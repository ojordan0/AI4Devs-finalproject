# Agent guidance

Guidance for AI coding agents working in this repository.

**Project:** ComproParaTi ("I buy for you"), an assisted shopping platform. Families keep shared lists; invited buyers reserve, buy, and ship the items.

## Read before working

| Task | Read first |
| --- | --- |
| Any change to behavior | [docs/01-PRD.md](docs/01-PRD.md): business rules (§12), requirements (§13), acceptance criteria (§17), traceability (§19) |
| Screens, text, or messages | [docs/02-UX-DESIGN.md](docs/02-UX-DESIGN.md) |
| Design trade-offs between roles, or what the product must not claim | [PRODUCT.md](PRODUCT.md): role priority, positioning, and product principles |
| Visual design, styling, or a screen's layout | [DESIGN.md](DESIGN.md): tokens, components, and how to use the Stitch screens in `design/stitch/` |
| Code structure, dependencies, layering | [docs/03-ARCHITECTURE.md](docs/03-ARCHITECTURE.md) |
| Schema, migrations, seed data | [docs/04-DATA-MODEL.md](docs/04-DATA-MODEL.md) |
| API endpoints and errors | [docs/05-API.md](docs/05-API.md) |
| CI, deployment, environment variables | [docs/06-INFRASTRUCTURE.md](docs/06-INFRASTRUCTURE.md) |
| Security or tests | [docs/07-SECURITY-AND-TESTING.md](docs/07-SECURITY-AND-TESTING.md) |
| Picking up work | [docs/08-WORK-TICKETS.md](docs/08-WORK-TICKETS.md): scope, dependencies, and acceptance criteria per ticket, and how tickets are tracked in GitHub Issues |

Use the traceability table (PRD §19) to find every story, rule, endpoint, and entity related to a requirement.

## Rules

- **The docs are the source of truth.** If a task needs behavior the docs don't define, or the code and docs disagree, stop and ask instead of choosing.
- **One source per fact.** When behavior changes, update the document that owns it, in the same pull request. Refer to rules by ID (for example `BR-23`); don't copy rule text into other documents or code comments.
- **Spec first:** every ticket starts as an OpenSpec change, reviewed before implementation, following [docs/08-WORK-TICKETS.md §1](docs/08-WORK-TICKETS.md#1-how-tickets-work). The PRD stays the source of truth for rules; specs cite its IDs.
- **Dependencies:** install only packages listed in [Architecture §1.6](docs/03-ARCHITECTURE.md#16-dependencies). If a task needs another one, stop and ask.
- **Layering:** pages and route handlers never query the database directly. Business rules and authorization live in the domain services (`src/server/services`).
- **Tests:** every acceptance criterion has at least one automated test whose name starts with its ID, for example `AC-59`. Follow the testing strategy in [docs/07-SECURITY-AND-TESTING.md §2](docs/07-SECURITY-AND-TESTING.md#2-testing-strategy): services take the clock as input, tests never call outside services, and the domain services keep at least 80% line coverage.
- **Text:** all interface text, emails, and WhatsApp messages come from the translation files; never hard-code strings.
- **Documentation:** written in English, with no notes to the author and no references to earlier versions. Each document's version and date go in its header, never in its file name. After changing any document, check that every link, anchor, and ID resolves, that the Mermaid diagrams parse, and that the OpenAPI definition validates.
- **Naming:** branches, OpenSpec changes, pull requests, and GitHub issues are named as described in [docs/08-WORK-TICKETS.md §1](docs/08-WORK-TICKETS.md#1-how-tickets-work) and [§2](docs/08-WORK-TICKETS.md#2-tracking-in-github).
- **AI usage record:** at the end of each work session, before the last commit:
  1. Export the session to `docs/ai-conversations/part-<N>-<short-name>.md`, continuing the numbering of the existing parts, for example `part-5-project-scaffold.md`. Follow the format of the existing exports: a title, the export date, and an "About this export" list with the model, the effort, and what is included and left out; then one section per turn with the prompt copied as written and the visible text of the response. Summarize tool activity in one line per turn, and name files instead of embedding them. If earlier turns are no longer in context, say which ones in "About this export" instead of reconstructing them.
  2. Add a row for the session to the Build table in [prompts.md, Sessions](prompts.md#sessions): part, tickets (or "—" for work outside a ticket), name, tool, model, and a link to the export.
  3. Add the session's most representative prompts to [prompts.md](prompts.md) under the matching section, at most 3 per section as the course template asks, labeled like `(Part 5, turn 3 · T-01 · Claude Opus 5.5)`, and copied as written.

## Branches, commits and PRs

Work is organized by tickets (see `/docs/08-WORK-TICKETS.md`). One ticket = one branch = one PR, merged into `main`.

- **Protected branches:** `main`, `feature/entrega-1-OJE`, `feature/entrega-2-OJE` and `final-project-OJE`. Never commit directly to any of them, and never check them out to work on them.
- **Branches are per ticket, not per request.** Before touching code, check the current branch:
  - On a protected branch: switch to `main`, update it (`git pull --ff-only`), then create the ticket branch with `git checkout -b <type>/t-<NN>-<slug>`, where `<type>` is `feat`, `fix`, `chore`, `docs` or `refactor` (e.g. `feat/t-07-groups-api`).
  - On a ticket branch: stay on it if the request belongs to that ticket. If it belongs to a different ticket, or the branch's PR is already merged or closed, go back to `main` and create the right ticket branch from there (never branch off another ticket branch).
  - If the request doesn't clearly map to a ticket, ask which one before starting.
- **Commits are per request:** when you finish each request, use the `/commit` skill. If the branch already has an open PR, push after committing.
- **The PR is per ticket.** The user decides when the ticket is done (e.g. "open the PR"); don't open one on your own. Then:
  1. `git push -u origin HEAD`.
  2. `gh pr create --base main`, with the ticket ID in the title and a full description of the changes in the body.
  3. Run the `adversarial-reviewer` subagent on the PR and post its findings as a PR comment. While the PR has no CI check runs, run `npm test` first, include its output in the subagent's prompt, and post that output in the same comment, below the findings. If `npm test` can't run yet, say so in the comment.
  4. Fix what's warranted, commit, push. Re-run the review at most once.
- **Final reply:** don't repeat the PR summary in chat. The session will be lost; the PR won't. Reply with the PR URL plus one line on any unresolved review findings.

## Course deliveries

Only when the user explicitly asks for a delivery:
- Delivery branches: D1 → `feature/entrega-1-OJE`, D2 → `feature/entrega-2-OJE`, D3 → `final-project-OJE`.
- First check that local `main` is up to date with `origin/main` and that no ticket PR meant for this delivery is still open. Report anything pending and wait for confirmation.
- Push with `git push origin main:<delivery-branch>`. Never force-push; if the push is rejected as non-fast-forward, stop and tell the user.

## Commands (planned)

`npm run setup` · `npm run dev` · `npm test` · `npm run test:e2e` · `npm run test:coverage` · `npm run lint` · `npm run db:migrate` · `npm run db:seed` (all test commands: [docs/07-SECURITY-AND-TESTING.md §2.5](docs/07-SECURITY-AND-TESTING.md#25-running-tests-locally-and-in-ci))
