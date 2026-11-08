import { inject } from "vitest";

// Code under test reads DATABASE_URL, so point it at the test database first.
process.env.DATABASE_URL = inject("testDatabaseUrl");
