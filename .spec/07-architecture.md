# tAI — Architecture

## Tech Stack

### Backend
| Layer | Choice | Notes |
|-------|--------|-------|
| Runtime | Node.js 22 LTS | |
| Framework | NestJS 11 | Modular, decorator-based |
| ORM | Prisma 5.22 | Stay on current major |
| Database | PostgreSQL 17 | Primary data store |
| File storage | MinIO | S3-compatible, self-hosted |
| LLM (local) | Ollama | Default 2 concurrent requests |
| LLM (cloud) | Google Gemini (`@google/genai`) & Anthropic Claude | Gemini is primary for high-speed page-level structured translations; Claude serves as fallback |
| PDF extraction | Native Visual Multimodal OCR | Pages are captured as layout images and passed directly to Gemini, completely bypassing external OCR text extraction tools |
| Sentence segmentation | **None** | Completely retired; translation is processed directly at the cohesive Page level |
| Email (dev) | `maildev` + `nodemailer` | Dev SMTP on :1080 |
| PDF export | `pdfkit` | Embed Unicode/language-appropriate fonts (e.g. Noto Sans) |
| DOCX export | `docx` (npm) | Generates .docx from paragraph/heading styles; no external dependencies |
| XLSX export | `exceljs` (npm) | Generates .xlsx for admin-report export |
| Diff | `diff` library | Inline diff highlighting |
| Concurrency | `p-limit` | Per-provider semaphores |
| Auth | JWT (access 15m + refresh 7d) | Refresh stored in DB |
| Security | `bcrypt` + AES-256-GCM for API keys | |
| Logging | Pino | JSON in prod, pretty in dev |
| Rate limiting | `@nestjs/throttler` | |
| Security headers | `helmet` | |
| Package manager | pnpm 10 | |
| Testing | Vitest + Supertest | |

### Frontend
| Layer | Choice | Notes |
|-------|--------|-------|
| Framework | Angular 21 + TypeScript 5.9 | |
| UI library | PrimeNG 21 (Lara theme) | Customized with SCSS overrides |
| Styling | Tailwind CSS 3 + CSS variables | Design tokens via custom props |
| State | RxJS 7 + Angular Signals | No NgRx |
| Monorepo | NX 22 | |
| Build | Angular CLI 21 | |

### Infrastructure
| Layer | Choice |
|-------|--------|
| Container | Docker + Docker Compose |
| Dev orchestration | `docker-compose.yml` |
| Prod orchestration | `docker-compose.prod.yml` |

---

## Architecture Decisions (Locked)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Component library | PrimeNG + SCSS overrides | Faster than fully custom; design fidelity via overrides |
| Rule system | **Genres only** (Rules removed) | Single source of truth per translation style and domain |
| Backend | Full rewrite (discard v1 code) | Existing structure too divergent from v2 domain |
| AI providers | Google Gemini primary + Claude fallback | Gemini visual translation provides extreme performance and cost-effectiveness |
| Async strategy | **Polling** (DB-backed jobs) | Simpler than WebSockets; translation timescales allow it |
| Database | Wipe + fresh schema | New domain too different from v1 |
| Queue | **No BullMQ/Redis** — DB polling + `SELECT FOR UPDATE` | Fewer dependencies; sufficient throughput |
| OCR & Translation | **Page-Level Visual Sliding Window** | Direct image-to-translated-HTML translation via Gemini 1.5 Flash completely bypasses separate OCR tools |
| Sentence segmentation | **None** | Completely retired; translation occurs at the cohesive Page level to optimize flow and context |

---

## Infrastructure Diagram

```
┌──────────────────────────────────────────────────┐
│  Angular SPA (PrimeNG + Tailwind)  :12008        │
│  Continuous Rich-Text Inline Page Editor         │
│  Polling: /jobs/:id every 2s during active jobs  │
│  SSE: /chat/stream for assistant responses       │
└─────────────────────┬────────────────────────────┘
                      │ HTTPS
┌─────────────────────▼────────────────────────────┐
│  NestJS API  :12007                             │
│  Modules: auth, users, genres, projects,        │
│  chapters, pages, errors, glossary, jobs,       │
│  chat, export, models, dashboard, queue, admin, │
│  health (sentences module deleted)               │
└──────┬──────────┬──────────┬──────────┬──────────┘
       │          │          │          │
    ┌──▼───┐  ┌───▼───┐  ┌───▼────┐  ┌──▼─────────┐
    │  PG  │  │ MinIO │  │ Ollama │  │ Google/    │
    │:12000│  │:12001 │  │ :12003 │  │ Anthropic  │
    └──────┘  └───────┘  └────────┘  │ (Ext APIs) │
                                     └────────────┘
              └──────────────────┘
```

---

## Module Structure (Backend)

```
src/
├── main.ts
├── app.module.ts
├── common/
│   ├── filters/          # Global exception filter (consistent error shape)
│   ├── interceptors/     # Logging interceptor + correlation IDs
│   ├── guards/           # JWT + role guards
│   ├── decorators/       # @CurrentUser, @Roles, @ActivityLog
│   └── pipes/            # Global validation pipe
├── modules/
│   ├── auth/             # Login, refresh, forgot/reset password
│   ├── users/            # CRUD + invite
│   ├── genres/           # CRUD + versions + restore + test
│   ├── projects/         # CRUD + stats + team
│   ├── chapters/         # CRUD
│   ├── pages/            # CRUD + review actions
│   ├── sentences/        # CRUD + apply fixes
│   ├── errors/           # Apply/reject/escalate/exception
│   ├── glossary/         # CRUD + bulk import + lookup
│   ├── memory/           # TranslationMemory CRUD + pgvector retrieve/index
│   ├── files/            # MinIO upload + signed URLs
│   ├── jobs/             # Enqueue + poll + cancel
│   ├── chat/             # Sessions + messages + SSE stream
│   ├── export/           # PDF/text/HTML generation
│   ├── models/           # LLM provider CRUD + test connection
│   ├── dashboard/        # Stats aggregation (30s in-memory cache)
│   ├── queue/            # Review queue + error stats + escalations
│   ├── admin/            # All-pages view + bulk actions + override
│   ├── email/            # nodemailer + maildev + templates
│   └── health/           # DB + MinIO + Ollama + Anthropic checks
├── llm/
│   ├── llm.interface.ts  # LLMProvider interface
│   ├── ollama.provider.ts
│   ├── anthropic.provider.ts
│   ├── llm.service.ts    # Factory (DB config → provider)
│   └── embedding.service.ts # nomic-embed-text via Ollama
└── agents/
    ├── extraction.service.ts   # OCR/Vision extractor (Marker/LlamaParse) + image extraction
    ├── segmentation.service.ts # Two-level split: Markdown structure → spaCy HTTP call per paragraph
    ├── translation.agent.ts    # Sentence-level, glossary + genre-aware
    ├── review.agent.ts         # Structured errors (generic)
    └── orchestrator.ts         # Wires agents to job pipeline
```

---

## originalHtml & translatedHtml — The New Visual Spine

The legacy `page.sourceMarkdown` structural skeleton and its `{{SENTENCE_X}}` placeholders are **REMOVED** from the architecture.

Instead of keeping complex skeletons and parsing lists of sentence records, the direct source of truth is stored as two continuous HTML-lite strings directly on the **`Page`** model:
1. `Page.originalHtml`: The complete, visually transcribed English page text including typography tags (`<b>`, `<i>`, `<sup>`, `<span>`).
2. `Page.translatedHtml`: The complete, visual Tamil translation page text with matching layout tags.

Everything downstream uses these page-level continuous strings:

| Consumer | How |
|---|---|
| Translation Agent | Gemini reads the visual scanned page image and outputs `originalHtml` and `translatedHtml` directly. |
| Workbench (source column) | Renders `Page.originalHtml` directly within a continuous HTML visual viewport. |
| Workbench (target column) | Renders `Page.translatedHtml` directly inside an active inline HTML editor panel. |
| Export module | Simply parses `Page.translatedHtml` via `cheerio` and maps tags 1-to-1 directly to print coordinate vectors. |

---

## Extraction & OCR Layer

Since PDFs are predominantly scanned images, extraction MUST utilize a Vision-based OCR service (e.g., LlamaParse or Marker/Surya) to accurately convert scanned pixels into layout-aware Markdown.
- **Image Cropping:** Illustrations and diagrams within scans must be cropped, uploaded to MinIO, and referenced in the markdown (`![Image](url)`).
- **Layout Metadata:** Alongside the Markdown, the extractor captures and stores `page.layoutMetadata`:

```json
{
  "pageWidth": 148,
  "pageHeight": 210,
  "unit": "mm",
  "columns": 2,
  "columnGutter": 6,
  "margins": { "top": 16, "bottom": 20, "inner": 18, "outer": 12 },
  "fontBands": {
    "body": { "sizePt": 10, "family": "serif" },
    "heading": { "sizePt": 14, "family": "serif" },
    "caption": { "sizePt": 8, "family": "sans-serif" },
    "verseNumber": { "sizePt": 7, "family": "serif", "position": "superscript" }
  },
  "hasRunningHeader": true,
  "hasFooter": true,
  "hasDropCap": false
}
```

This metadata is detected once per page during EXTRACT_PAGE and never modified. The export module reads it alongside `genre.pdfTemplate` to produce a typeset PDF.

---

## PDF Export Layer

### How it works

The export module reconstructs the translated document in three steps:

1. **Substitute** — replace each `{{SENTENCE_X}}` in `page.sourceMarkdown` with `sentence.translatedText` to produce translated Markdown per page
2. **Template** — apply `genre.pdfTemplate` for typography (fonts, sizes, line height, column layout)
3. **Layout hints** — use `page.layoutMetadata` to inform column count, margins, running headers, and image regions

Output is generated via `pdfkit` with Noto font family for Unicode/multilingual support.

### Accuracy expectations

| Element | Accuracy |
|---|---|
| Page size | Exact — detected from source |
| Column layout | High — detected from source |
| Heading hierarchy | High — preserved in sourceMarkdown |
| Font size ratios | Moderate — body/heading/caption bands detected, exact pt values approximated |
| Margins | Moderate — estimated from OCR bounding boxes |
| Image placement | Approximate — positioned in correct region, not pixel-exact |
| Running headers/footers | Yes — genre template defines format |
| Font families | Substituted — proprietary fonts replaced with Noto equivalents |
| Decorative elements | Partial — captured as images if OCR detects them |
| Page-by-page content match | **No** — Tamil text is 20–40% longer than English; page breaks shift throughout |
| Total page count | Higher than source — inherent to translation, not a bug |

### `genre.pdfTemplate` schema

```json
{
  "pageSize": "A5",
  "columns": 2,
  "columnGutter": 6,
  "margins": { "top": 16, "bottom": 20, "inner": 18, "outer": 12 },
  "fonts": {
    "body": { "family": "Noto Serif Tamil", "sizePt": 10, "lineHeight": 1.4 },
    "heading": { "family": "Noto Serif Tamil", "sizePt": 14, "weight": "bold" },
    "caption": { "family": "Noto Sans Tamil", "sizePt": 8 },
    "verseNumber": { "sizePt": 7, "position": "superscript" }
  },
  "runningHeader": { "enabled": true, "format": "{chapterTitle} · {pageNumber}" },
  "footer": { "enabled": true, "format": "{pageNumber}" },
  "justify": true,
  "chapterDropCap": false
}
```

The seed script sets this template on the "Tamil Bible (Parisutha Vedagamam)" genre. For new genres created by users, `pdfTemplate` is null and the export falls back to a single-column, Noto Sans, non-justified default.

---

## DOCX Export Layer

The export module generates Word documents (`.docx`) alongside PDF using the `docx` npm package.

### How it works

1. **Substitute** — same as PDF: replace each `{{SENTENCE_X}}` in `page.sourceMarkdown` with `sentence.translatedText` per page
2. **Structure mapping** — convert Markdown structure to Word paragraph styles:

   | Markdown | Word style |
   |----------|-----------|
   | `# heading` | `Heading1` |
   | `## heading` | `Heading2` |
   | `### heading` | `Heading3` |
   | Regular paragraph | `Normal` |
   | `- list item` | `ListBullet` |
   | `> blockquote` | `Quote` |
   | `![img](url)` | Inline image (fetched from MinIO at export time) |

3. **Typography** — apply `genre.docxTemplate` if set; fallback to single-column, A4, Times New Roman/Arial default

### `genre.docxTemplate` schema

```json
{
  "pageSize": "A5",
  "margins": { "top": 1440, "bottom": 1440, "left": 1800, "right": 1800 },
  "fonts": {
    "body":     { "family": "Noto Serif Tamil", "sizePt": 10 },
    "heading1": { "family": "Noto Serif Tamil", "sizePt": 14, "bold": true },
    "heading2": { "family": "Noto Serif Tamil", "sizePt": 12, "bold": true },
    "heading3": { "family": "Noto Serif Tamil", "sizePt": 11, "bold": true }
  },
  "lineSpacing": 276
}
```

(Margins in twips: 1440 twips = 1 inch.)

The seed script does **not** set `docxTemplate` on the Bible genre — DOCX is secondary output; PDF is the primary typeset format. For new genres, `docxTemplate` is null and the fallback default applies.

---

## NLP Segmentation Service (DELETED)

The Python FastAPI sidecar (`apps/nlp/`) and the `en_core_web_sm` spaCy sentence segmentations are **DELETED** from the active architecture. All page extractions and translations are executed at the native visual page level, which completely eliminates the need for sentence boundary segmentation.

---

## LLM Provider Layer

### Interface
```typescript
interface LLMProvider {
  generate(prompt: string, options?: GenerateOptions): Promise<string>;
  generateStructured<T>(prompt: string, schema: ZodSchema<T>): Promise<T>;
  stream(prompt: string): AsyncGenerator<string>;
}

// EmbeddingService calls OllamaProvider directly — not via LLMProvider.
// Anthropic has no embedding API, so embed() is NOT part of the shared interface.
```

### Concurrency
- Ollama: `p-limit(2)` — max 2 concurrent requests
- Anthropic: `p-limit(50)` — up to 50 concurrent (rate-limit managed by SDK)
- Backpressure: queue requests when limit hit; don't error
- Retry: 3 attempts with exponential backoff

### Anthropic Prompt Caching
Cache `cache_control` breakpoints on:
1. System prompt (static)
2. Genre content (changes rarely)
3. Glossary block (changes rarely)

---

## Translation Memory (RAG)

tAI includes a Retrieval-Augmented Generation (RAG) layer that learns from human reviewer corrections.

### Indexing (On Page Approval — async)
When a human reviewer approves a page, the approve endpoint enqueues an `INDEX_MEMORY` job (see `05-agents.md` § Agent Pipeline) and returns immediately — the approve response is never blocked by embedding calls. The `INDEX_MEMORY` job generates a 768-dimensional vector embedding of the `originalText` for each sentence via `EmbeddingService` (nomic-embed-text via Ollama) and upserts each into the `TranslationMemory` table, scoped to `genreId`, `sourceLang`, and `targetLang`.

### Retrieval (At Translation Time)
When the `TRANSLATE_BATCH` job processes a batch of pages:
1. Generate an embedding for each sentence's `originalText`.
2. Cosine similarity search via pgvector against `TranslationMemory` (filtered by same genre and language pair).
3. Retrieve up to 3 past approved sentences with similarity ≥ 0.75.
4. Inject retrieved pairs into the Translation Agent's system prompt as `[TRANSLATION_MEMORY_BLOCK]` (see `05-agents.md` § Translation Agent).

This allows the system to learn implicitly from past human edits without model fine-tuning.

### Storage
- Vector dimensions: 768 (nomic-embed-text)
- pgvector index type: `ivfflat` with cosine distance
- Scoped per `(genreId, sourceLang, targetLang)` — no cross-genre retrieval

---

## Job Worker

- One `JobWorker` singleton running in the NestJS process (no `workerId` — horizontal scaling not in scope)
- Polls `jobs` table every 2s for `QUEUED` jobs
- `SELECT FOR UPDATE SKIP LOCKED` prevents double-processing
- Updates `job.progress` (0–100) incrementally during long jobs (e.g., after each page image in PROCESS_DOCUMENT)
- Graceful shutdown: waits for in-flight job step to finish before stopping
- **Retry cap**: on restart, RUNNING jobs are marked FAILED. If `job.retryCount < 3`, increment and re-queue. If `retryCount >= 3`, leave as FAILED — do not re-queue. Prevents infinite loops on corrupt assets.
- **Pause semantics**: `POST /projects/:id/pause` sets `project.status = PAUSED` and updates all QUEUED jobs for that project to `status = PAUSED`. The worker finishes any currently in-flight LLM call (does not abort mid-call) and then skips PAUSED jobs. On `POST /projects/:id/resume`, `project.status` returns to PROCESSING and all PAUSED jobs for the project are set back to QUEUED so the worker picks them up.
- **Cancel semantics**: cancelling a job sets `job.status = CANCELLED`. If the job has children (via `parentJobId`), all QUEUED child jobs are also set to CANCELLED. In-flight child jobs complete but their results are discarded (page status not advanced).

---

## Security

| Concern | Approach |
|---------|----------|
| Passwords | bcrypt (cost 12) |
| JWT | RS256 or HS256; access 15m, refresh 7d |
| Refresh tokens | Stored in DB; rotated on use; revoked on logout |
| API keys | AES-256-GCM encrypted at rest |
| CORS | Strict origin whitelist |
| Headers | helmet (CSP, HSTS, etc.) |
| Rate limiting | 100 req/min per IP (throttler) |
| Correlation IDs | X-Correlation-Id header propagated through all logs |

---

## Docker Services (dev)

| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| postgres | pgvector/pgvector:pg17 | 12000→5432 | Primary DB + pgvector extension |
| minio | minio/minio | 12001→9000, 12002→9001 | File storage + console |
| ollama | ollama/ollama | 12003→11434 | Local LLM |
| nlp | ./Dockerfile.nlp | 12004→8001 | spaCy sentence segmentation (FastAPI) |
| maildev | maildev/maildev | 12005→1080, 12006→1025 | Dev SMTP UI + SMTP |
| api | ./Dockerfile.api | 12007→3000 | NestJS backend |
| frontend | ./Dockerfile.frontend | 12008→4200 | Angular dev server |

---

## Environment Variables

```bash
# Database
DATABASE_URL=postgresql://tai_user:tai_pass@postgres:5432/tai_db

# MinIO
MINIO_ENDPOINT=minio:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=tai-files

# Ollama
OLLAMA_ENDPOINT=http://ollama:11434
OLLAMA_TIMEOUT=120000
EMBEDDING_MODEL=nomic-embed-text

# NLP segmentation
NLP_ENDPOINT=http://nlp:8001

# Translation batching
MAX_TRANSLATION_BATCH_TOKENS=6000  # max tokens per TRANSLATE_BATCH job; tune per model context window

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Auth
JWT_SECRET=...
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d
ENCRYPTION_KEY=...   # 32-byte hex for AES-256-GCM

# Email
SMTP_HOST=maildev
SMTP_PORT=1025
EMAIL_FROM=noreply@tai.local

# App
NODE_ENV=development
PORT=3000
CORS_ORIGIN=http://localhost:12008
```
