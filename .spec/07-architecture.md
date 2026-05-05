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
| LLM (cloud) | Anthropic Claude (`@anthropic-ai/sdk`) | With prompt caching; supports many language pairs |
| PDF extraction | `pdf-parse` | No OCR; text PDFs only |
| Email (dev) | `maildev` + `nodemailer` | Dev SMTP on :1080 |
| PDF export | `pdfkit` | Embed Unicode/language-appropriate fonts (e.g. Noto Sans) |
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
| AI providers | Ollama + Anthropic | Local for dev/cost, Claude for production quality; both support multilingual output |
| Async strategy | **Polling** (DB-backed jobs) | Simpler than WebSockets; translation timescales allow it |
| Database | Wipe + fresh schema | New domain too different from v1 |
| Queue | **No BullMQ/Redis** — DB polling + `SELECT FOR UPDATE` | Fewer dependencies; sufficient throughput |
| OCR | **No PaddleOCR** — `pdf-parse` only | Defer OCR until explicitly needed |

---

## Infrastructure Diagram

```
┌─────────────────────────────────────────────────┐
│  Angular SPA (PrimeNG + Tailwind)               │
│  Polling: /jobs/:id every 2s during active jobs  │
│  SSE: /chat/stream for assistant responses       │
└────────────────────┬────────────────────────────┘
                     │ HTTPS
┌────────────────────▼────────────────────────────┐
│  NestJS API  (Port 3000)                        │
│  Modules: auth, users, genres, projects,        │
│  chapters, pages, sentences, errors, glossary,  │
│  jobs, chat, export, models, dashboard,         │
│  queue, admin, health                           │
└──┬─────────────┬─────────────┬──────────────────┘
   │             │             │
┌──▼──┐     ┌───▼───┐    ┌────▼─────┐
│ PG  │     │ MinIO │    │  Ollama  │
│ :5432│    │ :9000 │    │  :11434  │
└─────┘     └───────┘    └──────────┘
                              │
                    ┌─────────▼────────┐
                    │ Anthropic Claude  │
                    │ (external API)    │
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
    ├── segmentation.service.ts # Split into sentences
    ├── translation.agent.ts    # Sentence-level, glossary + genre-aware
    ├── review.agent.ts         # Structured errors (generic)
    └── orchestrator.ts         # Wires agents to job pipeline
```

---

## Extraction & OCR Layer

Since PDFs are predominantly scanned images, extraction MUST utilize a Vision-based OCR service (e.g., LlamaParse or Marker/Surya) to accurately convert scanned pixels into layout-aware Markdown.
- **Image Cropping:** Illustrations and diagrams within scans must be cropped, uploaded to MinIO, and referenced in the markdown (`![Image](url)`).

---

## LLM Provider Layer

### Interface
```typescript
interface LLMProvider {
  generate(prompt: string, options?: GenerateOptions): Promise<string>;
  generateStructured<T>(prompt: string, schema: ZodSchema<T>): Promise<T>;
  stream(prompt: string): AsyncGenerator<string>;
  embed(text: string): Promise<number[]>;
}
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

## Job Worker

- One `JobWorker` singleton running in the NestJS process
- Polls `jobs` table every 2s for `QUEUED` jobs
- `SELECT FOR UPDATE SKIP LOCKED` prevents double-processing
- Updates `progress` field in real time
- Graceful shutdown: waits for running jobs to finish
- On restart: resumes `RUNNING` jobs that weren't completed (marks as FAILED → re-queues)

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
| postgres | pgvector/pgvector:pg17 | 5432 | Primary DB + pgvector extension |
| minio | minio/minio | 9000, 9001 | File storage + console |
| ollama | ollama/ollama | 11434 | Local LLM |
| maildev | maildev/maildev | 1080, 1025 | Dev SMTP UI |
| api | ./Dockerfile.api | 3000 | NestJS backend |
| frontend | ./Dockerfile.frontend | 4200 | Angular dev server |

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
CORS_ORIGIN=http://localhost:4200
```
