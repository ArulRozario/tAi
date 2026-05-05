<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

# General Guidelines for working with Nx

- For navigating/exploring the workspace, invoke the `nx-workspace` skill first - it has patterns for querying projects, targets, and dependencies
- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- Prefix nx commands with the workspace's package manager (e.g., `pnpm nx build`, `npm exec nx test`) - avoids using globally installed CLI
- You have access to the Nx MCP server and its tools, use them to help the user
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.
- NEVER guess CLI flags - always check nx_docs or `--help` first when unsure

## Scaffolding & Generators

- For scaffolding tasks (creating apps, libs, project structure, setup), ALWAYS invoke the `nx-generate` skill FIRST before exploring or calling MCP tools

## When to use nx_docs

- USE for: advanced config options, unfamiliar flags, migration guides, plugin configuration, edge cases
- DON'T USE for: basic generator syntax (`nx g @nx/react:app`), standard commands, things you already know
- The `nx-generate` skill handles generator discovery internally - don't call nx_docs just to look up generator syntax

<!-- nx configuration end-->

---

# tAI — Project Instructions

## What This Project Is

tAI (Translation AI) is a multi-agent platform for translating English Protestant Christian books into Tamil using the **Thiruviviliam** (திருவிவிலியம்) Bible style. NestJS 11 API + Angular 21 frontend, NX 22 monorepo.

**Read these before touching any code:**
- `.spec/01-overview.md` — product brief, roles, non-goals
- `.spec/02-domain.md` — Prisma schema (authoritative; v1 schema in `apps/api/prisma/schema.prisma` is wrong and must be replaced)
- `.spec/03-api.md` — all REST endpoints
- `.spec/04-screens.md` — UI screens derived from Claude JSX designs (authoritative)
- `.spec/05-agents.md` — LLM agent prompts and pipeline
- `.spec/06-glossary.md` — Thiruviviliam terminology (seeded into DB)
- `.spec/07-architecture.md` — tech stack, module structure, Docker, env vars
- `.spec/IMPLEMENTATION.md` — 26-phase build plan (the work queue)

---

## Session Start Ritual

At the start of every session:
1. Read `PROGRESS.md` to know what phase is active and what's next
2. Read the relevant spec section for the current phase
3. Check `git log --oneline -10` to see what was actually committed last session
4. Resume from where the last session ended — do not re-do completed work

---

## Session End Ritual

Before ending any session where code was written:
1. Update `PROGRESS.md`:
   - Mark completed phases with ✅ and today's date
   - Set "Active phase" to the next phase
   - Add a row to the Session Log
   - Add any new decisions made to the Notes section
2. Commit: `git add -A && git commit -m "Phase N: <what was done>"`

---

## Progress Tracking

`PROGRESS.md` is the source of truth for what's been built. Keep it accurate.

Phase status conventions:
- `☐` — not started
- `🔄` — in progress (set this when you begin a phase)
- `✅` — complete

When a phase is complete, always commit before marking it done. The commit message must be `Phase N: <description>` so git log tells the story.

---

## Architecture — Locked Decisions

Do not re-litigate these:

| Decision | Choice |
|----------|--------|
| Backend framework | NestJS 11 (modular, decorator-based) |
| ORM | Prisma 5.22 |
| Database | PostgreSQL 17 |
| File storage | MinIO (S3-compatible) |
| LLM local | Ollama (default 2 concurrent via p-limit) |
| LLM cloud | Anthropic Claude SDK (p-limit 50) |
| PDF extraction | `pdf-parse` only — no OCR |
| Email (dev) | nodemailer + maildev |
| Async jobs | DB polling + SELECT FOR UPDATE SKIP LOCKED — no BullMQ/Redis |
| Frontend | Angular 21 + PrimeNG 21 (Lara theme) + Tailwind CSS 3 |
| State management | RxJS 7 + Angular Signals — no NgRx |
| Auth | JWT access (15m) + refresh token (7d) stored in DB, rotated on use |
| Language | Source: English (en), Target: Tamil/Thiruviviliam (ta) — hardcoded |
| Rules system | **Removed** — Genres only; no Rules screen, no rules module |
| Genre system | Genre markdown injected into every translation prompt for that genre |
| Overlay mode | Implemented in workbench — not deferred |
| Chat modes | "Discuss" = Plan mode, "Edit doc" = Build mode |

---

## Tech Stack Quick Reference

```
apps/
  api/              NestJS 11 backend (port 3000)
    prisma/         schema.prisma + migrations + seed.ts
    src/
      common/       guards, interceptors, decorators, pipes, filters
      modules/      auth, users, genres, projects, chapters, pages,
                    segments, errors, glossary, files, jobs, chat,
                    export, models, dashboard, queue, admin, email, health
      llm/          LLMProvider interface, ollama.provider, anthropic.provider
      agents/       extraction, translation.agent, review.agent, orchestrator
  frontend/         Angular 21 (port 4200)
    src/app/
      core/         services (auth, api), interceptors, guards
      layout/       app.layout, app.menu, app.topbar
      features/     login, dashboard, projects, workbench, review-detail,
                    review-queue, genres, admin
```

---

## Common Commands

```bash
# Start all services
docker compose up -d

# API dev server
pnpm nx serve api

# Frontend dev server
pnpm nx serve frontend

# Prisma
pnpm nx run api:prisma-generate     # regenerate client after schema change
pnpm nx run api:prisma-migrate      # run migrations
pnpm nx run api:prisma-seed         # seed data

# Build
pnpm nx build api
pnpm nx build frontend

# Test
pnpm nx test api
pnpm nx test frontend
pnpm nx e2e api-e2e
pnpm nx e2e frontend-e2e

# Lint
pnpm nx lint api
pnpm nx lint frontend

# Affected (CI)
pnpm nx affected -t build,test,lint
```

---

## Key Domain Rules (never violate)

- A `Genre`'s `segmentUnit` cannot change if any project using that genre has segments
- A `Page` cannot be `APPROVED` if it has any `OPEN` errors — unless the caller is MASTER or ADMIN
- Deleting a `Project` cascades: Project → Chapter → Page → Segment → Error
- Deleting a `Genre` is blocked if any project references it
- `RefreshToken` rotation: every use deletes the old token and issues a new one
- `ActivityLog` is append-only — no updates, no deletes
- Thiruviviliam terminology is non-negotiable in all translation prompts (see `.spec/06-glossary.md`)
- `POST /errors/:id/apply` MUST also update `segment.translatedText` (replace currentText with suggestedText) — marking APPLIED without fixing the text is a bug
- Auto-pipeline: EXTRACT_PDF automatically enqueues one TRANSLATE_PAGE per page; TRANSLATE_PAGE automatically enqueues REVIEW_PAGE — no user action needed between stages
- Reviewer assignment: round-robin among active REVIEWERs ordered by fewest current HUMAN_REVIEW assignments
- Project status transitions: DRAFT→PROCESSING (EXTRACT_PDF starts), PROCESSING→REVIEW (all pages reach HUMAN_REVIEW/APPROVED), REVIEW→COMPLETED (all pages APPROVED)

---

## Thiruviviliam Terminology — Critical Terms

Never use the wrong term in prompts or seed data:

| Correct | Wrong | English |
|---------|-------|---------|
| தேவன் | கடவுள் | God |
| விசுவாசம் | நம்பிக்கை | Faith |
| சபை / தேவாலயம் | கூடு | Church |
| வாக்கு | மந்திரம் | Word (of God) |
| அன்பு | நேசி | Love |

---

## Frontend Routes

| Route | Component | Layout |
|-------|-----------|--------|
| `/login` | LoginComponent | Standalone card |
| `/reset-password/:token` | ResetPasswordComponent | Standalone card |
| `/dashboard` | DashboardComponent | Top nav |
| `/projects` | ProjectListComponent | Top nav |
| `/projects/:id` | ProjectDetailComponent | Top nav |
| `/workbench/:pageId` | WorkbenchComponent | Full-page (own toolbar) |
| `/review/:pageId` | ReviewDetailComponent | Full-page (own toolbar) |
| `/queue` | ReviewQueueComponent | Top nav |
| `/genres` | GenreListComponent | Top nav |
| `/genres/:id` | GenreEditorComponent | Full-page (own toolbar) |
| `/admin/team` | TeamComponent | Top nav |
| `/admin/settings` | SettingsComponent | Top nav |

---

## What NOT to Do

- Do not use `NgRx` — use RxJS + Signals
- Do not add BullMQ, Redis, or any queue broker — job system uses DB polling
- Do not add PaddleOCR or any OCR library — pdf-parse only
- Do not add a language selector UI — en→ta is hardcoded
- Do not add a user profile screen — not in scope for v1
- Do not add a Rules screen, rules module, or any rules-related endpoints — Rules is removed
- Do not add autosave to the genre editor — content saves only on explicit "Save" button (POST /genres/:id/versions)
- Do not add mobile breakpoints — tablet minimum (1024px)
- Do not modify the v1 Prisma schema to patch it — replace it entirely in Phase 1
- Do not add comments explaining what code does — only add comments for non-obvious WHY
- Do not add error handling for impossible cases — trust framework guarantees

---

## Subagent Usage Policy

- Most implementation work runs in the **main agent** — phases are sequential and context accumulates
- Use `Explore` subagent for broad codebase searches (e.g., "find all files referencing PageStatus")
- Only spawn implementation subagents for truly independent parallel phases
- Any subagent doing implementation work must: read the relevant spec section first, and update `PROGRESS.md` when done
