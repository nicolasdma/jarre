# Auto-Learn Pipeline: "Quiero aprender X"

> One command. Any subject. Full learning experience.

## Vision

The user says: **"Quiero aprender sobre consensus algorithms"**

Jarre automatically:
1. Identifies the best source material (book chapter, paper, lecture)
2. Acquires the content (legally)
3. Extracts clean text with structure
4. Translates faithfully to the user's language
5. Segments by concept
6. Generates micro-tests from the question bank (or creates new ones)
7. Seeds everything to the database
8. The learn page is ready: ACTIVATE → LEARN → APPLY → EVALUATE

**Cost per chapter: ~$0.20. Time: ~15-30 min. Zero manual work.**

---

## Legal Content Sources (by priority)

### Tier 1 — Primary (build first)

| Source | Type | How | Legal Basis |
|--------|------|-----|-------------|
| **User PDF** | Purchased books | Upload → extract with pymupdf4llm | Personal use of purchased material |
| **User EPUB** | DRM-free ebooks | Unzip → parse XHTML (structured!) | Personal use of purchased material |
| **arXiv** | Research papers | `arxiv` Python API → download PDF or LaTeX source | Open access, author-deposited |
| **YouTube** | Talks, lectures | `youtube-transcript-api` → SRT/JSON transcripts | Public captions, personal use |

### Tier 2 — Open Educational Resources

| Source | Type | How | License |
|--------|------|-----|---------|
| **MIT OCW** | Lecture notes, problem sets | Download ZIP → extract PDFs | CC-BY-NC-SA 4.0 |
| **OpenStax** | Textbooks | GitHub CNXML → Markdown | CC-BY 4.0 |
| **Springer OA** | Open Access papers | REST API → XML full text | Open Access |

### Tier 3 — Metadata only (for discovery)

| Source | Use | API |
|--------|-----|-----|
| Google Books API | Find ISBNs, descriptions | REST, free |
| Open Library API | Book editions, metadata | REST, free |
| Semantic Scholar API | Paper citations, abstracts | REST, free |

### NOT viable
- O'Reilly Platform (DRM + ToS)
- ACM Digital Library (no public API)
- Kindle full text (DRM)

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  "Quiero aprender sobre consensus algorithms"       │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│  1. RESOLVER — What's the best source?              │
│                                                     │
│  - Check curriculum: concept exists? resource?      │
│  - If book chapter: check if PDF uploaded            │
│  - If paper: search arXiv API                       │
│  - If lecture: search YouTube transcripts            │
│  - If new topic: suggest sources to acquire          │
│                                                     │
│  Output: source_type + source_path + concept_ids    │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│  2. EXTRACTOR — Get clean text                      │
│                                                     │
│  PDF:   pymupdf4llm → markdown                      │
│  EPUB:  unzip → parse XHTML → markdown              │
│  arXiv: download + pymupdf4llm (or LaTeX parse)     │
│  YouTube: transcript API → timestamped text          │
│  OCW:   download ZIP → extract lecture PDFs          │
│                                                     │
│  Output: raw markdown with section structure         │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│  3. SEGMENTER — Split by concept                    │
│                                                     │
│  - Heading-based splitting (TOC/structure)           │
│  - Map sections to existing concept_ids              │
│  - If new concepts needed: create them               │
│  - Dedup page boundary artifacts                     │
│                                                     │
│  Output: concept_id → content_original pairs         │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│  4. TRANSLATOR — Faithful paragraph-by-paragraph    │
│                                                     │
│  - Anti-summarization prompts                        │
│  - Technical glossary per domain                     │
│  - Sliding context window                            │
│  - Length ratio verification                         │
│  - Post-process: dedup + clean artifacts             │
│                                                     │
│  Output: content_markdown (translated)               │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│  5. TEST GENERATOR — Micro-tests per concept        │
│                                                     │
│  - Check question_bank for existing questions        │
│  - If < 5 questions: generate new ones via LLM       │
│  - Types: explanation, scenario, error_detection,    │
│           connection, tradeoff                       │
│  - Seed to question_bank table                       │
│                                                     │
│  Output: questions ready in DB                       │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│  6. SEEDER — Write to Supabase                      │
│                                                     │
│  - Insert resource_sections (translated content)     │
│  - Insert question_bank entries (if generated)       │
│  - Create/update resource if needed                  │
│  - Link resource_concepts                            │
│                                                     │
│  Output: learn page ready at /learn/{resourceId}     │
└─────────────────────────────────────────────────────┘
```

---

## Glossary System (per domain)

Each domain needs its own technical glossary for consistent translation:

```
glossaries/
├── distributed-systems.json    ← DDIA, MIT 6.824
├── machine-learning.json       ← Attention, transformers, etc.
├── llm-systems.json            ← RAG, agents, guardrails
├── databases.json              ← SQL, indexes, transactions
└── networking.json             ← TCP, HTTP, DNS
```

Format:
```json
{
  "fault-tolerant": "tolerante a fallos",
  "throughput": "throughput (no traducir)",
  "trade-off": "trade-off (no traducir)",
  "latency": "latencia"
}
```

The translator picks the right glossary based on the resource's concepts/phase.

---

## Source-Specific Extractors

### PDF Extractor (already built)
```
Input:  user-uploaded PDF + page range + section definitions
Output: sections JSON with content_original per concept
Tool:   pymupdf4llm
```

### EPUB Extractor (to build)
```
Input:  .epub file
Output: chapters as markdown (XHTML → MD)
Tool:   zipfile + beautifulsoup4
Notes:  EPUB preserves structure better than PDF — no page boundary artifacts!
```

### arXiv Extractor (to build)
```
Input:  arXiv paper ID (e.g., "2005.11401" for RAG)
Output: sections JSON with abstract + each section as concept
Tool:   arxiv Python API + pymupdf4llm (or LaTeX parser for source)
Notes:  LaTeX source available for most papers — better than PDF
```

### YouTube Transcript Extractor (to build)
```
Input:  YouTube video URL
Output: timestamped transcript grouped by topic
Tool:   youtube-transcript-api
Notes:  Need LLM to segment transcript into topics (no headings)
```

---

## CLI Interface (future)

```bash
# From a PDF you own
jarre ingest --pdf ~/Books/ddia.pdf --chapters 1-3,5,6,8,9,11

# From arXiv
jarre ingest --arxiv 2005.11401  # RAG paper
jarre ingest --arxiv 1706.03762  # Attention Is All You Need

# From YouTube
jarre ingest --youtube "https://youtube.com/watch?v=..."

# From MIT OCW
jarre ingest --ocw 6.824 --lectures 1-5

# Auto-discover
jarre learn "consensus algorithms"  # finds best source automatically
```

---

## Implementation Phases

### Phase 1: PDF Pipeline (DONE)
- [x] pymupdf4llm extraction
- [x] Heading-based concept segmentation
- [x] Paragraph-by-paragraph faithful translation
- [x] Deduplication + artifact cleaning
- [x] Supabase seeding
- [x] DDIA Chapter 1 complete
- [ ] DDIA Chapters 2,3,5,6,8,9,11 (next session)

### Phase 2: EPUB Support
- [ ] Unzip + XHTML parser
- [ ] Chapter detection from TOC (OPF manifest)
- [ ] Markdown converter
- [ ] Plug into existing translate → seed pipeline
- **Why:** EPUBs have better structure than PDFs, no page artifacts

### Phase 3: arXiv Integration
- [ ] `arxiv` Python library integration
- [ ] Paper search by topic/keyword
- [ ] Auto-detect sections from paper structure
- [ ] LaTeX source parser (better than PDF for math-heavy papers)
- [ ] Auto-create concept_id from paper title/topic
- **Why:** Most AI/ML papers are on arXiv, 100% free and legal

### Phase 4: YouTube Transcripts
- [ ] `youtube-transcript-api` integration
- [ ] LLM-based topic segmentation (transcripts have no headings)
- [ ] Timestamp preservation for video reference
- [ ] Auto-detect language (skip translation if already in target language)
- **Why:** Conference talks, lecture series are goldmines for micro-tests

### Phase 5: Smart Resolver
- [ ] "Quiero aprender X" → concept graph lookup
- [ ] Suggest sources from catalog + external APIs
- [ ] Auto-acquire from free sources (arXiv, YouTube)
- [ ] Prompt user to upload PDFs for paid sources
- [ ] Generate curriculum order based on prerequisites

### Phase 6: Question Auto-Generation
- [ ] Detect when a concept has < 5 questions
- [ ] Generate new micro-tests from the translated content
- [ ] Validate quality with LLM self-check
- [ ] Seed to question_bank automatically
- **Why:** Currently questions are hand-curated; this scales infinitely

---

## Cost Model

| Source | Extract | Translate (per 10K words) | Questions (per concept) |
|--------|---------|--------------------------|------------------------|
| PDF | Free (local) | ~$0.20 (DeepSeek) | ~$0.05 (DeepSeek) |
| EPUB | Free (local) | ~$0.20 (DeepSeek) | ~$0.05 (DeepSeek) |
| arXiv | Free (API) | ~$0.10 (papers are shorter) | ~$0.05 (DeepSeek) |
| YouTube | Free (API) | ~$0.15 (1hr talk ≈ 8K words) | ~$0.05 (DeepSeek) |

**Total cost to process ALL of DDIA (8 chapters, ~123K words): ~$2.50**
**Total cost to process 20 arXiv papers: ~$2.00**
**Total cost for a complete Phase 1 curriculum: ~$5-8**

---

## Key Principles

1. **User owns the source material.** For books, the user must have purchased them. Jarre is a study tool, not a piracy tool.
2. **Faithful translation, never summarization.** The LLM translates paragraph-by-paragraph with anti-summarization guards. Length ratio verification ensures fidelity.
3. **Structure preservation.** Headings, code blocks, formulas, figures, references — all preserved through the pipeline.
4. **Incremental.** Each chapter/paper/lecture is independent. Process one at a time or batch them.
5. **Glossary consistency.** Technical terms are translated consistently across all content in a domain via domain-specific glossaries.
6. **Cost transparency.** Every API call is tracked. The user always knows what they're spending.
