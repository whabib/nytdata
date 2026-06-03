require('dotenv').config();
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ adapter });

// Helper to parse NYT bylines (e.g. "By JANE DOE and JOHN SMITH") into an array of strings
function parseByline(byline) {
  if (!byline) return [];
  // Remove "By " from the start and split by "," or "and"
  const cleaned = byline.replace(/^By\s+/i, '');
  return cleaned
    .split(/(?:,| and )+/i)
    .map((name) => name.trim())
    .filter((name) => name.length > 0);
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function syncTopStories() {
  const apiKey = process.env.NYT_API_KEY;
  if (!apiKey) {
    throw new Error('NYT_API_KEY environment variable is missing.');
  }

  // List of standard NYT Top Stories sections
  const sections = [
    'arts', 'automobiles', 'books', 'business', 'fashion', 'food', 'health',
    'home', 'insider', 'magazine', 'movies', 'nyregion', 'obituaries',
    'opinion', 'politics', 'realestate', 'science', 'sports', 'sundayreview',
    'technology', 'theater', 't-magazine', 'travel', 'upshot', 'us', 'world'
  ];

  let totalInsertedCount = 0;

  for (const currentSection of sections) {
    console.log(`Fetching top stories for section: ${currentSection}...`);

    const response = await fetch(`https://api.nytimes.com/svc/topstories/v2/${currentSection}.json?api-key=${apiKey}`);

    if (response.status === 429) {
      console.warn('Rate limited by NYT API (429). Stopping fetch for this hourly run.');
      break; // Stop fetching sections to respect rate limits, but don't crash
    }

    if (!response.ok) {
      console.error(`Failed to fetch section ${currentSection}: ${response.statusText}`);
      continue; // Skip this section but keep trying the others
    }

    const data = await response.json();

    if (!data.results) {
      console.error(`Invalid data received for section: ${currentSection}`);
      continue;
    }

    for (const story of data.results) {
      const { url, section, subsection, title, byline } = story;
      const authors = parseByline(byline);

      try {
        await prisma.article.create({
          data: {
            url,
            section,
            subsection,
            title,
            authors: {
              connectOrCreate: authors.map((name) => ({
                where: { name },
                create: { name },
              })),
            },
          },
        });
        totalInsertedCount++;
      } catch (e) {
        // Prisma error code P2002 means unique constraint failed (article already exists)
        if (e.code !== 'P2002') {
          throw e;
        }
      }
    }

    // NYT API limits free tiers to 5 requests per minute (1 request every 15 seconds).
    // We wait 15 seconds to avoid rate limiting before pulling the next section.
    await delay(15000);
  }
  
  console.log(`Successfully synced NYT data. Inserted ${totalInsertedCount} new articles.`);
}

async function run() {
  try {
    await syncTopStories();
    console.log('Cloud Run Job completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Job failed:', error);
    process.exit(1);
  }
}

run();