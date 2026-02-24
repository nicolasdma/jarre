# Inline Micro-Quizzes — Investigation

## Date: 2026-02-09

## Problem
Academic research overwhelmingly supports inserting short quizzes during reading. The learn flow currently has pre/post questions but nothing DURING the reading itself.

## Academic Support

| Study | Finding | Effect Size |
|-------|---------|-------------|
| Szpunar, Khan & Schacter (2013) PNAS | Interpolated testing | d=1.38 |
| Pastötter & Bäuml (2014) Frontiers | Forward testing effect | — |
| Arnold & McDermott (2013) JEP:LMC | Test-potentiated learning | — |
| Rawson & Dunlosky (2013, 2022) EPR/CDPS | Successive relearning | — |
| Roediger & Butler (2011) TiCS | Retrieval practice | — |
| Richland, Kornell & Kao (2009) JEP:Applied | Pretesting effect | — |
| Bjork & Bjork (2011) | Desirable difficulties | — |
| Dunlosky et al. (2013) PSPI | Practice testing rated "high utility" | — |
| Adesope et al. (2017) meta | Overall g=0.61, MC specifically g=0.70 | g=0.70 |
| Rowland (2014) meta | Overall g=0.50, with feedback g=0.73 | g=0.73 |
| Yang et al. (2021) meta | 48K students, classroom only | g=0.499 |

## Design Decisions

### Why NOT reuse `question_bank`?
- Different schema: MC/TF vs open-ended
- No SM-2 scheduling needed (deterministic, not spaced)
- No LLM evaluation needed (client-side grading)
- Position-aware (inserted between content sections)

### Why separate `inline_quizzes` table?
- `position_after_heading` ties quiz to a specific content position
- `format` is 'mc' or 'tf' (not open-ended)
- `correct_answer` enables client-side grading (no API calls)
- `options` JSONB for MC choices
- `explanation` shown after answering

### Content Splitting Strategy
- Split markdown at `**bold heading**` lines (standalone bold = sub-headings in DDIA)
- Regex: `^\*\*(.+?)\*\*$`
- Quiz inserted AFTER the section under the matching heading
- If no quizzes for a section → render normally (zero regression)

### Quiz UX
- MC: radio buttons → submit → green/red highlight + explanation
- TF: two buttons "Verdadero"/"Falso" → same feedback
- No LLM calls, no server calls (pure client-side)
- Matches Jarre aesthetic: muted colors, mono font labels, subtle borders

## Schema

```sql
CREATE TABLE inline_quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES resource_sections(id) ON DELETE CASCADE,
  position_after_heading TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  format TEXT NOT NULL CHECK (format IN ('mc', 'tf')),
  question_text TEXT NOT NULL,
  options JSONB,
  correct_answer TEXT NOT NULL,
  explanation TEXT NOT NULL,
  academic_reference TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## MC Options Format
```json
[{"label":"A","text":"..."},{"label":"B","text":"..."},{"label":"C","text":"..."}]
```

## TF Format
- `options` is null
- `correct_answer` is `"true"` or `"false"`
