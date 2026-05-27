# Workbench Review Submission Feature — Analysis & Design

> **Status**: Analysis complete — ready for implementation  
> **Scope**: Backend (NestJS/Prisma) + Frontend (Angular/PrimeNG) changes to enable multi-reviewer correction submissions and master approval workflow.

---

## 1. Current State Analysis

### 1.1 How Corrections Work Today

| Step | What Happens |
|------|-------------|
| **Edit** | Reviewer clicks a segment → toolbar appears → clicks **Edit** → types new text → **Save** |
| **Storage** | Saved immediately as a `PageEdit` record (upsert per `pageId + segmentId`). Only **one** correction per segment ever exists. |
| **Submit** | Reviewer clicks **"Submit for Review"** → sets `Page.submittedAt` + `Page.submittedById` |
| **Approval** | Master clicks **"Approve"** → page status becomes `APPROVED`. No review of *which* corrections were made. |
| **Problem** | If 2 reviewers edit the same page, the second reviewer's `PageEdit` **overwrites** the first. There is no history, no comparison, no choice. |

### 1.2 Current Data Model

```prisma
model PageEdit {
  id         String   @id @default(uuid())
  pageId     String
  segmentId  String
  editedText String   @db.Text
  editedById String
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@unique([pageId, segmentId])
}
```

**Limitations:**
- `@@unique([pageId, segmentId])` means only **one** correction per segment per page.
- No concept of a "submission" (a snapshot of corrections at a point in time).
- No way for a master to see what different reviewers changed.
- `Page.submittedById` only records **one** submitter.

### 1.3 Current UI Flow

```
┌─────────────────────────────────────────────────────────────┐
│  Workbench Toolbar                                          │
│  [Reviewer]  Submit for Review  →  sets submittedAt          │
│  [Master]    Approve / Revoke  →  toggles page status      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Segment Toolbar (on click)                                 │
│  [Approve] [Ask AI] [Edit] [Reset]                         │
│                                                             │
│  Edit → contentEditable=true → Save → upserts PageEdit     │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Proposed New Workflow

### 2.1 High-Level Flow

```
┌─────────────────┐     ┌─────────────────────────────┐     ┌──────────────────┐
│   REVIEWER A    │     │         WORKBENCH           │     │     MASTER       │
└─────────────────┘     └─────────────────────────────┘     └──────────────────┘
         │                           │                            │
         │  1. Makes segment edits   │                            │
         │  → saved as PageEdit       │                            │
         │  (working draft)           │                            │
         │                           │                            │
         │  2. Clicks "Submit Review" │                            │
         │───────────────────────────►│                            │
         │                           │  creates PageReviewSubmission│
         │                           │  + copies PageEdits into     │
         │                           │  PageReviewSubmissionItem    │
         │                           │                            │
         │◄───────────────────────────│  clears reviewer's PageEdit │
         │                           │  (optional — see design)   │
         │                           │                            │
         │         REVIEWER B also submits (same page)              │
         │                           │                            │
         │                           │  3. Master opens page       │
         │                           │◄─────────────────────────── │
         │                           │                            │
         │                           │  4. Sees "Submissions" tab  │
         │                           │     listing Reviewer A & B  │
         │                           │     with segment counts     │
         │                           │                            │
         │                           │  5. Clicks a segment         │
         │                           │     → sees all corrections   │
         │                           │       from all reviewers     │
         │                           │                            │
         │                           │  6. Picks one submission   │
         │                           │     → clicks "Approve"     │
         │                           │                            │
         │                           │  7. Approved items become   │
         │                           │     the new PageEdit /      │
         │                           │     translatedHtml          │
         │                           │                            │
         │                           │  8. Master can edit further │
         │                           │     (new PageEdit records)  │
```

### 2.2 New Concepts

| Concept | Definition |
|---------|-----------|
| **PageReviewSubmission** | A snapshot of a reviewer's corrections on a page, submitted at a point in time. |
| **PageReviewSubmissionItem** | One segment correction inside a submission. |
| **Working Edits** | Current `PageEdit` records — the live draft the reviewer is typing into. |
| **Submitted Corrections** | Frozen copies inside a submission. Immutable once submitted. |
| **Approved Corrections** | The submission the master picked. Becomes the canonical version. |

---

## 3. Database Schema Changes

### 3.1 New Models

Add to `apps/api/prisma/schema.prisma`:

```prisma
// ─── Page Review Submissions ─────────────────────────────────────────────────

enum ReviewSubmissionStatus {
  PENDING
  APPROVED
  REJECTED
}

model PageReviewSubmission {
  id        String   @id @default(uuid())
  pageId    String
  page      Page     @relation(fields: [pageId], references: [id], onDelete: Cascade)
  submittedById String
  submittedBy   User   @relation(fields: [submittedById], references: [id])
  status    ReviewSubmissionStatus @default(PENDING)
  notes     String?  // reviewer can add a note when submitting
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  items     PageReviewSubmissionItem[]

  @@index([pageId, status])
  @@index([submittedById])
}

model PageReviewSubmissionItem {
  id           String   @id @default(uuid())
  submissionId String
  submission   PageReviewSubmission @relation(fields: [submissionId], references: [id], onDelete: Cascade)
  segmentId    String
  editedText   String   @db.Text
  createdAt    DateTime @default(now())

  @@index([submissionId])
  @@index([segmentId])
}
```

### 3.2 Updated Models

Update `Page` model to track the approved submission:

```prisma
model Page {
  // ... existing fields ...

  // Replace the single submitter with link to approved submission
  // Keep submittedAt/submittedById for backward compat or migrate
  approvedSubmissionId String? @unique
  approvedSubmission   PageReviewSubmission? @relation("ApprovedSubmission", fields: [approvedSubmissionId], references: [id])

  reviewSubmissions    PageReviewSubmission[]
}
```

Update `User` model to link submissions:

```prisma
model User {
  // ... existing fields ...
  reviewSubmissions PageReviewSubmission[]
}
```

> **Note**: The existing `Page.submittedById` + `Page.submittedAt` can be **deprecated** once this feature is live. During migration, create a `PageReviewSubmission` for any existing submitted pages and clear those fields.

### 3.3 Migration Strategy

1. Create Prisma migration: `prisma migrate dev --name add_review_submissions`
2. For existing data where `Page.submittedById IS NOT NULL`:
   - Create one `PageReviewSubmission` per such page
   - Copy all existing `PageEdit` records into `PageReviewSubmissionItem`
   - Set status = `PENDING`
   - Set `Page.approvedSubmissionId` if page is already `APPROVED`
3. Optionally drop `Page.submittedById` in a follow-up migration.

---

## 4. Backend API Design

### 4.1 New Module: `ReviewSubmissionsModule`

Create `apps/api/src/modules/review-submissions/`:

| File | Purpose |
|------|---------|
| `review-submissions.module.ts` | NestJS module |
| `review-submissions.controller.ts` | HTTP routes |
| `review-submissions.service.ts` | Business logic |
| `dto/` | DTOs |

### 4.2 New Endpoints

```typescript
@Controller('pages')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReviewSubmissionsController {
  // ... injected ReviewSubmissionsService ...
}
```

#### POST `/pages/:id/review-submissions`
**Role**: REVIEWER, MASTER, ADMIN  
**Action**: Submit the reviewer's current working `PageEdit`s as a new submission.

**Body:**
```json
{
  "notes": "optional note from reviewer"
}
```

**Logic:**
1. Find all `PageEdit` where `pageId = :id` and `editedById = currentUser.id`
2. If none exist, return `400 Bad Request` ("No edits to submit")
3. Create `PageReviewSubmission` (status = `PENDING`)
4. For each `PageEdit`, create `PageReviewSubmissionItem`
5. Delete those `PageEdit` records (they are now "frozen" in the submission)
6. Update `Page.submittedAt = now()` (for backward compat / queue display)
7. Return the submission with items

#### GET `/pages/:id/review-submissions`
**Role**: REVIEWER (own only), MASTER, ADMIN (all)  
**Action**: List all submissions for a page.

**Query params:** `?status=PENDING` (optional filter)

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "submittedBy": { "id": "uuid", "name": "Alice", "avatarUrl": "..." },
      "status": "PENDING",
      "notes": "Fixed terminology in ch. 3",
      "itemCount": 12,
      "createdAt": "2026-05-18T10:00:00Z",
      "items": [
        { "segmentId": "seg-1", "editedText": "..." }
      ]
    }
  ]
}
```

> For REVIEWER role: filter `submittedById = currentUser.id` unless they are also the page owner.

#### GET `/pages/:id/review-submissions/segment/:segmentId`
**Role**: MASTER, ADMIN (reviewers can also call to see their own)  
**Action**: Get all submitted corrections for a specific segment across all submissions.

**Response:**
```json
{
  "data": [
    {
      "submissionId": "uuid",
      "submittedBy": { "id": "uuid", "name": "Alice" },
      "status": "PENDING",
      "editedText": "The quick brown fox...",
      "createdAt": "2026-05-18T10:00:00Z"
    },
    {
      "submissionId": "uuid",
      "submittedBy": { "id": "uuid", "name": "Bob" },
      "status": "PENDING",
      "editedText": "A fast brown fox...",
      "createdAt": "2026-05-18T11:00:00Z"
    }
  ]
}
```

#### POST `/pages/:id/review-submissions/:submissionId/approve`
**Role**: MASTER, ADMIN  
**Action**: Approve a submission. This becomes the canonical version.

**Body:**
```json
{
  "notes": "optional master note"
}
```

**Logic:**
1. Find submission by `id` and `pageId`. Must be `PENDING`.
2. Transaction:
   - Delete all existing `PageEdit` for this page
   - Create new `PageEdit` records from submission items (with `editedById = masterUser.id` or keep original? **Decision**: use `editedById = submission.submittedById` to preserve attribution, or add a new field `approvedFromSubmissionId`)
   - Update `PageReviewSubmission.status = APPROVED`
   - Reject all **other** `PENDING` submissions for this page (`status = REJECTED`)
   - Update `Page.status = HUMAN_REVIEW` (or keep as-is if master is just picking corrections)
   - Update `Page.approvedSubmissionId = submissionId`
   - Re-compile `translatedHtml` by applying all approved edits to `originalHtml` (reuse existing `compileHtml` logic from frontend, or implement on backend)
3. Return updated page + submission

#### POST `/pages/:id/review-submissions/:submissionId/reject`
**Role**: MASTER, ADMIN  
**Action**: Reject a submission.

**Logic:**
- Set `status = REJECTED`
- Optionally add rejection note (extend schema with `rejectedAt`, `rejectedById`, `rejectionReason`)

#### POST `/pages/:id/review-submissions/:submissionId/unsubmit`
**Role**: REVIEWER (own only), MASTER, ADMIN  
**Action**: Withdraw a submission before it's approved.

**Logic:**
- Only if `status = PENDING`
- Optionally copy items back into working `PageEdit` records so reviewer can keep editing

---

### 4.3 Modified Existing Endpoints

| Endpoint | Change |
|----------|--------|
| `POST /pages/:id/submit` | **Deprecated**. Redirect to new `POST /pages/:id/review-submissions` or keep for backward compat but internally create a submission. |
| `POST /pages/:id/approve` | After approving page, also check if `approvedSubmissionId` is set. If not, warn master. |
| `GET /pages/:id` | Include `reviewSubmissions` array (or at least `reviewSubmissionCount`) in response. |
| `GET /pages/:id/edits` | For masters, return the **approved** submission's items if they exist. For reviewers, return their working edits. |

---

## 5. Frontend UI/UX Design

### 5.1 Workbench Layout Changes

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  TOOLBAR                                                                    │
│  [Prev/Next] [Retranslate] [Model] [Reset] [Status] [Submit/Approve panel]  │
└─────────────────────────────────────────────────────────────────────────────┘
┌──────────────────┬──────────────────────────────┬───────────────────────────┐
│                  │                              │                           │
│  LEFT SIDEBAR    │   CENTER: Translation        │   RIGHT PANEL           │
│  (thumbnails)    │                              │                           │
│                  │   ┌────────────┬───────────┐ │  ┌─────────────────────┐│
│                  │   │ Source     │ Target    │ │  │  AI Chat (existing) ││
│                  │   │            │           │ │  └─────────────────────┘│
│                  │   │            │           │ │  ┌─────────────────────┐│
│                  │   │            │           │ │  │  SUBMISSIONS PANEL  ││
│                  │   │            │           │ │  │  (new — master only)││
│                  │   │            │           │ │  │                     ││
│                  │   │            │           │ │  │ • Alice  (12 segs)  ││
│                  │   │            │           │ │  │   [Approve] [Reject]││
│                  │   │            │           │ │  │ • Bob    (8 segs)   ││
│                  │   │            │           │ │  │   [Approve] [Reject]││
│                  │   │            │           │ │  └─────────────────────┘│
│                  │   │            │           │ │                           │
│                  │   │            │           │ │  ┌─────────────────────┐│
│                  │   │            │           │ │  │  SEGMENT REVIEWS    ││
│                  │   │            │           │ │  │  (new — shows when  ││
│                  │   │            │           │ │  │   segment is active)││
│                  │   │            │           │ │  │                     ││
│                  │   │            │           │ │  │ Alice: "The fox..." ││
│                  │   │            │           │ │  │ Bob:   "A fox..."   ││
│                  │   └────────────┴───────────┘ │  └─────────────────────┘│
│                  │                              │                           │
└──────────────────┴──────────────────────────────┴───────────────────────────┘
```

### 5.2 Reviewer Mode (Non-Master)

**Toolbar Changes:**

```
┌──────────────────────────────────────────────────────────────┐
│  ... model picker ...                                        │
│                                                              │
│  [Reviewer]                                                  │
│    IF has working edits:                                     │
│      [ 📝 Submit Review ]  ← primary green button           │
│    ELSE IF already submitted:                                │
│      [ ✓ Submitted ]  [ 🚫 Unsubmit ]                       │
│    ELSE:                                                     │
│      [ Submit for Review ] (disabled if no edits)            │
│                                                              │
│  Hover: "Submit your corrections for master review"           │
└──────────────────────────────────────────────────────────────┘
```

**Segment Toolbar (on click):**
- Keep current: `[Approve] [Ask AI] [Edit] [Reset]`
- Edits are saved as working `PageEdit` (same as today)
- Add a subtle badge on segments that have working edits: a small dot or "edited" indicator

### 5.3 Master Mode

**Toolbar Changes:**

```
┌──────────────────────────────────────────────────────────────┐
│  ... status dropdown ...                                     │
│                                                              │
│  [Master]                                                    │
│    IF there are pending submissions:                         │
│      [ 👑 Review Submissions (3) ]  ← primary button        │
│    ELSE IF page approved:                                    │
│      [ Revoke Approval ]                                     │
│    ELSE:                                                     │
│      [ Approve Page ]                                        │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Right Panel — Submissions List (new component):**

When master clicks "Review Submissions", the right panel shows:

```
┌─────────────────────────────────┐
│  👤 Review Submissions (3)      │
│  ─────────────────────────────  │
│                                 │
│  ┌─────────────────────────┐   │
│  │ 🟢 Alice M.   12 edits  │   │
│  │    2 hrs ago            │   │
│  │    "Fixed ch3 terms"    │   │
│  │                         │   │
│  │ [👁 Preview] [✓ Approve]│   │
│  │ [✕ Reject]              │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │ 🟡 Bob D.      8 edits  │   │
│  │    5 hrs ago            │   │
│  │                         │   │
│  │ [👁 Preview] [✓ Approve]│   │
│  │ [✕ Reject]              │   │
│  └─────────────────────────┘   │
│                                 │
└─────────────────────────────────┘
```

**Preview Mode:**
- Clicking "Preview" highlights that submission's corrections in the target column with a colored border (e.g., blue for Alice, orange for Bob).
- Show a diff view comparing original → corrected text.

**Right Panel — Segment Reviews (new component):**

When master clicks a segment that has submitted corrections:

```
┌─────────────────────────────────┐
│  📝 Corrections for "seg-42"    │
│  ─────────────────────────────  │
│                                 │
│  ┌─────────────────────────┐   │
│  │ Alice:                  │   │
│  │ "The quick brown fox"   │   │
│  │ [Use this text]         │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │ Bob:                    │   │
│  │ "A fast brown fox"      │   │
│  │ [Use this text]         │   │
│  └─────────────────────────┘   │
│                                 │
│  Current: "The fast brown fox" │
│                                 │
└─────────────────────────────────┘
```

Clicking "Use this text" temporarily applies that correction to the segment in the target column. The master can then save it as a working edit, or approve the entire submission.

### 5.4 Visual Indicators on Segments

Add CSS classes to segments based on state:

| State | Visual |
|-------|--------|
| Has working edit (reviewer) | 🟡 yellow left border |
| Has correction in submission A | 🔵 blue top border |
| Has correction in submission B | 🟠 orange top border |
| Approved correction | 🟢 green left border |
| Segment with multiple submissions | Small badge showing count (e.g., "2") |

### 5.5 New / Modified Components

| Component | Action |
|-----------|--------|
| `submissions-panel.component.ts` | New. Lists all submissions for the page. Master only. |
| `segment-reviews.component.ts` | New. Shows all corrections for the active segment. Master only. |
| `submission-preview.component.ts` | New. Diff view of a single submission. |
| `workbench-toolbar.component.ts` | Modify. Change buttons for reviewer vs master. |
| `workbench.component.ts` | Modify. Load submissions, pass to panels. |
| `workbench-state.service.ts` | Modify. Add `submissions`, `activeSubmissionId` signals. |
| `segment-toolbar.component.ts` | Minor. Add "edited" indicator. |

---

## 6. Implementation Phases

### Phase 1: Database & Backend Core (Day 1–2)

1. **Prisma schema changes**
   - Add `PageReviewSubmission`, `PageReviewSubmissionItem`, `ReviewSubmissionStatus` enum
   - Add `Page.approvedSubmissionId` relation
   - Generate migration

2. **Backend module scaffolding**
   - `review-submissions.module.ts`, `.controller.ts`, `.service.ts`
   - Wire into `AppModule`

3. **Core endpoints**
   - `POST /pages/:id/review-submissions` (submit)
   - `GET /pages/:id/review-submissions` (list)
   - `GET /pages/:id/review-submissions/segment/:segmentId` (segment corrections)
   - `POST /pages/:id/review-submissions/:submissionId/approve`
   - `POST /pages/:id/review-submissions/:submissionId/reject`

4. **Unit tests** for service layer

### Phase 2: Frontend UI — Reviewer Flow (Day 2–3)

1. **Modify `workbench-toolbar`**
   - Reviewer sees "Submit Review" instead of generic "Submit for Review"
   - Button disabled if no working edits exist

2. **Create `submissions.service.ts`** (frontend)
   - HTTP calls to new endpoints

3. **Modify segment toolbar**
   - Show "edited" indicator on segments with working edits

4. **Update `workbench.component.ts`**
   - Load submissions on page load
   - After submit, clear working edits and refresh

### Phase 3: Frontend UI — Master Flow (Day 3–4)

1. **Create `submissions-panel.component.ts`**
   - List submissions with reviewer info, item count, timestamp
   - Approve / Reject / Preview buttons
   - Only visible to MASTER / ADMIN

2. **Create `segment-reviews.component.ts`**
   - Shows when segment is active
   - Lists all corrections for that segment
   - "Use this text" button to apply individually

3. **Modify right panel layout**
   - Show AI chat by default
   - Show Submissions panel when master toggles it
   - Show Segment Reviews when segment active and master role

4. **Modify `workbench-toolbar` for master**
   - "Review Submissions (N)" button when submissions exist
   - "Approve Page" only enabled after a submission is approved (or warn)

### Phase 4: Edge Cases & Polish (Day 4–5)

1. **Unsubmit flow**
   - Allow reviewer to withdraw submission (if still PENDING)
   - Restore working edits

2. **Approval without submission**
   - If master clicks "Approve Page" but no submission is approved, show warning: "No reviewer corrections selected. Approve AI translation as-is?"

3. **Notifications / Activity Log**
   - Log `page.review_submitted`, `page.review_approved`, `page.review_rejected` actions

4. **E2E tests**
   - Reviewer submits corrections
   - Master sees and approves
   - Segment-level comparison

---

## 7. API Summary

| Method | Path | Role | Description |
|--------|------|------|-------------|
| `POST` | `/pages/:id/review-submissions` | REVIEWER+ | Submit working edits as a submission |
| `GET` | `/pages/:id/review-submissions` | REVIEWER+ | List submissions for page |
| `GET` | `/pages/:id/review-submissions/segment/:segmentId` | MASTER+ | Get all corrections for a segment |
| `POST` | `/pages/:id/review-submissions/:submissionId/approve` | MASTER+ | Approve a submission |
| `POST` | `/pages/:id/review-submissions/:submissionId/reject` | MASTER+ | Reject a submission |
| `POST` | `/pages/:id/review-submissions/:submissionId/unsubmit` | REVIEWER+ | Withdraw a submission |

---

## 8. Files to Touch

### Backend
```
apps/api/prisma/schema.prisma
apps/api/prisma/migrations/YYYY..._add_review_submissions/
apps/api/src/app/app.module.ts                    ← register module
apps/api/src/modules/review-submissions/          ← NEW FOLDER
  review-submissions.module.ts
  review-submissions.controller.ts
  review-submissions.service.ts
  dto/
    create-submission.dto.ts
    approve-submission.dto.ts
    reject-submission.dto.ts
apps/api/src/modules/pages/pages.controller.ts     ← wire new endpoints
apps/api/src/modules/pages/pages.service.ts        ← maybe reuse edit logic
```

### Frontend
```
apps/frontend/src/app/projects/projects.service.ts          ← add submission HTTP calls
apps/frontend/src/app/workbench/services/
  workbench-state.service.ts                               ← add submission state
  submissions.service.ts                                   ← NEW
apps/frontend/src/app/workbench/components/
  submissions-panel/                                       ← NEW FOLDER
    submissions-panel.component.ts
    submissions-panel.component.html
    submissions-panel.component.scss
  segment-reviews/                                       ← NEW FOLDER
    segment-reviews.component.ts
    segment-reviews.component.html
    segment-reviews.component.scss
  submission-preview/                                    ← NEW FOLDER (optional)
  workbench-toolbar/workbench-toolbar.component.ts       ← modify buttons
  workbench-toolbar/workbench-toolbar.component.html
  segment-toolbar/segment-toolbar.component.ts           ← add edited indicator
  page-content-renderer/page-content-renderer.component.ts ← add CSS classes
apps/frontend/src/app/workbench/workbench.component.ts   ← integrate panels
apps/frontend/src/app/workbench/workbench.component.html
```

---

## 9. Open Questions / Decisions Needed

1. **Should rejected submissions be hard-deleted or kept?**  
   → **Recommendation**: Keep them (`status = REJECTED`) for audit trail. Add `rejectedAt`, `rejectedById`, `rejectionReason` fields.

2. **When a master approves a submission, should the original reviewer be credited in `PageEdit.editedById`?**  
   → **Recommendation**: Yes, preserve `editedById = submission.submittedById` so attribution is maintained. Add `PageEdit.approvedFromSubmissionId` if you need to trace back.

3. **Should multiple submissions from the SAME reviewer be allowed?**  
   → **Recommendation**: Yes, but only one `PENDING` per reviewer per page. If they submit again, auto-unsubmit the previous one or reject it.

4. **Should the `translatedHtml` be updated immediately on approval?**  
   → **Recommendation**: Yes. On approval, apply all submission items to the base `originalHtml` (or current `translatedHtml`?) to produce the new canonical `translatedHtml`. The existing frontend `compileHtml` logic can be ported to the backend.

5. **Should the AI Chat panel be replaced by the Submissions panel, or should they coexist?**  
   → **Recommendation**: Coexist. Add a tab switcher in the right panel: "AI Chat" | "Submissions" | "Segment Reviews". Or show Submissions panel below AI Chat when relevant.

6. **What happens to `PageEdit` working records after a reviewer submits?**  
   → **Recommendation**: Delete them (they are now frozen in the submission). If the reviewer un-submits, optionally restore them.

---

*End of analysis. Ready to implement.*
