# tAI — Implementation Plan

This document defines the build sequence for tAI v2. All spec decisions are locked in `01-07` files.
The existing codebase (v1 Prisma schema + stub modules) is being **fully replaced**.

Phases are ordered by dependency. Each phase lists what to create/replace, the acceptance test, and the spec reference.

---

## Pre-work: Wipe v1

Before Phase 0, manually:
1. Drop the v1 Prisma schema and all migrations
2. Delete `apps/api/src/modules/rules/` (removed — no Rules feature), `apps/api/src/modules/agents/` (old), `apps/api/src/modules/files/`, `apps/api/src/modules/export/` — all will be rewritten
3. Delete `apps/api/src/app/` (NX-generated scaffold)
4. Delete all frontend feature directories — all will be rewritten
5. Keep: `apps/api/src/main.ts`, `apps/api/src/modules/prisma/`, NX config files, Docker files

---

## Phase 0 — Infrastructure & Docker

**Goal:** All services start; API health endpoint returns green.

### Create / Update
- `docker-compose.yml` — postgres:17, minio/minio, ollama/ollama, maildev/maildev, api (port 3000), frontend (port 4200), nlp (port 8001)
- `docker-compose.prod.yml` — same without dev overrides
- `apps/api/.env.example` — all env vars from `07-architecture.md`
- `apps/api/src/main.ts` — enable CORS, helmet, throttler, global validation pipe, Pino logger
- `apps/api/src/app.module.ts` — root module: imports PrismaModule, ThrottlerModule, ConfigModule
- `apps/nlp/main.py` — FastAPI/spaCy sentence segmentation sidecar (~20 lines; see `07-architecture.md` § NLP Segmentation Service)
- `apps/nlp/requirements.txt` — `fastapi`, `uvicorn`, `spacy`; pre-download `en_core_web_sm`
- `apps/nlp/Dockerfile.nlp` — Python 3.11 slim; installs requirements; downloads `en_core_web_sm`; exposes port 8001

### Acceptance
- `docker compose up` → all 7 services healthy (postgres, minio, ollama, nlp, maildev, api, frontend)
- `GET /health` → `{status: "ok", db: "ok", minio: "ok", ollama: "ok"}`

**Spec ref:** `07-architecture.md` § Docker Services, § Environment Variables

---

## Phase 1 — Database Schema

**Goal:** Fresh Prisma schema matches spec exactly; seed data loads.

### Create / Replace
- `apps/api/prisma/schema.prisma` — full schema from `02-domain.md` (replace v1 schema entirely)
  - Models: User, RefreshToken, Genre, GenreVersion, Project, Chapter, Page, Sentence, Error, GlossaryTerm, Job, ChatSession, ChatMessage, ModelConfig, ActivityLog
  - Enums: Role, ProjectStatus, PageStatus, SentenceStatus, ErrorSeverity, ErrorCategory, ErrorStatus, JobType, JobStatus, AgentType, Provider, ChatContext, ChatMode, MessageRole, Priority, SegmentUnit
- `apps/api/prisma/migrations/` — single initial migration. **Important:** after Prisma generates the migration SQL, manually append the pgvector ivfflat index for `TranslationMemory.embedding` — Prisma cannot express this for `Unsupported` types:
  ```sql
  CREATE INDEX tm_embedding_idx ON "TranslationMemory"
    USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
  ```
- `apps/api/prisma/seed.ts`:
  - 3 users: admin@tai.local / master@tai.local / reviewer@tai.local (bcrypt passwords)
  - Genre "Tamil Bible (Parisutha Vedagamam)" (icon: 📖, color: #7c3aed) with v1.0 content from `05-agents.md` § Default Genre Template
  - 50 GlossaryTerms (Parisutha Vedagamam Protestant theological vocabulary) from `02-domain.md` § Seed Data linked to the Bible genre
  - 5 ModelConfigs: TRANSLATION/OLLAMA/qwen2.5:7b, REVIEW/OLLAMA/phi4:mini, CHAT/OLLAMA/qwen2.5:7b, CHAT/ANTHROPIC/claude-sonnet-4-6, EMBEDDING/OLLAMA/nomic-embed-text

### Acceptance
- `npx prisma migrate dev --name init` runs clean
- `npx prisma db seed` creates all seed records
- `npx prisma studio` — all tables visible with correct columns

**Spec ref:** `02-domain.md` § Prisma Schema, § Seed Data

---

## Phase 2 — Auth Module (API)

**Goal:** Login → access token + refresh token. Token rotation. Password reset flow.

### Create / Replace
- `apps/api/src/modules/auth/auth.module.ts`
- `apps/api/src/modules/auth/auth.controller.ts` — `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `POST /auth/forgot-password`, `POST /auth/reset-password`, `GET /auth/me`
- `apps/api/src/modules/auth/auth.service.ts`:
  - `login()` — bcrypt compare, issue JWT access (15m) + refresh (7d / 30d if rememberMe)
  - `refresh()` — validate RefreshToken, rotate (delete old, issue new)
  - `logout()` — delete RefreshToken
  - `forgotPassword()` — sign a stateless JWT `{sub: userId, email, purpose: "password-reset", exp: 1h}`; send link `/reset-password/:token` via EmailService
  - `resetPassword()` — verify JWT signature + purpose claim; bcrypt hash new password; token replay is naturally prevented because the old password hash no longer matches after reset
- `apps/api/src/common/guards/jwt.guard.ts` — validates Bearer token
- `apps/api/src/common/guards/roles.guard.ts` — REVIEWER/MASTER/ADMIN hierarchy
- `apps/api/src/common/decorators/current-user.decorator.ts`
- `apps/api/src/common/decorators/activity-log.decorator.ts` — method decorator: `@ActivityLog('page.approved', 'page')`
- `apps/api/src/common/interceptors/activity-log.interceptor.ts` — fires after successful response; writes ActivityLog row with action, entityType, entityId, entityHref, userId
- `apps/api/src/modules/email/email.module.ts` + `email.service.ts` — nodemailer + dev maildev

### Acceptance
- `POST /auth/login` with valid creds → `{accessToken, refreshToken, user}`
- `GET /auth/me` with token → current user
- `POST /auth/refresh` → rotated tokens
- `POST /auth/logout` → 204; subsequent refresh → 401
- `POST /auth/forgot-password` → email appears in maildev at :1080

**Spec ref:** `03-api.md` § Auth; `02-domain.md` § RefreshToken

---

## Phase 3 — Users Module (API)

**Goal:** Admin can invite, deactivate, and reset passwords for users.

### Create
- `apps/api/src/modules/users/users.controller.ts` — `GET /users`, `POST /users/invite`, `PATCH /users/:id`, `POST /users/:id/reset-password`
- `apps/api/src/modules/users/users.service.ts`:
  - `invite()` — create user with temp password, send invitation email
  - `update()` — change name, role, isActive
  - `resetPassword()` — send reset email

### Acceptance
- `GET /users` (MASTER+) → list of users
- `POST /users/invite` (ADMIN) → creates user, email in maildev
- `PATCH /users/:id` → updates user; role change takes effect on next login

> **Design decision**: `POST /users/invite` accepts roles REVIEWER and MASTER only. ADMIN accounts are provisioned exclusively via the seed script or direct DB access — the invite endpoint must reject `role: "ADMIN"` with a 422.

**Spec ref:** `03-api.md` § Users

---

## Phase 4 — Genres Module (API)

**Goal:** Create/edit genres with full version history and test endpoint.

### Create
- `apps/api/src/modules/genres/genres.controller.ts` — all endpoints from `03-api.md` § Genres
- `apps/api/src/modules/genres/genres.service.ts`:
  - `list()` — with `projectCount` and `lastUpdatedBy`
  - `create()` — auto-creates v1.0 GenreVersion
  - `createVersion()` — bumps semver, sets as currentVersionId
  - `restore()` — duplicates old version as new current
  - `diff()` — uses `diff` library on content strings
  - `test()` — calls TranslationAgent with sample text, returns translation + tokensUsed

### Acceptance
- Full CRUD with version chain; `GET /genres/:id/versions` returns ordered list
- `POST /genres/:id/versions` bumps version number correctly (1.0 → 1.1 → 2.0 manual)
- `GET /genres/:id/versions/:vId/diff` returns unified diff string
- `POST /genres/:id/test` returns translation of sample text

**Spec ref:** `03-api.md` § Genres; `02-domain.md` § Key Business Rules

---

## Phase 5 — Projects & Chapters Module (API)

**Goal:** Create projects linked to genres; chapters auto-detected post-extraction.

### Create
- `apps/api/src/modules/projects/projects.controller.ts` — CRUD + `/stats` + `/team`
- `apps/api/src/modules/projects/projects.service.ts`:
  - `create()` — atomic: create Project + enqueue PROCESS_DOCUMENT job
  - `getStats()` — counts by page status, avg quality
  - `getTeam()` — distinct reviewers assigned to project's pages
  - `pause()` — sets Project status = PAUSED, updates QUEUED jobs to PAUSED
  - `resume()` — sets Project status = PROCESSING, updates PAUSED jobs to QUEUED
  - `cancelJobs()` — sets pending jobs to CANCELLED
- `apps/api/src/modules/chapters/chapters.controller.ts` — CRUD for chapters
- `apps/api/src/modules/chapters/chapters.service.ts`

### Acceptance
- `POST /projects` → creates project, triggers PROCESS_DOCUMENT job (verify job record created)
- `POST /projects/:id/pause` → transitions QUEUED jobs to PAUSED and Project to PAUSED
- `GET /projects/:id` → includes chapters array with page status grid
- `GET /projects/:id/stats` → accurate page counts

**Spec ref:** `03-api.md` § Projects, § Chapters

---

## Phase 6 — Files Module (API)

**Goal:** Upload PDFs to MinIO; generate signed download URLs.

### Create / Replace
- `apps/api/src/modules/files/minio.service.ts` — `upload()`, `getSignedUrl()` (1h expiry), `deleteObject()`
- `apps/api/src/modules/files/files.controller.ts` — `POST /files/upload` (multipart), `GET /files/:fileId/url`, `GET /files/public/:path` (streams object directly from MinIO, no auth required — used by Markdown `![img]` tags in the workbench)
- Store MinIO object key as `sourceFileId` on Project

### Acceptance
- `POST /files/upload` with PDF → `{fileId, filename, size, url}`
- `GET /files/:fileId/url` → signed URL accessible for 1 hour
- URL expires; second request after 1h → 403 from MinIO

**Spec ref:** `03-api.md` § Files

---

## Phase 7 — LLM Provider Layer

**Goal:** Unified interface for Ollama and Anthropic; DB-driven config.

### Create
- `apps/api/src/llm/llm.interface.ts` — `LLMProvider` interface: `generate()`, `generateStructured<T>()`, `stream()`
- `apps/api/src/llm/ollama.provider.ts` — HTTP calls to Ollama endpoint; `p-limit(2)`
- `apps/api/src/llm/anthropic.provider.ts` — `@anthropic-ai/sdk`; `p-limit(50)`; prompt cache breakpoints
- `apps/api/src/llm/llm.service.ts` — factory: reads active ModelConfig per AgentType, returns correct provider
- Retry logic: 3 attempts, exponential backoff, on both providers

### Acceptance
- `LlmService.forAgent(AgentType.TRANSLATION)` → returns Ollama or Anthropic based on DB config
- Ollama provider rejects when p-limit(2) full, queues remainder
- Anthropic provider sets `cache_control: {type: "ephemeral"}` at correct breakpoints

**Spec ref:** `07-architecture.md` § LLM Provider Layer; `05-agents.md` § Prompt Caching

---

## Phase 8 — Agents (Extraction, Translation, Review)

**Goal:** Pipeline processes PDFs into translated, reviewed sentences.

### Create / Replace
- `apps/api/src/agents/extraction.service.ts`:
  - `processDocument(job)`: Download PDF via `minio.getObject()`, split into images (`pdf2image`), upload to MinIO, create Page records, enqueue `EXTRACT_PAGE` jobs (parentJobId = this job's id).
  - `extractPage(job)`: Download page image, run OCR (Marker/LlamaParse) → `markdownString`. Capture `page.layoutMetadata`. Image Extraction: crop illustrations/diagrams, upload to MinIO, embed `![image](minio_url)` in Markdown. Call SegmentationService (two-level: Markdown structure → spaCy per paragraph). Save `page.sourceMarkdown` with `{{SENTENCE_X}}` placeholders. Set `page.status = EXTRACTED`. Check if all sibling EXTRACT_PAGE jobs are DONE; if yes, enqueue DETECT_CHAPTERS.
  - `detectChapters(job)`: Cross-page sentence stitching → chapter detection → token-budget batch planner → enqueue TRANSLATE_BATCH jobs (see `05-agents.md` § Agent Pipeline).
- `apps/api/src/agents/translation.agent.ts`:
  - Load `project.sourceLang`, `project.targetLang` from DB
  - Build system prompt using `{sourceLang}` / `{targetLang}` variables (see `05-agents.md` § Translation Agent)
  - Inject `[GENRE_CONTENT_CACHE_BLOCK]` + `[GLOSSARY_CACHE_BLOCK]` + `[TRANSLATION_MEMORY_BLOCK]`
  - User prompt: `[DOCUMENT_CONTEXT]` block per page + JSON array of sentences to translate
  - Call `LlmService.forAgent(TRANSLATION)` with all sentences across the batch.
  - Parse JSON array response and save `translatedText`, `aiTranslatedText = translatedText`, and `confidence` to each Sentence
- `apps/api/src/agents/review.agent.ts`:
  - Load `project.sourceLang`, `project.targetLang` from DB
  - Build review prompt using `{sourceLang}` / `{targetLang}` variables (see `05-agents.md` § Review Agent)
  - Call `LlmService.forAgent(REVIEW)`, temp=0.1, maxTokens=2048
  - Parse structured JSON response (scores + errors array)
  - Save scores to Sentence; create Error records
  - Set `sentence.status = REVIEWED`
- `apps/api/src/agents/orchestrator.ts`:
  - `runProcessDocument(job)` — splits PDF and queues page extraction
  - `runExtractPage(job)` — runs OCR pipeline on single image
  - `runTranslateBatch(job)` — fetches sentences for all pages in batch, calls translation agent; implements batch-split retry on JSON parse failure (split in half, retry each half, max 3 attempts per half)
  - `runReviewPage(job)` — fetches all page sentences, calls review agent in one batch call
  - Priority assignment: map the worst error severity across all errors on the page directly to `page.priority` — any CRITICAL error → CRITICAL, else any HIGH → HIGH, else any MEDIUM → MEDIUM, else LOW (or MEDIUM if no errors)
  - Sets `page.lastAiRunAt`, assigns reviewer

### Acceptance
- Upload a PDF, trigger PROCESS_DOCUMENT → Page images split and EXTRACT_PAGE jobs queued.
- EXTRACT_PAGE completes → Sentence records created with correct text.
- Trigger TRANSLATE_BATCH → JSON array sent to LLM, all sentences get `translatedText`.
- Trigger REVIEW_PAGE → all sentences get scores + Error records created
- Page priority assigned based on highest error severity

**Spec ref:** `05-agents.md` § Agent Pipeline; `05-agents.md` § Quality Scoring

---

## Phase 8b — Translation Memory (RAG)

**Goal:** Store approved translations as vector embeddings and retrieve them to augment the translation prompt.

### Create / Modify
- `apps/api/src/modules/memory/memory.module.ts` + `memory.service.ts`
- `apps/api/src/llm/embedding.service.ts`:
  - `embed(text)` — calls Ollama with `nomic-embed-text` to generate 768-dim vector
- `MemoryService.index(sentence, page)`:
  - Generates embedding for `sentence.originalText`
  - Inserts row into `TranslationMemory` (genreId, sourceLang, targetLang, originalText, translatedText, embedding)
- `MemoryService.retrieve(originalText, genreId, sourceLang, targetLang)`:
  - Performs pgvector cosine similarity search (`<=>`) filtered by genre and languages
  - Returns top 3 matches with similarity ≥ 0.75
- `apps/api/src/modules/pages/pages.service.ts`:
  - In `approve()` method, after setting status to APPROVED: enqueue INDEX_MEMORY job (async — approval response is not blocked). The INDEX_MEMORY job runner calls `MemoryService.index()` per sentence.
- `apps/api/src/agents/translation.agent.ts`:
  - Before building the prompt, call `MemoryService.retrieve()`
  - Inject retrieved pairs into `[TRANSLATION_MEMORY_BLOCK]`

### Acceptance
- `POST /pages/:id/approve` succeeds → new rows appear in `TranslationMemory` with embeddings
- `TRANSLATE_BATCH` job for similar text → log output shows `[TRANSLATION_MEMORY_BLOCK]` populated with the previously approved pair
- `MemoryService.retrieve` correctly filters out results from a different `genreId`

**Spec ref:** `05-agents.md` § Translation Memory (RAG)

---

## Phase 9 — Job System

**Goal:** DB-backed async job queue with progress tracking.

### Create
- `apps/api/src/modules/jobs/jobs.controller.ts` — `POST /jobs`, `GET /jobs/:id`, `DELETE /jobs/:id`
- `apps/api/src/modules/jobs/jobs.service.ts` — enqueue, poll, cancel
- `apps/api/src/modules/jobs/job.worker.ts`:
  - Polls `jobs` table every 2s for `status = QUEUED`
  - `SELECT FOR UPDATE SKIP LOCKED` transaction
  - Dispatches to `orchestrator.runProcessDocument()`, `runExtractPage()`, `runDetectChapters()`, `runTranslateBatch()`, `runReviewPage()`, `runIndexMemory()`, `runExportProject()`, `runExportPageReport()`, `runExportAdminReport()`
  - Updates `progress` (0-100) in real time via `job.progress = N`; saves to DB
  - Graceful shutdown: `onModuleDestroy()` waits for running jobs to complete
  - On restart: finds jobs stuck in `RUNNING` → marks `FAILED` → re-queues

### Acceptance
- Enqueue PROCESS_DOCUMENT → job appears as QUEUED, transitions RUNNING → DONE
- `GET /jobs/:id` while running → `{status: "RUNNING", progress: 47}`
- Kill API mid-job → restart → job goes to FAILED then re-queues automatically
- `DELETE /jobs/:id` on QUEUED → cancels immediately; on RUNNING → cancels gracefully (worker finishes current LLM call but discards result — does not advance page status)

**Spec ref:** `03-api.md` § Jobs; `07-architecture.md` § Job Worker

---

## Phase 10 — Pages, Sentences & Errors Modules (API)

**Goal:** Human review workflow: approve, request changes, escalate, apply/reject errors.

### Create
- `apps/api/src/modules/pages/pages.controller.ts` — full endpoints from `03-api.md` § Pages including `GET /pages/:id/next-in-queue`:
  - `PATCH /pages/:id` (notes, priority, status)
  - `POST /pages/:id/approve` — blocked if OPEN errors or any sentence isApproved=false (unless MASTER+); enqueues INDEX_MEMORY
  - `POST /pages/:id/request-changes` — requires note; sets page.retryCount += 1; if page.retryCount > page.maxRetries (3), return 422 with code `MAX_RETRIES_EXCEEDED`; otherwise enqueues TRANSLATE_BATCH for this page alone
  - `POST /pages/:id/reassign {reviewerIds}` — replaces entire PageReviewer list
  - `POST /pages/:id/add-reviewer {reviewerId}` — adds reviewer without removing others
  - `POST /pages/:id/remove-reviewer {reviewerId}` — removes reviewer; error if last reviewer
  - `POST /pages/:id/escalate`
  - `POST /pages/:id/resolve-escalation`
  - Recalculate `page.quality` after any Error status change
- `apps/api/src/modules/sentences/sentences.controller.ts`:
  - `GET /sentences?pageId=`
  - `PATCH /sentences/:id` — edit translatedText; blocked if sentence.assignedReviewerId set and caller is not that reviewer (unless MASTER+)
  - `POST /sentences/:id/apply-all-fixes` — sets all OPEN errors to APPLIED; recalculates page.quality
  - `POST /sentences/:id/assign {reviewerId}` — locks sentence to specific reviewer
  - `POST /sentences/:id/reset-translation` — sets translatedText = aiTranslatedText; clears isApproved
- `apps/api/src/modules/errors/errors.controller.ts`:
  - `GET /errors?sentenceId=&pageId=&status=`
  - `POST /errors/:id/apply` — sets status APPLIED; replaces `error.currentText` with `error.suggestedText` in `sentence.translatedText` (string replace); returns updated Error + Sentence
  - `POST /errors/:id/reject` — sets status REJECTED
  - `POST /errors/:id/exception {sourceTerm?, note?}` — sets status EXCEPTION; if sourceTerm provided, creates GlossaryTerm (sourceTerm=English, targetTerm=error.currentText, genreId from project)
  - `POST /errors/:id/escalate` — sets status ESCALATED

### Acceptance
- `POST /pages/:id/approve` with OPEN errors → 422 (REVIEWER role)
- `POST /pages/:id/approve` with OPEN errors → succeeds (MASTER role)
- `POST /errors/:id/exception` → creates new GlossaryTerm for the genre
- `POST /sentences/:id/apply-all-fixes` → all OPEN errors become APPLIED

**Spec ref:** `03-api.md` § Pages, § Segments, § Errors; `02-domain.md` § Business Rules

---

## Phase 11 — Glossary Module (API)

**Goal:** Genre-scoped terminology CRUD with fuzzy lookup.

### Create
- `apps/api/src/modules/glossary/glossary.controller.ts` — all endpoints from `03-api.md` § Glossary
- `apps/api/src/modules/glossary/glossary.service.ts`:
  - `lookup()` — `ILIKE` fuzzy match on sourceTerm, limit 5
  - `bulkCreate()` — upsert 300+ seed terms (ADMIN only)
  - Enforce `@@unique([genreId, sourceTerm])` — 409 on duplicate

### Acceptance
- `GET /glossary/lookup?term=God&genreId=X` → `[{sourceTerm: "God", targetTerm: "...", ...}]`
- `POST /glossary/bulk` with 300 terms → all inserted
- Duplicate sourceTerm for same genre → 409

**Spec ref:** `03-api.md` § Glossary

---

## Phase 12 — Chat Module (API)

**Goal:** Context-aware AI assistant with SSE streaming and Plan/Build modes.

### Create
- `apps/api/src/modules/chat/chat.controller.ts` — all endpoints from `03-api.md` § Chat
- `apps/api/src/modules/chat/chat.service.ts`:
  - `createSession()` — create ChatSession with context + entityId
  - `getSessionMessages()` — last 20 (sliding window)
  - `sendMessage()` — non-streaming; saves user + assistant messages
  - `stream()` — SSE: build system prompt per context, call `LlmService.stream()`, emit chunks
  - `getQuickPrompts()` — return 5-8 suggestions based on context + mode
  - BUILD mode for GENRE context: extract `[REVISED_CONTENT]...[/REVISED_CONTENT]` from response, return `revisedContent`
  - BUILD mode for REVIEW context: parse `SENTENCE N: {text}` corrections

### Context system prompts
- **GENRE**: inject `genre.name` + `genre.currentVersion.content`
- **REVIEW**: inject page original + current translation + detected errors
- **GLOSSARY**: inject genre glossary terms
- **GENERAL**: base translator prompt only

### Acceptance
- `POST /chat/sessions` + `GET /chat/sessions/:id/stream?content=X&mode=PLAN` → SSE chunks ending with `data: [DONE]`
- BUILD mode GENRE → response includes `{revisedContent: "..."}`
- Sliding window: session with 25 messages → `GET /chat/sessions/:id` returns 20 most recent
- `GET /chat/quick-prompts?context=GENRE&mode=PLAN` → 5+ suggestions

**Spec ref:** `03-api.md` § Chat; `05-agents.md` § Chat Assistant

---

## Phase 13 — Dashboard, Queue & Admin Modules (API)

**Goal:** Stats aggregation, review queue with filtering, bulk admin actions.

### Create
- `apps/api/src/modules/dashboard/dashboard.controller.ts`:
  - `GET /dashboard/stats` — `DashboardStats` with deltas (30s in-memory cache)
  - `GET /dashboard/throughput?metric=pages|words&weeks=12`
  - `GET /dashboard/my-queue?limit=5`
  - `GET /dashboard/recent-projects?limit=4`
  - `GET /dashboard/activity?limit=10`
- `apps/api/src/modules/queue/queue.controller.ts`:
  - `GET /queue` — filterable, sortable PageListItem list
  - `GET /queue/error-stats` — ErrorStatsByCategory[]
  - `GET /escalations` — MASTER+
- `apps/api/src/modules/admin/admin.controller.ts`:
  - `GET /admin/pages` — all pages with filters (MASTER+)
  - `POST /admin/bulk-reassign` — assign reviewer to multiple pages
  - `POST /admin/bulk-approve` — approve pages that have no OPEN errors; return skipped count
  - `POST /admin/pages/:id/override` — force page status with reason

### Acceptance
- `GET /dashboard/stats` → correct counts; delta is difference from 30d/7d ago
- `GET /queue?sort=quality&lowQualityOnly=true` → pages with score < 70 sorted by quality
- `POST /admin/bulk-approve` with mix of clean + errored pages → skipped count = errored count

**Spec ref:** `03-api.md` § Dashboard, § Queue, § Admin

---

## Phase 14 — Models Module (API)

**Goal:** Admins configure LLM providers; test connectivity; view prompt logs.

### Create
- `apps/api/src/modules/models/models.controller.ts`:
  - `GET /models` — all ModelConfig records
  - `GET /models/available?provider=` — list models from Ollama (`/api/tags`) or Anthropic
  - `PUT /models/:agentType` — update provider config; encrypt API key with AES-256-GCM
  - `POST /models/test` — ping provider, return `{online, latencyMs, error?}`
  - `GET /models/:agentType/logs?limit=` — last N prompt/response pairs (redacted)
- `apps/api/src/modules/models/models.service.ts` — encryption/decryption with ENCRYPTION_KEY env var

### Acceptance
- `PUT /models/TRANSLATION` with Anthropic + real API key → encrypts key, saves to DB
- `POST /models/test` with Ollama offline → `{online: false, error: "connection refused"}`
- `GET /models/available?provider=OLLAMA` → list of locally available models

**Spec ref:** `03-api.md` § Models

---

## Phase 15 — Export Module (API)

**Goal:** Generate downloadable project PDFs and per-page reports (manual, user-triggered only).

### Create / Replace
- `apps/api/src/modules/export/export.controller.ts`:
  - `POST /export/project/:id` — `{format: pdf|docx|text|html, scope: all|approved, templateOverride?}` → `{jobId}`
  - `POST /export/page/:id/report` → `{jobId}`
  - `POST /export/admin-report` (MASTER+) — `{projectIds?: string[], format?: pdf|xlsx}` → `{jobId}`; generates an aggregate quality/progress report across selected projects (or all accessible projects if `projectIds` omitted)
- `apps/api/src/modules/export/export.service.ts`:
  - Reconstruct markdown per page: fetch `page.sourceMarkdown`, replace `{{SENTENCE_X}}` with `sentence.translatedText`
  - **PDF**: pdfkit with `genre.pdfTemplate` + `page.layoutMetadata`; Noto font family; see `07-architecture.md` § PDF Export Layer
  - **DOCX**: `docx` npm package; map Markdown heading/paragraph/list/quote to Word styles; apply `genre.docxTemplate` if set; fetch images from MinIO for inline embedding; see `07-architecture.md` § DOCX Export Layer
  - **text / html**: plain string concatenation or lightweight Markdown-to-HTML
  - Page report: sentence-by-sentence quality analysis with error breakdown
  - Store output in MinIO; set `job.result.fileUrl` (signed URL, 1h expiry)

### Acceptance
- `POST /export/project/:id` with `{format: "pdf", scope: "approved"}` → jobId → poll → signed PDF URL; PDF renders Tamil text with correct fonts
- `POST /export/project/:id` with `{format: "docx", scope: "approved"}` → jobId → poll → signed DOCX URL; Word document opens with correct heading hierarchy
- `POST /export/page/:id/report` → jobId → poll → downloadable report
- `POST /export/admin-report` (MASTER+) → jobId → poll → aggregate report (PDF or XLSX)

**Spec ref:** `03-api.md` § Export

---

## Phase 16 — Health Endpoint

**Goal:** Single health check covers all dependent services.

### Create
- `apps/api/src/modules/health/health.controller.ts`:
  - `GET /health` — checks DB (Prisma `$queryRaw SELECT 1`), MinIO (bucket exists), Ollama (HTTP GET /api/tags), Anthropic (ping if API key present)
  - Returns `{status, db, minio, ollama, anthropic}`

### Acceptance
- All services running → `{status: "ok", db: "ok", minio: "ok", ollama: "ok"}`
- Kill MinIO → `{status: "degraded", minio: "error"}`

**Spec ref:** `03-api.md` § Health

> Activity logging (ActivityLog interceptor + decorator) was added in Phase 2 — available from Phase 3 onwards.

---

## Phase 17 — Frontend Foundation

**Goal:** Angular app bootstrapped; auth flow works; layout shell renders.

### Create
- `apps/frontend/src/app/core/services/auth.service.ts` — login/logout/refresh; stores access token in memory, refresh token in httpOnly cookie
- `apps/frontend/src/app/core/interceptors/auth.interceptor.ts` — attaches Bearer token; on 401 → refresh → retry
- `apps/frontend/src/app/core/guards/auth.guard.ts` — redirect to /login if no token
- `apps/frontend/src/app/core/guards/role.guard.ts` — guard routes by role
- `apps/frontend/src/app/core/services/api.service.ts` — typed HTTP methods wrapping `HttpClient`
- `apps/frontend/src/app/features/login/login.component.ts` — email/password form + remember me checkbox + inline forgot-password mode
- `apps/frontend/src/app/features/login/reset-password.component.ts` — standalone card at `/reset-password/:token`
- `apps/frontend/src/app/layout/app.layout.component.ts` — sidebar + topbar shell
- `apps/frontend/src/app/layout/app.menu.component.ts` — nav items: Dashboard / Projects / Queue / Genres / [Admin▼: Team / Settings]
- `apps/frontend/src/app/layout/app.topbar.component.ts` — app name + user avatar + logout
- `apps/frontend/src/styles.scss` — Tailwind + PrimeNG Lara theme imports + dark/light CSS variables
- `apps/frontend/src/app/app.routes.ts` — routes for all screens (lazy-loaded)

### Acceptance
- `/login` → login form renders; valid credentials → redirect to `/dashboard`
- Direct navigate to `/dashboard` without token → redirects to `/login`
- Layout shell: sidebar with correct nav items; Admin▼ dropdown shows Team / Settings

**Spec ref:** `04-screens.md` § Auth Screen; `07-architecture.md` § Frontend

---

## Phase 18 — Dashboard Screen

**Goal:** Dashboard loads stats, throughput chart, activity feed, and personal queue.

### Create
- `apps/frontend/src/app/features/dashboard/dashboard.component.ts`
  - 4 stat cards: Active Projects (+ delta), Pages Translated (+ delta), Pending Review (+ delta), Avg Quality (+ delta)
  - Throughput bar chart (PrimeNG Chart): 12-week pages/words data; toggle `metric`
  - Activity feed: timestamped list; entity names link to detail pages
  - My queue: top 5 pages assigned to current user; priority pill + quality score
  - `Recent Projects` section: 4 project cards with progress ring
- Poll interval: refresh stats every 30s

### Acceptance
- Dashboard loads with real data from `/dashboard/stats` and `/dashboard/throughput`
- Throughput chart switches between pages and words on toggle
- My queue empty state: "No pages assigned"
- Quality delta shows red/green correctly (▲/▼)

**Spec ref:** `04-screens.md` § Dashboard Screen

---

## Phase 19 — Projects Screen

**Goal:** List, create, and navigate to projects.

### Create
- `apps/frontend/src/app/features/projects/project-list.component.ts`:
  - Search bar + status filter tabs (All / Draft / Processing / Review / Completed)
  - Grid of project cards: name, genre badge, progress bar, quality ring, page counts
  - Empty state
- New Project modal (`project-create.dialog.ts`):
  - Fields: Name, Description, Genre (searchable dropdown), PDF upload (drag-drop)
  - Source language: searchable dropdown (ISO 639-1 names)
  - Target language: searchable dropdown (ISO 639-1 names)
  - On submit: `POST /files/upload` then `POST /projects`; show job progress toast
- `apps/frontend/src/app/features/projects/project-detail.component.ts`:
  - Chapter accordion; each chapter shows page status grid
  - Page status chips: color-coded by status
  - Click page → navigate to `/workbench/:pageId`
  - Re-run AI button (MASTER+): enqueues TRANSLATE_BATCH (single-page batch) + REVIEW_PAGE

### Acceptance
- Create project with PDF → progress toast shows extraction progress
- Project detail: chapter accordion expands; pages show correct status chips
- Click page → navigates to `/workbench/:pageId`

**Spec ref:** `04-screens.md` § Projects List Screen, § New Project Modal, § Project Detail (Workbench)

---

## Phase 20 — Workbench Screen (browse mode)

**Goal:** 3-column translation workbench matching the authoritative `04-screens.md` layout — source and target rendered side-by-side with inline AI suggestions and Cursor-style chat.

### Create
- `apps/frontend/src/app/features/workbench/workbench.component.ts` (browse mode, `/workbench/:pageId`):
  - **Left sidebar (15%):** page navigation list — StatusDot + `P{nn}` (mono) per page; click switches active page; chapter eyebrow label; active page highlighted
  - **Middle column (35%) — Source Document:**
    - Renders `page.sourceMarkdown` as structured document — headings, bullets, paragraphs, images
    - Each `{{SENTENCE_X}}` replaced by a read-only `SentenceComponent` showing `sentence.originalText`
    - Each sentence has a numbered badge and an approval toggle (`[ ]` hollow / `[✓]` filled green)
    - Clicking a sentence highlights it and scrolls the right column to the matching sentence
  - **Right column (50%) — Target Document Editor:**
    - Renders same `page.sourceMarkdown` structure; each `{{SENTENCE_X}}` replaced by an editable `SentenceComponent` showing `sentence.translatedText`
    - Structural formatting identical to source column (heading → heading, bullet → bullet)
    - Sentences with OPEN errors have colored underlines (red for CRITICAL/HIGH, yellow for MEDIUM/LOW)
    - AI suggestion popover on underlined sentence: severity pill + category + suggestedText + `[✓ Accept suggestion]` → `POST /errors/:id/apply`
    - Inline chat rewrite below suggestion: text input + `[→]` → `POST /chat/sessions/:id/stream (BUILD mode)`
    - Approval toggle on source column SentenceComponent: `PATCH /sentences/:id {isApproved}`; accepting a suggestion auto-approves the sentence
    - Manual editing: click anywhere and type; debounced auto-save (500ms): `PATCH /sentences/:id {translatedText}`
    - Cmd+K / Ctrl+K on selected text → capsule inline prompt pill; on submit calls chat BUILD mode; renders red/green inline diff blocks with `[Accept (Y)]` / `[Reject (N)]` / `[Retry]` floating toolbar
    - Right sidebar toggle (Cmd+I): Chat (PLAN mode) tab + Composer (BUILD mode) tab; supports `@`-mentions (`@page`, `@glossary`, `@genre`)
    - Sentence context menu (⋮ or right-click): **Reset to AI translation** → `POST /sentences/:id/reset-translation` (confirmation dialog); **Assign to reviewer** (MASTER+) → `POST /sentences/:id/assign`
    - Reviewer panel in right column footer: Avatar chips for all `PageReviewer` entries; MASTER+ sees **Add reviewer** (`POST /pages/:id/add-reviewer`) and **Reassign** (`POST /pages/:id/reassign`) buttons; each sentence row has `[👤 Assign]` gutter icon → `POST /sentences/:id/assign`
  - **Toolbar:**
    - Back button → navigate to `/projects/:projectId`
    - Breadcrumb: project name · chapter · page number
    - Progress bar: `X / Y accepted` with visual bar
    - Prev / Next page buttons
    - Skip + Complete action buttons
  - Job progress banner: when page is TRANSLATING or REVIEWING, show progress bar with cancel button; poll `/jobs/:id` every 2s while status is QUEUED or RUNNING

### Acceptance
- Middle and right columns render identical Markdown structure (headings align, bullets align)
- Click sentence in source column → right column scrolls to and focuses the matching editable sentence
- Edit sentence text → auto-saves after 500ms; no explicit save button needed
- Apply AI suggestion → error underline disappears; suggestion popover closes; sentence auto-approved
- Cmd+K on sentence → inline prompt pill appears; submit → red/green diff renders in document body
- Accept diff → sentence text updates; Reject → reverts; both remove the diff overlay
- Exception error → prompts for glossary term input; on confirm → creates GlossaryTerm
- MASTER adds reviewer via footer panel → new Avatar chip appears immediately
- Reset to AI translation → confirmation dialog → sentence text reverts to `aiTranslatedText`; `isApproved` cleared

**Spec ref:** `04-screens.md` § Workbench Screen

---

## Phase 21 — Queue Screen

**Goal:** Filtered list of pages awaiting review.

### Create
- `apps/frontend/src/app/features/review-queue/review-queue.component.ts`:
  - Filter bar: Priority (All/Critical/High/Medium/Low), Error type (multi-select from categories), Reviewer (me / any user), Low quality only toggle
  - Sort dropdown: Priority / Quality / Wait time
  - Page list: QualityRing + priority pill + error category badges + project/chapter label + wait time
  - Click page → navigate to `/review/:id`
  - Error stats sidebar: bar chart of error counts by category
  - Escalations section (MASTER+): list of escalated pages with reason + escalated-by

### Acceptance
- `?lowQualityOnly=true` filter shows only pages with quality < 70
- Priority sort: CRITICAL pages first
- Error stats sidebar reflects real `/queue/error-stats` data
- Escalations section only visible to MASTER+

**Spec ref:** `04-screens.md` § Queue Screen

---

## Phase 22 — Review Screen (queue mode)

**Goal:** Wire the workbench component to the `/review/:pageId` route with queue-mode behaviour.

### Create / Modify
- `apps/frontend/src/app/features/workbench/workbench.component.ts` receives a `mode` input derived from the active route (`/workbench` → `browse`, `/review` → `queue`).
- **Queue mode differences** (activated on `/review/:pageId`):
  - "Back" navigates to `/queue` instead of `/projects/:id`
  - Sidebar shows only the caller's assigned HUMAN_REVIEW pages (filtered by PageReviewer)
  - "Complete" button calls `POST /pages/:id/approve` then `GET /pages/:id/next-in-queue`; navigates to returned pageId or to `/queue` with "Queue complete" toast if null
  - Shows reviewer chip list in right column footer; MASTER+ sees "Add reviewer" and "Reassign" buttons
- `apps/frontend/src/app/app.routes.ts` — both `/workbench/:pageId` and `/review/:pageId` map to `WorkbenchComponent` with `data: { mode: 'browse' | 'queue' }`

### Acceptance
- Navigate from queue → `/review/:pageId` → "Complete" → lands on next queued page automatically
- Navigate from project detail → `/workbench/:pageId` → "Back" → returns to project detail
- MASTER adds reviewer via "Add reviewer" chip → new Avatar appears in reviewer list immediately
- "Reset to AI translation" on sentence → confirmation dialog → translatedText reverts; isApproved cleared

**Spec ref:** `04-screens.md` § Review Screen

---

## Phase 23 — Genres Screen

**Goal:** Genre list and full genre editor with version history.

### Create
- `apps/frontend/src/app/features/genres/genre-list.component.ts`:
  - Grid of genre cards: icon, name, description, project count badge, last updated
  - Search input filters list live
  - New Genre button (MASTER+): name + description + icon picker + color picker
  - Click card → navigate to genre editor
- `apps/frontend/src/app/features/genres/genre-editor.component.ts`:
  - Left pane: rich markdown editor (or CodeMirror) for genre content; switchable to Glossary Panel or Diff Mode
  - View mode tabs: Split / Edit / Preview / Diff (Diff tab appears only while a version is selected for diffing)
  - Mode pill: "Discuss" (Plan) / "Edit doc" (Build) — toggles chat mode
  - Right pane: chat assistant panel
    - In Plan mode: discuss, suggest, explain — no document changes
    - In Build mode: AI edits; response shows inline diff; "Save as new version" button
  - Toolbar: genre name (editable), Segment unit select, Version select, History button, **Glossary button**, Test button, Save button
  - Test Translation: text box + Run Test button → shows target-language output
- **Glossary Panel** (toggled by Glossary toolbar button — replaces left pane):
  - `GET /glossary?genreId=` → searchable/paginated table of terms
  - MASTER+: inline add/edit/delete via `POST /glossary`, `PUT /glossary/:id`, `DELETE /glossary/:id`
  - ADMIN: `[↑ Import CSV]` button → `POST /glossary/bulk`
  - REVIEWER: read-only table view
- **Diff Mode** (toggled by `[↔ Diff]` on any version row in the History Drawer):
  - Calls `GET /genres/:id/versions/:versionId/diff` → unified diff string
  - Renders diff client-side as line-level colored blocks (removed = red, added = green)
  - `[Diff ← v{n}]` tab appears in view mode bar; closing it returns to previous mode
- Version History Drawer (`genre-version-drawer.component.ts`):
  - List of versions: version number, date, note, author, Restore button (MASTER+), `[↔ Diff]` button per row
  - Restore → POST /genres/:id/restore/:versionId

### Acceptance
- Edit genre content → Save Version → creates new GenreVersion; bumps version number
- Build mode: AI response includes "Save as new version" button; click → creates version with AI-revised content
- Restore older version → confirms dialog → creates new version with old content
- Test Translation → shows target-language output in ≤ 30s
- Glossary button → table of genre terms; MASTER+ can add/edit/delete inline; ADMIN sees Import CSV
- `[↔ Diff]` on v1.1 → main pane switches to diff view showing changes between v1.1 and current; red/green line highlights
- ADMIN invite with `role: "ADMIN"` → 422 (enforced in Phase 3 API)

**Spec ref:** `04-screens.md` § Genres List Screen, § Genre Editor Screen, § Version History Drawer, § Diff Mode, § Glossary Panel

---

## Phase 24 — Admin Screens (Team, Settings)

**Goal:** Admin management and model configuration.

### Create
- `apps/frontend/src/app/features/admin/team.component.ts`:
  - User list: name, email, role badge, active status toggle, reset password button
  - Invite User modal: name, email, role selector
  - Role change → confirm dialog (affects all future sessions)
- `apps/frontend/src/app/features/admin/settings.component.ts`:
  - Tabs: Models / Languages / System
  - **Models tab** (functional):
    - 4 model config rows: Translation Agent, Review Agent, Chat Agent, Embedding Agent
    - Each: provider dropdown (Ollama/Anthropic), model name input, endpoint field, API key field (masked)
    - Embedding Agent row: provider locked to Ollama (show inline warning if user tries to switch to Anthropic)
    - Test Connection button → shows latency or error
    - Prompt logs accordion (last 10 prompts, redacted)
  - **Languages / System tabs** → "Coming soon" placeholder

### Acceptance
- Invite user → email in maildev; user appears in list
- Deactivate user → cannot login (401)
- Test Connection with bad Ollama endpoint → shows error message inline

**Spec ref:** `04-screens.md` § Admin Screen, § Team Screen, § Settings Screen

---

## Phase 25 — Polish & Cross-Cutting

**Goal:** Production-ready UX, dark/light theme, accessibility, error states.

### Tasks
- Dark/light theme toggle in topbar → persists to localStorage; applies PrimeNG Lara dark/light
- Toast notification service: success/error/info toasts for all async operations
- Empty states for all list screens
- Loading skeletons for all data-heavy components (PrimeNG Skeleton)
- Global error boundary: unhandled 500s → "Something went wrong" banner with correlationId
- Keyboard shortcut: `N` → focus chat input (workbench/review)
- PrimeNG Tailwind integration: `tailwind.config.js` purges PrimeNG class names
- Responsive behavior at 1024px (minimum tablet width)
- `GET /health` polling in admin settings page → live status indicators

### Acceptance
- Switch theme → all components update; no white flash
- Navigate to empty project → empty state illustration + CTA button
- Trigger 500 → toast with correlationId matches API response
- Layout at 1024px: no horizontal scroll; panels stack if needed

**Spec ref:** `04-screens.md` § General Design Language; `01-overview.md` § Key Constraints

---

## Phase 26 — Testing

**Goal:** Critical paths covered; confidence to ship.

### Backend (Vitest + Supertest)
- Auth: login, refresh rotation, logout invalidation, forgot/reset flow
- Job worker: enqueue → process → done state machine
- Review workflow: approve blocked by OPEN errors; MASTER override
- Exception error → GlossaryTerm created

### Frontend (Vitest)
- Auth guard: unauthenticated redirect
- Token refresh interceptor: 401 → refresh → retry
- Sentence autosave: debounce fires once per 500ms; no duplicate requests
- Chat streaming: SSE chunks assembled into correct message

### E2E (Playwright via `apps/api-e2e` / `apps/frontend-e2e`)
- Full pipeline: upload PDF → extraction → translation → review → approve
- Genre version workflow: create → edit → save version → restore

**Spec ref:** `07-architecture.md` § Testing

---

## Delivery Order Summary

| Phase | What | Key Deliverable |
|-------|------|-----------------|
| 0 | Infrastructure | Docker services + health endpoint |
| 1 | Database | Fresh schema + seed data |
| 2 | Auth API | JWT + refresh rotation |
| 3 | Users API | Invite + manage users |
| 4 | Genres API | CRUD + versions + diff + test |
| 5 | Projects + Chapters API | Create → auto-enqueue extraction |
| 6 | Files API | MinIO upload + signed URLs |
| 7 | LLM Layer | Unified provider interface |
| 8 | Agents | Extraction + translation + review pipeline |
| 9 | Job System | DB polling worker + progress |
| 10 | Pages/Sentences/Errors API | Full review workflow |
| 11 | Glossary API | CRUD + fuzzy lookup |
| 12 | Chat API | SSE stream + Plan/Build modes |
| 13 | Dashboard/Queue/Admin API | Stats + review queue + bulk ops |
| 14 | Models API | LLM config + test + logs |
| 15 | Export API | PDF/text/report generation |
| 16 | Health Endpoint | All-services health check (activity logging wired in Phase 2) |
| 17 | Frontend Foundation | Auth screen + layout shell |
| 18 | Dashboard UI | Stats + chart + queue |
| 19 | Projects UI | List + create modal + detail |
| 20 | Workbench UI | 3-column workbench (sidebar / source / target editor) + chat |
| 21 | Queue UI | Filtered list + error stats |
| 22 | Review UI | Full page review + approve flow |
| 23 | Genres UI | Editor + version drawer |
| 24 | Admin UI | Team + Settings |
| 25 | Polish | Themes + toasts + empty states |
| 26 | Testing | Critical path coverage |

---

## Notes

- **Phases 0–16** (API) can be developed first with Postman/curl verification before building any UI.
- **Phases 17–24** depend on Phase 2 (auth tokens) being complete.
- **Phase 8** (agents) and **Phase 9** (job worker) are interdependent — build agent code first, then wire into worker.
- Any screen that embeds the chat assistant (Genre Editor) must complete Phase 12 first.

---

## Appendices & Extensions

### Phase 20b — Workbench Manual Edits & Multi-Sentence Copilot Dialog

**Goal:** Implement the multi-selection matrix, the inline `contenteditable` double-click micro-editor, and the unified modal `p-dialog` sentence co-pilot with streaming AI output redirection and lead-anchor save mechanics.

#### Implementation Steps
1. **Selection Matrix & Gutter Checkboxes**:
   - In `SentenceComponent` or `WorkbenchComponent` target segment list, add left checkboxes.
   - Bind checkbox selection to toggle segment indices into a `selectedSentenceNums = signal<number[]>([])` signal.
2. **Refine Action Hook**:
   - In the right-hand inspector component, add a **`[⚡ Refine Selected Segments]`** button (with PrimeIcons `pi-sparkles`), bound to `[disabled]="selectedSentenceNums().length === 0"` and `(click)="openCopilotDialog()"`.
3. **The Sentence Co-Pilot Dialog Component**:
   - Build a PrimeNG `p-dialog` overlay in `workbench.component.html`.
   - **Bilingual reference list**: Render an `*ngFor` mapping `selectedSentenceNums()`, retrieving the original source text via `getSentence(num)?.originalText`.
   - **Main Textarea**: Add a `<textarea [(ngModel)]="dialogDraftContent" [readonly]="chatLoading" class="w-full h-32 text-text-1 bg-surface-2 p-3 border border-border rounded-md focus:outline-none focus:border-primary">` field.
   - **Model Selector**: Add a `<p-select [options]="models" [(ngModel)]="selectedModel" class="w-40 text-xs">` container.
   - **Prompt input**: Add an input bar `<input [(ngModel)]="dialogPrompt" (keydown.enter)="sendDialogPrompt()" placeholder="Ask AI to rewrite...">` with a send button `<p-button icon="pi pi-send" (click)="sendDialogPrompt()">`.
   - **Streaming integration**:
     - On prompt send, set `chatLoading = true` and target the existing chat endpoint: `GET /api/v1/chat/sessions/:sessionId/stream`.
     - In the chunk reader loop, parse JSON tokens. Clear `dialogDraftContent` on first chunk if executing a full overwrite, then append tokens successvely: `dialogDraftContent.set(dialogDraftContent() + chunkText)`.
     - Disable textarea editability during stream loading.
4. **Lead-Anchor Database Write Service**:
   - Clicking **`[✓ Accept & Save]`** will:
     - Select the first element of selected IDs: `const leadId = selectedSentenceIds[0]`.
     - Call `patchSentence(leadId, { translatedText: dialogDraftContent(), isApproved: false })`.
     - For all remaining elements (`const siblingId of selectedSentenceIds.slice(1)`), call `patchSentence(siblingId, { translatedText: "", isApproved: false })`.
     - On successful response, clear selections and refresh the active page's sentences.
5. **Double-Click Inline Editing**:
   - On the sentence translation text `<span>` inside the Target pane, bind `(dblclick)="startInlineEdit(sentence)"`.
   - Under edit mode, toggle `contenteditable="true"` on the element, call `focus()`, and capture keyboard events:
     - `keydown.enter`: Prevent default newline, retrieve element's `innerText`, and call `patchSentence(s.id, { translatedText: text, isApproved: false })`.
     - `keydown.escape`: Revert `innerText` to original model signal and disable edit mode.

#### Verification
- Click a translation segment row, double-click it, change text, hit `Enter`, and verify a successful DB patch is triggered and visual edits are saved.
- Select checkboxes for sentences 12 and 13. Verify the "Refine Selected Segments" button activates.
- Click the button, verify the modal opens showing both source segments. Type a prompt, click send, and watch the AI stream text directly inside the textarea.
- Click "Accept & Save". Verify the first sentence receives the full merged text, and the second sentence row renders seamlessly merged/omitted.

