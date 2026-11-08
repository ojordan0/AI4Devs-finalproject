export const TEST_DATABASE_NAME = "comproparati_test";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

/**
 * The address of the test database, derived from DATABASE_URL. Refuses any host
 * other than the local machine, so tests can never reach production data
 * (docs/07-SECURITY-AND-TESTING.md, section 2.3).
 */
export function testDatabaseUrl(databaseUrl: string | undefined): string {
  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL is not set. Run `npm run setup` to create .env.",
    );
  }

  let url: URL;
  try {
    url = new URL(databaseUrl);
  } catch {
    throw new Error("DATABASE_URL is not a valid address.");
  }

  if (!LOCAL_HOSTS.has(url.hostname)) {
    throw new Error(
      `Tests only run against a local database, and DATABASE_URL points to ${url.hostname}.`,
    );
  }

  url.pathname = `/${TEST_DATABASE_NAME}`;
  return url.toString();
}
