# Page States & Thumbnail UI

## Pipeline overview

```
File upload
    ↓
SPLIT_DOCUMENT job
  • Counts pages in the PDF
  • Inserts one Page row per page (status: PENDING)
  • Enqueues one RENDER_PAGE job per page
    ↓
RENDER_PAGE job (one per page, run serially per project)
  • Converts that PDF page to PNG
  • Uploads PNG to MinIO at projects/{projectId}/pages/{pageNumber}.png
  • Updates page status to READY
  • (last sibling does nothing — extraction is complete)
    ↓
  ── user clicks "Translate" ──
    ↓
POST /projects/:id/translate
  • Computes 3-page sliding window batch plan
  • Enqueues TRANSLATE_BATCH jobs
    ↓
TRANSLATE_BATCH job
  • Gemini reads the page image (OCR + translation in one vision prompt)
  • Writes translatedHtml back to the page row
  • Updates page status to TRANSLATED
    ↓
Human review → APPROVED
```

---

## Page statuses

| Status | Set by | Meaning |
|---|---|---|
| `PENDING` | SPLIT_DOCUMENT | Row created, RENDER_PAGE job queued |
| `RENDERING` | RENDER_PAGE (start) | PDF→PNG conversion + MinIO upload in progress |
| `READY` | RENDER_PAGE (done) | Image in MinIO, awaiting translation |
| `TRANSLATING` | TRANSLATE_BATCH (start) | Gemini vision prompt in progress |
| `TRANSLATED` | TRANSLATE_BATCH (done) | Translation written, awaiting review |
| `HUMAN_REVIEW` | Reviewer assignment | Assigned to a reviewer |
| `APPROVED` | Reviewer action | Approved, complete |
| `REJECTED` | Reviewer action | Sent back for retranslation |
| `ERROR` | Any job failure | Pipeline failure at any stage |

---

## Job types

| Job | Replaces | Scope |
|---|---|---|
| `SPLIT_DOCUMENT` | `PROCESS_DOCUMENT` | Once per project |
| `RENDER_PAGE` | `EXTRACT_PAGE` | Once per page |
| `TRANSLATE_BATCH` | unchanged | One per 3-page window, user-triggered |
| `REVIEW_PAGE` | unchanged | Once per page |

`DETECT_CHAPTERS` / `PLAN_BATCHES` is removed entirely. Batch planning is done inline in `POST /projects/:id/translate`.

---

## Thumbnail UI states

Each thumbnail is a portrait card (3:4 aspect ratio) with three visual layers:

### Layer 1 — Image area (communicates render readiness)

| Status | Image area |
|---|---|
| `PENDING` | Flat gray skeleton (`--bg-canvas`). No animation. |
| `RENDERING` | Same gray skeleton + **blue scan line** moving top→bottom on loop |
| `READY` and beyond | Real PNG loaded from MinIO (`/api/v1/projects/:id/pages/:num/image`) |

If the image fails to load for post-READY states, falls back to centered page number on gray background.

### Layer 2 — Border color (communicates lifecycle stage)

| Status | Border |
|---|---|
| `PENDING` | `--border-color` (gray, 2px) |
| `RENDERING` | `--accent-primary` (blue/purple, 2px) |
| `READY` | `--border-color` (gray, neutral — image visible) |
| `TRANSLATING` | `--accent-success` (green, 2px) |
| `TRANSLATED` | `--accent-info` (blue, 2px) |
| `HUMAN_REVIEW` | `--accent-warn` (amber, 2px) |
| `APPROVED` | `--accent-success` (green, 2px) |
| `REJECTED` | `--accent-danger` (red, 2px) |
| `ERROR` | `--accent-danger` (red, 2px) |

### Layer 3 — Scan line animation

Only two states get an animated overlay. All others are completely static.

**RENDERING** — blue scan line:
```
position: absolute, left: 0, right: 0, height: 2px
background: linear-gradient(90deg, transparent, --accent-primary 20%, --accent-primary 80%, transparent)
box-shadow: 0 0 8px --accent-primary
animation: scan 1.8s linear infinite  (top: -2px → top: 100%)
```

**TRANSLATING** — green scan line:
```
same geometry as RENDERING
background: linear-gradient(90deg, transparent, --accent-success 20%, --accent-success 80%, transparent)
box-shadow: 0 0 8px --accent-success
animation: scan 1.8s linear infinite
```

No other animations exist anywhere in the thumbnail or the project detail page.

---

## Files that change

### Prisma schema (`apps/api/prisma/schema.prisma`)
- `PageStatus` enum: add `RENDERING`, `READY`; remove `EXTRACTING`, `EXTRACTED`
- `JobType` enum: add `SPLIT_DOCUMENT`, `RENDER_PAGE`; remove `PROCESS_DOCUMENT`, `EXTRACT_PAGE`, `DETECT_CHAPTERS`

### Migration
- New Prisma migration file
- Data migration: existing `EXTRACTING` rows → `RENDERING`, `EXTRACTED` rows → `READY`

### Backend — Extraction service (`apps/api/src/modules/agents/extraction.service.ts`)
- Rename `processDocument()` → `splitDocument()` — same logic, enqueues `RENDER_PAGE` jobs
- Rename `extractPage()` → `renderPage()` — sets `RENDERING`, uploads PNG to MinIO, sets `READY`; last sibling does nothing (no PLAN_BATCHES)
- Delete `detectChapters()`

### Backend — Orchestrator (`apps/api/src/modules/agents/agent.orchestrator.ts`)
- Rename `runProcessDocument()` → `runSplitDocument()`
- Rename `runExtractPage()` → `runRenderPage()`
- Delete `runDetectChapters()`

### Backend — Job worker (`apps/api/src/modules/jobs/job.worker.ts`)
- Update `executeJob()` switch: `SPLIT_DOCUMENT`, `RENDER_PAGE`; remove `DETECT_CHAPTERS` case

### Backend — Translation controller (`apps/api/src/modules/projects/translation.controller.ts`)
- Update `getExtractionProgress()` to query `SPLIT_DOCUMENT` and `RENDER_PAGE` only
- Phase labels: `splitting` (SPLIT_DOCUMENT active) and `rendering` (RENDER_PAGE jobs active)

### Backend — Projects service (`apps/api/src/modules/projects/projects.service.ts`)
- Update `create()` to enqueue `SPLIT_DOCUMENT` instead of `PROCESS_DOCUMENT`

### Frontend — Thumbnail component
- `apps/frontend/src/app/shared/components/page-thumbnail/page-thumbnail.component.ts`
  - `statusClass` computed: add `RENDERING`, `READY` cases; remove `EXTRACTING`, `EXTRACTED`
  - Add `showImage` computed: true for `READY` and beyond
  - Add `isRendering` computed: true for `RENDERING`
  - Add `isTranslating` computed: true for `TRANSLATING`
- `apps/frontend/src/app/shared/components/page-thumbnail/page-thumbnail.component.html`
  - Split image area: skeleton vs real image based on `showImage`
  - Add scan line `<div>` inside image area, visible when `isRendering` or `isTranslating`
- `apps/frontend/src/app/shared/components/page-thumbnail/page-thumbnail.component.scss`
  - Remove shimmer/pulse animations
  - Add `@keyframes scan` (top: -2px → top: 100%)
  - Add `.scan-line` with color variants (blue for rendering, green for translating)

### Frontend — Project detail component
- `apps/frontend/src/app/projects/project-detail/project-detail.component.ts`
  - Update extraction polling to use new phase names (`rendering` instead of `extracting`)
- `apps/frontend/src/app/projects/project-detail/project-detail.component.html`
  - Update phase label strings in the extraction button and status text
  - Update legend: replace "Processing" with "Rendering" and "Ready"

### Frontend — Projects service (`apps/frontend/src/app/projects/projects.service.ts`)
- Update `getExtractionProgress()` return type phase strings

---

## Legend (project detail page)

```
● Approved    ● In review    ● Ready    ● Translating    ● Rendering    ● Pending    ● Error
```

Replaces the current: Approved / In review / Pending / Changes / Processing
