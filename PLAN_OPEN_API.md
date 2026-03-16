# Open API Plan

Updated: 2026-03-12

## Goal

Turn `jarre` from a YouTube/PDF-first pipeline into a broader source -> course platform without weakening the current deterministic core.

The repo already has two strong entry points:

- `/api/pipeline`
  - structured auto-generation for YouTube and PDF
- `/api/resources/ingest`
  - lighter external-resource ingestion for articles, notes, papers, books, and podcasts

The right strategy is not "replace the current pipeline with APIs". The right strategy is:

1. keep the current pipeline
2. enrich the resolve stage with external APIs
3. add new source types where metadata and content are reliable

## Current hooks in code

- `src/app/api/pipeline/route.ts`
  - accepts YouTube or direct PDF URLs
- `src/lib/pipeline/orchestrator.ts`
  - 6-stage pipeline orchestration
- `src/lib/pipeline/stages/resolve-youtube.ts`
  - already resolves transcript, timestamps, chapters, and metadata
- `src/app/api/resources/ingest/route.ts`
  - external resource ingest pipeline
- `src/lib/ingest/content-resolver.ts`
  - currently resolves YouTube transcript or user notes
- `src/app/library/unified-intake-panel.tsx`
  - already accepts free-form user input and URL extraction

## Principles

- External APIs should enrich, not destabilize, the current learning pipeline.
- Persist normalized provider metadata separately from generated educational content.
- Keep fallback paths explicit.
- Respect licensing and content-policy boundaries for books, articles, and datasets.
- Treat provider payloads as traceable inputs, not hidden magic.

## Priority summary

| API | Why it fits | Priority |
| --- | --- | --- |
| YouTube Data API v3 | Better official metadata for the existing core path | P0 |
| Google Books API | Book -> course and bibliography expansion | P1 |
| Open Library API | Open metadata fallback for books and editions | P1 |
| Microlink / LinkPreview | Better article preview and generic URL enrichment | P1 |
| GNews / Currents / NewsData | News -> explainer / course experiments | P2 |
| Kaggle API | Dataset-backed courses and playground attachments | P2 |

## API entries

### 1. YouTube Data API v3

Docs:
- https://developers.google.com/youtube/v3

Why it fits:
- `jarre` already depends on YouTube as a primary source.
- The current system extracts video ID, subtitles, and chapters, but official metadata can make the experience cleaner and more trustworthy.

Representative data returned:
- `video` resources with fields like `snippet`, `contentDetails`, and `statistics`
- `channel` resources
- `playlist` and `playlistItem` resources
- thumbnails, publish time, channel title, duration, tags, category, and related metadata

Benefits:
- canonical metadata for course cards
- better thumbnails and attribution
- more stable title/channel information
- easier deduping and cache keys

Implementation plan:
- Add `YOUTUBE_API_KEY`.
- Extend `src/lib/pipeline/stages/resolve-youtube.ts` to call the official API after extracting the video ID.
- Keep subtitle and transcript extraction on the current path for now.
- Add a normalized metadata object to the resolve output:
  - `videoTitle`
  - `channelTitle`
  - `publishedAt`
  - `thumbnails`
  - `durationIso`
  - `tags`
- Feed that metadata into:
  - `src/app/dashboard/pipeline-course-card.tsx`
  - `src/app/library/resource-video-preview.tsx`
  - `src/lib/pipeline/stages/write-to-db.ts`

Recommended first cut:
- metadata enrichment only
- no change to transcript acquisition

Notes:
- This is the cleanest P0 because it improves an already-working path.

### 2. Google Books API

Docs:
- https://developers.google.com/books/docs/v1/using

Why it fits:
- Jarre already thinks in terms of sections, concepts, summaries, and learning flows.
- Books are a natural next source after YouTube and PDF.

Representative data returned:
- `volume` resources with `id`
- `volumeInfo` including title, subtitle, authors, publisher, categories, description, page count, language, image links
- `saleInfo`, `accessInfo`, and search metadata

Benefits:
- lets users start from a book title, ISBN, or Google Books URL
- unlocks bibliography cards and reading suggestions
- provides clean metadata even when full text is not available

Implementation plan:
- Add `src/lib/ingest/providers/google-books.ts`.
- Add a small search route:
  - `src/app/api/resources/book-search/route.ts`
- Extend `src/app/library/unified-intake-panel.tsx` to recognize ISBNs or book titles.
- For the first version, use Google Books only for:
  - metadata hydration
  - cover image
  - description
  - author/category labels
- Store provider payload in a new metadata field or table, then ask the user for:
  - notes
  - chapter list
  - a PDF or excerpt if they want full course generation

Recommended first cut:
- metadata-only book cards
- not full-text ingestion

Notes:
- This avoids copyright trouble while still making Jarre more useful.

### 3. Open Library API

Docs:
- https://openlibrary.org/developers/api

Why it fits:
- It is a strong open fallback when Google Books coverage is weak or too sparse.
- It is especially good for editions, works, authors, and covers.

Representative data returned:
- work records
- edition records
- author records
- cover image references
- identifiers such as ISBN and Open Library IDs

Benefits:
- open fallback for book discovery
- better edition matching
- extra metadata for bibliography and source cards

Implementation plan:
- Add `src/lib/ingest/providers/open-library.ts`.
- Use it as:
  - fallback when Google Books has no strong match
  - secondary metadata source for edition/cover enrichment
- Keep one normalized shape across both providers:
  - `title`
  - `subtitle`
  - `authors`
  - `coverUrl`
  - `identifiers`
  - `description`
  - `subjects`

Recommended first cut:
- fallback only
- no separate UI until the normalization layer is stable

### 4. Article metadata: Microlink or LinkPreview

Docs:
- https://microlink.io/docs/api/getting-started/overview
- https://www.linkpreview.net/

Why they fit:
- `unified-intake-panel.tsx` already accepts arbitrary URLs.
- `content-resolver.ts` is still weak for non-YouTube URLs.

Representative data returned:
- normalized URL
- title
- description
- image
- publisher/site name
- author and date on some pages
- favicon, logos, and summary-like preview fields

Benefits:
- much better article cards
- better titles before LLM extraction
- less dependence on users writing their own notes

Implementation plan:
- Add `src/lib/ingest/providers/article-preview.ts`.
- Call the preview provider before LLM extraction inside `src/app/api/resources/ingest/route.ts`.
- Extend `ResolvedContent` or add a companion metadata object:
  - `resolvedTitle`
  - `resolvedDescription`
  - `imageUrl`
  - `publisher`
  - `author`
  - `publishedAt`
- Use preview metadata when:
  - generating the resource title
  - rendering intake confirmation
  - producing LLM extraction context

Recommended first cut:
- metadata enrichment only
- do not treat preview text as full article content

### 5. News provider adapter: GNews, Currents, NewsData

Docs:
- https://gnews.io/docs/
- https://currentsapi.services/en/docs/
- https://newsdata.io/docs

Why they fit:
- Jarre can become a "learn this topic now" product, not only a "turn this source into a course" product.
- News can feed explainer mode, concept refreshers, and current-events study cards.

Representative data returned:
- article lists
- title
- URL
- source
- published time
- description or summary snippet
- image
- keyword/category/language metadata depending on provider

Benefits:
- current-events explainers
- topic feeds for curriculum expansion
- daily or weekly AI/infra reading lists tied back to concepts

Implementation plan:
- Add `src/lib/ingest/providers/news-adapter.ts`.
- Normalize all providers to one internal type:
  - `headline`
  - `url`
  - `source`
  - `publishedAt`
  - `description`
  - `imageUrl`
  - `language`
- Add a light route:
  - `src/app/api/resources/news-search/route.ts`
- First use case:
  - topic search -> result selection -> ingest as external resource
- Second use case:
  - "Explain today's topic" -> generate a compact explainer resource

Recommended first cut:
- metadata and link discovery only
- do not scrape or store full article text unless licensing is clear

Notes:
- This must respect `docs/CONTENT_POLICY.md`.

### 6. Kaggle API

Docs:
- https://www.kaggle.com/docs/api

Why it fits:
- Jarre already has playgrounds, quizzes, evaluation, and concept-linked learning.
- Datasets are the missing bridge between theory and applied practice.

Representative data returned:
- dataset metadata
- files
- owners
- tags
- versions
- download access to dataset artifacts, depending on permissions and licensing

Benefits:
- attach real datasets to courses
- generate applied exercises
- create "practice with this dataset" flows after theory sections

Implementation plan:
- Add `src/lib/ingest/providers/kaggle.ts`.
- Add a lightweight search flow for datasets relevant to a concept or course.
- Store dataset metadata, not raw files, at first.
- Add a new optional relation table or metadata field for:
  - `resource_id`
  - `provider`
  - `provider_item_id`
  - `title`
  - `download_url`
  - `license`
  - `tags`
- Surface datasets in:
  - `src/app/resource/[resourceId]/page.tsx`
  - future playground panels

Recommended first cut:
- metadata attachment only
- no background dataset downloads yet

## Suggested code changes

### Phase 1

- extend `src/lib/pipeline/stages/resolve-youtube.ts`
- extend `src/lib/pipeline/types.ts`
- extend `src/app/api/pipeline/route.ts`
- add provider metadata persistence in `write-to-db` or a new DB table

### Phase 2

- add `src/lib/ingest/providers/google-books.ts`
- add `src/lib/ingest/providers/open-library.ts`
- add `src/lib/ingest/providers/article-preview.ts`
- extend `src/app/api/resources/ingest/route.ts`
- extend `src/lib/ingest/content-resolver.ts`
- extend `src/app/library/unified-intake-panel.tsx`

### Phase 3

- add `src/lib/ingest/providers/news-adapter.ts`
- add `src/lib/ingest/providers/kaggle.ts`
- add new search routes under `src/app/api/resources/`

## Suggested data model additions

Recommended normalized table:

- `resource_provider_metadata`
  - `id`
  - `resource_id`
  - `provider`
  - `provider_item_id`
  - `provider_url`
  - `metadata_json`
  - `fetched_at`

Optional relation table for dataset attachments:

- `resource_external_assets`
  - `id`
  - `resource_id`
  - `provider`
  - `asset_type`
  - `title`
  - `url`
  - `license`
  - `metadata_json`

## Rollout

### P0

- YouTube Data API metadata enrichment

Outcome:
- immediate improvement to the main product path

### P1

- Google Books
- Open Library
- Microlink or LinkPreview

Outcome:
- better generic source intake
- first credible book-support path

### P2

- News adapter
- Kaggle

Outcome:
- broader source universe
- more applied learning flows

## Recommended env vars

- `YOUTUBE_API_KEY`
- `GOOGLE_BOOKS_API_KEY`
- `MICROLINK_API_KEY` or `LINKPREVIEW_API_KEY`
- `GNEWS_API_KEY`
- `CURRENTS_API_KEY`
- `NEWSDATA_API_KEY`
- `KAGGLE_USERNAME`
- `KAGGLE_KEY`

## Final recommendation

If only one thing ships first, it should be:

1. official YouTube metadata enrichment in the current pipeline
2. article preview enrichment for external-resource ingest
3. book metadata via Google Books + Open Library

That order strengthens the current product before expanding the source surface.
