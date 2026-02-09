# Session Prompt: Translate ALL DDIA + Start Auto-Learn Pipeline

## Context
Read these files for full context:
- `plan/2026-02-08/next-session-translate-all-ddia.md` — Translation execution plan
- `plan/2026-02-08/auto-learn-pipeline-design.md` — Auto-learn pipeline architecture
- `BACKLOG.md` — Current task list

Chapter 1 is already translated and seeded. Chapters 2, 3, 5, 6, 8, 9, 11 need translation.
All extraction JSONs are ready at `scripts/output/chapter-{NN}-sections.json`.

## PHASE 1: Translate ALL DDIA Chapters (~2-3 hours, background)

### CRITICAL: Context Window Protection
Each chapter translation takes 15-75 minutes. You MUST run them as background Bash tasks.
Do NOT use agents for translations — use raw `Bash` with `run_in_background: true`.
Do NOT try to read translation output into context — just check exit codes.

### Execution Order (2 at a time, avoid DeepSeek rate limits)

**Batch A — Launch immediately (2 smallest chapters):**
```bash
python scripts/process-ddia-chapter.py scripts/output/ddia.pdf --chapter 6 --skip-extract
```
```bash
python scripts/process-ddia-chapter.py scripts/output/ddia.pdf --chapter 2 --skip-extract
```
Run each as a SEPARATE background Bash task. Then move to Phase 2 while they run.

**Batch B — After Batch A completes:**
```bash
python scripts/process-ddia-chapter.py scripts/output/ddia.pdf --chapter 3 --skip-extract
```
```bash
python scripts/process-ddia-chapter.py scripts/output/ddia.pdf --chapter 5 --skip-extract
```

**Batch C — After Batch B completes:**
```bash
python scripts/process-ddia-chapter.py scripts/output/ddia.pdf --chapter 8 --skip-extract
```
```bash
python scripts/process-ddia-chapter.py scripts/output/ddia.pdf --chapter 11 --skip-extract
```

**Batch D — After Batch C completes:**
```bash
python scripts/process-ddia-chapter.py scripts/output/ddia.pdf --chapter 9 --skip-extract
```

### After ALL translations complete:

1. Verify all files exist:
```bash
ls -la scripts/output/chapter-*-translated.json | wc -l
# Should be 8 (including ch01)
```

2. Quick quality check:
```bash
python3 -c "
import json, glob
for f in sorted(glob.glob('scripts/output/chapter-*-translated.json')):
    data = json.load(open(f))
    for s in data:
        en = len(s.get('content_original','').split())
        es = len(s['content_markdown'].split())
        r = es/en if en else 0
        print(f'{s[\"concept_id\"]:25s} {en:6d} EN -> {es:6d} ES  ratio={r:.2f}')
"
```

3. Seed ALL to Supabase:
```bash
npx tsx scripts/seed-sections.ts --from-dir scripts/output
```

4. Test build:
```bash
npx next build
```

---

## PHASE 2: While Translations Run — Build arXiv Extractor

This is the highest-impact next step from the auto-learn pipeline. arXiv papers are:
- 100% free and legal (open access)
- API accessible (no manual download needed)
- Directly relevant to Phases 2-6 of the curriculum (RAG, agents, guardrails, etc.)

### Task: Create `scripts/ingest-arxiv.py`

A single script that takes an arXiv paper ID and produces a translated, seeded learn resource.

```bash
python scripts/ingest-arxiv.py 2005.11401  # RAG paper
# Downloads PDF → extracts → segments → translates → saves JSON
# Then: npx tsx scripts/seed-sections.ts --from-file scripts/output/arxiv-2005.11401-translated.json
```

### Implementation Steps:

1. **Install `arxiv` library:** `pip install arxiv`

2. **Download paper:** Use `arxiv` Python API to download PDF to `scripts/output/`

3. **Extract text:** Use pymupdf4llm (same as DDIA pipeline)

4. **Segment by sections:** Research papers have standard structure:
   - Abstract
   - Introduction
   - Related Work
   - Method / Approach (the core — this maps to the concept)
   - Experiments / Results
   - Conclusion

   Use heading detection to split. Map the core sections to concept_ids.

5. **Determine concept mapping:**
   - Check if concept_id exists in DB for this paper's topic
   - If not, suggest creating one (or map to closest existing concept)
   - Use the paper title + abstract to determine which concept(s) it covers

6. **Translate:** Reuse `translate-chapter.py` (paragraph-by-paragraph, anti-summarization)
   - Papers are shorter (~5-8K words) so translation is fast (~10 min, ~$0.10)
   - Need a glossary for ML/AI terms (different from distributed systems glossary)

7. **Create resource + seed sections:**
   - Auto-create resource entry if it doesn't exist
   - Seed resource_sections as usual

### Glossary for ML/AI Papers:
Create `scripts/glossaries/ml-ai.json` with terms like:
- retrieval-augmented generation → RAG (no traducir)
- fine-tuning → ajuste fino (fine-tuning)
- embedding → embedding (no traducir)
- attention mechanism → mecanismo de atención
- transformer → transformer (no traducir)
- prompt → prompt (no traducir)
- hallucination → alucinación
- grounding → grounding (no traducir)
- inference → inferencia
- etc.

### Test with these papers (all in Jarre curriculum):
- `2005.11401` — RAG (Retrieval-Augmented Generation)
- `1706.03762` — Attention Is All You Need
- `2210.03629` — ReAct: Synergizing Reasoning and Acting
- `2302.04761` — Toolformer

### Resource ID convention for arXiv papers:
`arxiv-{id}` → e.g., `arxiv-2005.11401`

---

## PHASE 3: If Time Remains — YouTube Transcript Extractor

Lower priority than arXiv, but high value. Many conference talks are in the curriculum.

### Task: Create `scripts/ingest-youtube.py`

```bash
python scripts/ingest-youtube.py "https://youtube.com/watch?v=VIDEO_ID"
```

1. Install `youtube-transcript-api`
2. Extract transcript (auto-generated or manual captions)
3. LLM-based topic segmentation (transcripts have no headings — need DeepSeek to identify topic boundaries)
4. Translate segments
5. Seed as resource_sections

This is trickier than PDF/arXiv because transcripts are unstructured. Focus on getting a working prototype, not perfection.

---

## Session End Checklist

- [ ] All 8 DDIA chapters translated and seeded
- [ ] `npm run dev` works, all learn pages render content
- [ ] arXiv extractor working (at least for one paper)
- [ ] BACKLOG.md updated
- [ ] Session plan created in `plan/` folder
- [ ] Git commit with descriptive message
- [ ] No broken state — everything builds and runs

---

## Architecture Reminder

```
scripts/
├── extract-chapter.py          # PDF → sections JSON (DDIA-specific chapter defs)
├── translate-chapter.py        # EN → ES paragraph-by-paragraph
├── process-ddia-chapter.py     # Full pipeline for one DDIA chapter
├── seed-sections.ts            # JSON → Supabase (--from-file or --from-dir)
├── ingest-arxiv.py             # NEW: arXiv paper ID → full pipeline
├── ingest-youtube.py           # NEW: YouTube URL → full pipeline
├── glossaries/
│   ├── distributed-systems.json  # DDIA terms (already in translate-chapter.py, extract to file)
│   └── ml-ai.json                # NEW: ML/AI paper terms
└── output/                     # Generated files (gitignored)
    ├── ddia.pdf
    ├── chapter-*-sections.json
    ├── chapter-*-translated.json
    └── arxiv-*-translated.json
```
