# Lesson format

A lesson is a hand-written resource loaded from one JSON file: concepts with their study section, inline quizzes, open questions and review cards, plus spoken-English **drills** for the Practice view.

```
npx tsx scripts/seed-lesson.ts <lesson.json> [--user <uuid>] [--tts] [--dry-run] [--enroll | --no-enroll]
```

- `--dry-run` validates the file (schema, quiz headings, audio files) and writes nothing.
- `--user` picks whose progress is set; without it the loader uses the most recently active row of `user_profiles` and prints the candidates.
- `--tts` generates audio for drills that have none (Gemini TTS, see below). Off by default: it calls a paid model.
- `--enroll` / `--no-enroll` override the lesson's `enroll_cards` (see below).

The schema lives in `src/lib/lessons/lesson-format.ts` (Zod); a minimal example is `scripts/fixtures/sample-lesson.json`.

## Top level

| Field | Type | Notes |
|---|---|---|
| `id` | slug | Resource id. Prefix with the track's topic (`interview-…`) so it never collides. |
| `track` | `ai` \| `travel` \| `aventura` | Library tab where it appears. |
| `phase` | `'0'`…`'11'`, `'1.5'` | Default `'1'`. Unlocking only depends on prerequisite concepts, and lesson concepts are never prerequisites, so any phase is unlocked; `'0'` and `'11'` are hidden in the AI library. |
| `title`, `description` | string | Shown in the library and the learn view. |
| `language` | string | Language of the sections. Default `es`. |
| `enroll_cards` | boolean, optional | Default `true`: seeding raises the owner's `concept_progress` to 1 and enrolls the cards in the review deck. A **content pack** (extra material for the feed, e.g. `3y-health-tecnica-repaso`) sets `false`: its cards stay in the lesson and the feed, and the owner's progress and deck are not touched. |
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
{ "id": "01-presentacion", "title": "Tu presentación", "priority": 1, "text_en": "…", "text_es": "…", "audio": "/abs/path.m4a", "concept": "interview-call-playbook" }
```

- `id`: letters, digits, `-`, `_` (case kept, it is also the audio file name).
- `text_en` may mark breaths with a slash between spaces (`six years, / five of them`): shown as written, skipped by Copiar and Repetir, and read as a comma by `--tts`. Each stretch between marks is a **phrase**: Frase por frase plays one phrase, stops, and listens to and scores only that phrase (a drill without marks goes sentence by sentence).
- `segments` (optional): where each phrase sits in the audio, in seconds, `[{ "start": 0, "end": 2.38 }, …]`, one per phrase, in order, not overlapping (validated). Rarely written by hand: `npx tsx scripts/align-drill-segments.ts <lesson.json>` measures them locally (mlx_whisper word timings, each cut snapped to the silence between the phrases in the audio itself) and writes `<audio name>.segments.json` next to each audio; the seed uses that file when it was made from the drill's current text and this exact audio file (sha1), else the drill has no timings. Stored in `lesson_drills.segments` (migration `20261114010000_lesson_drill_segments.sql`; until it is applied the seed skips it). Without timings Frase por frase cuts at the pauses it finds in the audio and says the cuts are approximate. Re-run the aligner after re-recording a drill or editing its text.
- `concept` (optional): the lesson concept the drill practices; the learn view shows it under that section. Without it the drill goes in the last group, "De memoria" (the plan by heart, useful phrases). Stored in `lesson_drills.concept_id` (migration `20261111030000_lesson_drill_concept.sql`; until it is applied the seed skips it and every drill is "De memoria").
- Audio is looked up in this order: `audio` (absolute, `~/`, or relative to the JSON), then `<json dir>/audios/<id>.m4a`, then, with `--tts`, generated into that same path. A drill with no audio still loads: the practice page reads it with the browser's en-US voice (speechSynthesis), labelled "voz del navegador", until a re-seed adds the recording.
- Audio is uploaded to the private Storage bucket `lesson-audio` at `<lesson id>/<drill id>.m4a`. The practice page signs 4-hour URLs with the learner's session (bucket read policy: authenticated).
- TTS: `gemini-3.8-flash-tts`, voice `Charon`, calm American English at a learner's pace (`src/lib/llm/gemini-tts.ts`), PCM converted to m4a with `ffmpeg`, 20 s between calls (the key's per-minute quota answers 429 after ~20 fast calls).

## Interview

The practice page's **Entrevista** tab runs a voice mock interview in English on the lesson: an interviewer asks one question at a time, and after each answer a short feedback (what worked, what is technically off against the lesson, the 1–3 English corrections that matter). The learner picks the interviewer and a depth (1: direct questions and one curveball; 2: at least one follow-up on the learner's own words per topic and two curveballs; 3: up to two follow-ups, cuts in on vague answers, four curveballs). Feedback goes in a fixed order: the technical misconception against the answer key, the key point left out, a key name or term that came out unrecognizable, then one or two English corrections; praise only for complete answers. Every lesson gets six default interviewers (`src/lib/interview/personas.ts`: curious recruiter, tech lead, demanding expert, worried client, skeptical client (tough), relaxed founder) and a default bank of curveballs (price, showing code, AI use, going off the platform, getting sick, agencies, NDA and IP, daily calls); a lesson adds its own, or replaces a default by `id`:

```json
"interview": {
  "context": "A first video call on Zoom, booked through Upwork. …",
  "default_persona": "nathalie",
  "personas": [
    { "id": "nathalie", "name": "Nathalie", "label": "Nathalie (founder de Brivel)", "blurb": "…",
      "role": "the founder of Brivel, hiring the developer for her platform",
      "tone": "relaxed and friendly, … but she listens for details",
      "focus": "…", "pushback": "…", "technical": "medium", "toughness": "standard" }
  ],
  "key_terms": [
    "Valley of Guardians",
    { "term": "Supabase", "heard_as": ["super base", "super bass"], "say": "SÚ-pa-beis", "ipa": "ˈsuːpəbeɪs" },
    { "term": "45/55", "heard_as": ["forty five fifty five"], "speak": "forty-five fifty-five" }
  ],
  "questions": [
    { "id": "signed-links", "kind": "core", "tests": "interview-signed-urls", "drill": "03-links-120-segundos",
      "ask": "How do you make sure a panel link does not stay valid forever?",
      "key_points": ["each link expires 120 seconds after it is signed: no global timer", "…"],
      "misconceptions": ["\"the links expire every two minutes\", as if a timer rotated all links: …"] },
    { "id": "milestones", "kind": "must_know", "drill": "00-los-6-hitos-de-memoria", "…": "…" },
    { "id": "cb-refund", "kind": "curveball", "tests": "interview-ledger-split", "…": "…" }
  ]
}
```

- `context`, `role`, `tone`, `focus`, `pushback` are written in English: they go into the model's prompt. `label` and `blurb` are what the picker shows.
- `technical`: `low` (asks you to explain simply), `medium`, `high` (expects the mechanism and the terms).
- `toughness`: `standard` (default) or `tough`: cuts in on vague answers ("Sorry, be specific: how many seconds?"), one more curveball, praise only for complete answers.
- `key_terms`: names and terms the learner has to say so a native listener recognizes them; the coach flags them when they come out mangled (the transcript is speech recognition). The drills' **Repetir** mode uses them too (`src/lib/practice/key-terms.ts`): an entry is the bare term, or an object with
  - `heard_as`: what the browser's recognizer writes when the term is said **well** (Chrome cannot be given a vocabulary: "Supabase" comes back as "super bass", 45/55 as "forty five fifty five"). Those count as said, marked with a dashed underline to check by ear. Only sound-alikes of words the recognizer cannot know: a real mispronunciation of a common word ("payroll" for paywall) stays a miss. The same letters with other spacing ("post back", "4555") count as the term without listing them.
  - `say`: Spanish-ear respelling, syllables with `-`, the stressed one in caps with its accent (`"PÉI-uol"`). Shown on tap and with "Mostrar pronunciación". Words that are not key terms take theirs from the dictionary in `src/lib/practice/pronunciation.ts`; a word in neither gets audio only.
  - `ipa` (US, no slashes) and `speak` (what the browser voice reads, when the written form misleads it).
- `questions`: the answer key. `kind` is `core` (a main topic), `must_know` (scored item by item; its `drill` is the canonical answer, read from the lesson's drills) or `curveball` (unexpected but realistic; a few are drawn at random per interview). `tests` is a concept id or `deal` / `process`; `key_points` and `misconceptions` are English and go into the prompt; `drill` links the question to the drill to practice. A curveball with a default's `id` replaces it.
- `drill_asks` (optional): `{ "<drill id>": "the interviewer's English question" }`. What **Pregunta → respuesta** (and the feed's say-it card) shows for that drill; it wins over the `ask` of a question linked to the drill, and a drill with neither shows its title. The voice interviewer never asks these: only `questions` go into its prompt.
- The drills are the prepared answers; the sections are the reference for content.
- `mode` (optional): `interview` (default) or `presentation`, for a short talk to rehearse instead of a call. In a presentation the persona is the audience: it invites the learner to give the whole talk without interrupting (only "Mm-hm." if it must take a turn), then asks 3, 4 or 5 questions by depth (one more for a tough persona), judged silently as in an interview. The first item of `questions` is the talk itself (its key points are what the talk must cover); the written report judges it as the first entry and writes its summary in neutral Spanish. Only the lesson's own personas and curveballs are used, never the freelance-call defaults. The learn view calls the step "Simulacro". Example: `~/Desktop/demaria/50-aprender/presentaciones/2026-11-alcoa-plus/build-leccion-alcoa.mjs`.
- Needs `supabase/migrations/20261111020000_resource_interview.sql` applied before seeding a lesson that has the block. Without the column the tab works with the defaults.

## Coding round

A lesson for a live-coding interview adds `interview.coding` (stored with the interview block in `resources.interview`, no migration). Schema: `src/lib/coding/format.ts`. It drives two things in the learn view:

- **Escribilo en código**, under the reading section of each problem (`problem.concept`): its `exercises`, usually `guided` (the plan as comments, TODOs in the core) and then `blank` (the signature only). Editor (CodeMirror, no AI completion), **Probar** runs the example and hidden tests, **Correr** runs the file and shows its `console.log`. Drafts and solved exercises are kept in the browser.
- **Coding en vivo**, the last step (`?step=coding`): a timed mock with a voice interviewer (Gemini Live, the interview mock's session) who presents a problem, answers clarifications from `clarifications`, watches the code, keeps time and gives hints one rung at a time; at the end the final code runs against every test and a written scorecard appears (`POST /api/interview/coding-report`, DeepSeek, five dimensions scored 1 to 4 with quoted moments). Attempts (transcript, final code, facts, report) are kept in the browser.

```json
"coding": {
  "context": "The round being rehearsed (English).",
  "interviewer": { "name": "Sam", "role": "…", "tone": "…" },
  "minutes": 30,
  "phases": [{ "id": "clarify", "title": "Aclarar", "from": 0, "to": 0.1, "what": "…", "drill": "tt-f2-aclarar" }],
  "stuck_drills": ["tt-f6-trabado"],
  "problems": [{
    "id": "two-sum", "title": "Two Sum", "difficulty": "easy", "pattern": "Hash map", "concept": "3yt-two-sum", "minutes": 15,
    "statement": "…", "examples": [{ "input": "…", "output": "…" }], "constraints": ["…"],
    "clarifications": [{ "topic": "sorted?", "answer": "No." }],
    "exports": ["twoSum"], "starter": "export function twoSum(…) {…}",
    "example_tests": "import { twoSum } from './solution';\ntest('example 1', () => { expect(twoSum([2, 7], 9)).toEqual([0, 1]); });",
    "tests": "…hidden edge cases…",
    "hints": ["a question", "a direction", "the step"], "follow_ups": ["…"], "senior_signals": ["…"], "pitfalls": ["…"],
    "solution": { "approach": "…", "time": "O(n)", "space": "O(n)", "code": "…" },
    "exercises": [{ "id": "two-sum-guided", "level": "guided", "title": "…", "instructions": "…", "starter": "…" }]
  }]
}
```

- **Núcleo / red de seguridad.** `problem.tier` (optional): `core` (write it from a blank page) or `safety_net` (read it and say its complexity). The mock lists core problems first, labels each card and preselects the first core medium; without tiers it preselects the first medium.
- **Complejidad.** `problem.complexity` (optional): `{ time, space, brute?, say, drill? }`, where `time` and `space` are `{ answer, options, why }` (the answer among 2 to 6 options, `why` one line in the learner's language), `brute` is `{ time: { answer, options, why }, space, why }` when the brute force costs something else, `say` is the answer as said on the call (English, " / " marks) and `drill` the lesson drill with that sentence and its recording. Once an exercise passes every test, a **Complejidad** step appears under it: pick time and space (and the brute force's time), or say it aloud (the browser's recognizer, `en-US`; `src/lib/coding/big-o.ts` maps what it heard to the options), then **Ver respuesta** marks each part with its reason and shows the sentence with **Escuchar** and **Repetirla con el micrófono** (opens its drill in Repetir). Answers are kept in the browser. The mock interviewer always asks for the time and space of the final code and probes a vague answer; the scorecard scores `complexity` as its own dimension against it.
- `coding.complexity_drill` (optional): `{ concept, title, instructions, items }`, each item a complexity check plus `id`, `title` and `code` (a short TypeScript fragment). It shows under that concept's reading in place of code exercises: read the fragment, say its Big-O, see the correction.
- Tests are TypeScript against the candidate's file (`import … from './solution'`), with `test` and a small Jest-like `expect` (`src/lib/coding/harness.ts`: toBe, toEqual, toThrow, toContain, toBeLessThan, `.not`, `.rejects`…). They run in a Web Worker (Sucrase strips the types; a run is killed after 6 s), never on a server.
- `phases[].drill` and `stuck_drills` name drills whose text (cut at " / ") is the phrase list the mock's guide shows.
- The hint ladder never goes into the interviewer's prompt: the page hands it one rung at a time, when the candidate asks for help or stays stuck after a check-in (`src/lib/coding/mock-runtime.ts`).
- `npx tsx scripts/verify-coding.ts <lesson.json>` proves every reference solution passes its tests and every starter fails one; `seed-lesson.ts` runs the same check (also with `--dry-run`) and writes nothing if it fails.
- `npx tsx scripts/probe-coding-mock.ts <lesson.json>` checks the interviewer against the real Live API (paid: one session).

## What the loader does

1. Validates the whole file before writing anything, and says which drills with audio have phrase timings (and why the others do not).
2. Upserts `concepts`, `resources` (core curriculum: `created_by` null, `type: article`, no URL), `resource_concepts`, `resource_sections`, `inline_quizzes`, `question_bank`, `concept_cards`, `lesson_drills`, and uploads the audio.
3. Unless enrollment is off (`enroll_cards: false` or `--no-enroll`), sets the owner's `concept_progress` to level 1 (never lowers a higher level) and enrolls the cards in `review_schedule`, like `/api/review/enroll`. A card is never enrolled twice by content: if the owner already has a card with the same front and back (any lesson, compared case- and spacing-insensitively, `cardContentKey`), or the lesson repeats one of its own cards, it is skipped and counted as a duplicate (2026-11-18: a v2 that re-namespaced v1's concepts added 63 copies to the deck).

Re-running is safe: every row id is derived from the lesson (`stableUuid`), so rows update in place and review progress survives. Quizzes, questions and cards the lesson no longer has are deactivated; sections and drills it no longer has are deleted.

## Where it shows

- Library (`/library`, which `/dashboard` redirects to): the resource card gets a **Practicar** button.
- Learn view (`/learn/<id>`): the APPLY step embeds the practice page.
- Everything is in the learn view, `/learn/<id>`: each section ends with its drills ("Decilo en inglés", every mode inline), APPLY becomes **Practicar** (every drill by group, with the groups and what is practiced in the side navigation) and the last step is **Entrevista**. Deep links: `?step=practice&drill=<id>&mode=listen|copy|repeat|sentences|recall` (old links: `shadow` opens `sentences`, `dictation` opens `listen`), `?step=interview`. `/resource/<id>/practice` redirects there. Best scores per drill are kept in the browser (localStorage). Each drill in "Decilo en inglés" shows its grade from 1 to 5, the best of the evaluations its attempts already got (Repetir, Frase por frase and Copiar % mapped around the 85 % pass bar: 95+ is 5, 85+ 4, 70+ 3, 50+ 2; Pregunta → respuesta: La tenía 5, A medias 3, No salió 1), or **Pendiente** if it was never practiced (`src/lib/practice/drill-grade.ts`); the section header counts the pending ones.

### Pregunta → respuesta: the answer is judged

In the `recall` mode the spoken answer is heard and judged against the drill's own `text_en`, by a third party that reads for meaning and is lenient on purpose.

- **Hearing.** The browser's speech recognition (Web Speech API, `en-US`), the same one Repetir and Frase por frase use (`src/components/practice/recognition.ts`). It listens from the start of the countdown until "Ya está" or the end of the timer. No audio leaves the page for this: only the text is sent. Hook: `src/components/practice/use-recall-answer.ts`.
- **Judging.** One request per answer to `POST /api/practice/recall-eval` with `{ resourceId, drill, transcript, cutOff }`. The route reads the question, the reference and, when the lesson's `interview.questions` links the drill, its `key_points`, and makes one call to the evaluation model every other evaluation uses (`callDeepSeek`, model name `deepseek-chat`, JSON output, `TOKEN_BUDGETS.RECALL_EVAL` = 400 output tokens, 15 s timeout). Prompt, rules and parsing: `src/lib/practice/recall-eval.ts`.
- **What it returns.** Two to four main ideas of the reference, each marked said or not (in Spanish), whether the question was answered, one short suggestion and a grade: La tenía / A medias / No salió. Other words, another order or a shorter answer are not penalized; when the question asks for one thing and the reference has several, one told with its concrete detail is complete. `settleRating` keeps the grade consistent with the listed ideas, always toward the learner.
- **On screen.** The evaluation shows above "La respuesta" with the grade preselected. 1 · 2 · 3 change it, Enter confirms; while the judge is still out, Enter waits unless a grade was chosen by hand. The stored result is the same `RecallRecord` as before (`recordRecall`, localStorage), so reviews and "Mejor:" are unchanged.
- **Fallback.** No recognizer (Firefox), a blocked microphone, fewer than three words heard, no network, a model error or the monthly token limit: the mode says so in one line and is self-rated, as it was. An answer with nothing to judge makes no model call.
- **Cost.** About 1,000 tokens per answer (measured on drill `34-regla-por-un-error`: 844 to 911 in, 157 to 167 out). Logged under the `recall_eval` category of token usage.
- **Tests.** `src/lib/practice/__tests__/recall-eval.test.ts` (hand-made transcripts, the model and `fetch` mocked; nothing touches the network).
