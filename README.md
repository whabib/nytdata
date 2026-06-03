# NYT Top Stories Data Sync

A Node.js application designed to run as a scheduled job (e.g., Google Cloud Run Job) that polls the New York Times Top Stories API. It fetches the latest stories across multiple sections, parses the bylines into individual authors, and stores the normalized data into a PostgreSQL database using Prisma ORM.

The purpose of this is to cache metadata about NYT articles to support a bluesky labeler I am building. I want to avoid hitting the API in real time when I'm trying to do the labels, plus the API doesn't have a clean, simple API for "get me the metadata for this article by the URL."

## Features

* **Multi-Section Polling**: Iterates through all standard NYT sections (Arts, Technology, World, etc.).
* **Rate Limit Handling**: Includes built-in delays to respect the NYT API free tier limits (5 requests/minute) and gracefully stops if rate-limited.
* **Relational Data**: Implements a many-to-many relationship between Articles and Authors to prevent duplicate author records.
* **Idempotent Execution**: Safely handles duplicate articles using unique URL constraints, making it safe to run continuously on a schedule.

## Prerequisites

* [Node.js](https://nodejs.org/) (v20+ or v26+ recommended)
* A PostgreSQL database instance (local or cloud)
* A [New York Times Developer API Key](https://developer.nytimes.com/)

## Installation

1. **Clone the repository** (or navigate to your project directory):
   ```bash
   cd /Users/whabib/code/nytdata
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy the sample environment file and update it with your actual credentials.
   ```bash
   cp .env.example .env
   ```
   *Open `.env` and configure your `NYT_API_KEY` and `DATABASE_URL`.*

4. **Initialize the Database**:
   Run Prisma migrations to construct the necessary tables (`Article`, `Author`, and the underlying join table) in your PostgreSQL database.
   ```bash
   npx prisma migrate dev --name init
   ```

## Running Locally

To execute the script locally, run the script using Node's built-in environment variable loader:

```bash
node --env-file=.env index.js
```

You should see console output indicating the progress as it fetches each section, applies delays, and inserts the records into the database.

## Testing and Verifying the Data

The easiest way to verify that the data was ingested correctly is to use **Prisma Studio**, a local visual editor for your database.

```bash
npx prisma studio
```

This will open a web interface in your browser (typically at `http://localhost:5555`) where you can view your `Article` and `Author` tables, see the generated IDs, and verify that the many-to-many connections were created successfully.