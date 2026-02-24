# Translation API Comparison Test Plan

**Date:** 2026-02-10
**Status:** Pending — run after pipeline is implemented

## Context

The current DDIA translations were done via **Claude Code (terminal)**, NOT DeepSeek.
The quality baseline (ratio 1.10, faithful, no summarization) comes from Claude Opus/Sonnet.
DeepSeek V3 has NEVER been tested for translation in this project.

## Test Design

Take DDIA Ch1 (already translated by Claude Code) as the reference.
Run the same chapter through `translate-chapter.py` with each API.
Compare outputs.

## Candidates

| Model | Input $/M | Output $/M | Est. cost/300pg book |
|-------|-----------|------------|---------------------|
| DeepSeek V3 | $0.27 | $1.10 | ~$1.50 |
| Kimi K2 | $0.60 | $2.00 | ~$3.00 |
| Claude Haiku 4.5 | $0.80 | $4.00 | ~$5.00 |
| Claude Sonnet 4.5 | $3.00 | $15.00 | ~$18.00 |

## Metrics to Compare

1. **Word ratio** (ES/EN) — target: 0.95-1.15
2. **Sentence count preservation** — same # of sentences in/out
3. **Technical term accuracy** — spot-check 20 terms against glossary
4. **Summarization detection** — any paragraphs shorter than 85% of original?
5. **Fluency** — read 5 random paragraphs, rate naturalness 1-5
6. **Cost** — actual tokens used and $ spent

## Decision Matrix

- If DeepSeek passes all metrics → use it (best margins)
- If only Haiku passes → use Haiku, price books at ~$5
- If only Sonnet passes → need higher pricing (~$10-15/book) or subsidize with volume
- Kimi K2 as fallback for rate limit / downtime scenarios

## Important

The anti-summarization prompt in `translate-chapter.py` was designed and tested with DeepSeek,
but the ACTUAL translations that the user validated were done by Claude.
The prompt may need tuning per model.
