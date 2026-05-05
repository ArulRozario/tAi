# tAI — Domain Model

## Prisma Schema

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── Auth ────────────────────────────────────────────────────────────────────

model User {
  id           String   @id @default(uuid())
  email        String   @unique
  passwordHash String
  name         String
  role         Role     @default(REVIEWER)
  isActive     Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  refreshTokens  RefreshToken[]
  ownedProjects  Project[]        @relation("ProjectOwner")
  assignedPages  Page[]           @relation("PageReviewer")
  genreVersions  GenreVersion[]
  chatSessions   ChatSession[]
  activityLogs   ActivityLog[]
  createdGenres  Genre[]
}

model RefreshToken {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  token     String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())
}

// Password reset uses a stateless JWT — no DB model.
// Token payload: { sub: userId, email, purpose: "password-reset", exp: now+1h }
// Signed with JWT_SECRET. Single-use enforced by: once password changes, the old
// bcrypt hash no longer matches, so any replay attempt fails at validateUser().

// ─── Genre ───────────────────────────────────────────────────────────────────

model Genre {
  id               String       @id @default(uuid())
  name             String
  description      String?
  icon             String?      // emoji or icon name
  color            String?      // hex color for card
  currentVersionId String?      @unique
  currentVersion   GenreVersion? @relation("CurrentVersion", fields: [currentVersionId], references: [id])
  createdById      String?
  createdBy        User?        @relation(fields: [createdById], references: [id])
  createdAt        DateTime     @default(now())
  updatedAt        DateTime     @updatedAt

  versions      GenreVersion[] @relation("AllVersions")
  projects      Project[]
  glossaryTerms GlossaryTerm[]
  memories      TranslationMemory[]
}

model GenreVersion {
  id          String   @id @default(uuid())
  genreId     String
  genre       Genre    @relation("AllVersions", fields: [genreId], references: [id], onDelete: Cascade)
  version     String   // e.g. "1.0", "1.1", "2.0"
  content     String   // full markdown content (system prompt + style guide + glossary hints)
  note        String?  // change summary
  createdById String?
  createdBy   User?    @relation(fields: [createdById], references: [id])
  createdAt   DateTime @default(now())

  currentForGenre Genre? @relation("CurrentVersion")
}

// ─── Project ─────────────────────────────────────────────────────────────────

model Project {
  id          String        @id @default(uuid())
  name        String
  description String?
  sourceLang  String
  targetLang  String
  genreId     String
  genre       Genre         @relation(fields: [genreId], references: [id])
  status      ProjectStatus @default(DRAFT)
  ownerId     String?
  owner       User?         @relation("ProjectOwner", fields: [ownerId], references: [id])
  sourceFileId String?      // MinIO object key
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  chapters    Chapter[]
  pages       Page[]
  jobs        Job[]
  memories    TranslationMemory[]
}

model Chapter {
  id        String   @id @default(uuid())
  projectId String
  project   Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  number    Int
  title     String?
  createdAt DateTime @default(now())

  pages     Page[]

  @@unique([projectId, number])
}

// ─── Page ────────────────────────────────────────────────────────────────────

model Page {
  id                 String     @id @default(uuid())
  projectId          String
  project            Project    @relation(fields: [projectId], references: [id], onDelete: Cascade)
  chapterId          String?
  chapter            Chapter?   @relation(fields: [chapterId], references: [id])
  pageNumber         Int
  originalText       String?
  sourceMarkdown     String?    @db.Text   // Markdown skeleton with {{SENTENCE_X}} placeholders
  status             PageStatus @default(PENDING)
  priority           Priority   @default(MEDIUM)
  assignedReviewerId String?
  assignedReviewer   User?      @relation("PageReviewer", fields: [assignedReviewerId], references: [id])
  assignedAt         DateTime?  // when reviewer was assigned
  lastAiRunAt        DateTime?  // when last AI translation/review job finished
  notes              String?    // reviewer private notes
  errorMessage       String?    // last job error
  retryCount         Int        @default(0)
  maxRetries         Int        @default(3)
  createdAt          DateTime   @default(now())
  updatedAt          DateTime   @updatedAt

  sentences    Sentence[]
  jobs         Job[]

  @@unique([projectId, pageNumber])
}

// ─── Sentence ─────────────────────────────────────────────────────────────────

model Sentence {
  id             String        @id @default(uuid())
  pageId         String
  page           Page          @relation(fields: [pageId], references: [id], onDelete: Cascade)
  sentenceNumber Int
  originalText   String
  translatedText String?
  status         SentenceStatus @default(PENDING)
  confidence     Float?        // 0-1 from translation agent
  isApproved     Boolean       @default(false) // marked as accepted by human reviewer
  reviewedAt     DateTime?     // when reviewer last touched this sentence
  reviewedById   String?       // FK to User (soft ref, no constraint)
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt

  errors         Error[]
  memory         TranslationMemory?

  @@unique([pageId, sentenceNumber])
}

// ─── Error ───────────────────────────────────────────────────────────────────

model Error {
  id               String        @id @default(uuid())
  sentenceId       String
  sentence         Sentence      @relation(fields: [sentenceId], references: [id], onDelete: Cascade)
  severity         ErrorSeverity
  category         ErrorCategory
  location         String?       // e.g. "words 5-7"
  currentText      String        // what the AI produced
  suggestedText    String        // what it should be
  issueDescription String        // why it's wrong
  reference        String?       // glossary term or domain reference
  aiNote           String?       // model's own explanation
  status           ErrorStatus   @default(OPEN)
  appliedAt        DateTime?
  appliedById      String?
  escalatedAt      DateTime?
  escalatedById    String?
  createdAt        DateTime      @default(now())
}

// ─── Glossary ─────────────────────────────────────────────────────────────────

model GlossaryTerm {
  id         String   @id @default(uuid())
  genreId    String
  genre      Genre    @relation(fields: [genreId], references: [id], onDelete: Cascade)
  sourceTerm String
  targetTerm String
  context    String?  // which sense / topic area
  notes      String?
  version    Int      @default(1)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@unique([genreId, sourceTerm])
}

// ─── Translation Memory (RAG) ─────────────────────────────────────────────────
// Stores human-approved sentence translations as vector embeddings.
// Retrieved at translation time to provide few-shot context to the agent.
// Requires the pgvector extension: CREATE EXTENSION IF NOT EXISTS vector;

model TranslationMemory {
  id             String   @id @default(uuid())
  genreId        String
  genre          Genre    @relation(fields: [genreId], references: [id], onDelete: Cascade)
  projectId      String
  project        Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  sentenceId     String   @unique
  sentence       Sentence @relation(fields: [sentenceId], references: [id], onDelete: Cascade)
  sourceLang     String
  targetLang     String
  originalText   String
  translatedText String
  embedding      Unsupported("vector(768)")?  // nomic-embed-text output
  createdAt      DateTime @default(now())

  @@index([genreId, sourceLang, targetLang])
}

// ─── Jobs ────────────────────────────────────────────────────────────────────

model Job {
  id          String    @id @default(uuid())
  type        JobType
  status      JobStatus @default(QUEUED)
  payload     Json      @default("{}")  // input params (projectId, pageId, etc.)
  result      Json?     // output (fileUrl, stats, etc.)
  progress    Int       @default(0)     // 0-100
  errorMessage String?
  workerId    String?
  startedAt   DateTime?
  completedAt DateTime?
  createdAt   DateTime  @default(now())

  // Optional relations (a job may belong to a project or page)
  projectId   String?
  project     Project?  @relation(fields: [projectId], references: [id])
  pageId      String?
  page        Page?     @relation(fields: [pageId], references: [id])
}

// ─── Chat ────────────────────────────────────────────────────────────────────

model ChatSession {
  id            String      @id @default(uuid())
  userId        String
  user          User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  context       ChatContext @default(GENERAL)
  entityId      String?     // genreId, pageId, etc. depending on context
  modelProvider Provider    @default(OLLAMA)
  modelName     String      @default("qwen2.5:7b")
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  messages      ChatMessage[]
}

model ChatMessage {
  id         String      @id @default(uuid())
  sessionId  String
  session    ChatSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  role       MessageRole
  content    String
  mode       ChatMode?   // PLAN or BUILD (null for USER/SYSTEM messages)
  tokenCount Int?
  createdAt  DateTime    @default(now())
}

// ─── Models ──────────────────────────────────────────────────────────────────

model ModelConfig {
  id        String    @id @default(uuid())
  agentType AgentType
  provider  Provider
  modelName String
  endpoint  String?
  apiKeyEnc String?   // AES-256-GCM encrypted
  isActive  Boolean   @default(true)
  isDefault Boolean   @default(false)
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  @@unique([agentType, isDefault])
}

// ─── Activity ────────────────────────────────────────────────────────────────

model ActivityLog {
  id         String   @id @default(uuid())
  userId     String?
  user       User?    @relation(fields: [userId], references: [id])
  action     String   // e.g. "page.approved", "genre.version_created"
  entityType String   // "page", "project", "genre", etc.
  entityId   String?
  entityHref String?  // frontend route for click-through navigation
  details    Json     @default("{}")
  createdAt  DateTime @default(now())
}

// ─── Enums ───────────────────────────────────────────────────────────────────

enum Role {
  REVIEWER
  MASTER
  ADMIN
}

enum ProjectStatus {
  DRAFT
  PROCESSING
  PAUSED
  REVIEW
  COMPLETED
  ARCHIVED
}

enum PageStatus {
  PENDING
  EXTRACTING
  EXTRACTED
  TRANSLATING
  TRANSLATED
  REVIEWING
  HUMAN_REVIEW
  APPROVED
  REJECTED
  ESCALATED
  ERROR
}

enum SentenceStatus {
  PENDING
  TRANSLATED
  REVIEWED
}

enum ErrorSeverity {
  CRITICAL
  HIGH
  MEDIUM
  LOW
}

enum ErrorCategory {
  TERMINOLOGY
  STYLE
  ACCURACY
  FLUENCY
  GRAMMAR
}

enum ErrorStatus {
  OPEN
  APPLIED
  REJECTED
  ESCALATED
  EXCEPTION
}

enum JobType {
  EXTRACT_PDF
  TRANSLATE_PAGE
  REVIEW_PAGE
  EXPORT_PROJECT
}

enum JobStatus {
  QUEUED
  RUNNING
  PAUSED
  DONE
  FAILED
  CANCELLED
}

enum AgentType {
  TRANSLATION
  REVIEW
  CHAT
  EMBEDDING   // nomic-embed-text via Ollama — generates vectors for TranslationMemory
}

enum Provider {
  OLLAMA
  ANTHROPIC
}

enum ChatContext {
  GENRE
  REVIEW
  GLOSSARY
  GENERAL
}

enum ChatMode {
  PLAN
  BUILD
}

enum MessageRole {
  USER
  ASSISTANT
  SYSTEM
}

enum Priority {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}
```

---

## Seed Data

The seed script must create:

1. **Users**
   - `admin@tai.local` / `admin123` — ADMIN role
   - `master@tai.local` / `master123` — MASTER role
   - `reviewer@tai.local` / `reviewer123` — REVIEWER role

2. **Genre: "Literary Translation"** _(example/demo genre)_
   - sourceLang hint: English, targetLang hint: Tamil (illustrative)
   - GenreVersion v1.0 set as `currentVersionId`
   - Content: a generic literary translation style guide (see `05-agents.md` § Default Genre Template)

3. **GlossaryTerms** _(optional demo data)_:
   - Seed 20–30 generic literary terms linked to the demo genre (e.g. common narrative vocabulary: protagonist, narrator, irony, metaphor, etc., with example target-language equivalents).
   - A full domain-specific glossary should be loaded by the user via `POST /glossary/bulk` for their specific genre.

4. **ModelConfigs**:
   - TRANSLATION / OLLAMA / qwen2.5:7b (default)
   - REVIEW / OLLAMA / phi4:mini (default)
   - CHAT / OLLAMA / qwen2.5:7b (default)
   - CHAT / ANTHROPIC / claude-sonnet-4-6 (non-default, available)

---

## Project Status Lifecycle

| Transition | Trigger |
|-----------|---------|
| DRAFT → PROCESSING | EXTRACT_PDF job starts (set when job status = RUNNING) |
| PROCESSING → PAUSED | Manual via POST /projects/:id/pause |
| PAUSED → PROCESSING | Manual via POST /projects/:id/resume |
| PROCESSING → REVIEW | All pages reach HUMAN_REVIEW or APPROVED (set by REVIEW_PAGE job after last page) |
| REVIEW → COMPLETED | All pages are APPROVED (set by approve action) |
| Any → ARCHIVED | Manual via PATCH /projects/:id {status: ARCHIVED} (MASTER+) |

---

## Key Business Rules

- A `Page` cannot be moved to `APPROVED` if it has any `Error` with status `OPEN` (unless user is MASTER or ADMIN doing an override).
- Deleting a `Project` cascades to `Chapter` → `Page` → `Sentence` → `Error`.
- Deleting a `Genre` is blocked if any project references it.
- `RefreshToken` rotation: on every use, the old token is deleted and a new one is issued.
- `ActivityLog` is append-only; no updates or deletes.
