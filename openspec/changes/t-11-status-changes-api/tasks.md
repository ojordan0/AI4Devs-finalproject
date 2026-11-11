# Tasks

T-11's acceptance criteria each have a test task named with their ID: AC-58 (5.3), AC-59 (3.3), AC-60 (3.5), AC-61 (4.3), and AC-62 (4.4). The other scenarios are named after the rule or requirement they verify, as [Security and testing §2.6](../../../docs/07-SECURITY-AND-TESTING.md#26-coverage-targets) describes. Of the definition of done, lint and type checks with an up-to-date OpenAPI document (group 6) and the owning documents (group 1) apply. No interface text is added: the errors use the messages from T-03, and no screen changes, so there are no loading, empty, or error states to cover.

## 1. Documents first

- [ ] 1.1 Update `docs/05-API.md` §2: `GET /me/to-buy` returns the pending items in all the user's groups with each item's list and group, filterable by group and list; `GET /me/purchases` returns the user's reserved and purchased items with their list and group, including purchased items in a group they left (BR-11). Update the header's version and date. Verify that no rule text is copied.
- [ ] 1.2 Update `docs/08-WORK-TICKETS.md`: T-11's acceptance criteria become AC-58 (API), AC-59, AC-60, AC-61, AC-62 (API); T-12 adds AC-58 (interface); T-14 adds AC-62 (interface). Update the header.
- [ ] 1.3 Run `npm run check:links`. Verify that it passes.

## 2. Shared schemas and item helpers

- [ ] 2.1 Add `purchaseRequestShape` (`buyerNote`, the trimmed nullable note) and `toBuyFiltersShape` (`groupId`, `listId`, optional UUIDs) to `src/shared/requests.ts` (design decisions 3 and 4). Verify with `npx tsc --noEmit`.
- [ ] 2.2 Add `purchaseRequestSchema` (accepting a missing body as empty), `toBuyFiltersSchema`, `buyerItemSchema` (`Item` with `list` and `group`), and `buyerItemCollectionSchema` to `src/server/http/schemas.ts`, registered for the OpenAPI document (design decisions 3 and 4). Verify with `npx tsc --noEmit`.
- [ ] 2.3 Export from `src/server/services/items.ts` what the new services reuse: `loadItem`, `readItem`, and the item view conversion, with the `items` table read joined to `lists` and `groups` for the buyer view (design decisions 2 and 4). Verify that `tests/integration/items-endpoints.test.ts` still passes unchanged.

## 3. Reserve and release

- [ ] 3.1 Add `src/server/services/item-status.ts` with `reserveItem` and `releaseItem`: the membership check, one conditional update of `items` per action with the version raised, the `status_history` row in the same transaction, and the shared refusal rule (design decisions 1 and 2). Verify with `npx tsc --noEmit`.
- [ ] 3.2 Add `POST` and `DELETE /items/{itemId}/reservation` in `src/app/api/v1/items/[itemId]/reservation/definitions.ts` and `route.ts`, answering 200 with `Item` (design decision 5). Verify with `npx tsc --noEmit` and `npm run lint`.
- [ ] 3.3 Write `tests/integration/item-status-endpoints.test.ts` with `AC-59 two buyers reserve at the same time`. Verify that it passes: one 200, one 409 `ALREADY_RESERVED`, one buyer, and one reservation in `status_history`.
- [ ] 3.4 Add `FR-24 a member reserves a pending item`, `BR-22 an item that isn't pending can't be reserved`, and `BR-13 an item the user can't see can't be reserved` (deleted, archived list, other group, ended membership). Verify that they pass.
- [ ] 3.5 Add `AC-60 Juan releases his reservation` and `BR-12 only the item's buyer releases it`. Verify that they pass.

## 4. Purchase

- [ ] 4.1 Add `purchaseItem` to `src/server/services/item-status.ts`: the conditional update to purchased, the buyer note when the request has one, and the `status_history` row (design decisions 1 to 3). Verify with `npx tsc --noEmit`.
- [ ] 4.2 Add `POST /items/{itemId}/purchase` in `src/app/api/v1/items/[itemId]/purchase/definitions.ts` and `route.ts` (design decision 5). Verify with `npx tsc --noEmit` and `npm run lint`.
- [ ] 4.3 Add `AC-61 another buyer can't mark Juan's item as purchased`. Verify that it passes and the item is still reserved by Juan.
- [ ] 4.4 Add `AC-62 the buyer marks the item as purchased with a note`, reading the item afterwards as a member with `GET /items/{itemId}` and checking its `status_history` row. Verify that it passes.
- [ ] 4.5 Add `BR-25 the buyer note is optional and limited` and `BR-22 an item that isn't reserved can't be marked as purchased`. Verify that they pass.
- [ ] 4.6 Add `BR-26 reserving, releasing, and purchasing are recorded` and `BR-20 a member's edit from before a reservation is refused` (through `PATCH /items/{itemId}`). Verify that they pass.

## 5. To buy and My purchases

- [ ] 5.1 Add `src/server/services/buyer-items.ts` with `listToBuy` (pending items in groups with the user's active membership, lists not archived, optional group and list filters) and `listPurchases` (the user's reserved and purchased items, as `hasPurchases` counts them), returning items with their list and group (design decision 4). Verify with `npx tsc --noEmit`.
- [ ] 5.2 Add `GET /me/to-buy` and `GET /me/purchases` in `src/app/api/v1/me/to-buy/` and `src/app/api/v1/me/purchases/` (`definitions.ts` and `route.ts`) (design decision 5). Verify with `npx tsc --noEmit` and `npm run lint`.
- [ ] 5.3 Write `tests/integration/buyer-items-endpoints.test.ts` with `AC-58 To buy has the pending items with their person, list, and group` and `AC-58 To buy filtered by group and by list`. Verify that they pass.
- [ ] 5.4 Add `FR-21 To buy leaves out other groups, other statuses, archived lists, and groups the user left` and `BR-13 a filter for another group returns nothing`. Verify that they pass.
- [ ] 5.5 Add `FR-21 My purchases has the buyer's reserved and purchased items`, `BR-11 My purchases keeps purchased items after the user left the group`, and `FR-21 a user with nothing reserved or purchased`. Verify that they pass.

## 6. OpenAPI document and checks

- [ ] 6.1 Regenerate `docs/openapi.yaml` with `npm run openapi:generate`. Verify that it has the five new operations with their schemas and errors, that the reservation responses match API §3, that the purchase body is optional, and that a second run changes nothing.
- [ ] 6.2 Run `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run test:coverage`, `npm run check:links`, and `npm run build`. Verify that all pass and the domain services keep at least 80% line coverage.
- [ ] 6.3 Run `npm run test:e2e`. Verify that every browser test still passes, including T-10's item page tests.

## Workflow follow-up

- Commit the approved proposal, then run `/opsx:apply`.
- After the pull request is reviewed: `/opsx:archive`, record the session, and push (CLAUDE.md, Finishing a ticket).
