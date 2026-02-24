# Session 09 — PDF Pipeline + Concept-Level Micro-Tests Design
**Date:** 2026-02-08

## Vision

Transform Jarre from "hand-written explanations per chapter" to a scalable pipeline:

```
PDF (600 pages, English)
    |
    v
Extract structured text (Markdown with headings, code, formulas)
    |
    v
Detect chapter boundaries (TOC + heading regex)
    |
    v
Map chapters to Jarre resources (ddia-ch1, ddia-ch2, etc.)
    |
    v
Split chapters into concept-level sections
    |
    v
Translate sections to Spanish (glossary-aware, code-preserving)
    |
    v
Embed micro-tests between concept sections (from question_bank)
    |
    v
SM-2 spaced repetition schedules reviews of tested concepts
```

---

## Part 1: Legal Analysis

### Copyright Status of Personal Translation

| Dimension | Status |
|-----------|--------|
| Technically legal? | No. Translation = derivative work (17 U.S.C. 106(2)) |
| Fair use defense? | Weak. Factor 3 (entire work) strongly against. Post-Warhol (2023), non-transformative |
| Enforcement risk? | Extremely low. No distribution, no commercial use, no known precedent |
| AI vs human? | No legal difference |

**Practical conclusion:** Technically infringing, practically unenforced. Safest path: own a purchased copy, keep translation strictly local and private, never distribute.

**Sources:** 17 U.S.C. 101/106/107, Andy Warhol Foundation v. Goldsmith 598 U.S. 508 (2023), Stanford Fair Use Center, Harvard Berkman Klein Center.

---

## Part 2: PDF Processing Pipeline

### Step 1: PDF Extraction

**Recommended: Marker** (datalab-to/marker)
- Deep-learning PDF-to-Markdown, optimized for books
- Handles tables, code blocks, LaTeX formulas
- `--use_llm` mode for complex pages
- ~25 pages/sec on GPU

**Fallback: pymupdf4llm** for fast first pass (0.14 sec/page, no GPU).

### Step 2: Chapter Detection

**Strategy: Hybrid (TOC first, heading regex fallback)**
1. `doc.get_toc()` via PyMuPDF — returns `[level, title, page]` from PDF bookmarks
2. If no TOC: font-size heading detection (pymupdf4llm `IdentifyHeaders`)
3. Validate with regex: `"Chapter N"`, `"Part N"`, numbered headings

### Step 3: Concept Segmentation

**Strategy: Headings + LLM classification (2 phases)**

**Phase 1 — Structural (covers 60-80% of cases):**
- Split on Markdown `##`/`###` headings
- Map headings to concepts via fuzzy string matching
- DDIA example: heading "Reliability" → concept `reliability` (direct match)

**Phase 2 — LLM fine-grained (for ambiguous sections):**
- Number each paragraph
- Send section text + concept taxonomy + canonical definitions to LLM
- Request structured output (Zod validated):
  ```typescript
  z.object({
    conceptId: z.string(), // from predefined list
    startParagraph: z.number(),
    endParagraph: z.number(),
    confidence: z.number().min(0).max(1),
  })
  ```
- LLMs perform well with 3-8 predefined categories (exactly Jarre's range per chapter)

**Research backing:**
- Zero-shot LLM classification outperforms all unsupervised methods for small label sets (Survey: arxiv 2411.16613)
- LumberChunker (2024): 62.09 DCG@20 vs 54.72 for recursive chunking
- Context is the Key (Springer 2024): surrounding context dramatically improves boundary detection

**Cost:** ~$0.01-0.03/chapter with DeepSeek V3. Full book: <$0.50.

### Step 4: Translation

**Recommended model: DeepL API Pro** (best cost/quality for EN→ES)
- Near-human quality for technical content
- 2-3x fewer edits needed vs competitors

**Alternative: Claude Sonnet** (best raw quality, ~$6.33 for 600 pages)

**Strategy: Section-by-section with glossary injection**
- Unit of translation: one concept section (1,000-5,000 tokens)
- Glossary preamble with ~100-200 key terms
- Code blocks, LaTeX, acronyms marked as `<notranslate>`
- Sliding context: include previous section's last paragraph

**Cost estimates for 600 pages:**

| Service | Cost |
|---------|------|
| DeepL API Pro | ~$15 |
| GPT-4o | ~$4.40 |
| Claude Haiku 3.5 | ~$2.11 |
| DeepSeek V3 | ~$0.49 |

### Step 5: Quality Assurance

1. Code block preservation (exact string match)
2. Formula preservation (LaTeX unchanged)
3. Glossary compliance check
4. Length ratio validation (Spanish = English + 15-25%)
5. Back-translation spot check (5-10% sample)

---

## Part 3: Pedagogical Foundation for Micro-Tests

### Why test after each concept?

| Study | Finding | Source |
|-------|---------|--------|
| Szpunar, McDermott & Roediger (2008) | Tests between sections: **39% vs 19%** recall of NEW material (2x improvement) | JEP:LMC, Washington University |
| Szpunar, Khan & Schacter (2013) | Mind wandering: **19% with tests vs 41% without**. Final test: **90% vs 68%** | PNAS, Harvard |
| Roediger & Karpicke (2006) | STST pattern (study-test-study-test): **50% more retention** than SSSS, only **13% forgetting** vs dramatic | Psychological Science |
| Richland, Kornell & Kao (2009) | Even **failed** pre-test attempts enhance subsequent learning | JEP:Applied |
| Kornell, Hays & Bjork (2009) | Unsuccessful retrieval attempts enhance learning — across 6 experiments | JEP:LMC, Bjork Lab UCLA |
| Rawson & Dunlosky (2022) | "Successive relearning" (immediate test + spaced reviews): effect sizes **d = 1.52 to 4.19** | Current Directions in Psychological Science |

### Optimal test frequency

- **Every 5-10 minutes** of new material (Szpunar et al. 2013, PNAS Harvard)
- **NOT** every 1-2 minutes — too-frequent switching is counterproductive (Davis, Chan & Wilford 2017)
- **Per concept** is the right granularity for Jarre

### The optimal pattern (STST + Spaced Review)

```
Pre-question (1 hard question, user likely fails)     ← Pretesting effect
    |                                                     Richland et al. 2009
    v
Read concept section (translated PDF content)          ← Primed encoding
    |
    v
Post-test (1-2 questions from question_bank)           ← Forward testing effect
    |                                                     Szpunar et al. 2008
    v
Next concept → repeat cycle
    |
    v
SM-2 spaced review (days/weeks later)                 ← Successive relearning
                                                         Rawson & Dunlosky 2022
```

### Quantum Country precedent (Matuschak & Nielsen)

- 112 embedded SR questions in a quantum computing essay
- **83% retention at 2 months** (vs ~33% without)
- Only **<50% time overhead** for months of retention
- After 6 review sessions: ~54 days average retention per question
- 195 users achieved 1-month retention on 80%+ questions within 6 months

---

## Part 4: Architecture Changes

### Current State vs Vision

| Layer | Current | Vision |
|-------|---------|--------|
| Content source | 7 hand-written React components (~270 LOC each) | PDF → auto-extracted → translated |
| Content structure | Flat: resource → concepts | Three-level: resource → sections → concepts |
| Concept sections | Don't exist | `resource_sections` table with page ranges |
| PDF viewer | Doesn't exist | react-pdf or pdf.js component |
| Micro-tests | QuickQuiz (floating panel in library) | Inline between concept sections |
| Reading questions | Hardcoded in TS file | Migrated to question_bank |
| Scalability | Manual work per chapter | Any PDF-based resource instantly learnable |

### New Data Model

```sql
-- New table: breaks resources into concept-level sections
CREATE TABLE resource_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id TEXT REFERENCES resources(id) NOT NULL,
  concept_id TEXT REFERENCES concepts(id) NOT NULL,
  section_title TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  content_markdown TEXT NOT NULL,        -- translated section content
  content_original TEXT,                 -- original English content
  start_page INTEGER,                   -- PDF page reference
  end_page INTEGER,
  paragraph_range INTEGER[],            -- [start, end] paragraph indices
  segmentation_confidence REAL,         -- LLM confidence (0-1)
  manually_reviewed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(resource_id, concept_id, sort_order)
);

-- Enable RLS (content is public read)
ALTER TABLE resource_sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON resource_sections FOR SELECT USING (true);

-- Index for learn page queries
CREATE INDEX idx_resource_sections_resource
  ON resource_sections(resource_id, sort_order);
```

### Mastery Model Extension

```typescript
// New trigger type in mastery.ts
type MasteryTriggerType = 'evaluation' | 'project' | 'manual' | 'decay' | 'micro_test';

// Micro-test criteria for level 0 → 1 advancement:
// Score >= 60% on 3+ questions for a concept (same threshold as evaluation)
```

### Learn Page Restructure

**Current flow:**
```
Resumen (hand-written JSX) → Preguntas (static cards) → Playground
```

**New flow:**
```
Section 1: Pre-question → PDF content → Post-test (1-2 questions)
    ↓
Section 2: Pre-question → PDF content → Post-test
    ↓
... (repeat for each concept section)
    ↓
Playground → Full Evaluate (optional deep assessment)
```

### Component Architecture

```
LearnPage (server component)
  ├── SectionNavigator (shows concept sections as steps)
  └── ConceptSection (client component, per section)
       ├── PreQuestion (1 hard question, attempt before reading)
       ├── SectionContent (rendered markdown from resource_sections)
       ├── PostTest (1-2 questions from question_bank)
       │    ├── Uses /api/review/random?concepts={sectionConceptId}
       │    └── Submits to /api/review/submit (same pipeline)
       └── NextSectionButton (unlocks after PostTest attempted)
```

---

## Part 5: Implementation Plan

### Phase A: Pipeline Scripts (Python, one-time processing)

1. **`scripts/pdf-extract.py`** — Marker-based PDF → Markdown extraction
2. **`scripts/chapter-detect.py`** — TOC/heading-based chapter splitting
3. **`scripts/concept-segment.py`** — LLM-based concept section identification
4. **`scripts/translate-sections.py`** — Glossary-aware section translation
5. **`scripts/seed-sections.ts`** — Insert results into `resource_sections` table

### Phase B: Database (migration 008)

1. Create `resource_sections` table
2. Populate `start_page`/`end_page` on existing DDIA resources
3. Extend `mastery.ts` with `micro_test` trigger type

### Phase C: UI Components

1. `ConceptSection` component (pre-question + content + post-test)
2. `SectionNavigator` component (step progress)
3. Restructure `/learn/[resourceId]` page to use sections
4. Keep existing hand-written explanations as fallback for resources without sections

### Phase D: Integration

1. Wire micro-test results to mastery progression
2. Track section completion per user
3. Create review_schedule entries from micro-test interactions

---

## Cost Estimates (Full DDIA Book)

| Step | Cost |
|------|------|
| PDF extraction (Marker) | Free (local) |
| Concept segmentation (DeepSeek V3) | ~$0.50 |
| Translation (DeepL Pro) | ~$15 |
| Translation (DeepSeek V3, lower quality) | ~$0.50 |
| **Total (budget path)** | **~$1** |
| **Total (quality path)** | **~$16** |

---

## Key Research Sources

### Pedagogical (peer-reviewed)
- Roediger & Karpicke (2006) — Test-Enhanced Learning, *Psychological Science*
- Szpunar, McDermott & Roediger (2008) — Interpolated Testing, *JEP:LMC*
- Szpunar, Khan & Schacter (2013) — Mind Wandering + Testing, *PNAS* (Harvard)
- Richland, Kornell & Kao (2009) — Pretesting Effect, *JEP:Applied*
- Kornell, Hays & Bjork (2009) — Unsuccessful Retrieval, *JEP:LMC* (UCLA Bjork Lab)
- Rawson & Dunlosky (2022) — Successive Relearning, *Current Directions in Psychological Science*
- Davis, Chan & Wilford (2017) — Dark Side of Interpolated Testing, *JARMAC*
- Rothkopf (1966) — Mathemagenic Behaviors, *American Educational Research Journal*
- Hamaker (1986) — Adjunct Questions Meta-Analysis, *Review of Educational Research*
- Dunlosky et al. (2013) — 10 Learning Techniques, *Psychological Science in the Public Interest*
- Rowland (2014) — Testing Effect Meta-Analysis, *Psychological Bulletin*
- Cepeda et al. (2008) — Optimal Spacing, *Psychological Science*
- Karpicke & Roediger (2008) — Retrieval for Learning, *Science*

### Mnemonic Medium
- Matuschak & Nielsen (2019) — "How can we develop transformative tools for thought?" (numinous.productions)
- Matuschak (2024) — "How Might We Learn?" (andymatuschak.org)
- Quantum Country retention data — 83% at 2 months, <50% time overhead

### Technical Pipeline
- Marker — best technical PDF → Markdown (github.com/datalab-to/marker)
- Docling (IBM) — DocLayNet + TableFormer, 97.9% table accuracy
- LumberChunker (2024) — LLM iterative segmentation, 62.09 DCG@20
- LLM Text Segmentation Survey (arXiv 2411.16613, Nov 2024)
- HiPS (2024) — Hierarchical PDF Segmentation for Textbooks

### Legal
- 17 U.S.C. 101, 106, 107
- Andy Warhol Foundation v. Goldsmith, 598 U.S. 508 (2023)
- Stanford Fair Use Center, Harvard Berkman Klein Center

---

## Decisions to Make

1. **Translation model:** DeepL Pro ($15, best quality) vs DeepSeek V3 ($0.50, lower quality)?
2. **Scope:** Start with DDIA only, or design for any PDF from the start?
3. **Hand-written explanations:** Keep as supplementary "concept explainers" alongside PDF, or replace entirely?
4. **Pre-questions:** Implement from day 1, or add in a later iteration?
5. **Python scripts vs TypeScript:** Pipeline scripts in Python (better PDF tooling) or TypeScript (consistency with codebase)?

---

## Next Steps

- [ ] Decide on the 5 questions above
- [ ] Create migration 008 (resource_sections table)
- [ ] Build PDF extraction script (start with DDIA Ch1 as proof of concept)
- [ ] Build concept segmentation for Ch1 (map sections to reliability, scalability, maintainability)
- [ ] Build translation pipeline for Ch1 sections
- [ ] Build ConceptSection component with inline micro-tests
- [ ] Test full flow: read section → pre-question → content → post-test → next section
