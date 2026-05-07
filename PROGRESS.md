# tAI — Build Progress

Last updated: 2026-05-07

## Current Status

**Active phase:** Phase 14 — Models Module (API)  
**Next up:** Phase 15 — Export Module (API)

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
| 14 | Models Module (API) | ☐ | — |
| 15 | Export Module (API) | ☐ | — |
| 16 | Activity Logging & Health | ☐ | — |
| 17 | Frontend Foundation (auth + layout shell) | ✅ | 2026-05-06 |
| 18 | Dashboard Screen | ✅ | 2026-05-06 |
| 19 | Projects Screen | ☐ | — |
| 20 | Workbench Screen | ✅ | 2026-05-06 |
| 21 | Queue Screen | ☐ | — |
| 22 | Review Screen | ☐ | — |
| 23 | Genres Screen (editor + version drawer) | ☐ | — |
| 24 | Admin Screens (Team + Settings + Rules) | ☐ | — |
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

