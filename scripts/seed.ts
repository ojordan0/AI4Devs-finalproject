import { existsSync } from "node:fs";

import { Client } from "pg";

// Loads the data in docs/04-DATA-MODEL.md, section 3 (T-02). There is no data to
// load yet, so this only confirms that the database can be reached.
async function main() {
  if (existsSync(".env")) {
    process.loadEnvFile();
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Run `npm run setup` to create .env.",
    );
  }

  const client = new Client({ connectionString });
  await client.connect();
  await client.end();
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
