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

async function syncTopStories() {
  const apiKey = process.env.NYT_API_KEY;
  if (!apiKey) {
    throw new Error('NYT_API_KEY environment variable is missing.');
  }

  // Fetch Top Stories from NYT API (using 'home' section as an example)
  const response = await fetch(`https://api.nytimes.com/svc/topstories/v2/home.json?api-key=${apiKey}`);
  const data = await response.json();

  if (!data.results) {
    throw new Error('Invalid data received from NYT API.');
  }

  let insertedCount = 0;

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
      insertedCount++;
    } catch (e) {
      // Prisma error code P2002 means unique constraint failed (article already exists)
      if (e.code !== 'P2002') {
        throw e;
      }
    }
  }
  console.log(`Successfully synced NYT data. Inserted ${insertedCount} new articles.`);
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