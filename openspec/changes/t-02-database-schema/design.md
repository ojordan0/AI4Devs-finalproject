# Design

## Context

`src/server/db/schema.ts` is empty, the migrations journal has no entries, and `scripts/seed.ts` only checks the connection. Vitest's integration project already finds the test database and applies migrations. See [proposal.md](proposal.md) for motivation and scope, and the specs for required behavior.

T-02 has no acceptance criteria with an ID, so scenarios are named after the behavior they verify, and no test carries an `AC-` prefix.

Constraints checked while planning, on November 8, 2026:

| Finding | How it was checked | Effect |
| --- | --- | --- |
| Better Auth 1.7.18 defines nullable `accessToken`, `refreshToken`, `idToken`, `accessTokenExpiresAt`, `refreshTokenExpiresAt`, `scope`, and `password` on accounts, and `ipAddress` on sessions | `@better-auth/core/dist/db/get-tables.mjs` | The schema includes them, as [Data model §2](../../../docs/04-DATA-MODEL.md#2-entities) says |
| `src/server/db/migrations/` is already ignored by Prettier | `.prettierignore` | Generated migrations don't affect `npm run lint` |
| `+1 202 555 01xx` numbers pass `libphonenumber-js` | Running `isValidPhoneNumber` | Seed WhatsApp numbers are fictional and still valid, so later validation accepts them |
| `scripts/setup.mjs` already imports `tests/support/test-database.ts` to refuse a remote database | Reading the script | The seed script can use the same guard |

## Goals / Non-Goals

**Goals:**

- Every scenario in the specs passes, and T-02's "Done when" statement is demonstrated on an empty Postgres volume.
- T-03 and later tickets add no structural migrations for milestone 1 or the `job_runs` table, and can start tests from known rows with stable IDs.

**Non-Goals:**

- Indexes beyond those in [Data model §2](../../../docs/04-DATA-MODEL.md#2-entities). The data volume is small; a ticket that measures a slow query can add one.
- A CI check that the schema and the migrations agree. The ticket doesn't ask for it, and the local check is `drizzle-kit generate` reporting no changes.
- Seeding `link_status` values other than `none`. The link lookup is milestone 2, and its tests use their own data.

## Decisions

### 1. One schema file, with explicit column names

All tables stay in `src/server/db/schema.ts`, where `drizzle.config.ts` already points. TypeScript property names are camelCase and each column's database name is written out in snake_case. Better Auth's Drizzle adapter looks up fields by property name (`emailVerified`), while [Data model §2](../../../docs/04-DATA-MODEL.md#2-entities) defines the database names (`email_verified`), so both have to be right. Drizzle's global `casing` setting was rejected: it would have to be set the same way in the client and in drizzle-kit, and a mismatch fails at runtime.

Table exports use plural names (`users`, `accounts`), matching the plural setting T-04 gives Better Auth. IDs use `gen_random_uuid()`, built into Postgres 17.

Relation definitions are left out, because nothing uses relational queries yet.

### 2. Which rules are database checks

The database enforces every rule in Data model §2's Constraints column that can be decided from one row without the current time. Each check has a name, so tests can prove that this check, not another failure, rejected the row.

| Name | Table | Rule |
| --- | --- | --- |
| `items_quantity_range` | items | `quantity BETWEEN 1 AND 99` |
| `items_buyer_matches_status` | items | `(status = 'pending') = (buyer_id IS NULL)` |
| `items_shipment_only_when_shipped` | items | `shipment_id IS NULL OR status = 'shipped'` |
| `items_unavailable_note_required` | items | `status <> 'unavailable' OR unavailable_note IS NOT NULL` |
| `items_url_scheme` | items | `url ~* '^https?://'` |
| `users_whatsapp_number_e164` | users | `whatsapp_number ~ '^\+[1-9][0-9]{1,14}$'` |
| `delivery_addresses_phone_e164` | delivery_addresses | Same pattern on `phone` |
| `shipments_address_phone_e164` | shipments | Same pattern on `address_phone` |
| `delivery_addresses_country_format` | delivery_addresses | `country ~ '^[A-Z]{2}$'` |
| `shipments_address_country_format` | shipments | Same pattern on `address_country` |

A check passes when its value is null, so these allow the empty values that Data model §2 allows.

These checks are a last line of defense on the value's shape. The services still validate first under BR-32, for example that a phone number really exists or that a country code is a real one. A format the services accept must also pass here, so they normalize values before storing them.

**Stays in the services:**

- The ship date. It needs the clock the services receive as input, and Postgres expects a check's result not to change with time.
- Rules that span rows or depend on a previous value: the 10-address and 20-detail limits, an owner being an active member, a group having exactly one default address, and allowed status transitions.
- Minimum text lengths. BR-32 sets them, but Data model §2 lists only maximums, and whether a value counts as blank depends on the trimming the services do.

### 3. The buyer check works both ways, the shipment check one way

The ticket says the buyer is present only when the status requires it, and Data model §2 says it is null only when pending. Together, these mean a buyer exactly when the status isn't `pending`, which also matches BR-19's clearing the buyer of an edited unavailable item.

The shipment rule only runs one way: an item with a shipment must be shipped, but a shipped item may have no shipment. That's what both documents say, and it's required. `items.shipment_id` is `on delete set null`, and deleting a group deletes both its lists and its shipments in an order Postgres chooses. Postgres can't defer a check, so a two-way rule could reject a group deletion whenever the shipment is deleted first. The specs test deleting a group with shipped items for this reason. The service for BR-24 keeps shipped items in a shipment.

### 4. Foreign keys

The delete actions are those in Data model §2: `cascade` for rows owned by a group, list, recipient, item, or a user's sign-in records, and `set null` for `items.recipient_id`, `items.shipment_id`, and `shipments.delivery_address_id`. All other references to `users` use the default, which rejects the deletion, so a user row with history can't be physically removed (BR-05).

### 5. Timestamps

`created_at` and `updated_at` default to `now()` in the database, so factories and Better Auth's inserts work. Services pass the time from their clock explicitly. Drizzle's `$onUpdate` is not used: it would read the system time inside a query, which [Security and testing §2.4](../../../docs/07-SECURITY-AND-TESTING.md#24-sign-in-outside-services-and-time) rules out for services.

`job_runs` and `rate_limits` follow Data model §2. It leaves three details open, which this change fills in: `job_runs.name` is `varchar(50)`, `rate_limits.key` is `varchar(255)`, and both `job_runs` timestamps are nullable, because a job has no completed run until its first one ends.

### 6. One generated migration

`npx drizzle-kit generate` produces the single first migration from the schema, committed as generated. `npm run db:migrate` applies it locally, and the Vitest global setup applies it to the test database. Hand-written SQL isn't needed, because Drizzle can express every check and the partial unique index.

### 7. Seed code lives in `scripts/`, split into data and command

[Architecture §2](../../../docs/03-ARCHITECTURE.md#2-project-structure) places the seed in `scripts/`. It has two files, so tests can load the data without running a command:

- `scripts/seed-data.ts` exports the fixed IDs and `loadSeedData(db)`, which inserts everything in one transaction, parents first. Later tests import the IDs rather than repeating them.
- `scripts/seed.ts` loads `.env`, refuses a remote database, connects, calls `loadSeedData`, and closes the connection.

The guard is `testDatabaseUrl`, called the same way as in `scripts/setup.mjs`, and only for its check: the seed still connects to `DATABASE_URL`. [Infrastructure §2](../../../docs/06-INFRASTRUCTURE.md#2-environments) lists seed data only for the local environment, and these rows include fixed invitation codes.

### 8. Loading twice: fixed IDs and `ON CONFLICT DO NOTHING`

Every row has a fixed ID, and every insert skips rows that already exist. The existing `developer-environment` spec says setup can run again without losing development data, so the seed never updates or deletes.

Updating rows back to their seed values was rejected, because it would overwrite a developer's edits. Deleting and reloading was rejected for the same reason.

### 9. Fixed dates

All seed timestamps are constants in early 2026, so two loads give the same rows, and tests can set any later clock. The expired invitation's `expires_at` is in the past on any clock.

The pending invitation is the exception to "creation plus 7 days" (BR-08): it expires on January 1, 2099. A date relative to the load time would expire in a long-lived development database, because a second load skips the row (decision 8), and would make tests with a controlled clock depend on when the seed ran. Nothing in the database enforces the 7 days, and the service that creates invitations does.

### 10. Seed contents

[Data model §3](../../../docs/04-DATA-MODEL.md#3-seed-data) owns the list. It leaves these details open:

| Detail | Choice |
| --- | --- |
| Emails | `ana@example.com` and so on, on a domain reserved for examples |
| WhatsApp numbers | Fictional `+1 202 555 01xx` numbers |
| Languages not listed | Juan, Luis, and Pedro use Spanish |
| Item buyers not listed | Juan shipped both items in the shipment; Luis marked the unavailable item |
| Item placement | "Anthony's birthday" holds the pending, reserved, purchased, and shipped items, all for Anthony. "Medicine" holds the unavailable item for Grandma, Pedro's purchased item for Mom, and one pending item with no recipient |
| Archived list | "Last Christmas", with no items |
| Pérez Group | Luis has an active `member` membership; one list with one pending item, added by Luis |
| Shipment | Maritime, to "Grandma's house", with a copy of the address |
| Invitations | All in the García Group, created by Ana: pending (buyer), expired (member), accepted (buyer, by Juan), and cancelled (buyer) |
| Timeline | Each item has rows from creation through its current status, by the person who took each step |

Seed text isn't interface text, so it stays in the seed file rather than the translation files.

### 11. Emptying the test database

`tests/support/reset-database.ts` runs `TRUNCATE` over every table in the schema and then `loadSeedData`, using its own connection. It always derives its address with `testDatabaseUrl`, whatever `DATABASE_URL` holds, so it can't reach the development database or a remote one. The `drizzle` schema, which records applied migrations, isn't touched.

- **Integration tests:** `tests/support/integration-env.ts`, which already runs for each test file, adds a `beforeAll` calling the reset.
- **Browser tests:** `playwright.config.ts` replaces `npm run db:seed` in its server command with `npx tsx scripts/reset-test-database.ts`, a one-line command calling the same function. A Playwright global setup was rejected, because the reset has to come after migrations, and the command line makes that order explicit.

### 12. Test approach

- `tests/integration/database-schema.test.ts` uses tables of cases for the rules with many columns. Each rejected insert must fail with the named check, or with the expected Postgres error code for not-null, unique, foreign-key, enumeration, and length failures. Asserting only "it threw" would pass for the wrong reason, for example when a parent row is missing.
- Rejected values are written as raw SQL, because the TypeScript types wouldn't allow many of them.
- `tests/support/factories.ts` holds small factories for valid rows, as [Security and testing §2.3](../../../docs/07-SECURITY-AND-TESTING.md#23-test-data-and-isolation) calls for.
- `tests/integration/seed-data.test.ts` covers the seed's contents, consistency, and second load, comparing every table's rows before and after.

## Risks / Trade-offs

- **A value passes a service but fails a check, giving a server error instead of a validation message.** → Services normalize to E.164, uppercase country codes, and http or https links before storing. The link check ignores case, and services will also be covered by their own tests from T-03 on.
- **Group deletion order could change the outcome.** → The one-way shipment check holds in any order, and a test deletes a group with shipped items.
- **Fixed invitation codes in the seed would be known secrets.** → The seed refuses a non-local database, and production is never seeded.
- **A partly seeded database could mix old and new data if the seed changes later.** → Inserts skip existing rows, so a changed seed row doesn't update. A developer can recreate the volume, and tests always start from an emptied database.
- **The schema and migrations could drift apart.** → Task 2.5 confirms they agree. Without a CI check, a later ticket that forgets to generate a migration fails only when its integration test hits the missing column.
- **`TRUNCATE` is destructive.** → The address is always derived by `testDatabaseUrl`, which forces the test database name and refuses other hosts.

## Migration Plan

Nothing is deployed yet, and T-06 applies migrations to production for the first time. Existing local databases are empty, so the next `npm run db:migrate` adds the tables with no data to move. To start over locally, a developer recreates the Postgres volume and runs `npm run setup`.
