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

Output a strict JSON array containing the translated sentences. Do not output anything else.
You MUST preserve any markdown formatting tags (e.g., `**`, `*`, `#`) present in the source text. Do not remove or alter the structure of these tags.

Format:
```json
[
  {"id": "sent-1", "translatedText": "..."}
]
```

### User Prompt
```
Translate the following {sourceLang} sentences into {targetLang}:

```json
{sentences_json_array}
```
```

If the genre's content includes a `## Examples` section, prepend those examples in the user turn before the sentences JSON.

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
Evaluate the {targetLang} translation of the provided {sourceLang} source text.
Apply the terminology and style rules from the style guide when assessing quality.

## Style Guide Reference
{genre.currentVersion.content (truncated to 2000 chars)}

## Glossary Reference
{top 50 glossary terms: source → target}

## Output Format (strict JSON)
{
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
```

### Parameters
| Param | Value |
|-------|-------|
| Temperature | 0.1 |
| Max tokens | 2048 |

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

Current translation ({targetLang}):
{sentence.translatedText}

Detected errors:
{errors formatted as list}

In PLAN mode: Explain errors, suggest corrections, answer questions.
In BUILD mode: Produce corrected translations for specific sentences when asked.
When in BUILD mode, format corrections as:
SENTENCE {n}: {corrected target-language text}
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

When the seed script creates the demo "Literary Translation" genre, use this content as v1.0:

```markdown
# Literary Translation Style Guide
English → Tamil (illustrative example — adjust for your language pair)

## Purpose
This genre defines the rules for translating literary fiction from English into Tamil.
Adjust terminology, register, and examples for your specific domain.

## Core Rules
1. Preserve the author's voice, sentence rhythm, and narrative register.
2. Use formal (வட்டார வழக்கு / முறைசார்ந்த மொழி) or informal register as established by the source text.
3. Do not domesticate cultural references unless comprehension fails.
4. Maintain paragraph and chapter structure exactly.
5. Preserve formatting like italics and punctuation styles.

## Terminology
| English | Tamil | Notes |
|---------|-------|-------|
| protagonist | கதாநாயகன் | match context for female/male protagonism |
| narrator | கதைசொல்லி | preserve point of view |
| irony | முரண் | preserve narrative ambiguity |
| metaphor | உருவகம் | translate the literary image, not word-for-word |
| flashback | பின்னோக்குக் காட்சி | standard cinematic/literary term |

## Register
- Dialogue: match colloquial level of source (வட்டார வழக்கு)
- Narration: formal literary register (முறைசார்ந்த எழுத்து மொழி)
- Internal monologue: match intimacy level of source

## Common Pitfalls
- Avoid over-literal translation of idioms
- Do not add explanatory phrases not in the source
- Preserve sentence fragmentation where used for stylistic effect

## Examples
English: She left without a word, the door clicking shut behind her.
Tamil: அவள் ஒரு வார்த்தையும் பேசாமல் வெளியேறினாள், கதவு அவளுக்குப் பின்னால் லேசான சத்தத்துடன் மூடிக்கொண்டது.
```

---

## Translation Memory (RAG)

tAI includes a Retrieval-Augmented Generation (RAG) layer to learn from human corrections.

### 1. Indexing (On Approval)
When a human reviewer approves a page, the `MemoryService` generates a 768-dimensional vector embedding of the `originalText` for each sentence on that page. It stores the `(originalText, translatedText, embedding)` in the `TranslationMemory` table, scoped to the specific `genreId`, `sourceLang`, and `targetLang`.

### 2. Retrieval (At Translation Time)
When the `TRANSLATE_PAGE` job processes a new sentence, it:
1. Generates an embedding for the new sentence's `originalText`.
2. Performs a cosine similarity search (`pgvector`) against the `TranslationMemory` table (filtered by the same genre and language pair).
3. Retrieves up to 3 past approved sentences that have a similarity score ≥ 0.75.
4. Injects these retrieved pairs into the Translation Agent's system prompt in the `[TRANSLATION_MEMORY_BLOCK]`.

This allows the AI to learn implicitly from past human edits without requiring model fine-tuning.

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
  1. Download PDF from MinIO
  2. Split PDF into page images (`pdf2image` or `poppler`)
  3. Upload images to MinIO
  4. Create Page records
  5. Enqueue one EXTRACT_PAGE job per page image
  6. Set project.status = PROCESSING

EXTRACT_PAGE job (parallel per page):
  1. Download page image from MinIO
  2. OCR & Vision-aware extraction (e.g., LlamaParse/Marker) → Markdown string
  3. Image Extraction: Crop illustrations/diagrams, upload to MinIO, and embed `![image](minio_url)` in Markdown
  4. SegmentationService.detectChapters() → create Chapter records
  5. SegmentationService.extractSentences() →
     a. Split Markdown text into Sentence records
     b. Save markdown skeleton to `page.sourceMarkdown` with `{{SENTENCE_X}}` placeholders
  6. Set page.status = EXTRACTED
  7. Enqueue TRANSLATE_PAGE job for this page

TRANSLATE_PAGE job (per page):
  1. Load project.sourceLang, project.targetLang, genre content, top 50 glossary terms
  2. Fetch all Sentence records for this page
  3. Build translation prompt (system + genre cache block + glossary cache block)
  4. Call TranslationAgent.translate(page_sentences) with the array of sentences
  5. Parse JSON array response and save `translatedText` + `confidence` to each Sentence
  6. Set page.status = TRANSLATED
  7. Enqueue REVIEW_PAGE job

REVIEW_PAGE job (per page):
  1. Load project.sourceLang, project.targetLang, genre content, glossary
  2. For each sentence in page:
     a. Build review prompt
     b. Call ReviewAgent.review(sentence) → structured JSON
     c. Create Error records from errors array
     d. Set sentence.status = REVIEWED
  3. Set page.status = HUMAN_REVIEW
  4. Set page.lastAiRunAt = now()
  5. Determine Priority based on highest error severity found (CRITICAL > HIGH > MEDIUM > LOW).
  6. Assign reviewer: round-robin among active REVIEWER users ordered by fewest currently assigned HUMAN_REVIEW pages; set page.assignedReviewerId + page.assignedAt
  7. If all pages in the project are now HUMAN_REVIEW or APPROVED: set project.status = REVIEW
  8. If all pages in the project are APPROVED: set project.status = COMPLETED
```
