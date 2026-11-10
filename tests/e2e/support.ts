import { randomUUID } from "node:crypto";

import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import en from "../../src/i18n/en.json";
import es from "../../src/i18n/es.json";
import * as schema from "../../src/server/db/schema";
import { testDatabaseUrl } from "../support/test-database";

// Helpers for the browser tests. Each scenario signs up its own users through
// the development-only sign-in, so the seed users never change
// (docs/07-SECURITY-AND-TESTING.md, sections 2.3 and 2.4).

export const messages = { en, es } as const;

export type Language = keyof typeof messages;

/** An email no other scenario uses. */
export function newEmail(): string {
  return `e2e-${randomUUID()}@example.com`;
}

function appOrigin(): string {
  const baseURL = test.info().project.use.baseURL;
  if (!baseURL) throw new Error("playwright.config.ts sets no baseURL.");
  return new URL(baseURL).origin;
}

/** Changes carry the app's own origin, as the browser sends it (docs/07-SECURITY-AND-TESTING.md, section 1). */
export function sameOrigin() {
  return { origin: appOrigin() };
}

/** The language chosen on Welcome, as its selector keeps it. */
export async function chooseLanguage(page: Page, language: Language) {
  await page
    .context()
    .addCookies([{ name: "language", value: language, url: appOrigin() }]);
}

/** Signs the page's browser in as a new or existing user, as the Welcome form does. */
export async function signInAs(page: Page, email = newEmail()) {
  const response = await page.request.post("/api/auth/dev/sign-in", {
    data: { email },
    headers: sameOrigin(),
  });
  expect(response.ok()).toBe(true);
  return email;
}

/** Signs up a new user and completes onboarding through the API. */
export async function signUpOnboarded(
  page: Page,
  { language = "es" as Language, whatsappNumber = "+12025550123" } = {},
) {
  const email = await signInAs(page);
  const response = await page.request.post("/api/v1/me/onboarding", {
    data: { language, whatsappNumber, acceptsTerms: true },
    headers: sameOrigin(),
  });
  expect(response.ok()).toBe(true);
  return email;
}

/** The signed-in user, as GET /me returns them. */
export async function readMe(page: Page) {
  const response = await page.request.get("/api/v1/me");
  expect(response.ok()).toBe(true);
  return response.json();
}

/** Fails with the list of violations when the automated WCAG 2.1 AA checks find any. */
export async function expectNoAccessibilityViolations(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(
    results.violations.map(({ id, nodes }) => ({
      id,
      targets: nodes.map((node) => node.target),
    })),
  ).toEqual([]);
}

/** The seed users (docs/04-DATA-MODEL.md, section 3) that browser tests sign in as, only to look. */
export type SeedUser = "ana" | "juan" | "luis" | "pedro";

/** Signs in as a seed user. Scenarios that sign in this way change nothing. */
export async function signInAsSeedUser(page: Page, name: SeedUser) {
  return signInAs(page, `${name}@example.com`);
}

/**
 * Makes the user with this email a member of a new group with this name, and
 * returns the group's ID. No milestone 1 endpoint gives a user a second group,
 * so this writes to the test database that the app under test uses.
 */
export async function addMemberGroup(email: string, groupName: string) {
  const pool = new Pool({
    connectionString: testDatabaseUrl(process.env.DATABASE_URL),
  });
  try {
    const db = drizzle(pool, { schema });
    const [user] = await db
      .select({ id: schema.users.id })
      .from(schema.users)
      .where(eq(schema.users.email, email));
    if (!user) throw new Error(`No user has the email ${email}.`);
    const [group] = await db
      .insert(schema.groups)
      .values({ name: groupName, ownerId: user.id })
      .returning({ id: schema.groups.id });
    if (!group) throw new Error("The group insert returned no row.");
    await db.insert(schema.memberships).values({
      groupId: group.id,
      userId: user.id,
      type: "member",
      joinedAt: new Date(),
    });
    return group.id;
  } finally {
    await pool.end();
  }
}
