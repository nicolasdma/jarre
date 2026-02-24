# Generic "PDF to Learning Course" Product Plan

**Date:** 2026-02-10
**Status:** Research & Architecture Phase

## Vision

Any user uploads a PDF. The system automatically produces a complete learning experience:
- **ACTIVATE**: Advance organizer / summary
- **LEARN**: Divided by concepts, each with subsections and inline MC/TF quizzes
- **EVALUATE**: AI-evaluated post-tests per section
- All translated to the user's language

**Pricing**: Credits system. ~1 credit per page. User uploads PDF, sees quote, pays, processing begins.

---

# Perspective 1: Systems Architect

## 1.1 Current Pipeline (Manual)

The existing data flow is entirely offline and hardcoded to DDIA:

```
PDF file (local)
  → extract-chapter.py (pymupdf4llm, hardcoded CHAPTERS dict with page ranges)
  → scripts/output/chapter-NN-sections.json
  → translate-chapter.py (DeepSeek paragraph-by-paragraph, glossary, anti-summarization)
  → scripts/output/chapter-NN-translated.json
  → seed-sections.ts (validates concept_ids, upserts to resource_sections)
  → seed-inline-quizzes.ts (hardcoded quiz definitions)
  → seed-question-bank.ts (hardcoded questions per concept)
```

Key observations:
- `extract-chapter.py` has a `CHAPTERS` dict with 8 DDIA chapters hardcoded (page ranges, heading patterns, concept IDs). This is the most manual part.
- `translate-chapter.py` splits into paragraphs with 500-char sliding context. The 1s rate limit means a 300-page book (~2000 paragraphs) takes ~33 minutes minimum.
- `seed-sections.ts` validates concept_ids against the existing `concepts` table. For generic, concepts must be auto-created.
- `seed-inline-quizzes.ts` has 22 handcrafted quizzes. Must be LLM-generated.

## 1.2 Proposed Pipeline Architecture

Decomposed into isolated, resumable stages with intermediate persistence:

```
Stage 1: UPLOAD + VALIDATE
  Input:  PDF file (user upload)
  Output: processing_jobs row + PDF in object storage
  Where:  Next.js API route + Supabase Storage

Stage 2: EXTRACT
  Input:  PDF from storage
  Output: Raw markdown text + extracted figures
  Where:  Background worker (Python microservice, pymupdf4llm)
  Store:  pipeline_artifacts table (type='extraction')

Stage 3: SEGMENT
  Input:  Raw markdown text
  Output: Concept-level sections with titles and sort order
  Where:  Background worker (LLM call to identify concepts + boundaries)
  Store:  pipeline_artifacts table (type='segmentation')

Stage 4: TRANSLATE (optional, if target != source language)
  Input:  Sections with content_original
  Output: Sections with content_markdown (translated)
  Where:  Background worker (LLM paragraph-by-paragraph)
  Store:  pipeline_artifacts table (type='translation')

Stage 5: GENERATE QUIZZES
  Input:  Translated sections
  Output: MC/TF quiz definitions per section
  Where:  Background worker (LLM per section)
  Store:  pipeline_artifacts table (type='quizzes')

Stage 6: GENERATE QUESTIONS
  Input:  Translated sections
  Output: Open-ended questions for post-tests
  Where:  Background worker (LLM per concept)
  Store:  pipeline_artifacts table (type='questions')

Stage 7: GENERATE ACTIVATE CONTENT
  Input:  All sections
  Output: Advance organizer / summary
  Where:  Background worker (LLM call)

Stage 8: ASSEMBLE
  Input:  All artifacts from stages 2-7
  Output: Final records in resource_sections, inline_quizzes, question_bank
  Where:  Background worker (TypeScript, writes to Supabase)
```

## 1.3 Job Queue: Inngest

Inngest runs as a serverless function handler alongside Next.js on Vercel. Native step-based workflows where each pipeline stage becomes an `inngest.createFunction()` with `step.run()` calls. Built-in retries, concurrency controls, and observability.

```typescript
// Pseudocode
inngest.createFunction(
  { id: 'process-pdf', concurrency: { limit: 5 } },
  { event: 'pdf/uploaded' },
  async ({ event, step }) => {
    const extraction = await step.run('extract', () => extractPdf(event.data.jobId));
    const segments   = await step.run('segment', () => segmentContent(extraction));
    const translated = await step.run('translate', () => translateSections(segments));
    const quizzes    = await step.run('gen-quizzes', () => generateQuizzes(translated));
    const questions  = await step.run('gen-questions', () => generateQuestions(translated));
    const activate   = await step.run('gen-activate', () => generateActivateContent(translated));
    await step.run('assemble', () => assembleIntoDb(translated, quizzes, questions, activate));
  }
);
```

Each `step.run()` is individually retryable. If translation fails halfway, it resumes from the last successful step.

## 1.4 The Python Problem

PDF extraction requires Python (`pymupdf4llm`). Options:

1. **Separate Python microservice on Fly.io** (~$5/month) — stateless, takes PDF URL, returns JSON
2. **Vercel Python runtime** — pymupdf has native deps that may not work
3. **Port to TypeScript** — `pdf-lib` + `pdfjs-dist` (both already in package.json) for extraction

**Recommendation:** Start with TypeScript (`pdfjs-dist`) for MVP. Add Python microservice for v1.1 when handling complex layouts (multi-column, Marker).

## 1.5 Intermediate Artifact Storage

**Large artifacts (PDFs, figures):** Supabase Storage buckets
- `pdfs/` — uploaded PDFs (private, per-user)
- `figures/{job_id}/` — extracted figure images

**Structured artifacts (JSON):** `pipeline_artifacts` table
```sql
CREATE TABLE pipeline_artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES processing_jobs(id) ON DELETE CASCADE,
  stage TEXT NOT NULL,
  payload JSONB NOT NULL,
  token_count INTEGER,
  cost_estimate NUMERIC(8,4),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_id, stage)
);
```

## 1.6 Schema Evolution

### New Tables

```sql
CREATE TABLE processing_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resource_id TEXT REFERENCES resources(id),
  status TEXT NOT NULL DEFAULT 'queued',
  source_type TEXT NOT NULL DEFAULT 'pdf',
  source_url TEXT,
  source_language TEXT NOT NULL DEFAULT 'en',
  target_language TEXT NOT NULL DEFAULT 'es',
  metadata JSONB DEFAULT '{}',
  total_tokens INTEGER DEFAULT 0,
  total_cost NUMERIC(8,4) DEFAULT 0,
  credits_charged INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE user_credits (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 0,
  total_purchased INTEGER NOT NULL DEFAULT 0,
  total_consumed INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL, -- 'purchase', 'signup_bonus', 'processing', 'refund'
  reference_id TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Modifications to Existing Tables

```sql
ALTER TABLE resources ADD COLUMN user_id UUID REFERENCES auth.users(id);
ALTER TABLE resources ADD COLUMN is_public BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE resources ADD COLUMN source_job_id UUID REFERENCES processing_jobs(id);

ALTER TABLE concepts ADD COLUMN source_job_id UUID REFERENCES processing_jobs(id);
ALTER TABLE concepts ADD COLUMN is_system BOOLEAN NOT NULL DEFAULT TRUE;
```

### RLS Impact

New policy pattern for content tables:
```sql
USING (is_public = TRUE OR user_id = auth.uid())
```

## 1.7 Extensibility Points

### Extractor Interface
```typescript
interface Extractor {
  name: string;
  supports(metadata: { mimeType: string; pageCount: number }): boolean;
  extract(pdfUrl: string): Promise<ExtractionResult>;
}
```
Implementations: PymupdfExtractor, MarkerExtractor, CloudOcrExtractor, NougatExtractor

### LLM Provider Interface
```typescript
interface LLMProvider {
  name: string;
  callChat(params: ChatParams): Promise<{ content: string; tokensUsed: number; cost: number }>;
}
```
Implementations: DeepSeekProvider, GeminiFlashProvider, ClaudeProvider

### Source Type Adapters
All existing ingesters (PDF, arXiv, YouTube) already produce the same JSON shape:
```json
{ "resource_id", "concept_id", "section_title", "sort_order", "content_original", "word_count" }
```
This is the natural adapter interface.

## 1.8 The Segmentation Challenge

This is the single hardest problem. Currently `extract-chapter.py` uses a hardcoded dictionary. For generic:

1. Send full extracted text (or ToC) to LLM
2. Ask it to identify 3-8 major concepts
3. For each concept, identify heading boundaries in source text
4. Merge subsections into parent concepts where appropriate

**Critical mitigation:** Allow users to review and adjust the auto-segmentation BEFORE the expensive translation stage runs. "We identified these concepts and sections. Adjust if needed. Then click 'Process'."

---

# Perspective 2: Product Engineer

## 2.1 MVP Definition

**In scope:**
- PDF upload (drag & drop) with page count detection
- Credit quote (1 credit per page, shown before processing)
- Async processing pipeline (extract, segment, translate, generate quizzes)
- Processing status page with progress updates
- Full ACTIVATE → LEARN flow with inline quizzes
- User dashboard showing processed PDFs
- Stripe/Lemon Squeezy payment for credits
- EN → ES translation only

**Deferred to v2:**
- Spaced repetition / SM-2 (requires per-PDF question bank)
- Post-test with LLM evaluation (requires auto-generated question bank)
- Figure extraction
- Multi-language translation beyond EN → ES
- Pre-questions (requires question bank)

## 2.2 Time & Cost for 30-Page Paper

| Stage | Time | Cost |
|-------|------|------|
| Upload + page count | < 2s | $0 |
| Extraction (pdfjs/pymupdf) | ~5s | $0 |
| Segmentation (LLM) | ~10s | ~$0.01 |
| Translation (10K words, ~35 paragraphs) | ~2-3 min | ~$0.15 |
| Quiz generation (5-8 sections, 3-4 quizzes each) | ~30s | ~$0.05 |
| Activate summary | ~10s | ~$0.02 |
| Seed to database | ~2s | $0 |
| **Total** | **~3-4 min** | **~$0.23** |

Fits within 5-minute target. 300-page book: 8-12 min, ~$0.70.

## 2.3 User Flow

```
1. Upload   → Drag PDF onto upload zone
2. Quote    → "47 pages detected. Cost: 47 credits (~$2.35)"
3. Confirm  → Credits deducted, processing starts
4. Status   → /processing/[jobId] with live progress bar
5. Ready    → "Your course is ready" notification + CTA
6. Learn    → /learn/[resourceId] with full ACTIVATE → LEARN → EVALUATE flow
```

### Processing Status Page
```
[==============================                    ] 60%
STAGE 3 OF 5: TRANSLATING
Translating section 5 of 12... "Consistency and Consensus"
Estimated time remaining: ~2 minutes
```

### Error States
| Error | User Sees | Recovery |
|-------|-----------|----------|
| Scanned PDF | "This PDF is image-only. We need text-based PDFs." | Refund credits |
| Extraction failure | "We couldn't read this PDF." | Refund, offer to report |
| No sections detected | Treat as single section with warning | Proceed |
| Translation timeout | "Taking longer than expected. We'll retry." | Auto-retry, Gemini fallback |
| PDF too large (>500 pages) | "This will take ~30 minutes. Continue?" | Warn, allow proceeding |

## 2.4 Reuse Analysis

### Reuse as-is (no changes needed)
| Component | Lines |
|-----------|-------|
| `learn-flow.tsx` — full ACTIVATE/LEARN/APPLY/EVALUATE UI | 446 |
| `section-content.tsx` — markdown rendering + quiz interleaving | 225 |
| `inline-quiz.tsx` — MC/TF with localStorage persistence | 258 |
| `markdown-splitter.ts` — split at bold headings | 49 |
| `learn-progress.ts` — progress persistence | 47 |
| `deepseek.ts` — LLM client with retry + Zod | 114 |
| `schemas.ts` — Zod validation schemas | 70 |
| DB schemas: resource_sections, inline_quizzes, learn_progress | — |
| Glossaries: distributed-systems (36 terms), ml-ai (74 terms) | — |

### Needs adaptation
| Component | What Changes |
|-----------|-------------|
| `ingest-arxiv.py` | Best starting point for generic extraction. Port `segment_sections()`, `clean_page_artifacts()` to TypeScript |
| `translate-chapter.py` | Port core logic to TypeScript: paragraph splitting, sliding context, ratio verification, glossary loading |
| `concept-section.tsx` | For MVP without question bank: skip pre-question and post-test (already handles null question gracefully) |
| `/learn/[resourceId]/page.tsx` | Remove hardcoded DDIA chapter imports. Use DB-only sections |

### Must build from scratch
| Component | Description |
|-----------|-------------|
| PDF upload API | `POST /api/upload` — store PDF, count pages, return quote |
| Processing queue | Inngest functions orchestrating the pipeline |
| Processing status API + UI | `GET /api/processing/[jobId]` + status page |
| Auto-quiz generation | LLM prompt + Zod schema for MC/TF from section content |
| Auto-segmentation | LLM-assisted section detection for arbitrary PDFs |
| Auto-activate generation | LLM prompt for advance organizer summary |
| Credits system | DB tables + API for balance, purchase, deduction |
| Payment integration | Lemon Squeezy checkout for credit packs |
| User dashboard | List of processed PDFs with status and learn links |

## 2.5 Iteration Plan

### Week 1: Foundation + Upload + Extraction
**Ships:** User can upload a PDF, see page count, view extracted raw sections.
- New migration: processing_jobs, credit_transactions, user_credits
- PDF upload page (`/upload`) with drag-and-drop
- `POST /api/upload` — Supabase Storage + job creation
- Port arxiv ingester's `segment_sections()` to TypeScript
- Processing status page (`/processing/[jobId]`) with polling
- Simple inline processing (no queue yet)

### Week 2: Translation + Quiz Generation + Learn Flow
**Ships:** Full e2e: upload → translated course with quizzes.
- Port `translate-chapter.py` core to TypeScript
- Auto-quiz generation prompt + Zod schema
- Auto-activate generation
- Wire into pipeline: extract → segment → translate → quizzes → activate → seed
- Adapt learn page for auto-generated content
- User dashboard with processed PDFs

### v1.1 (Weeks 3-4)
- Inngest background jobs (replace inline processing)
- Supabase Realtime for status (replace polling)
- 2-column paper support (Marker fallback)
- Domain auto-detection for glossary
- Error recovery + refunds
- Email notifications

### v2.0 (Month 2-3)
- Auto-generated question bank per PDF
- Post-test with LLM evaluation per section
- Spaced repetition (SM-2)
- Multi-language translation
- Figure extraction
- AI tutor

## 2.6 Developer Experience (Open-Source Self-Host)

```env
# Required
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SECRET_KEY=your_service_role_key
DEEPSEEK_API_KEY=your_deepseek_api_key

# Self-host overrides
DISABLE_PAYMENTS=true
DEFAULT_CREDITS=999999
```

Self-hosters: `git clone` → `cp .env.example .env.local` → fill keys → `npm install && npm run dev`. The `DISABLE_PAYMENTS=true` flag bypasses credits. They only pay for their own LLM API usage.

## 2.7 Credit Pricing

| Pages | Credits | Our Cost | User Pays |
|-------|---------|----------|-----------|
| 30 | 30 | ~$0.23 | $0.30 |
| 100 | 100 | ~$0.70 | $1.00 |
| 300 | 300 | ~$1.70 | $3.00 |

At $0.01/credit (100 credits for $1), margins are 60-70%.

**Free tier:** 50 credits on signup (one short paper for free).

**Credit packs:** 100 for $1, 500 for $4, 2000 for $12.

---

# Perspective 3: Failure Engineer

## 3.1 PDF Extraction Failures

### F1: Scanned PDFs (no text layer)
`pymupdf4llm` extracts from the text layer. A scanned PDF has none. `ingest-arxiv.py` has a minimal guard (word_count < 50), but `extract-chapter.py` has NO such guard.

**Impact:** Empty sections seeded to database.
**Mitigation:** Pre-flight check: if `page.get_text("text")` is empty for >80% of pages, return error. Route to OCR path for v1.1.

### F2: Multi-column layouts
`pymupdf4llm` processes pages linearly. Multi-column papers (IEEE, ACM) will have interleaved column text.

**Impact:** Garbled text. Quiz generation on garbled text produces nonsensical questions.
**Mitigation:** Detect column count via page element bounding boxes. If multi-column detected, use Marker as fallback extractor (v1.1).

### F3: Tables and mathematical equations
Tables convert poorly with complex merges. Math equations as fonts/images are lost entirely.

**Impact:** A math textbook loses its core content.
**Mitigation:** For MVP, warn users. For v1.1+, use Nougat (Meta) or Gemini Vision for equation extraction.

### F4: Non-Latin scripts
System designed for EN→ES. Length ratio verification (0.85-1.50) is calibrated for alphabetic languages. CJK word tokenization differs fundamentally.

**Mitigation:** Language detection on extracted text. Per-language ratio thresholds.

### F5: Encrypted PDFs
`fitz.open()` will crash on password-protected PDFs with no try/catch.

**Mitigation:** Wrap in try/except. Return clear error message. Low effort fix.

### F6: Very large PDFs (600+ pages)
600 pages = ~2000 paragraphs = ~33+ minutes of translation. Memory pressure from 2-5MB of raw text.

**Mitigation:** Process in chapters. Detect chapter boundaries first (fast, local). Show progress per chapter. Allow selecting which chapters to process.

## 3.2 LLM Pipeline Failures

### The Anti-Summarization Problem (CRITICAL)
Already documented: LLMs compress by default. The anti-summarization architecture (paragraph-by-paragraph, glossary, ratio checks) was built as response to "resumen burdo" failure.

**Residual risks:**
- 10% subtle compression per paragraph passes the 0.85 ratio check but loses 10% across the document
- 500-char sliding context window loses references from 3 paragraphs back
- `max_tokens=4000` could silently truncate long paragraphs

**Mitigation:** Sentence-level counting (not just word ratio). Compare paragraph count before/after. For lists, count items. Dynamic `max_tokens` based on input length.

### Quiz Generation with Wrong Answers
Currently ALL quizzes are hand-crafted. Auto-generation risks:
- Factually incorrect "correct" answers
- Ambiguous MC options (two defensibly correct)
- TF questions with nuance lost

**Mitigation:** Two-pass generation: (1) Generate quizzes, (2) Validate each with a separate LLM call against source text. Store confidence score. Flag low-confidence for review. Allow user reporting.

### Concept Segmentation on Unfamiliar Domains
Keyword-matching in `concept-segment.py` only works for DDIA. "Reliability engineering in civil structures" would falsely match the "reliability" concept.

**Mitigation:** Use the document's OWN structure (headings, ToC) as taxonomy. Never invent concepts the author hasn't named. LLM refines but doesn't replace the document's organization.

### Rate Limits Mid-Processing
`translate_chapter.py` has NO retry logic. If DeepSeek returns 429 at paragraph 200 of 400, the entire job fails. All progress lost.

**Mitigation:** Retry with exponential backoff (match the TypeScript pattern in `deepseek.ts`). Save progress after each paragraph. Resume from last successful paragraph.

## 3.3 Cost Estimation Failures

| Factor | Dense textbook | Image-heavy book | Scanned PDF |
|--------|---------------|-------------------|-------------|
| Words per page | ~500 | ~100 | ~300 (post-OCR) |
| Translation tokens/page | ~1700 | ~340 | ~1000 |
| Retry overhead | ~5% | ~2% | ~15% |

**Page count != content density.** A page of diagrams vs a page of dense text have wildly different processing costs.

**Mitigation:** Pre-flight analysis: extract text, count words per page, detect content type. Estimate from word count, not page count. Show: "This 47-page PDF has ~15,000 words. Estimated cost: 32 credits."

## 3.4 Runtime/Production Failures

### Partial Failures and Data Consistency
`seed-sections.ts` DELETES all existing sections before inserting new ones. If insertion fails after delete, user loses content.

**Mitigation:** Use transactions. Never delete old content until ALL new content is validated. Idempotent processing: only replace after full success.

### Credit Deduction Timing
- Before processing → fails → user angry
- After processing → user disputes → free content

**Mitigation:** Reserve credits before. Charge per-chapter as each completes. Refund unprocessed chapters on failure.

### Concurrent Users
Shared API key hits rate limits. Python processes compete for resources.

**Mitigation:** Job queue with concurrency limits. Per-user rate limiting. API key pooling.

## 3.5 Content Quality Failures

### Missing Domain Glossary
Only 2 glossaries exist (distributed-systems, ml-ai). A biology textbook has no glossary.

**Mitigation:** Auto-generate glossary from content via LLM: "List the 30 most important technical terms and their standard Spanish translations. Note which should NOT be translated." Cache per domain.

### Quiz Quality by Domain
- Medical content: wrong answers could be dangerous
- Math content: numerical answers require exact correctness
- Philosophy: multiple valid interpretations break MC format

**Mitigation:** Domain-aware quiz prompts. For exact-answer domains, prefer fill-in-the-blank. Include "Report this quiz" button. Disclaimer on auto-generated content.

## 3.6 Priority Mitigation Matrix

### P0: Must Have for MVP
| Failure | Mitigation | Effort |
|---------|------------|--------|
| Scanned PDFs | Pre-flight text extraction check | 2 hours |
| Encrypted PDFs | Try/catch + error message | 2 hours |
| API failures mid-processing | Retry + incremental save | 1-2 days |
| Partial failure data loss | Transactional insert | 1 day |
| No cost estimation | Pre-flight word count + estimate | 4 hours |
| Long processing times | Background jobs + progress tracking | 3-5 days |

### P1: Must Have for Product-Market Fit
| Failure | Mitigation | Effort |
|---------|------------|--------|
| LLM summarization | Sentence-level counting | 4 hours |
| Missing glossary | Auto-generate from content | 1 day |
| Wrong quiz answers | Two-pass generation + validation | 1-2 days |
| Bad segmentation | Use document structure + LLM refinement | 3-5 days |

### P2: Must Have for Scale
| Failure | Mitigation | Effort |
|---------|------------|--------|
| Multi-column PDFs | Marker fallback | 2-3 days |
| Math/equations | Nougat or Vision API | 1 week |
| Concurrent users | Job queue + rate limiting | 3-5 days |
| Credit deduction | Per-chapter charge + refund | 2 days |

---

# Synthesis: Critical Decisions

## Decision 1: TypeScript-first vs Python microservice
- **MVP:** Port extraction to TypeScript (`pdfjs-dist`, already in package.json). Simpler deployment.
- **v1.1:** Add Python microservice (Fly.io) for Marker/pymupdf4llm when handling complex layouts.

## Decision 2: Inline processing vs job queue
- **MVP (Week 1):** Long-running API route. Vercel Pro has 300s timeout. 30-page paper fits.
- **v1.1:** Inngest for step-based background jobs. Required for books >100 pages.

## Decision 3: Segmentation approach
- **Phase 1:** Use document's own headings as-is. No LLM segmentation.
- **Phase 2:** LLM refines heading-based segments (merge small sections, split huge ones).
- **Phase 3:** User review step before expensive translation.

## Decision 4: Credit model
- 1 credit = ~$0.01 of LLM cost
- Estimate from word count, not page count
- Reserve before, charge per-chapter, refund failures
- Free: 50 credits on signup

## Decision 5: What the open-source version includes
- Full pipeline code (extraction, translation, quiz generation)
- Full UI (learn flow, dashboard, processing status)
- `DISABLE_PAYMENTS=true` flag for self-hosters
- Self-hosters bring their own LLM API key
- The hosted version's value: we provide the API key + zero setup

---

# Key Files Inventory

## Reuse as-is
- `src/components/learn-flow.tsx` — full 4-step UI
- `src/components/section-content.tsx` — markdown + quiz rendering
- `src/components/inline-quiz.tsx` — MC/TF with persistence
- `src/components/concept-section.tsx` — per-section learn flow
- `src/lib/markdown-splitter.ts` — heading-based splitting
- `src/lib/learn-progress.ts` — progress persistence
- `src/lib/llm/deepseek.ts` — LLM client with retry
- `src/lib/llm/schemas.ts` — Zod validation
- `scripts/glossaries/*.json` — domain glossaries

## Port to TypeScript
- `scripts/translate-chapter.py` → `src/lib/pipeline/translate.ts`
  - `split_into_paragraphs()`, `translate_paragraph()`, `verify_length_ratio()`, glossary loading
- `scripts/ingest-arxiv.py` → `src/lib/pipeline/extract.ts`
  - `segment_sections()`, `clean_page_artifacts()`, heading detection

## Build from scratch
- `src/lib/pipeline/orchestrator.ts` — Inngest pipeline function
- `src/lib/pipeline/segment.ts` — LLM-driven concept detection
- `src/lib/pipeline/quiz-generator.ts` — auto MC/TF from section content
- `src/lib/pipeline/activate-generator.ts` — advance organizer summary
- `src/app/api/upload/route.ts` — PDF upload + quote
- `src/app/api/processing/[jobId]/route.ts` — status polling
- `src/app/upload/page.tsx` — upload UI
- `src/app/processing/[jobId]/page.tsx` — status UI
- `src/app/dashboard/page.tsx` — user's processed PDFs (adapt existing)
- Credit system (tables + API + UI)
- Payment integration (Lemon Squeezy)
