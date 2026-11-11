# Lesson format

A lesson is a hand-written resource loaded from one JSON file: concepts with their study section, inline quizzes, open questions and review cards, plus spoken-English **drills** for the Practice view.

```
npx tsx scripts/seed-lesson.ts <lesson.json> [--user <uuid>] [--tts] [--dry-run]
```

- `--dry-run` validates the file (schema, quiz headings, audio files) and writes nothing.
- `--user` picks whose progress is set; without it the loader uses the most recently active row of `user_profiles` and prints the candidates.
- `--tts` generates audio for drills that have none (Gemini TTS, see below). Off by default: it calls a paid model.

The schema lives in `src/lib/lessons/lesson-format.ts` (Zod); a minimal example is `scripts/fixtures/sample-lesson.json`.

## Top level

| Field | Type | Notes |
|---|---|---|
| `id` | slug | Resource id. Prefix with the track's topic (`interview-…`) so it never collides. |
| `track` | `ai` \| `travel` \| `aventura` | Library tab where it appears. |
| `phase` | `'0'`…`'11'`, `'1.5'` | Default `'1'`. Unlocking only depends on prerequisite concepts, and lesson concepts are never prerequisites, so any phase is unlocked; `'0'` and `'11'` are hidden in the AI library. |
| `title`, `description` | string | Shown in the library and the learn view. |
| `language` | string | Language of the sections. Default `es`. |
| `activate` | object, optional | Stored in `resources.activate_data`: `{ summary, sections: [{number,title,description}], keyConcepts: [], insight }`. |
| `concepts` | array, ≥ 1 | One study section each, in order. |
| `interview` | object, optional | Interview mock: the situation and the lesson's own interviewers. See below. Stored in `resources.interview`; `null` clears it. |
| `drills` | array | Practice items, ordered by `priority`. |

## Concept

| Field | Notes |
|---|---|
| `id` | Concept id **and** slug. Must be globally unique: use a prefix (`interview-supabase-rls`), because concepts with the same slug are shared across tracks. |
| `name`, `definition` | `concepts.name`, `concepts.canonical_definition`. |
| `section.title`, `section.markdown` | One `resource_sections` row. Write headings as `## Heading`: the loader rewrites them to `**Heading**`, the form the learn view splits on (`src/lib/markdown-splitter.ts`). |
| `quizzes[]` | Inline quizzes shown inside the section. |
| `open[]` | `question_bank` rows (`format: 'open'`), scoped to the section. |
| `cards[]` | `concept_cards` rows for the review deck. |

### Quiz

```json
{ "format": "mc", "after_heading": null, "question": "…", "options": ["…","…","…","…"], "correct": 1, "explanation": "…" }
{ "format": "tf", "after_heading": "Qué es", "question": "…", "correct": false, "explanation": "…" }
```

- `correct`: mc → 0-based index into `options` (stored as `options: [{label:'A',text}]`, `correct_answer: 'B'`); tf → boolean (stored as `'true'`/`'false'`, `options: null`).
- `after_heading`: a heading of the section (with or without `##`, case-insensitive); `null` puts the quiz at the end of the section. The section needs at least one heading.
- Optional `justification_hint`.

### Open question

`{ "question": "…", "expected_answer": "…", "difficulty": 1-3, "type": "definition" }` (`type` optional, any `question_bank_type`).

### Card

`{ "type": "recall", "front": "…", "back": "…", "difficulty": 1 }` → `front_content: {prompt}`, `back_content: {definition}`.
Other card types (`fill_blank`, `true_false`, `connect`, `scenario_micro`) take `front`/`back` as the stored objects; copy the shapes from `scripts/seed-concept-cards.ts`.

## Drill

```json
{ "id": "01-presentacion", "title": "Tu presentación", "priority": 1, "text_en": "…", "text_es": "…", "audio": "/abs/path.m4a" }
```

- `id`: letters, digits, `-`, `_` (case kept, it is also the audio file name).
- Audio is looked up in this order: `audio` (absolute, `~/`, or relative to the JSON), then `<json dir>/audios/<id>.m4a`, then, with `--tts`, generated into that same path. A drill with no audio still loads: the practice page reads it with the browser's en-US voice (speechSynthesis), labelled "voz del navegador", until a re-seed adds the recording.
- Audio is uploaded to the private Storage bucket `lesson-audio` at `<lesson id>/<drill id>.m4a`. The practice page signs 4-hour URLs with the learner's session (bucket read policy: authenticated).
- TTS: `gemini-3.8-flash-tts`, voice `Charon`, calm American English at a learner's pace (`src/lib/llm/gemini-tts.ts`), PCM converted to m4a with `ffmpeg`, 20 s between calls (the key's per-minute quota answers 429 after ~20 fast calls).

## Interview

The practice page's **Entrevista** tab runs a voice mock interview in English on the lesson: an interviewer asks one question at a time, and after each answer a short feedback (what worked, what is technically off against the lesson, the 1–3 English corrections that matter). The learner picks the interviewer and a depth (1: direct questions; 2: a follow-up when an answer is vague; 3: edge cases and the why). Every lesson gets five default interviewers (`src/lib/interview/personas.ts`: curious recruiter, tech lead, demanding expert, worried client, relaxed founder); a lesson adds its own, or replaces a default by `id`:

```json
"interview": {
  "context": "A first video call on Zoom, booked through Upwork. …",
  "default_persona": "nathalie",
  "personas": [
    { "id": "nathalie", "name": "Nathalie", "label": "Nathalie (founder de Brivel)", "blurb": "…",
      "role": "the founder of Brivel, hiring the developer for her platform",
      "tone": "relaxed and friendly, … but she listens for details",
      "focus": "…", "pushback": "…", "technical": "medium" }
  ]
}
```

- `context`, `role`, `tone`, `focus`, `pushback` are written in English: they go into the model's prompt. `label` and `blurb` are what the picker shows.
- `technical`: `low` (asks you to explain simply), `medium`, `high` (expects the mechanism and the terms).
- The drills are the question bank and the reference answers; the sections are the reference for content.
- Needs `supabase/migrations/20261111020000_resource_interview.sql` applied before seeding a lesson that has the block. Without the column the tab works with the defaults.

## What the loader does

1. Validates the whole file before writing anything.
2. Upserts `concepts`, `resources` (core curriculum: `created_by` null, `type: article`, no URL), `resource_concepts`, `resource_sections`, `inline_quizzes`, `question_bank`, `concept_cards`, `lesson_drills`, and uploads the audio.
3. Sets the owner's `concept_progress` to level 1 (never lowers a higher level) and enrolls the cards in `review_schedule`, like `/api/review/enroll`.

Re-running is safe: every row id is derived from the lesson (`stableUuid`), so rows update in place and review progress survives. Quizzes, questions and cards the lesson no longer has are deactivated; sections and drills it no longer has are deleted.

## Where it shows

- Library (`/library`, which `/dashboard` redirects to): the resource card gets a **Practicar** button.
- Learn view (`/learn/<id>`): the APPLY step embeds the practice page.
- Practice: `/resource/<id>/practice` (`?drill=<id>&mode=listen|copy|dictation|repeat|shadow|interview`). Best scores per drill are kept in the browser (localStorage).
