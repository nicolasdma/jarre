# Next Session: Translate ALL DDIA Chapters

## Context
Chapter 1 is already translated and seeded (reliability, scalability, maintainability — ~7,600 ES words).
We need to translate 7 remaining chapters: 2, 3, 5, 6, 8, 9, 11.

## What's Ready
- `scripts/output/ddia.pdf` — Full DDIA PDF (613 pages)
- `scripts/extract-chapter.py` — Has chapter definitions for ALL 8 chapters (page ranges, heading patterns, concept mappings)
- `scripts/output/chapter-{02,03,05,06,08,09,11}-sections.json` — Extracted English sections, ready for translation
- `scripts/process-ddia-chapter.py` — Complete pipeline (extract → translate → deduplicate → clean)
- `scripts/translate-chapter.py` — Paragraph-by-paragraph faithful translation with anti-summarization
- `scripts/seed-sections.ts` — Supports `--from-file` (single) and `--from-dir` (all translated files)

## Execution Plan

### Strategy: Run chapters as background tasks in groups to avoid DeepSeek rate limits

**Group 1 (smaller chapters, ~30 min):**
```bash
python scripts/process-ddia-chapter.py scripts/output/ddia.pdf --chapter 6 --skip-extract
python scripts/process-ddia-chapter.py scripts/output/ddia.pdf --chapter 2 --skip-extract
```

**Group 2 (medium chapters, ~45 min):**
```bash
python scripts/process-ddia-chapter.py scripts/output/ddia.pdf --chapter 3 --skip-extract
python scripts/process-ddia-chapter.py scripts/output/ddia.pdf --chapter 5 --skip-extract
```

**Group 3 (large chapters, ~60 min):**
```bash
python scripts/process-ddia-chapter.py scripts/output/ddia.pdf --chapter 8 --skip-extract
python scripts/process-ddia-chapter.py scripts/output/ddia.pdf --chapter 11 --skip-extract
```

**Group 4 (largest chapter, ~75 min):**
```bash
python scripts/process-ddia-chapter.py scripts/output/ddia.pdf --chapter 9 --skip-extract
```

### IMPORTANT: Run each chapter as a SEPARATE background Bash task
Each chapter must run independently. Do NOT try to manage them in a single agent.
Use `run_in_background: true` for each chapter.
Run 2 chapters at a time maximum (DeepSeek rate limit courtesy).
Wait for a group to finish before starting the next.

### After All Translations Complete

1. Verify all translated files exist:
```bash
ls -la scripts/output/chapter-*-translated.json
```

2. Quick quality check (word counts and ratios):
```bash
python3 -c "
import json, glob
for f in sorted(glob.glob('scripts/output/chapter-*-translated.json')):
    data = json.load(open(f))
    for s in data:
        en = len(s.get('content_original','').split())
        es = len(s['content_markdown'].split())
        ratio = es/en if en else 0
        print(f'{f}: {s[\"concept_id\"]:25s} {en:6d} EN → {es:6d} ES (ratio={ratio:.2f})')
"
```

3. Seed ALL chapters at once:
```bash
npx tsx scripts/seed-sections.ts --from-dir scripts/output
```

4. Verify in DB:
```bash
npx tsx -e "
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);
s.from('resource_sections').select('resource_id, concept_id, section_title').order('resource_id').then(({data}) => {
  console.table(data);
});
"
```

## Expected Results

| Chapter | Resource ID | Concept IDs | ~EN Words | ~ES Words |
|---------|------------|-------------|-----------|-----------|
| Ch1 ✅ | ddia-ch1 | reliability, scalability, maintainability | 7,986 | ~9,064 |
| Ch2 | ddia-ch2 | data-models | 13,219 | ~15,000 |
| Ch3 | ddia-ch3 | storage-engines | 14,513 | ~16,500 |
| Ch5 | ddia-ch5 | replication | 16,844 | ~19,100 |
| Ch6 | ddia-ch6 | partitioning | 7,049 | ~8,000 |
| Ch8 | ddia-ch8 | distributed-failures | 18,601 | ~21,100 |
| Ch9 | ddia-ch9 | consistency-models, consensus | 25,031 | ~28,400 |
| Ch11 | ddia-ch11 | stream-processing | 19,486 | ~22,100 |
| **Total** | | **11 concepts** | **122,729** | **~139,300** |

## Estimated Cost & Time
- Cost: ~$2.50 (DeepSeek V3)
- Time: ~2-3 hours total (running 2 chapters in parallel)

## Error Handling
- If a chapter fails mid-translation, the partial output is lost. Re-run that chapter.
- If DeepSeek rate limits hit, the script will crash. Wait 60s and retry.
- The `--skip-extract` flag reuses existing section JSONs (extraction is fast anyway).

## After Seeding
1. Run `npm run dev` and test each chapter's learn page
2. Update BACKLOG.md to mark chapters as done
3. Commit the translated JSON files are in .gitignore — only commit code changes
