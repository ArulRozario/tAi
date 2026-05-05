# tAI — API Contract

All endpoints are prefixed `/api/v1/`. Auth-required endpoints need `Authorization: Bearer <access_token>`.

Role abbreviations: R = REVIEWER+, M = MASTER+, A = ADMIN only.

---

## Auth

| Method | Path | Body | Response | Auth |
|--------|------|------|----------|------|
| POST | `/auth/login` | `{email, password, rememberMe?}` | `{accessToken, refreshToken, user}` | None |
| POST | `/auth/refresh` | `{refreshToken}` | `{accessToken, refreshToken}` | None |
| POST | `/auth/logout` | `{refreshToken}` | 204 | R |
| POST | `/auth/forgot-password` | `{email}` | 204 | None |
| POST | `/auth/reset-password` | `{token, newPassword}` | 204 | None |
| GET | `/auth/me` | — | `User` | R |

`rememberMe: true` extends refresh TTL from 7d to 30d.

---

## Users

| Method | Path | Body | Response | Auth |
|--------|------|------|----------|------|
| GET | `/users` | — | `User[]` | M |
| POST | `/users/invite` | `{name, email, role}` | `User` | A |
| PATCH | `/users/:id` | `{name?, role?, isActive?}` | `User` | A |
| POST | `/users/:id/reset-password` | — | 204 (sends email) | A |

---

## Genres

| Method | Path | Body | Response | Auth |
|--------|------|------|----------|------|
| GET | `/genres` | `?q=&limit=` | `GenreListItem[]` | R |
| POST | `/genres` | `{name, description?, icon?, color?}` | `Genre` | M |
| GET | `/genres/:id` | — | `Genre + currentVersion` | R |
| PATCH | `/genres/:id` | `{name?, description?, icon?, color?}` | `Genre` | M |
| DELETE | `/genres/:id` | — | 204 | A |
| GET | `/genres/:id/versions` | — | `GenreVersion[]` | R |
| POST | `/genres/:id/versions` | `{content, note?}` | `GenreVersion` | M |
| GET | `/genres/:id/versions/:versionId` | — | `GenreVersion` | R |
| POST | `/genres/:id/restore/:versionId` | — | `Genre` | M |
| GET | `/genres/:id/versions/:versionId/diff` | — | `{diff: string}` (unified diff) | R |
| POST | `/genres/:id/test` | `{sampleText, modelProvider?, modelName?}` | `{translation: string, tokensUsed: number}` | M |

`GenreListItem` includes: `id, name, description, icon, color, currentVersion, projectCount, lastUpdatedBy`.

---

## Projects

| Method | Path | Body | Response | Auth |
|--------|------|------|----------|------|
| GET | `/projects` | `?q=&status=&limit=&offset=` | `ProjectListItem[]` | R |
| POST | `/projects` | `{name, description?, genreId, sourceFileId?, sourceLang, targetLang}` | `Project` | R |
| GET | `/projects/:id` | — | `ProjectDetail` | R |
| PATCH | `/projects/:id` | `{name?, description?, status?}` | `Project` | M |
| DELETE | `/projects/:id` | — | 204 | A |
| POST | `/projects/:id/pause` | — | 204 (Pauses QUEUED extraction/translation jobs) | M |
| POST | `/projects/:id/resume` | — | 204 (Resumes PAUSED extraction/translation jobs) | M |
| POST | `/projects/:id/cancel-jobs` | — | 204 (Cancels all pending jobs without deleting project) | M |
| GET | `/projects/:id/stats` | — | `ProjectStats` | R |
| GET | `/projects/:id/team` | — | `{reviewers: User[], master: User}` | R |

`sourceLang` and `targetLang` are required strings (e.g. `"en"`, `"es"`, `"fr"`, `"ta"`). Use ISO 639-1 codes. The frontend presents a searchable dropdown of common languages.

`ProjectListItem` includes: `id, name, status, chapterCount, pageCount, completedCount, progress (0-100), owner, sourceLang, targetLang`.

`ProjectDetail` includes: full project + chapters array with page status summary grid.

After `POST /projects`, trigger `POST /jobs` with `{type: EXTRACT_PDF, projectId}` automatically (atomic: if job creation fails, rollback project).

---

## Chapters

| Method | Path | Body | Response | Auth |
|--------|------|------|----------|------|
| GET | `/chapters?projectId=` | — | `Chapter[]` | R |
| POST | `/chapters` | `{projectId, number, title?}` | `Chapter` | M |
| PATCH | `/chapters/:id` | `{number?, title?}` | `Chapter` | M |
| DELETE | `/chapters/:id` | — | 204 | A |

---

## Pages

| Method | Path | Body | Response | Auth |
|--------|------|------|----------|------|
| GET | `/pages?projectId=&chapterId=&status=&limit=&offset=` | — | `PageListItem[]` | R |
| GET | `/pages/:id` | — | `PageDetail` (with sentences and `sourceMarkdown`) | R |
| PATCH | `/pages/:id` | `{notes?, priority?, status?}` | `Page` | R |
| POST | `/pages/:id/approve` | `{notes?}` | `Page` | R |
| POST | `/pages/:id/request-changes` | `{note}` | `Page` | R |
| POST | `/pages/:id/reassign` | `{reviewerId}` | `Page` | M |
| POST | `/pages/:id/escalate` | `{reason}` | `Page` | R |
| POST | `/pages/:id/resolve-escalation` | `{resolution}` | `Page` | M |
| GET | `/pages/:id/next-in-queue` | — | `{pageId: string} \| null` | R |

`approve` is blocked if the page has any `OPEN` errors (unless caller is MASTER/ADMIN). It is also blocked if any sentence on the page has `isApproved = false`. Sets `page.status = APPROVED`.
`request-changes` requires a non-empty note. Sets `page.status = REJECTED`. Enqueues a new TRANSLATE_PAGE job (which will move status to TRANSLATING when it starts).
`escalate`: sets `page.status = ESCALATED`.
`resolve-escalation`: sets `page.status = HUMAN_REVIEW`. Re-assigns to the original reviewer if still active, otherwise round-robin.
`next-in-queue`: returns the next `HUMAN_REVIEW` page assigned to the caller, ordered by priority then assignedAt. Returns `null` if the queue is empty. Used by "Save & next" on the review screen.

---

## Sentences

| Method | Path | Body | Response | Auth |
|--------|------|------|----------|------|
| GET | `/sentences?pageId=` | — | `Sentence[]` with errors | R |
| PATCH | `/sentences/:id` | `{translatedText?, isApproved?}` | `Sentence` | R |
| POST | `/sentences/:id/apply-all-fixes` | — | `Sentence` (with all OPEN errors set to APPLIED) + `Error[]` | R |

---

## Errors

| Method | Path | Body | Response | Auth |
|--------|------|------|----------|------|
| GET | `/errors?sentenceId=&pageId=&status=` | — | `Error[]` | R |
| POST | `/errors/:id/apply` | — | `Error` + updated `Sentence` | R |
| POST | `/errors/:id/reject` | — | `Error` | R |
| POST | `/errors/:id/exception` | `{sourceTerm?, note?}` | `Error` + `GlossaryTerm?` | R |
| POST | `/errors/:id/escalate` | `{reason}` | `Error` | R |

`apply`: sets `error.status = APPLIED`; also patches `sentence.translatedText` by replacing `error.currentText` with `error.suggestedText` (string replacement). Returns both the updated Error and the updated Sentence text.

`apply-all-fixes`: applies all OPEN errors on the sentence in `createdAt` order. For each error: sets `error.status = APPLIED` and performs the same string replacement on `sentence.translatedText` as single `apply`. Returns the final Sentence state and all updated Error records.

`exception`: sets `error.status = EXCEPTION`. If `sourceTerm` is provided, creates a `GlossaryTerm` with `sourceTerm` (source language term), `targetTerm = error.currentText` (the non-standard target-language text being accepted), `notes = note`, linked to the project's genre. If `sourceTerm` is omitted, marks EXCEPTION only — no GlossaryTerm created.

---

## Glossary

| Method | Path | Body | Response | Auth |
|--------|------|------|----------|------|
| GET | `/glossary?genreId=&q=&limit=` | — | `GlossaryTerm[]` | R |
| POST | `/glossary` | `{genreId, sourceTerm, targetTerm, context?, notes?}` | `GlossaryTerm` | M |
| PUT | `/glossary/:id` | `{targetTerm?, context?, notes?}` | `GlossaryTerm` | M |
| DELETE | `/glossary/:id` | — | 204 | M |
| POST | `/glossary/bulk` | `{genreId, terms: [{sourceTerm, targetTerm, context?}]}` | `{created: number}` | A |
| GET | `/glossary/lookup` | `?term=&genreId=` | `GlossaryTerm[]` (fuzzy match, limit 5) | R |

---

## Files

| Method | Path | Body | Response | Auth |
|--------|------|------|----------|------|
| POST | `/files/upload` | multipart `file` | `{fileId, filename, size, url}` | R |
| GET | `/files/:fileId/url` | — | `{url, expiresAt}` (signed, 1h) | R |
| GET | `/files/public/:path`| — | Streams image directly (used for Markdown `![img]` tags) | Public |

---

## Jobs

| Method | Path | Body | Response | Auth |
|--------|------|------|----------|------|
| POST | `/jobs` | `{type, projectId?, pageId?, ...payload}` | `Job` | R |
| GET | `/jobs/:id` | — | `Job` | R |
| DELETE | `/jobs/:id` | — | 204 (cancels if QUEUED/RUNNING) | M |

Job types and required payload fields:

| Type | Required |
|------|---------|
| PROCESS_DOCUMENT | projectId, sourceFileId |
| EXTRACT_PAGE | pageId |
| TRANSLATE_PAGE | pageId |
| REVIEW_PAGE | pageId |
| EXPORT_PROJECT | projectId |

---

## Chat

| Method | Path | Body | Response | Auth |
|--------|------|------|----------|------|
| GET | `/chat/sessions` | `?context=&entityId=` | `ChatSession[]` | R |
| POST | `/chat/sessions` | `{context, entityId?, modelProvider?, modelName?}` | `ChatSession` | R |
| GET | `/chat/sessions/:id` | — | `ChatSession + messages` | R |
| DELETE | `/chat/sessions/:id` | — | 204 | R |
| POST | `/chat/sessions/:id/messages` | `{content, mode?}` | `ChatMessage` (non-streaming) | R |
| GET | `/chat/sessions/:id/stream` | `?content=&mode=` | SSE stream of text chunks | R |
| GET | `/chat/quick-prompts` | `?context=&mode=` | `string[]` (5-8 suggestions) | R |

SSE stream ends with a `[DONE]` event. Mode is `PLAN` or `BUILD`.

In **BUILD** mode for `GENRE` context: after sending, the response includes `{genreVersionDraft: string}` that the frontend offers to save as a new version.

---

## Models

| Method | Path | Body | Response | Auth |
|--------|------|------|----------|------|
| GET | `/models` | — | `ModelConfig[]` | R |
| GET | `/models/available` | `?provider=` | `string[]` (model names from Ollama or Anthropic) | A |
| PUT | `/models/:agentType` | `{provider, modelName, endpoint?, apiKey?}` | `ModelConfig` | A |
| POST | `/models/test` | `{provider, modelName, endpoint?, apiKey?}` | `{online: boolean, latencyMs: number, error?}` | A |
| GET | `/models/:agentType/logs` | `?limit=` | `{logs: string[]}` (last N prompts/responses, redacted) | A |

---

## Dashboard

| Method | Path | Response | Auth |
|--------|------|----------|------|
| GET | `/dashboard/stats` | `DashboardStats` | R |
| GET | `/dashboard/throughput` | `?metric=pages\|words&weeks=12` → `WeeklyBar[]` | R |
| GET | `/dashboard/my-queue` | `?limit=5` → `PageListItem[]` | R |
| GET | `/dashboard/recent-projects` | `?limit=4` → `ProjectListItem[]` | R |
| GET | `/dashboard/activity` | `?limit=10` → `ActivityLog[]` | R |

`DashboardStats`:
```ts
{
  activeProjects: number;
  activeProjectsDeltaMonth: number;
  pagesTranslated: number;
  pagesTranslatedDeltaWeek: number;
  pendingReview: number;
  pendingReviewDelta: number;
  userQueueCount: number;
  escalationCount: number;
  lastSyncAt: string; // ISO datetime — most recent Page.lastAiRunAt across all accessible projects
}
```

All dashboard endpoints share a 30s in-memory cache (per user for my-queue/stats, shared for activity/projects).

---

## Queue

| Method | Path | Response | Auth |
|--------|------|----------|------|
| GET | `/queue` | `?sort=priority\|waitTime&errorTypes=&reviewerId=me\|:id&limit=&offset=` → `PageListItem[]` | R |
| GET | `/queue/error-stats` | `ErrorStatsByCategory[]` | R |
| GET | `/escalations` | `Escalation[]` | M |

`PageListItem` (queue view) includes: `id, pageNumber, project, chapter, errorCount, priority, status, assignedAt, assignedReviewer`.

`ErrorStatsByCategory`: `{category, count, severity, exampleText, resolvedCount}`.

`Escalation`: `{pageId, project, chapter, errorCategory, escalatedBy, escalatedAt, summary}`.

---

## Export

| Method | Path | Body | Response | Auth |
|--------|------|------|----------|------|
| POST | `/export/project/:id` | `{format: pdf\|text\|html, scope: all\|approved}` | `{jobId}` | R |
| POST | `/export/page/:id/report` | — | `{jobId}` | R |

All export endpoints return a `jobId`. Poll `GET /jobs/:id` until `status === "DONE"`, then fetch `result.fileUrl` for a signed download link.

---

## Admin

| Method | Path | Body | Response | Auth |
|--------|------|------|----------|------|
| GET | `/admin/pages` | `?projectId=&chapterId=&status=&reviewerId=&limit=&offset=` | `PageListItem[]` | M |
| POST | `/admin/bulk-reassign` | `{pageIds: string[], reviewerId: string}` | `{updated: number}` | M |
| POST | `/admin/bulk-approve` | `{pageIds: string[]}` | `{updated: number, skipped: number}` | M |
| POST | `/admin/pages/:id/override` | `{status, reason}` | `Page` | M |

`bulk-approve` skips pages with OPEN errors and returns `skipped` count.

---

## Health

| Method | Path | Response |
|--------|------|----------|
| GET | `/health` | `{status, db, minio, ollama, anthropic}` |

---

## Error Response Shape

All errors return:
```json
{
  "statusCode": 422,
  "error": "Unprocessable Entity",
  "message": "Human-readable description",
  "code": "MACHINE_READABLE_CODE",
  "correlationId": "uuid"
}
```
