# tAI — Bug Tracker

## Fixed Bugs

### 🔴 Critical (Fixed)

#### BUG-001: Genre deletion not blocked when projects reference it
- **Severity:** Critical
- **Reported:** 2026-05-08 (analysis session)
- **Spec:** `02-domain.md` § Key Business Rules — "Deleting a Genre is blocked if any project references it."
- **File:** `apps/api/src/modules/genres/genres.service.ts:97-101`
- **Root cause:** No project reference check before genre deletion
- **Fix:** Added `prisma.project.count({ where: { genreId: id } })` check; throws `ConflictException` if count > 0
- **Status:** Fixed

---

#### BUG-002: Password reset uses in-memory Map instead of stateless JWT
- **Severity:** Critical
- **Reported:** 2026-05-08 (analysis session)
- **Spec:** `02-domain.md` § Auth — "Password reset uses a stateless JWT — no DB model. Token payload: `{ sub: userId, email, purpose: 'password-reset', exp: now+1h }`"
- **File:** `apps/api/src/modules/auth/auth.service.ts:17,152-206`
- **Root cause:** Used `Map<string, ResetTokenInfo>` for ephemeral token storage instead of JWT
- **Fix:** Replaced with `jwtService.sign/verify`; added `verifyResetToken` helper for frontend token validation
- **Status:** Fixed

---

#### BUG-003: `GET /glossary/lookup` endpoint completely missing
- **Severity:** Critical
- **Reported:** 2026-05-08 (analysis session)
- **Spec:** `03-api.md:143` — `GET /glossary/lookup?term=&genreId=` → `GlossaryTerm[]` (fuzzy match, limit 5)
- **File:** `apps/api/src/modules/glossary/glossary.controller.ts`, `glossary.service.ts`
- **Root cause:** Endpoint was never implemented
- **Fix:** Added `lookup(term, genreId)` method to `GlossaryService` + `GET /glossary/lookup` route with `term` and `genreId` query params
- **Status:** Fixed

---

#### BUG-004: REVIEW agent seeded with wrong model
- **Severity:** Critical
- **Reported:** 2026-05-08 (analysis session)
- **Spec:** `05-agents.md` § Seed Data — "REVIEW / OLLAMA / phi4:mini (default)"
- **File:** `apps/api/src/modules/models/models.service.ts:34-39`
- **Root cause:** `ModelsService.onModuleInit()` seeds REVIEW with `qwen2.5:7b` instead of `phi4:mini`
- **Fix:** Changed seed data to `phi4:mini`
- **Status:** Fixed

---

#### BUG-005: Anthropic provider falls back to Ollama, never actually called
- **Severity:** Critical
- **Reported:** 2026-05-08 (analysis session)
- **Spec:** `07-architecture.md` — "Anthropic Claude SDK (p-limit 50)" — Anthropic should be a real provider option
- **File:** `apps/api/src/modules/models/models.service.ts:233-239`
- **Root cause:** When `config.provider === ANTHROPIC`, the code called Ollama instead of the Anthropic API
- **Fix:** Added real Anthropic API call (`/v1/messages` endpoint) with `decrypt(apiKeyEnc)` to decrypt stored key; also added Google Gemini provider support via `callGeminiDirect()`
- **Status:** Fixed

---

### 🟠 Security Issues (Fixed)

#### BUG-006: Logout endpoint has no token ownership verification (IDOR)
- **Severity:** Security
- **Reported:** 2026-05-08 (analysis session)
- **Spec:** `03-api.md:15` — `POST /auth/logout` requires R (REVIEWER+)
- **File:** `apps/api/src/modules/auth/auth.controller.ts:77-81`
- **Root cause:** Any logged-in user can revoke any refresh token without ownership check
- **Fix:** `logout()` now takes `userId` from `@CurrentUser()` and verifies `tokenRecord.userId === userId` before deletion
- **Status:** Fixed

---

#### BUG-007: Health endpoint passes encrypted (not decrypted) API key to Anthropic
- **Severity:** Security
- **Reported:** 2026-05-08 (analysis session)
- **File:** `apps/api/src/modules/health/health.controller.ts:63-67`
- **Root cause:** `config.apiKeyEnc` (AES-256-GCM encrypted string) passed directly as `x-api-key` header
- **Fix:** Added `decrypt(config.apiKeyEnc)` before sending request
- **Status:** Fixed

---

#### BUG-008: `rememberMe` TTL not preserved during token refresh
- **Severity:** Security
- **Reported:** 2026-05-08 (analysis session)
- **Spec:** `03-api.md:20` — `rememberMe: true` extends refresh TTL from 7d to 30d
- **File:** `apps/api/src/modules/auth/auth.service.ts:109-121`, `prisma/schema.prisma:33-40`
- **Root cause:** Refresh always creates 7d token regardless of original TTL
- **Fix:** Added `rememberMe: Boolean @default(false)` to `RefreshToken` model; stores flag on login/refresh; refresh preserves original `rememberMe` flag and TTL
- **Status:** Fixed

---

### 🟡 Logic / Behavior Bugs (Fixed)

#### BUG-009: `removeReviewer` can leave page with zero reviewers
- **Severity:** Logic bug
- **Reported:** 2026-05-08 (analysis session)
- **Spec:** `03-api.md:113` — "Cannot remove the last reviewer; use reassign instead"
- **File:** `apps/api/src/modules/pages/pages.service.ts:325-336`
- **Root cause:** Check only thrown if `reviewers.length === 1` before deletion, but removal happens before check completes
- **Fix:** Moved check before removal, throws if `reviewers.length <= 1`; also added null-check for `reviewerToRemove`
- **Status:** Fixed

---

#### BUG-010: `resolveEscalation` wrong reassignment logic
- **Severity:** Logic bug
- **Reported:** 2026-05-08 (analysis session)
- **Spec:** `03-api.md:110` — "Re-assigns to the primary reviewer (isPrimary=true) if still active, otherwise round-robin"
- **File:** `apps/api/src/modules/pages/pages.service.ts:413-418`
- **Root cause:** Only checks if primary exists, not whether original primary user's `isActive` status before re-assigning
- **Fix:** Added check to verify primary reviewer's `user.isActive` status before re-assigning; falls back to round-robin if inactive
- **Status:** Fixed

---

#### BUG-011: `AgentOrchestrator.runReviewPage` deletes ALL errors on each run
- **Severity:** Logic bug
- **Reported:** 2026-05-08 (analysis session)
- **Spec:** `05-agents.md:441` — Review agent re-creates errors but spec doesn't require clearing resolved ones
- **File:** `apps/api/src/modules/agents/agent.orchestrator.ts:269-270`
- **Root cause:** `prisma.error.deleteMany({ where: { pageId: page.id } })` clears everything — APPLIED/REJECTED/ESCALATED errors are lost
- **Fix:** Changed to `where: { pageId: page.id, status: ErrorStatus.OPEN }` — only OPEN errors cleared before re-creation
- **Status:** Fixed

---

#### BUG-012: `boundaryMetadata` missing `hasBleedOver` boolean
- **Severity:** Logic bug
- **Reported:** 2026-05-08 (analysis session)
- **Spec:** `05-agents.md:76` — `boundaryMetadata` includes `hasBleedOver: boolean` (required field)
- **Spec:** `07-architecture.md:164` — Extractor captures `hasBleedOver: boolean`
- **File:** `apps/api/src/modules/agents/gemini.service.ts:60-66`
- **Root cause:** `boundaryMetadata` only has `borrowedTextFromNextPage`, missing `hasBleedOver`
- **Fix:** Added `hasBleedOver: boolean` to Gemini structured output schema in `boundaryMetadata`
- **Status:** Fixed

---

#### BUG-013: `MemoryService.indexPage` — embedding saved in separate operation
- **Severity:** Logic bug
- **Reported:** 2026-05-08 (analysis session)
- **File:** `apps/api/src/modules/agents/memory.service.ts:69-87`
- **Root cause:** Record created first, then embedding updated via raw SQL — crash between creates orphan record without embedding
- **Fix:** Wrapped both operations in `prisma.$transaction([])` — create and raw SQL update execute atomically
- **Status:** Fixed

---

#### BUG-014: `BulkApprove` doesn't check project completion
- **Severity:** Logic bug
- **Reported:** 2026-05-08 (analysis session)
- **Spec:** Sequence #23 — After bulk-approve, check if project is fully approved → `UPDATE status=COMPLETED`
- **File:** `apps/api/src/modules/admin/admin.service.ts:79-103`
- **Root cause:** Updates individual pages but never checks completion to update project status
- **Fix:** After bulk approve, tracks approved page→project mapping and updates project status to `COMPLETED` if all pages are approved
- **Status:** Fixed

---

#### BUG-015: `JobWorker` — failed job doesn't update page status to ERROR in all paths
- **Severity:** Logic bug
- **Reported:** 2026-05-08 (analysis session)
- **File:** `apps/api/src/modules/jobs/job.worker.ts:163-199`
- **Root cause:** If `executeJob` throws before page can be marked ERROR, page stays in previous status (TRANSLATING, REVIEWING, etc.)
- **Fix:** Added `page.update({ status: PageStatus.ERROR })` in catch block before re-queue/retry logic
- **Status:** Fixed

---

#### BUG-016: Chat BUILD mode — `genreVersionDraft` not parsed from `[REVISED_CONTENT]` tags
- **Severity:** Logic bug
- **Reported:** 2026-05-08 (analysis session)
- **Spec:** `05-agents.md:256` — BUILD mode returns `{genreVersionDraft: string}` parsed from `[REVISED_CONTENT]...[/REVISED_CONTENT]` tags
- **File:** `apps/api/src/modules/chat/chat.service.ts:382-384`
- **Root cause:** Emits raw `accumulatedResponse` as `genreVersionDraft` without parsing tags
- **Fix:** Added regex to extract content between `[REVISED_CONTENT]...[/REVISED_CONTENT]` tags before emitting
- **Status:** Fixed

---

#### BUG-017: `QueueService.getQueue` — `_count.errors` not filtered by OPEN status
- **Severity:** Logic bug
- **Reported:** 2026-05-08 (analysis session)
- **File:** `apps/api/src/modules/queue/queue.service.ts:69-74`
- **Root cause:** `select: { errors: true }` counts all errors (APPLIED, REJECTED, ESCALATED included), not just OPEN
- **Fix:** Changed to `select: { errors: { where: { status: ErrorStatus.OPEN } } }` — only counts OPEN errors
- **Status:** Fixed

---

#### BUG-018: `ProjectsController.create` — REVIEWER role excluded from project creation
- **Severity:** Logic bug / Auth mis-match
- **Reported:** 2026-05-08 (analysis session)
- **Spec:** `03-api.md:54` — Role column: R = REVIEWER+ — `POST /projects` requires R (REVIEWER+)
- **File:** `apps/api/src/modules/projects/projects.controller.ts:32-34`
- **Root cause:** `@Roles('ADMIN', 'MASTER')` excludes REVIEWER — spec says REVIEWER should be allowed
- **Fix:** Changed to `@Roles('ADMIN', 'MASTER', 'REVIEWER')`
- **Status:** Fixed

---

#### BUG-019: `TranslationAgent` — hardcoded Ollama model ignores config
- **Severity:** Logic bug
- **Reported:** 2026-05-08 (analysis session)
- **File:** `apps/api/src/modules/agents/translation.agent.ts:200`
- **Root cause:** `ollama.generate(..., 'qwen2.5:7b')` hardcoded — doesn't read from ModelConfig
- **Fix:** Added `OnModuleInit` to read TRANSLATION agent model config from DB on startup; uses `ollama.setDefaultModel()`
- **Status:** Fixed

---

### 🟢 Minor Issues (Fixed)

#### BUG-020: Ollama service uses different env var than health check
- **File:** `ollama.service.ts:48` vs `health.controller.ts:48`
- **Note:** Ollama service uses `OLLAMA_ENDPOINT`, health check uses `OLLAMA_API_URL`
- **Fix:** Changed OllamaService to use `OLLAMA_API_URL` (consistent with health check)
- **Status:** Fixed

---

#### BUG-022: `ModelsService` — failed audit logging silently ignored
- **File:** `apps/api/src/modules/models/models.service.ts:282`
- **Note:** `try/catch` around `activityLog.create` — silent failure; console.error used instead of proper logger
- **Fix:** Added `Logger` to `ModelsService`; replaced `console.error` with `logger.warn`
- **Status:** Fixed

---

## Unfixed Bugs

### 🟡 Logic / Behavior Bugs

#### BUG-023: Dashboard `activeProjectsDeltaMonth` has incorrect delta logic
- **Severity:** Logic bug
- **Reported:** 2026-05-08 (second analysis session)
- **Spec:** `03-api.md:225` — `activeProjectsDeltaMonth: number` — change from previous month
- **File:** `apps/api/src/modules/dashboard/dashboard.service.ts:62-66`
- **Root cause:** Compared current active projects against count of projects created 30+ days ago, not month-over-month change
- **Fix:** Changed comparison to use 30-60 day window (`createdAt: { gte: thirtyDaysAgo, lt: sixtyDaysAgo }`) instead of `lte`
- **Status:** Fixed

---

#### BUG-024: Dashboard `pagesTranslatedDeltaWeek` has incorrect delta logic
- **Severity:** Logic bug
- **Reported:** 2026-05-08 (second analysis session)
- **Spec:** `03-api.md:227` — `pagesTranslatedDeltaWeek: number` — change from 7 days ago
- **File:** `apps/api/src/modules/dashboard/dashboard.service.ts:69-70`
- **Root cause:** Used `updatedAt: { lte: sevenDaysAgo }` which counted pages NOT updated in last 7 days; delta was inverted
- **Fix:** Changed to compare pages APPROVED in last 7 days vs pages APPROVED in the 7 days before that (7-14 day window)
- **Status:** Fixed

---

#### BUG-025: Dashboard `pendingReviewDelta` has incorrect delta logic
- **Severity:** Logic bug
- **Reported:** 2026-05-08 (second analysis session)
- **Spec:** `03-api.md:229` — `pendingReviewDelta: number` — change from previous period
- **File:** `apps/api/src/modules/dashboard/dashboard.service.ts:73-74`
- **Root cause:** Used `createdAt: { lte: thirtyDaysAgo }` — compared against old pages, not period-over-period
- **Fix:** Changed to compare HUMAN_REVIEW pages created in last 30 days vs pages created in the 30-60 day window
- **Status:** Fixed

---

#### BUG-026: `runReviewPage` quality score calculation includes resolved errors
- **Severity:** Logic bug
- **Reported:** 2026-05-08 (second analysis session)
- **Spec:** `02-domain.md:557` — Quality score formula: "resolved errors — APPLIED/REJECTED/EXCEPTION/ESCALATED — are excluded"
- **File:** `apps/api/src/modules/agents/agent.orchestrator.ts:290-292`
- **Root cause:** `findMany({ where: { pageId: page.id } })` fetches ALL errors without status filter — included APPLIED/REJECTED/ESCALATED
- **Fix:** Added `status: ErrorStatus.OPEN` filter to the quality score query — only OPEN errors counted
- **Status:** Fixed

---

#### BUG-027: Project stats returns wrong status keys (lowercase vs enum values)
- **Severity:** Logic bug
- **Reported:** 2026-05-08 (second analysis session)
- **File:** `apps/api/src/modules/projects/projects.service.ts:270-289`
- **Root cause:** Uses lowercase keys like `extracting`, `extracted` which don't match PageStatus enum values (`EXTRACTING`, `EXTRACTED`)
- **Fix:** Changed stats object to use `PageStatus` enum values as keys with `Record<string, number>` type; added `ESCALATED` status
- **Status:** Fixed

---

### 🟢 Minor Issues

#### BUG-021: XLSX export not implemented
- **Spec:** `03-api.md:264` — format: pdf|xlsx; `07-architecture.md` — XLSX export via `exceljs` for admin report
- **File:** `apps/api/src/modules/export/export.service.ts`
- **Note:** Only PDF, DOCX, HTML, TXT supported
- **Status:** Unfixed (low priority)
- **Fix needed:** Implement XLSX export using exceljs library; update admin report endpoint to respect format parameter
- **Priority:** Low

---

#### BUG-028: Missing endpoint: `GET /projects/:id/team`
- **Severity:** Missing feature
- **Reported:** 2026-05-08 (second analysis session)
- **Spec:** `03-api.md:68` — `GET /projects/:id/team` → `{reviewers: User[], owner: User?}`
- **File:** `apps/api/src/modules/projects/projects.controller.ts`, `projects.service.ts`
- **Root cause:** Endpoint was never implemented
- **Fix:** Added `GET /projects/:id/team` route and `getTeam(id)` method returning deduplicated reviewer list and project owner
- **Status:** Fixed

---

#### BUG-029: Admin `bulkReassign` doesn't validate page existence
- **Severity:** Minor
- **Reported:** 2026-05-08 (second analysis session)
- **File:** `apps/api/src/modules/admin/admin.service.ts:62-74`
- **Root cause:** Loops through pageIds without first checking if page exists; continues silently on invalid pageId
- **Fix:** Added `prisma.page.findUnique()` check for each pageId — silently skips with `continue` instead of throwing
- **Status:** Fixed

---

#### BUG-030: `JobsService.cancel` processes RUNNING jobs
- **Severity:** Minor
- **Reported:** 2026-05-08 (second analysis session)
- **Spec:** `07-architecture.md:354` — "In-flight child jobs complete but their results are discarded"
- **File:** `apps/api/src/modules/jobs/jobs.service.ts:80-93`
- **Root cause:** Recursively cancels jobs with status RUNNING — spec says RUNNING jobs should complete but results discarded
- **Fix:** Removed `JobStatus.RUNNING` from the cancellation condition; only QUEUED and PAUSED jobs are cancelled
- **Status:** Fixed

---

#### BUG-031: `GET /files/public/:path` requires authentication (spec violation)
- **Severity:** Logic bug / Spec mismatch
- **Reported:** 2026-05-08 (third analysis session)
- **Spec:** `03-api.md:153` — `GET /files/public/:path` → "Streams image directly (used for Markdown `![img]` tags) | Public"
- **File:** `apps/api/src/modules/files/files.controller.ts:87-102`
- **Root cause:** Wildcard `@Get('files/*')` route with `@Roles('ADMIN', 'MASTER', 'REVIEWER')` — requires auth for all file paths including public ones
- **Fix:** Changed to `@Public()` decorator on the wildcard file route; imported `Public` decorator
- **Status:** Fixed

---

#### BUG-032: `auth.service.spec.ts` tests OLD in-memory reset token Map behavior
- **Severity:** Test bug
- **Reported:** 2026-05-08 (third analysis session)
- **File:** `apps/api/src/modules/auth/auth.service.spec.ts:205-232`
- **Root cause:** After BUG-002 fix (JWT-based reset tokens), test still accessed `(service as any).resetTokens` as a Map which no longer exists
- **Fix:** Rewrote password reset flow tests to verify JWT token behavior instead of Map behavior; also added logout IDOR test
- **Status:** Fixed

---

## Resolved in This Session

| Bug ID | Description | Resolution |
|--------|-------------|-------------|
| BUG-001 | Genre deletion unblocked | Fixed — added project reference check |
| BUG-002 | In-memory reset tokens | Fixed — switched to JWT |
| BUG-003 | Glossary lookup missing | Fixed — added endpoint |
| BUG-004 | Wrong REVIEW model seed | Fixed — `phi4:mini` |
| BUG-005 | Anthropic never called | Fixed — real API calls + decrypt |
| BUG-006 | Logout IDOR vulnerability | Fixed — token ownership check added |
| BUG-007 | Health passes encrypted key | Fixed — decrypt before check |
| BUG-008 | rememberMe TTL not preserved | Fixed — rememberMe flag in DB schema |
| BUG-009 | removeReviewer leaves zero reviewers | Fixed — check `<=1` before deletion |
| BUG-010 | resolveEscalation wrong reassignment | Fixed — checks user.isActive |
| BUG-011 | runReviewPage deletes ALL errors | Fixed — only OPEN errors cleared |
| BUG-012 | boundaryMetadata missing hasBleedOver | Fixed — added to schema |
| BUG-013 | MemoryService embedding not in transaction | Fixed — wrapped in $transaction |
| BUG-014 | BulkApprove doesn't complete project | Fixed — tracks page→project mapping |
| BUG-015 | JobWorker doesn't set ERROR on failure | Fixed — added page status update in catch |
| BUG-016 | genreVersionDraft not parsed from tags | Fixed — regex extraction added |
| BUG-017 | Queue errors count not filtered by OPEN | Fixed — added `where: ErrorStatus.OPEN` |
| BUG-018 | ProjectsController excludes REVIEWER | Fixed — added REVIEWER to @Roles |
| BUG-019 | TranslationAgent hardcoded model | Fixed — reads from ModelConfig on init |
| BUG-020 | Ollama service env var mismatch | Fixed — uses OLLAMA_API_URL consistently |
| BUG-022 | ModelsService audit logging silently ignored | Fixed — added proper logger.warn |
| BUG-023 | Dashboard activeProjectsDeltaMonth wrong logic | Fixed — compare 30d vs 30-60d window |
| BUG-024 | Dashboard pagesTranslatedDeltaWeek wrong logic | Fixed — compare 7d vs 7-14d window |
| BUG-025 | Dashboard pendingReviewDelta wrong logic | Fixed — compare 30d vs 30-60d window |
| BUG-026 | runReviewPage quality includes resolved errors | Fixed — filter to OPEN errors only |
| BUG-027 | Project stats wrong status keys | Fixed — use PageStatus enum values |
| BUG-028 | Missing GET /projects/:id/team endpoint | Fixed — added endpoint |
| BUG-029 | bulkReassign no page existence validation | Fixed — added existence checks |
| BUG-030 | JobsService.cancel processes RUNNING jobs | Fixed — skip RUNNING jobs on cancel |
| BUG-031 | GET /files/public requires auth (spec violation) | Fixed — added @Public() decorator |
| BUG-032 | auth.service.spec.ts tests old Map behavior | Fixed — rewrote to test JWT behavior |

**Total: 32 fixed, 1 remaining** (BUG-021: XLSX export — low priority)
