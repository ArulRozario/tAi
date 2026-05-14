# tAI — Build Progress

Last updated: 2026-05-14 (session 29)

## Current Status

**Active phase:** Phase 24 — Admin Screens (Team + Settings)  
**Next up:** Phase 25 — Polish (themes, toasts, empty states)

---

## Phase Checklist

| # | Phase | Status | Completed |
|---|-------|--------|-----------|
| pre | Wipe v1 (old schema + stub modules) | ✅ | 2026-05-06 |
| 0 | Infrastructure & Docker | ✅ | 2026-05-06 |
| 1 | Database Schema (Prisma + seed) | ✅ | 2026-05-06 |
| 2 | Auth Module (API) | ✅ | 2026-05-06 |
| 3 | Users Module (API) | ✅ | 2026-05-06 |
| 4 | Genres Module (API) | ✅ | 2026-05-06 |
| 5 | Projects & Chapters Module (API) | ✅ | 2026-05-06 |
| 6 | Files Module (API — MinIO) | ✅ | 2026-05-06 |
| 7 | LLM Provider Layer | ✅ | 2026-05-06 |
| 8 | Agents (Extraction, Translation, Review) | ✅ | 2026-05-06 |
| 9 | Job System (DB polling worker) | ✅ | 2026-05-06 |
| 10 | Pages, Segments & Errors Modules (API) | ✅ | 2026-05-06 |
| 11 | Glossary Module (API) | ✅ | 2026-05-06 |
| 12 | Chat Module (API — SSE streaming) | ✅ | 2026-05-06 |
| 13 | Dashboard, Queue & Admin Modules (API) | ✅ | 2026-05-07 |
| 14 | Models Module (API) | ✅ | 2026-05-07 |
| 15 | Export Module (API) | ✅ | 2026-05-07 |
| 16 | Activity Logging & Health | ✅ | 2026-05-07 |
| 17 | Frontend Foundation (auth + layout shell) | ✅ | 2026-05-07 |
| 18 | Dashboard Screen | ✅ | 2026-05-07 |
| 19 | Projects Screen | ✅ | 2026-05-07 |
| 20 | Workbench Screen | ✅ | 2026-05-07 |
| 20b | Workbench Manual Edits & Multi-Sentence Copilot Dialog | ☐ | — |
| 21 | Queue Screen | ✅ | 2026-05-07 |
| 22 | Review Screen | ✅ | 2026-05-07 |
| 23 | Genres Screen (editor + version drawer) | ✅ | 2026-05-07 |
| 24 | Admin Screens (Team + Settings) | ☐ | — |
| 25 | Polish (themes, toasts, empty states) | ☐ | — |
| 26 | Testing | ☐ | — |

---

## Session Log

| Date | Session | Work Done | Phase Δ |
|------|---------|-----------|---------|
| 2026-05-05 | 1 | Created .spec/ files (01–07 + IMPLEMENTATION.md) | spec complete |
| 2026-05-05 | 2 | Standardized spec: set Tamil as the primary target language for all UI and agent prompt examples | spec updated |
| 2026-05-06 | 3 | Spec rewritten to generic platform (any language/domain); Sentence replaces Segment; Vision OCR; TranslationMemory/RAG; Cursor-style AI assistant; CLAUDE.md synced | spec updated |
| 2026-05-06 | 4 | Initialized "Intelligence Core" Design System; Scaffolded Dashboard and Workbench (3-column) high-density wireframes in Angular/PrimeNG/Tailwind | ui wireframes |
| 2026-05-06 | 5 | Configured local backend Docker infrastructure including PostgreSQL 17 (pgvector) and Python FastAPI (spaCy) sidecar | infrastructure up |
| 2026-05-06 | 6 | Established authoritative relational schema, configured custom Nx Prisma targets, and seeded 50 theological terms using lightning-fast SWC register | database schema & seeding |
| 2026-05-06 | 7 | Implemented secure Auth API featuring native crypto scrypt hashing, JWT integration guards, and database-backed RTR session rotation | auth module API |
| 2026-05-06 | 8 | Completed secure Users Module (API) including invite credentials logs, DTO validations, and automatic session revocation on password resets | users module API |
| 2026-05-06 | 9 | Completed secure, schema-compliant Genres Module (API) including Prisma DB push, DTO validations, RBAC guards, and transaction-linked v1.0 initial versions | genres module API |
| 2026-05-06 | 10 | Completed secure Projects & Chapters Module (API) including required genre bindings, ordered chapters list, uniqueness guards, and dynamic glossary retrieval | projects module API |
| 2026-05-06 | 11 | Completed secure Files Module (API — MinIO) including custom port configuration, automatic startup bucket healing, multi-part multer uploads, auto project database link, and wildcard download redirects | files module API |
| 2026-05-06 | 12 | Completed LLM Provider Layer featuring AES-256-GCM API key cryptography, automatic model configs seeding, connection testing, and audited prompt execution history logging | llm provider layer |
| 2026-05-06 | 13 | Built Agents & Translation Memory pipeline, incorporating spaCy sentence segmentation, terminal boundary stitching, token budget batches, recursive split recovery, and pgvector cosine search | agents module & TM (RAG) |
| 2026-05-06 | 14 | Built PostgreSQL-backed lock-free Job Queue system, incorporating SELECT FOR UPDATE SKIP LOCKED locks, polling scheduler, crash auto-recovery, and graceful shutdown loops | job system database polling |
| 2026-05-06 | 15 | Built secure, role-restricted REST APIs for Pages, Sentences, and Errors, incorporating sequential replacements, exception glossary seeding, and next-in-queue sorting | pages, sentences, and errors API modules |
| 2026-05-06 | 16 | Built complete Glossary REST API, including filter searches, duplicate term blocks, term edits, and bulk import upserts | glossary module API |
| 2026-05-07 | 17 | Built secure, context-enriched Chat REST API, featuring full Server-Sent Events (SSE) streaming, build-mode version suggestions, and quick suggestion lists | chat module API with SSE streaming |
| 2026-05-07 | 18 | Built Dashboard (30s cached stats/throughput/queue/activity), Queue (filterable HUMAN_REVIEW list + error stats + escalations), and Admin (bulk reassign/approve + page override) API modules | dashboard, queue, admin modules |
| 2026-05-07 | 19 | Audited and patched Models module: updated Anthropic model list to Claude 4.x, replaced simulated test with real HTTP ping to api.anthropic.com, fixed bad Ollama seed endpoint, stripped doc comments | models module audit |
| 2026-05-07 | 20 | Rewrote Export module: POST endpoints enqueue jobs and return jobId; job worker runs actual PDF (pdfkit), DOCX (docx), text, HTML generation from page.sourceMarkdown with sentence substitution; uploads to MinIO | export module rewrite |
| 2026-05-07 | 21 | Health endpoint: GET /health checks DB (SELECT 1), MinIO (listFiles probe), Ollama (GET /api/tags), Anthropic (GET /v1/models if key configured); returns {status, db, minio, ollama, anthropic} | health module |
| 2026-05-07 | 22 | Phase 17 frontend foundation: AuthService (signal-based, JWT+refresh), authInterceptor (401→refresh→retry), authGuard, roleGuard, real LoginComponent, ResetPasswordComponent, updated app.routes with guards + all routes, ApiService rewritten to /api/v1 contract; workbench/projects/queue/review stubs; build passes | frontend foundation |
| 2026-05-07 | 23 | Phase 18+19: Dashboard wired to real API (getDashboardStats 30s poll, throughput toggle, activity feed, greeting from auth user); Projects table (status tabs, live search, actions), New Project modal (ISO-639-1 language dropdowns, genre radio cards, PDF dropzone), ProjectDetailComponent (stat cards, chapter accordion, page status grid); fixed projects/:id route; StatusDot + PriorityPill accept uppercase API values | dashboard + projects screens |
| 2026-05-07 | 24 | Phase 20: WorkbenchComponent full-page 3-column (240px sidebar + dual pdf-panes + 360px inspector); sentence approval toggles; error cards with apply-fix; approve/request-changes/escalate actions with dialogs; queue mode auto-advance via next-in-queue; reviewer notes debounce-save; workbench/review routes moved outside AppLayout; SentenceError interface + patchPage + escalatePage + getNextInQueue + applyError added to ApiService | workbench screen |
| 2026-05-07 | 25 | Phase 21: ReviewQueueComponent — filterable queue table (sort by priority/quality/waitTime, low-quality toggle, error-type filter), quality progress bars (red/warning/success), error count tags, priority pills, wait time, error distribution card with proportional bars and quick-filter pills, escalations "Needs attention" card for MASTER/ADMIN with Resolve dialog; typed QueuePage/ErrorStat/Escalation interfaces + getEscalations + resolveEscalation added to ApiService | queue screen |
| 2026-05-07 | 26 | Phase 22: WorkbenchComponent review-mode additions — goBack() routes to /queue in queue mode; queue-mode sidebar loads GET /queue?reviewerId=me; MASTER/ADMIN Add reviewer + Reassign buttons in inspector footer with user-picker dialogs; Reset to AI translation confirmation dialog on selected sentence; resetSentenceTranslation + addReviewer + reassignReviewers added to ApiService | review screen |
| 2026-05-07 | 27 | Brainstormed, validated, and appended Specifications and Implementation Plans for Phase 20b (Workbench Manual Edits + Multi-Sentence Copilot Dialog) to .spec files and progression logs | spec update |
| 2026-05-07 | 28 | Phase 23: Genre list (cards + search + creation), genre editor (markdown + modes), version drawer (restore/diff), glossary panel (table with CRUD), chat assistant, test translation; fixed lint errors | genres screen |
| 2026-05-14 | 29 | Reviewer workflow: assign/unassign/reassign (per-page popover + bulk), reviewer avatars on page thumbnails, selection mode for bulk ops, two-stage review (HUMAN_REVIEW+submittedAt → APPROVE), Queue screen (My Queue + Submitted Reviews + Escalations tabs), workbench role-based toolbar (Submit for Review / Approve), REVIEWER-only project list, build fixed | reviewer workflow |

---

## Notes & Decisions

- v1 Prisma schema is completely wrong — full wipe required before Phase 1
- Rules screen removed — Genres only; delete `apps/api/src/modules/rules/` in pre-work
- Platform is generic: any language pair, any domain. Translation style/terminology defined per Genre. No language hardcoding.
- Source/target language configurable per project (ISO 639-1 codes); shown as searchable dropdowns in New Project modal
- No BullMQ/Redis — DB polling with SELECT FOR UPDATE SKIP LOCKED
- PDF extraction uses Vision-based OCR (LlamaParse/Marker) — NOT pdf-parse; produces layout-aware Markdown with image extraction
- Job pipeline: PROCESS_DOCUMENT → EXTRACT_PAGE (parallel per page) → TRANSLATE_PAGE → REVIEW_PAGE
- Translation Memory (RAG): approved sentences embedded via nomic-embed-text; retrieved at translation time via pgvector cosine similarity (≥0.75, top 3)
- Domain model uses Sentence (not Segment); sentences have isApproved flag set by reviewer
- Chat assistant is Cursor-inspired: Plan mode (Chat panel), Build mode (Composer with inline diffs), Inline prompt (Cmd+K)
- Seed data: "Tamil Bible (Parisutha Vedagamam)" genre (icon 📖, color #7c3aed) + 50 Parisutha Vedagamam theological glossary terms; full style guide in 05-agents.md § Default Genre Template

