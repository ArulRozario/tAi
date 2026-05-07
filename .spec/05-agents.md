# tAI — Agents & Prompts

## Overview

Three LLM-backed agents, all using the `LLMProvider` interface:

| Agent | Default Model | Purpose |
|-------|--------------|---------| 
| Translation | Ollama / qwen2.5:7b | Translate sentences using genre rules + glossary + RAG memory |
| Review | Ollama / phi4:mini | Detect errors with structured output |
| Chat | Configurable | Context-aware assistant (Plan + Build modes) |
| Embedding | Ollama / nomic-embed-text | Generate 768-dim vectors for TranslationMemory indexing and retrieval |

Temperature and params are defaults; overridden by active `ModelConfig`.

---

## Translation Agent

### System Prompt

```
You are an expert professional translator.
Translate the provided {sourceLang} text into {targetLang}.

## Style Guide
Follow the rules, terminology, and tone defined in the style guide below.
When in doubt, prefer the terms and phrasing specified in the style guide over general usage.

[GENRE_CONTENT_CACHE_BLOCK]
{genre.currentVersion.content}
[/GENRE_CONTENT_CACHE_BLOCK]

[GLOSSARY_CACHE_BLOCK]
{top 50 glossary terms for this genre formatted as: source → target}
[/GLOSSARY_CACHE_BLOCK]

[TRANSLATION_MEMORY_BLOCK]
## Past Approved Translations (use as reference)
These are human-verified translations of similar source text in this genre.
Use them to maintain consistency with previously approved style and terminology.
Do NOT copy them verbatim — apply them only where the source text is genuinely similar.

{top-3 TranslationMemory results formatted as:
1. Source: "..."
   Approved translation: "..."
}
[/TRANSLATION_MEMORY_BLOCK]

The user message will include a [DOCUMENT_CONTEXT] block for each source page in the batch.
Use it to understand each sentence's structural role (heading, bullet, paragraph, caption) and
to maintain coherence and terminology consistency across all pages in the batch.
Translate only the sentences listed in the JSON array — do not translate the context block itself.

Output a strict JSON array. Do not output anything else.

Format:
```json
[
  {"id": "sent-1", "translatedText": "..."}
]
```

### User Prompt
```
[DOCUMENT_CONTEXT]
{page.sourceMarkdown with each {{SENTENCE_X}} placeholder replaced by sentence.originalText}
[/DOCUMENT_CONTEXT]

Translate the following {sourceLang} sentences into {targetLang}.
Use the document context above to inform register, structural role, and terminology consistency:

```json
[{"id": "sent-1", "text": "..."}, ...]
```
```

If the genre's content includes a `## Examples` section, prepend those examples before the [DOCUMENT_CONTEXT] block.

### Parameters
| Param | Value |
|-------|-------|
| Temperature | 0.3 |
| Top P | 0.9 |
| Max tokens | 4096 |

---

## Review Agent

### System Prompt

```
You are a professional translation quality reviewer.
Evaluate the {targetLang} translations of the provided {sourceLang} source sentences.
Apply the terminology and style rules from the style guide when assessing quality.

## Style Guide Reference
{genre.currentVersion.content (truncated to 2000 chars)}

## Glossary Reference
{top 50 glossary terms: source → target}

## Output Format (strict JSON array — one entry per input sentence)
[
  {
    "sentenceId": "<id from input>",
    "errors": [
      {
        "severity": "CRITICAL|HIGH|MEDIUM|LOW",
        "category": "TERMINOLOGY|ACCURACY|FLUENCY|STYLE|GRAMMAR",
        "location": "<text snippet where error occurs>",
        "currentText": "<what was translated>",
        "suggestedText": "<what it should be>",
        "issueDescription": "<why it is wrong>",
        "reference": "<glossary term or style guide rule if applicable>",
        "aiNote": "<model's explanation of why this error occurred>"
      }
    ]
  }
]
Output an empty errors array for sentences with no errors. Do not omit any sentence from the output.
```

### User Prompt
```
Review the following {sourceLang} → {targetLang} sentence translations:

```json
[
  {"id": "sent-1", "source": "...", "translation": "..."},
  ...
]
```
```

### Parameters
| Param | Value |
|-------|-------|
| Temperature | 0.1 |
| Max tokens | 4096 |

---

## Chat Assistant

### Contexts and Modes

| Context | Entity | Plan Mode | Build Mode |
|---------|--------|-----------|-----------| 
| GENRE | Genre ID | Advises on genre content; explains decisions | Rewrites sections of genre markdown |
| REVIEW | Page ID | Explains errors; suggests fixes; looks up terms | Applies error fixes and rewrites sentences |
| GLOSSARY | Genre ID | Answers terminology questions | Adds/updates glossary terms |
| GENERAL | — | General translation Q&A | N/A |

### System Prompt (varies by context)

**GENRE context:**
```
You are an expert translation consultant helping refine a genre definition document.
The genre defines the style, terminology, and tone for translating {sourceLang} documents into {targetLang}.

Current genre: {genre.name}
Current content:
---
{genre.currentVersion.content}
---

In PLAN mode: Analyse, suggest, and explain — but do not change the document directly.
In BUILD mode: Produce a revised version of the document incorporating your changes.
When in BUILD mode, wrap your revised content in [REVISED_CONTENT]...[/REVISED_CONTENT] tags.
Keep changes minimal and targeted. Explain what you changed and why.
```

**REVIEW context:**
```
You are assisting a human reviewer analysing a translation of page {page.pageNumber} from "{project.name}".
Source language: {sourceLang}. Target language: {targetLang}.

Original ({sourceLang}):
{page.originalText truncated to 2000 chars}

Current translations ({targetLang}):
{all sentences on the page, numbered: "1. {sentence.translatedText}\n2. ..."}

Detected errors:
{all OPEN errors on the page, formatted as: "Sentence {n} [{severity}] {category}: {issueDescription} — current: '{currentText}', suggested: '{suggestedText}'"}

In PLAN mode: Explain errors, suggest corrections, answer questions.
In BUILD mode: Produce corrected translations for specific sentences when asked.
When in BUILD mode, format corrections as:
SENTENCE {n}: {corrected target-language text}
```

**GLOSSARY context:**
```
You are a terminology assistant for the "{genre.name}" translation genre.
Source language: {sourceLang}. Target language: {targetLang}.

Current glossary ({termCount} terms):
{top 50 glossary terms formatted as: "{sourceTerm} → {targetTerm}" with context appended if present}

In PLAN mode: Answer terminology questions, explain term choices, identify gaps or inconsistencies.
  Suggest missing terms but do not create them — the user must confirm via the UI.
In BUILD mode: When asked to add or update terms, respond with a structured list only:
  ADD: {sourceTerm} → {targetTerm} [context: {context}]
  UPDATE: {sourceTerm} → {newTargetTerm} [context: {context}]
  The frontend will parse this list and call POST /glossary or PUT /glossary/:id for each entry.
```

### Quick Prompts by Context/Mode

**GENRE + PLAN:**
- "What terminology gaps exist in this genre?"
- "Are there any style inconsistencies?"
- "What examples would strengthen this guide?"
- "Review the tone consistency of section X"

**GENRE + BUILD:**
- "Add the top 10 missing domain terms"
- "Rewrite the style section to be more specific"
- "Add example sentences for the key terms"

**REVIEW + PLAN:**
- "Explain the terminology errors on this page"
- "What is the correct term for X per the style guide?"
- "Is this error critical or stylistic?"

**REVIEW + BUILD:**
- "Rewrite sentence 3 to be more poetic"
- "Apply the suggested corrections"

**GLOSSARY + PLAN:**
- "What terms are missing from this glossary?"
- "Are there any inconsistent translations?"
- "What is the correct term for X in this genre?"
- "Which terms conflict with each other?"

**GLOSSARY + BUILD:**
- "Add the top 10 missing theological terms"
- "Standardise all verb forms to match the noun entries"
- "Add context notes to ambiguous terms"

### Sliding Window
Keep the last 20 messages in context (sliding window). On session creation, inject the full system prompt. Older messages are truncated from the start.

### SSE Stream Format
```
data: {"chunk": "Hello"}
data: {"chunk": " world"}
data: [DONE]
```

For BUILD mode with genre changes:
```
data: {"chunk": "I've updated the terminology section..."}
...
data: {"done": true, "revisedContent": "# Translation Guidelines\n..."}
```

---

## Default Genre Template

When the seed script creates the "Tamil Bible (Parisutha Vedagamam)" genre, use this content as v1.0:

```markdown
# Tamil Bible (Parisutha Vedagamam) Translation Style Guide
English → Tamil (Parisutha Vedagamam Protestant Tamil Bible style)

## Purpose
This genre defines the rules for translating English Protestant Christian texts into Tamil following
the Parisutha Vedagamam (பரிசுத்த வேதாகமம்) tradition — the authoritative Tamil Protestant Bible
used by Protestant churches. All translations must conform to the register, terminology, and
theological precision of the Parisutha Vedagamam text.

## Core Rules
1. Use ONLY Parisutha Vedagamam terminology as defined in the Terminology section below.
2. Maintain formal, dignified Old Tamil literary register (செந்தமிழ் நடை) throughout.
3. Preserve verse and paragraph structure exactly — do not merge or split.
4. Keep proper nouns (place names, people names) in their established Parisutha Vedagamam transliteration.
5. Preserve the original meaning without adding interpretation, commentary, or paraphrase.
6. Translate idioms and figures of speech into equivalent Tamil literary forms, not literally.
7. Reflect the grammatical weight of Hebrew/Greek source structures where the English preserves them.

## Terminology — Non-Negotiable Terms

These terms are fixed. Any deviation is a CRITICAL error.

| English | Correct Tamil | Incorrect (never use) |
|---------|--------------|----------------------|
| God | தேவன் | கடவுள், இறைவன் |
| Lord | கர்த்தர் | ஆண்டவர் (Catholic/Thiruviviliam term), இறைவர் |
| Jesus | இயேசு | ஏசு |
| Christ | கிறிஸ்து | — |
| Holy Spirit | பரிசுத்த ஆவி | தூய ஆவி (Catholic term) |
| Father (God) | பிதா | தந்தை (for God) |
| Faith | விசுவாசம் | நம்பிக்கை (when meaning theological faith) |
| Believe | விசுவாசி | நம்பு (in theological context) |
| Grace | கிருபை | அருள் (in theological context) |
| Salvation | இரட்சிப்பு | மீட்பு (Catholic/Thiruviviliam term), விடுதலை |
| Gospel | சுவிசேஷம் | நற்செய்தி (in theological context) |
| Scripture | வேதவசனம் | திருவசனம் (Catholic term) |
| Bible | பரிசுத்த வேதாகமம் | திருவிவிலியம் (Catholic Bible) |
| Word (of God) | வாக்கு | மந்திரம், சொல் |
| Church (assembly) | சபை | கூட்டம், திருச்சபை (Catholic term) |
| Church (building) | தேவாலயம் | — |
| Prayer | ஜெபம் | வேண்டுதல் (for personal prayer) |
| Righteousness | நீதி | — |
| Sin | பாவம் | தவறு (in theological context) |
| Repentance | மனந்திரும்புதல் | மனமாற்றம் |
| Covenant | உடன்படிக்கை | — |
| Resurrection | உயிர்த்தெழுதல் | — |
| Baptism | ஞானஸ்நானம் | திருமுழுக்கு (Catholic term) |
| Love (agape) | அன்பு | நேசம், நேசி |
| Peace | சமாதானம் | அமைதி (in theological context) |
| Eternal life | நித்திய ஜீவன் | — |
| Heaven | பரலோகம் | வான், சொர்க்கம் |
| Kingdom | ராஜ்யம் | அரசாட்சி (acceptable), நாடு |
| Lamb (of God) | ஆட்டுக்குட்டி | — |
| Cross | சிலுவை | — |
| Blood | இரத்தம் | குருதி (in theological context) |
| Blessing | ஆசீர்வாதம் | வாழ்த்து (in theological context) |
| Prophet | தீர்க்கதரிசி | — |
| Apostle | அப்போஸ்தலன் | — |
| Disciple | சீஷன் | — |

## Register
- All prose: formal Old Tamil literary register (செந்தமிழ் நடை)
- Dialogue (speech of characters): maintain the formality level appropriate to the speaker's role
- Narration: elevated, reverent register throughout
- Doxologies and poetry (Psalms, Revelation): heightened poetic form; preserve parallelism
- Do not use spoken/colloquial Tamil (வட்டார வழக்கு) under any circumstances

## Sentence Structure
- Mirror the syntactic weight of the English source where Tamil grammar permits
- Preserve emphatic constructions (e.g., "truly, truly I say to you" → "மெய்யாகவே மெய்யாகவே")
- Do not simplify complex subordinate clauses for readability — preserve theological precision

## Proper Nouns
Use the established Parisutha Vedagamam transliterations:
- Abraham → ஆபிரகாம், Moses → மோசே, David → தாவீது, Jerusalem → எருசலேம்
- Israel → இஸ்ரவேல், Egypt → எகிப்து, Jordan → யோர்தான்

## Common Pitfalls
- Using கடவுள் instead of தேவன் — CRITICAL error
- Using ஆண்டவர் instead of கர்த்தர் — Catholic/Thiruviviliam term, not Protestant
- Using மீட்பு instead of இரட்சிப்பு for salvation — CRITICAL error
- Using திருவசனம் instead of வேதவசனம் — Catholic term
- Using நம்பிக்கை for theological faith — use விசுவாசம்
- Using modern Tamil equivalents for any term in the Terminology table
- Adding explanatory words not present in the source text
- Softening theological statements for readability

## Examples

English: In the beginning God created the heavens and the earth.
Tamil: ஆதியிலே தேவன் வானத்தையும் பூமியையும் சிருஷ்டித்தார்.

English: For God so loved the world that he gave his one and only Son.
Tamil: தேவன், தம்முடைய ஒரேபேறான குமாரனை விசுவாசிக்கிறவன் எவனோ அவன் கெட்டுப்போகாமல் நித்தியஜீவனை அடையும்படிக்கு, அவரை அளித்தார்; ஏனெனில் அவர் உலகத்தை இவ்வளவாய் அன்புகூர்ந்தார்.

English: The righteous will live by faith.
Tamil: நீதிமான் விசுவாசத்தினால் பிழைப்பான்.

English: Grace and peace to you from God our Father and the Lord Jesus Christ.
Tamil: நம்முடைய பிதாவாகிய தேவனாலும் கர்த்தராகிய இயேசுகிறிஸ்துவினாலும் உங்களுக்கு கிருபையும் சமாதானமும் உண்டாவதாக.
```

---

## Prompt Caching (Anthropic)

When using Anthropic Claude, apply `cache_control: {type: "ephemeral"}` breakpoints at:
1. End of static system prompt
2. End of genre content block
3. End of glossary block

This caches ~80% of each prompt, reducing cost and latency for repeated calls on the same genre.

---

## Agent Pipeline (Extraction → Translation → Review)

```
PROCESS_DOCUMENT job (runs once per file):
  Idempotency: check existing Page records for this project before creating.
  1. Set project.status = PROCESSING
  2. Stream-split PDF — for each page in order (do not wait for all pages before enqueueing):
     a. Extract page image (pdf2image / poppler)
     b. Upload page image to MinIO
     c. Create Page record (status: PENDING) — skip if record already exists for this pageNumber
     d. Enqueue EXTRACT_PAGE job (parentJobId: this job's id)
  Progress: update job.progress after each page image uploaded (0 → 100 across all pages)

EXTRACT_PAGE job (parallel per page):
  Idempotency: if page.status != PENDING, exit immediately (already extracted or beyond).
  1. Set page.status = EXTRACTING
  2. Download page image from MinIO
  3. OCR & Vision-aware extraction (LlamaParse/Marker) → Markdown string
  4. Image Extraction: crop illustrations/diagrams, upload to MinIO, embed `![image](/api/v1/files/public/<objectKey>)` in Markdown.
     Use the backend proxy path (`GET /files/public/:path`), NOT a direct MinIO URL — the browser cannot reach MinIO directly and MinIO URLs require credentials.
  5. SegmentationService.extractSentences() →
     a. Split page Markdown on structural boundaries (double newlines, headings, list items) → paragraphs
     b. For each paragraph: POST to NLP service (http://nlp:8001/segment) with paragraph text + sourceLang
     c. Collect returned sentences; create Sentence records in order
     d. Save markdown skeleton to page.sourceMarkdown with {{SENTENCE_X}} placeholders
  6. Set page.status = EXTRACTED
  7. Check: are all EXTRACT_PAGE sibling jobs for this project DONE?
     If yes: enqueue one DETECT_CHAPTERS job for the project

DETECT_CHAPTERS job (runs once per document, after all EXTRACT_PAGE jobs complete):
  Idempotency: if any Chapter records already exist for this project, delete them and all
  page.chapterId assignments before re-running (safe to re-run on retry — produces same result).
  1. Load all Pages for project in pageNumber order
  2. Cross-page sentence stitching (detects sentence fragments split across page boundaries):
     a. For each adjacent page pair (page N, page N+1):
        - If the last sentence of page N has no terminal punctuation (.!?:;) AND
          the first sentence of page N+1 starts with a lowercase letter or a conjunction/preposition:
          → Merge: append the first sentence of page N+1 to the last sentence of page N
            (update page N's last Sentence.originalText; delete page N+1's first Sentence record;
             renumber remaining sentences on page N+1; update page N+1's sourceMarkdown to remove
             the merged {{SENTENCE_X}} placeholder)
     b. Repeat pass until no fragments are detected (handles runs of 3+ consecutive fragments)
  3. SegmentationService.detectChapters() across all pages' sourceMarkdown in sequence
     → create Chapter records with correct start/end page spans; assign page.chapterId
  4. Token-budget batch planner:
     - budget = min(contextWindow × 0.75 − estimatedSystemPromptTokens, MAX_TRANSLATION_BATCH_TOKENS)
     - tokenEstimate(page) = sum of (sentence.originalText.length / 4) across all sentences on the page
     - Walk pages in order, accumulating token estimates; cut a new batch when adding the next page
       would exceed budget (a single page that alone exceeds budget becomes its own batch)
  5. For each batch: enqueue one TRANSLATE_BATCH job with payload = {projectId, pageIds: [...]}

TRANSLATE_BATCH job (1+ pages, grouped by token budget):
  Idempotency: skip any page in the batch where page.status is not EXTRACTED or REJECTED.
  (REJECTED pages are valid re-translation targets from the request-changes flow.)
  1. For each page in batch: set page.status = TRANSLATING
  2. Load project.sourceLang, project.targetLang, genre content, top 50 glossary terms
  3. Collect all Sentence records across all pages in the batch (ordered by pageNumber, sentenceNumber)
  4. TM Retrieval: for each sentence, generate embedding via EmbeddingService and query
     TranslationMemory (cosine similarity ≥ 0.75, top 3, scoped to genreId + sourceLang + targetLang)
  5. Build translation prompt (system + genre cache block + glossary cache block + TM block).
     User prompt includes [DOCUMENT_CONTEXT] for each page in the batch.
  6. Call TranslationAgent.translate(all_batch_sentences) — returns [{id, translatedText, confidence}]
  7. Parse JSON array response (Zod validation).
     On parse failure: split batch in half and retry each half independently (max 2 retries per half — 3 total attempts per half including the first).
  8. For each sentence: save sentence.translatedText, sentence.aiTranslatedText = translatedText, sentence.confidence
  9. For each page in batch: set page.status = TRANSLATED; enqueue REVIEW_PAGE job

REVIEW_PAGE job (per page):
  Idempotency: filter to only sentences where sentence.status != REVIEWED before calling agent.
  1. Set page.status = REVIEWING
  2. Load project.sourceLang, project.targetLang, genre content, top 50 glossary terms
  3. Fetch all unreviewed Sentence records for this page
  4. Call ReviewAgent.review(sentences_batch) with all (id, originalText, translatedText) pairs in one call
  5. Parse JSON array response; for each sentence entry:
     a. Create Error records from errors array
     b. Set sentence.status = REVIEWED
  6. Set page.status = HUMAN_REVIEW
  7. Set page.lastAiRunAt = now()
  8. Determine Priority: highest severity across all errors on this page (CRITICAL > HIGH > MEDIUM > LOW)
  9. Assign primary reviewer: round-robin among active REVIEWER users ordered by fewest current
     HUMAN_REVIEW assignments; create PageReviewer record (isPrimary=true); set page.assignedAt = now()
  10. Check project completion (via aggregate DB count — do not load all pages into memory):
      - If all pages are HUMAN_REVIEW or APPROVED: set project.status = REVIEW
      - If all pages are APPROVED: set project.status = COMPLETED

INDEX_MEMORY job (per page, enqueued on page approval):
  1. Fetch all Sentence records for this page
  2. For each sentence:
     a. Generate 768-dim embedding of originalText via EmbeddingService (nomic-embed-text)
     b. Upsert TranslationMemory (genreId, sourceLang, targetLang, originalText, translatedText, embedding)
  — Runs async so approval response is not blocked by embedding calls
```
