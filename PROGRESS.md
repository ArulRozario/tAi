# tAI — Build Progress

Last updated: 2026-05-05

## Current Status

**Active phase:** None started  
**Next up:** Phase 0 — Infrastructure & Docker

---

## Phase Checklist

| # | Phase | Status | Completed |
|---|-------|--------|-----------|
| pre | Wipe v1 (old schema + stub modules) | ☐ | — |
| 0 | Infrastructure & Docker | ☐ | — |
| 1 | Database Schema (Prisma + seed) | ☐ | — |
| 2 | Auth Module (API) | ☐ | — |
| 3 | Users Module (API) | ☐ | — |
| 4 | Genres Module (API) | ☐ | — |
| 5 | Projects & Chapters Module (API) | ☐ | — |
| 6 | Files Module (API — MinIO) | ☐ | — |
| 7 | LLM Provider Layer | ☐ | — |
| 8 | Agents (Extraction, Translation, Review) | ☐ | — |
| 9 | Job System (DB polling worker) | ☐ | — |
| 10 | Pages, Segments & Errors Modules (API) | ☐ | — |
| 11 | Glossary Module (API) | ☐ | — |
| 12 | Chat Module (API — SSE streaming) | ☐ | — |
| 13 | Dashboard, Queue & Admin Modules (API) | ☐ | — |
| 14 | Models Module (API) | ☐ | — |
| 15 | Export Module (API) | ☐ | — |
| 16 | Activity Logging & Health | ☐ | — |
| 17 | Frontend Foundation (auth + layout shell) | ☐ | — |
| 18 | Dashboard Screen | ☐ | — |
| 19 | Projects Screen | ☐ | — |
| 20 | Workbench Screen | ☐ | — |
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

---

## Notes & Decisions

- v1 Prisma schema is completely wrong — full wipe required before Phase 1
- Rules screen removed — Genres only; delete `apps/api/src/modules/rules/` in pre-work
- Source/target language are fully configurable per project (ISO 639-1 codes); shown as searchable dropdowns in New Project modal
- No BullMQ/Redis — DB polling with SELECT FOR UPDATE SKIP LOCKED
- No PaddleOCR — pdf-parse only
- Overlay mode IS implemented in workbench (not deferred)
- Chat mode pills: "Discuss" (Plan) / "Edit doc" (Build)
- Platform is language/domain agnostic, but uses English → Tamil as the standardized target language example across all specifications and prompts

