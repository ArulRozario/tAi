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

  refreshTokens       RefreshToken[]
  ownedProjects       Project[]        @relation("ProjectOwner")
  pageReviews         PageReviewer[]
  sentenceAssignments Sentence[]       @relation("SentenceReviewer")
  genreVersions       GenreVersion[]
  chatSessions        ChatSession[]
  activityLogs        ActivityLog[]
  createdGenres       Genre[]
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
  segmentUnit      SegmentUnit  @default(SENTENCE)  // how sentences are grouped for display in the workbench
  pdfTemplate      Json?        // export typography/layout settings (see 07-architecture.md § PDF Export)
  docxTemplate     Json?        // export Word document styles (see 07-architecture.md § DOCX Export)
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
  layoutMetadata     Json?                 // structural data from OCR: columns, dimensions, font bands, image regions
  status             PageStatus @default(PENDING)
  priority           Priority   @default(MEDIUM)
  assignedAt         DateTime?  // when first reviewer was assigned (set on HUMAN_REVIEW transition)
  lastAiRunAt        DateTime?  // when last AI translation/review job finished
  quality            Int?       // 0-100; null before REVIEW_PAGE runs; recalculated after each Error status change
  notes              String?    // page-level notes visible to all assigned reviewers
  errorMessage       String?    // last job error
  retryCount         Int        @default(0)
  maxRetries         Int        @default(3)
  createdAt          DateTime   @default(now())
  updatedAt          DateTime   @updatedAt

  sentences    Sentence[]
  jobs         Job[]
  reviewers    PageReviewer[]

  @@unique([projectId, pageNumber])
}

// ─── PageReviewer ─────────────────────────────────────────────────────────────
// Supports multiple reviewers per page. REVIEW_PAGE auto-assigns one primary reviewer
// (isPrimary=true). MASTER+ can add more via POST /pages/:id/add-reviewer.

model PageReviewer {
  id         String   @id @default(uuid())
  pageId     String
  page       Page     @relation(fields: [pageId], references: [id], onDelete: Cascade)
  userId     String
  user       User     @relation(fields: [userId], references: [id])
  assignedAt DateTime @default(now())
  isPrimary  Boolean  @default(false)  // true for the round-robin auto-assigned reviewer

  @@unique([pageId, userId])
}

// ─── Sentence ─────────────────────────────────────────────────────────────────

model Sentence {
  id                 String        @id @default(uuid())
  pageId             String
  page               Page          @relation(fields: [pageId], references: [id], onDelete: Cascade)
  sentenceNumber     Int
  originalText       String
  translatedText     String?
  aiTranslatedText   String?       // AI-generated translation before any human edits; used for "Reset to AI translation"
  status             SentenceStatus @default(PENDING)
  confidence         Float?        // 0-1 from translation agent
  isApproved         Boolean       @default(false) // marked as accepted by human reviewer
  assignedReviewerId String?       // sentence-level reviewer override (optional)
  assignedReviewer   User?         @relation("SentenceReviewer", fields: [assignedReviewerId], references: [id])
  reviewedAt         DateTime?     // when reviewer last touched this sentence
  reviewedById       String?       // FK to User (soft ref — who last edited)
  createdAt          DateTime      @default(now())
  updatedAt          DateTime      @updatedAt

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
  id           String    @id @default(uuid())
  type         JobType
  status       JobStatus @default(QUEUED)
  payload      Json      @default("{}")  // input params (projectId, pageId, etc.)
  result       Json?     // output (fileUrl, stats, etc.)
  progress     Int       @default(0)     // 0-100
  retryCount   Int       @default(0)     // incremented on each re-queue; capped at 3
  errorMessage String?
  parentJobId  String?   // set on child jobs (e.g. EXTRACT_PAGE children of PROCESS_DOCUMENT)
  startedAt    DateTime?
  completedAt  DateTime?
  createdAt    DateTime  @default(now())

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
  PROCESS_DOCUMENT    // split PDF → images, create Pages, enqueue EXTRACT_PAGE per page
  EXTRACT_PAGE        // OCR one page image → sentences; triggers DETECT_CHAPTERS when all siblings done
  DETECT_CHAPTERS     // document-level: stitch cross-page fragments, detect chapters, group into TRANSLATE_BATCH jobs
  TRANSLATE_BATCH     // translate a token-budget batch of 1+ pages (replaces per-page TRANSLATE_PAGE)
  REVIEW_PAGE         // AI review of one page's translations
  INDEX_MEMORY        // embed approved sentences into TranslationMemory (async on page approval)
  EXPORT_PROJECT       // generate PDF/DOCX/text/HTML export of a whole project
  EXPORT_PAGE_REPORT   // generate per-page quality report PDF (sentence-by-sentence breakdown)
  EXPORT_ADMIN_REPORT  // generate aggregate quality/progress report across selected projects (MASTER+)
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

enum SegmentUnit {
  VERSE      // for verse-structured texts (scripture, poetry)
  PARAGRAPH  // group sentences into paragraphs for display
  SENTENCE   // default — each sentence displayed individually
  PAGE       // treat each page as one display unit
}
```

---

## Seed Data

The seed script must create:

1. **Users**
   - `admin@tai.local` / `admin123` — ADMIN role
   - `master@tai.local` / `master123` — MASTER role
   - `reviewer@tai.local` / `reviewer123` — REVIEWER role

2. **Genre: "Tamil Bible (Parisutha Vedagamam)"**
   - icon: `📖`, color: `#7c3aed`
   - segmentUnit: `VERSE` (scripture content is verse-structured)
   - sourceLang hint: English (`en`), targetLang hint: Tamil (`ta`)
   - GenreVersion v1.0 set as `currentVersionId`
   - Content: Parisutha Vedagamam Protestant Tamil Bible translation style guide (see `05-agents.md` § Default Genre Template)
   - pdfTemplate:
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

3. **GlossaryTerms**: seed the following Parisutha Vedagamam terms linked to the Bible genre:

| sourceTerm | targetTerm | context |
|------------|------------|---------|
| God | தேவன் | theological — never கடவுள் |
| Lord | கர்த்தர் | Protestant term — never ஆண்டவர் (Catholic) |
| Jesus | இயேசு | proper noun — transliterated |
| Christ | கிறிஸ்து | proper noun — transliterated |
| Holy Spirit | பரிசுத்த ஆவி | pneumatology — never தூய ஆவி (Catholic) |
| Father | பிதா | trinitarian — divine person |
| Son | குமாரன் | trinitarian — divine person |
| Faith | விசுவாசம் | never நம்பிக்கை |
| Believe | விசுவாசி | verb form of Faith |
| Grace | கிருபை | soteriological |
| Salvation | இரட்சிப்பு | Protestant primary — never மீட்பு (Catholic) |
| Gospel | சுவிசேஷம் | good news |
| Scripture | வேதவசனம் | Protestant term — never திருவசனம் (Catholic) |
| Bible | பரிசுத்த வேதாகமம் | Protestant Bible — never திருவிவிலியம் (Catholic) |
| Word (of God) | வாக்கு | never மந்திரம் |
| Church (congregation) | சபை | ekklesia — gathering |
| Church (building) | தேவாலயம் | place of worship |
| Prayer | ஜெபம் | personal address to God |
| Worship | ஆராதனை | corporate/formal worship |
| Righteousness | நீதி | moral/legal standing before God |
| Righteous | நீதிமான் | adjective/noun form |
| Sin | பாவம் | moral transgression |
| Repentance | மனந்திரும்புதல் | turning from sin |
| Forgiveness | மன்னிப்பு | release from sin's penalty |
| Eternal life | நித்திய ஜீவன் | eschatological life |
| Kingdom (of God) | ராஜ்யம் | divine reign |
| Covenant | உடன்படிக்கை | divine agreement |
| Promise | வாக்குத்தத்தம் | divine pledge |
| Blessing | ஆசீர்வாதம் | divine favour |
| Peace | சமாதானம் | shalom — wholeness |
| Love | அன்பு | agape — never நேசி |
| Hope | நம்பிக்கை | eschatological hope (only usage where நம்பிக்கை is correct) |
| Truth | சத்தியம் | divine reality |
| Light | ஒளி | metaphor for God/Christ |
| Darkness | இருள் | metaphor for sin/evil |
| Heaven | பரலோகம் | divine dwelling |
| Earth | பூமி | created world |
| Angel | தூதன் / தேவதூதன் | messenger of God |
| Prophet | தீர்க்கதரிசி | spokesperson for God |
| Apostle | அப்போஸ்தலன் | sent one |
| Disciple | சீஷன் | learner/follower |
| Priest | ஆசாரியன் | levitical or Melchizedek order |
| King | ராஜா | royal title |
| Throne | சிங்காசனம் | seat of divine authority |
| Lamb | ஆட்டுக்குட்டி | sacrificial — messianic title for Jesus |
| Blood | இரத்தம் | sacrificial/covenantal |
| Cross | சிலுவை | instrument of crucifixion |
| Resurrection | உயிர்த்தெழுதல் | rising from death |
| Baptism | ஞானஸ்நானம் | sacrament of initiation |

4. **ModelConfigs**:
   - TRANSLATION / OLLAMA / qwen2.5:7b (default)
   - REVIEW / OLLAMA / phi4:mini (default)
   - CHAT / OLLAMA / qwen2.5:7b (default)
   - CHAT / ANTHROPIC / claude-sonnet-4-6 (non-default, available)
   - EMBEDDING / OLLAMA / nomic-embed-text (default) — used by EmbeddingService for TranslationMemory indexing and retrieval

---

## Project Status Lifecycle

| Transition | Trigger |
|-----------|---------|
| DRAFT → PROCESSING | PROCESS_DOCUMENT job starts (set at job start) |
| PROCESSING → PAUSED | Manual via POST /projects/:id/pause |
| PAUSED → PROCESSING | Manual via POST /projects/:id/resume |
| PROCESSING → REVIEW | All pages reach HUMAN_REVIEW or APPROVED (set by REVIEW_PAGE job after last page) |
| REVIEW → COMPLETED | All pages are APPROVED (set by approve action) |
| Any → ARCHIVED | Manual via PATCH /projects/:id {status: ARCHIVED} (MASTER+) |

---

## Key Business Rules

- A `Page` cannot be moved to `APPROVED` if it has any `Error` with `status = OPEN` (unless user is MASTER or ADMIN doing an override).
- A `Page` cannot be moved to `APPROVED` if any sentence has `isApproved = false` (unless user is MASTER or ADMIN doing an override).
- Deleting a `Project` cascades to `Chapter` → `Page` → `Sentence` → `Error`.
- Deleting a `Genre` is blocked if any project references it.
- `RefreshToken` rotation: on every use, the old token is deleted and a new one is issued.
- `ActivityLog` is append-only; no updates or deletes.
- **Reviewer assignment**: REVIEW_PAGE auto-assigns one primary reviewer (`isPrimary = true` in `PageReviewer`) via round-robin among active REVIEWERs ordered by fewest current HUMAN_REVIEW assignments; sets `page.assignedAt`. MASTER+ can add additional reviewers via `POST /pages/:id/add-reviewer`.
- **Sentence assignment**: Any reviewer in the page's `PageReviewer` list can edit any sentence by default. Optionally a specific reviewer can be locked to a sentence via `POST /sentences/:id/assign {reviewerId}` — only that reviewer (or MASTER+) may then edit `translatedText` on that sentence.
- **Reassign**: `POST /pages/:id/reassign {reviewerIds}` replaces the entire `PageReviewer` list. The first entry in `reviewerIds` is set as `isPrimary = true`.
- **resolve-escalation**: re-assigns to the primary reviewer (`isPrimary = true` in `PageReviewer`) if still active, else round-robin new assignment.
- **Page retry limit**: `page.retryCount` is incremented on each `POST /pages/:id/request-changes`. If `page.retryCount >= page.maxRetries` (default 3), the endpoint returns 422 `MAX_RETRIES_EXCEEDED`. A MASTER+ can force a re-translation via `POST /admin/pages/:id/override` which resets retryCount.
- **Page quality score**: `max(0, round(100 − (criticalCount × 5 + highCount × 2 + medCount × 1 + lowCount × 0.5)))` across all `Error` records on the page **where `status = OPEN`** (resolved errors — APPLIED/REJECTED/EXCEPTION/ESCALATED — are excluded so that resolving or escalating errors improves the score). Stored in `page.quality`. Recalculated after every `Error` status change (apply/reject/exception/escalate). Null before REVIEW_PAGE runs.
