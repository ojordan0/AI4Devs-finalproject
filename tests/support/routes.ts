import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { expect } from "vitest";
import type { z } from "zod";

import { seedIds } from "../../scripts/seed-data";
import type { Clock } from "../../src/server/clock";
import * as schema from "../../src/server/db/schema";
import type { RouteDependencies } from "../../src/server/http/route";
import type { SessionReader, SessionUser } from "../../src/server/http/session";

// Helpers for testing route handlers with real Request objects and no server
// (docs/07-SECURITY-AND-TESTING.md, section 2.1).

export const TEST_APP_URL = "http://localhost:3000";

/** The request header the fake session reader reads the signed-in user from. */
const TEST_USER_HEADER = "x-test-user";

/** Seed users as the session reader would return them (docs/04-DATA-MODEL.md, section 3). */
export const seedSessionUsers = {
  ana: { id: seedIds.users.ana, language: "en", onboarded: true },
  rosa: { id: seedIds.users.rosa, language: "es", onboarded: true },
  juan: { id: seedIds.users.juan, language: "es", onboarded: true },
  luis: { id: seedIds.users.luis, language: "es", onboarded: true },
} as const satisfies Record<string, SessionUser>;

export type SeedSessionUser = keyof typeof seedSessionUsers;

/** Signs the request in as a seed user, through the fake session reader. */
export const fakeSessionReader: SessionReader = async (headers) => {
  const name = headers.get(TEST_USER_HEADER) as SeedSessionUser | null;
  return name ? seedSessionUsers[name] : null;
};

export function createTestDatabase() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  return { pool, db: drizzle(pool, { schema }) };
}

/** A clock that tests can move. */
export function testClock(start = new Date("2026-11-09T15:00:10Z")) {
  let now = start;
  const clock: Clock = () => now;
  return {
    clock,
    set(date: Date) {
      now = date;
    },
  };
}

export function testDependencies(
  overrides: Partial<RouteDependencies> & Pick<RouteDependencies, "db">,
): RouteDependencies {
  return {
    clock: testClock().clock,
    readSession: fakeSessionReader,
    appUrl: TEST_APP_URL,
    ...overrides,
  };
}

type RequestOptions = {
  method?: string;
  as?: SeedSessionUser;
  origin?: string | null;
  body?: unknown;
  rawBody?: string;
  headers?: Record<string, string>;
};

/**
 * A request to the app. Requests that change data carry the app's own origin
 * unless `origin` says otherwise; `null` leaves the header out.
 */
export function apiRequest(
  path: string,
  options: RequestOptions = {},
): Request {
  const method = options.method ?? "GET";
  const headers = new Headers(options.headers);
  if (options.as) headers.set(TEST_USER_HEADER, options.as);
  const origin =
    options.origin === undefined
      ? method === "GET"
        ? null
        : TEST_APP_URL
      : options.origin;
  if (origin !== null) headers.set("origin", origin);
  let body: string | undefined = options.rawBody;
  if (options.body !== undefined) {
    body = JSON.stringify(options.body);
    headers.set("content-type", "application/json");
  }
  return new Request(new URL(`/api/v1${path}`, TEST_APP_URL), {
    method,
    headers,
    body,
  });
}

/** The second argument Next.js passes to a route handler. */
export function routeParams(params: Record<string, string>) {
  return { params: Promise.resolve(params) };
}

/**
 * Checks a response body against the schema that documents it in the OpenAPI
 * document, and fails naming each property that doesn't match.
 */
export function expectMatchesSchema(schema: z.ZodType, body: unknown) {
  const result = schema.safeParse(body);
  if (!result.success) {
    const problems = result.error.issues.map(
      (issue) => `${issue.path.join(".") || "(body)"}: ${issue.message}`,
    );
    expect.fail(
      `The response doesn't match its schema:\n${problems.join("\n")}`,
    );
  }
}
