#!/usr/bin/env python3
"""
Extract and segment a YouTube video transcript for the translation pipeline.

Fetches the transcript using youtube-transcript-api, cleans caption artifacts,
and segments the text into ~500-word chunks using silence gaps as natural
boundaries. Output matches the existing section JSON format used by
translate-chapter.py and seed-sections.ts.

Usage:
  python scripts/ingest-youtube.py "https://www.youtube.com/watch?v=VIDEO_ID"
  python scripts/ingest-youtube.py VIDEO_ID
  python scripts/ingest-youtube.py VIDEO_ID --language en --chunk-size 500

Output:
  scripts/output/youtube-{VIDEO_ID}-sections.json

Requires:
  pip install youtube-transcript-api
"""

import argparse
import json
import re
import sys
from pathlib import Path

try:
    from youtube_transcript_api import YouTubeTranscriptApi
    from youtube_transcript_api._errors import (
        NoTranscriptFound,
        TranscriptsDisabled,
        VideoUnavailable,
        InvalidVideoId,
    )
except ImportError:
    print("Install: pip install youtube-transcript-api")
    sys.exit(1)


# ============================================================================
# Video ID extraction
# ============================================================================

# Patterns that match various YouTube URL formats
YOUTUBE_URL_PATTERNS: list[re.Pattern[str]] = [
    # Standard: https://www.youtube.com/watch?v=VIDEO_ID
    re.compile(r"(?:https?://)?(?:www\.)?youtube\.com/watch\?.*v=([a-zA-Z0-9_-]{11})"),
    # Short: https://youtu.be/VIDEO_ID
    re.compile(r"(?:https?://)?youtu\.be/([a-zA-Z0-9_-]{11})"),
    # Embed: https://www.youtube.com/embed/VIDEO_ID
    re.compile(r"(?:https?://)?(?:www\.)?youtube\.com/embed/([a-zA-Z0-9_-]{11})"),
    # Live: https://www.youtube.com/live/VIDEO_ID
    re.compile(r"(?:https?://)?(?:www\.)?youtube\.com/live/([a-zA-Z0-9_-]{11})"),
]

# Bare video ID: exactly 11 chars of [a-zA-Z0-9_-]
BARE_VIDEO_ID_PATTERN = re.compile(r"^[a-zA-Z0-9_-]{11}$")


def extract_video_id(url_or_id: str) -> str:
    """Extract the 11-character video ID from a URL or bare ID.

    Supports youtube.com/watch, youtu.be, youtube.com/embed, and bare IDs.

    Raises:
        ValueError: If the input doesn't match any known pattern.
    """
    url_or_id = url_or_id.strip()

    # Try URL patterns first
    for pattern in YOUTUBE_URL_PATTERNS:
        match = pattern.search(url_or_id)
        if match:
            return match.group(1)

    # Try bare video ID
    if BARE_VIDEO_ID_PATTERN.match(url_or_id):
        return url_or_id

    raise ValueError(
        f"Could not extract video ID from: {url_or_id}\n"
        "Expected a YouTube URL or an 11-character video ID."
    )


# ============================================================================
# Transcript fetching
# ============================================================================


def fetch_transcript(
    video_id: str, language: str = "en"
) -> tuple[list[dict], str, bool]:
    """Fetch the transcript for a video, preferring manual captions.

    Returns:
        (snippets, language_code, is_generated) where snippets is a list of
        dicts with 'text', 'start', and 'duration' keys.

    Raises:
        SystemExit: If no transcript is available.
    """
    ytt_api = YouTubeTranscriptApi()

    try:
        transcript_list = ytt_api.list(video_id)
    except TranscriptsDisabled:
        print(f"Error: Transcripts are disabled for video {video_id}.")
        print("This video does not allow subtitle access.")
        sys.exit(1)
    except VideoUnavailable:
        print(f"Error: Video {video_id} is unavailable or does not exist.")
        sys.exit(1)
    except InvalidVideoId:
        print(f"Error: '{video_id}' is not a valid YouTube video ID.")
        sys.exit(1)

    # List available transcripts for diagnostics
    available = []
    for t in transcript_list:
        label = f"  {'[auto]' if t.is_generated else '[manual]'} {t.language} ({t.language_code})"
        available.append(label)

    print(f"Available transcripts:")
    for label in available:
        print(label)

    # Strategy: try manual first, then auto-generated, in the requested language
    transcript = None
    is_generated = False

    try:
        transcript = transcript_list.find_manually_created_transcript([language])
        print(f"\nUsing manual transcript: {transcript.language} ({transcript.language_code})")
    except NoTranscriptFound:
        try:
            transcript = transcript_list.find_generated_transcript([language])
            is_generated = True
            print(f"\nUsing auto-generated transcript: {transcript.language} ({transcript.language_code})")
            print("Note: Auto-generated captions may contain errors.")
        except NoTranscriptFound:
            # Try English as ultimate fallback if not already requested
            if language != "en":
                try:
                    transcript = transcript_list.find_transcript(["en"])
                    is_generated = transcript.is_generated
                    print(f"\nFallback to English transcript: {transcript.language}")
                except NoTranscriptFound:
                    pass

    if transcript is None:
        print(f"\nError: No transcript found for language '{language}'.")
        print("Available languages:")
        for label in available:
            print(label)
        print("\nTry: --language <code> with one of the available language codes.")
        sys.exit(1)

    # Fetch the actual transcript data
    fetched = transcript.fetch()
    snippets = [
        {"text": s.text, "start": s.start, "duration": s.duration}
        for s in fetched
    ]

    if not snippets:
        print("Error: Transcript is empty (no text segments found).")
        sys.exit(1)

    return snippets, transcript.language_code, is_generated


# ============================================================================
# Transcript cleaning
# ============================================================================

# Patterns for auto-generated caption artifacts
ARTIFACT_PATTERNS: list[re.Pattern[str]] = [
    re.compile(r"\[Music\]", re.IGNORECASE),
    re.compile(r"\[Applause\]", re.IGNORECASE),
    re.compile(r"\[Laughter\]", re.IGNORECASE),
    re.compile(r"\[Silence\]", re.IGNORECASE),
    re.compile(r"\[Background noise\]", re.IGNORECASE),
    re.compile(r"\[Inaudible\]", re.IGNORECASE),
    re.compile(r"^\s*$"),
]


def clean_text(text: str) -> str:
    """Remove auto-generated caption artifacts from a single text segment."""
    cleaned = text
    for pattern in ARTIFACT_PATTERNS:
        cleaned = pattern.sub("", cleaned)
    return cleaned.strip()


def deduplicate_consecutive(words: list[str], max_repeat: int = 3) -> list[str]:
    """Remove consecutive repeated words that appear more than max_repeat times.

    Auto-generated captions sometimes stutter: "the the the the solution".
    """
    if not words:
        return words

    result: list[str] = [words[0]]
    repeat_count = 1

    for i in range(1, len(words)):
        if words[i].lower() == words[i - 1].lower():
            repeat_count += 1
            if repeat_count <= max_repeat:
                result.append(words[i])
        else:
            repeat_count = 1
            result.append(words[i])

    return result


def clean_transcript_text(raw_text: str) -> str:
    """Clean up the full transcript text after joining segments."""
    # Remove artifact markers
    for pattern in ARTIFACT_PATTERNS:
        raw_text = pattern.sub("", raw_text)

    # Deduplicate consecutive repeated words (auto-caption stutter)
    words = raw_text.split()
    words = deduplicate_consecutive(words)
    raw_text = " ".join(words)

    # Collapse multiple spaces
    raw_text = re.sub(r" {2,}", " ", raw_text)

    # Remove leading/trailing whitespace per line
    lines = [line.strip() for line in raw_text.split("\n")]
    raw_text = "\n".join(lines)

    # Collapse multiple blank lines
    raw_text = re.sub(r"\n{3,}", "\n\n", raw_text)

    return raw_text.strip()


# ============================================================================
# Timestamp formatting
# ============================================================================


def format_timestamp(seconds: float) -> str:
    """Format seconds into MM:SS or H:MM:SS."""
    total_seconds = int(seconds)
    hours = total_seconds // 3600
    minutes = (total_seconds % 3600) // 60
    secs = total_seconds % 60

    if hours > 0:
        return f"{hours}:{minutes:02d}:{secs:02d}"
    return f"{minutes}:{secs:02d}"


# ============================================================================
# Segmentation
# ============================================================================

# Silence gap threshold (seconds) — used as a natural section boundary
SILENCE_GAP_THRESHOLD = 5.0


def segment_transcript(
    snippets: list[dict], chunk_size: int = 500
) -> list[dict]:
    """Segment transcript snippets into chunks of approximately chunk_size words.

    Uses silence gaps (>SILENCE_GAP_THRESHOLD seconds between segments)
    as natural boundaries. If no gap is found within the target range,
    falls back to the nearest sentence-ending punctuation.

    Returns a list of sections with text, start/end timestamps, and word count.
    """
    if not snippets:
        return []

    # Pre-process: join snippet text and track boundaries
    # Each snippet has: text, start, duration
    # A "gap" is the time between the end of one snippet and the start of the next

    # Build a list of (text, start_time, end_time, gap_after) per snippet
    processed: list[dict] = []
    for i, s in enumerate(snippets):
        text = clean_text(s["text"])
        if not text:
            continue

        start = s["start"]
        end = start + s["duration"]

        gap_after = 0.0
        if i < len(snippets) - 1:
            next_start = snippets[i + 1]["start"]
            gap_after = next_start - end

        processed.append({
            "text": text,
            "start": start,
            "end": end,
            "gap_after": gap_after,
        })

    if not processed:
        return []

    # Group snippets into chunks
    sections: list[dict] = []
    current_texts: list[str] = []
    current_word_count = 0
    chunk_start = processed[0]["start"]

    for i, snippet in enumerate(processed):
        words = snippet["text"].split()
        current_texts.append(snippet["text"])
        current_word_count += len(words)
        chunk_end = snippet["end"]

        # Decide whether to break here
        should_break = False
        is_last = i == len(processed) - 1

        if is_last:
            should_break = True
        elif current_word_count >= chunk_size:
            # We have enough words. Break at a silence gap if available.
            if snippet["gap_after"] >= SILENCE_GAP_THRESHOLD:
                should_break = True
            else:
                # Look ahead: if we're significantly over target, break anyway
                # to avoid very large chunks
                if current_word_count >= chunk_size * 1.3:
                    should_break = True
                # Otherwise, check if this snippet ends with sentence-ending punctuation
                elif snippet["text"].rstrip().endswith((".", "!", "?", ":", ";")):
                    should_break = True
        elif current_word_count >= chunk_size * 0.7:
            # Near target: break at silence gaps
            if snippet["gap_after"] >= SILENCE_GAP_THRESHOLD:
                should_break = True

        if should_break and current_texts:
            # Join and clean the chunk text
            joined = " ".join(current_texts)
            joined = clean_transcript_text(joined)
            word_count = len(joined.split())

            if word_count > 0:
                sections.append({
                    "text": joined,
                    "start": chunk_start,
                    "end": chunk_end,
                    "word_count": word_count,
                })

            # Reset for next chunk
            current_texts = []
            current_word_count = 0
            if i < len(processed) - 1:
                chunk_start = processed[i + 1]["start"]

    return sections


# ============================================================================
# Output formatting
# ============================================================================


def build_output(
    sections: list[dict],
    video_id: str,
    resource_id: str | None = None,
    concept_id: str = "to-be-mapped",
) -> list[dict]:
    """Build the output JSON matching the existing section format.

    Each section gets a title with timestamps: "Part N (MM:SS - MM:SS)".
    """
    effective_resource_id = resource_id or f"youtube-{video_id}"
    output: list[dict] = []

    for i, section in enumerate(sections):
        start_ts = format_timestamp(section["start"])
        end_ts = format_timestamp(section["end"])

        output.append({
            "resource_id": effective_resource_id,
            "concept_id": concept_id,
            "section_title": f"Part {i + 1} ({start_ts} - {end_ts})",
            "sort_order": i,
            "content_original": section["text"],
            "word_count": section["word_count"],
        })

    return output


# ============================================================================
# Main
# ============================================================================


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Extract and segment a YouTube video transcript for translation."
    )
    parser.add_argument(
        "video",
        help="YouTube URL or 11-character video ID",
    )
    parser.add_argument(
        "--resource-id",
        help="Override the resource_id field (default: youtube-VIDEO_ID)",
    )
    parser.add_argument(
        "--concept-id",
        default="to-be-mapped",
        help="Override the concept_id for all sections (default: to-be-mapped)",
    )
    parser.add_argument(
        "--language",
        default="en",
        help="Preferred transcript language code (default: en)",
    )
    parser.add_argument(
        "--chunk-size",
        type=int,
        default=500,
        help="Target words per chunk (default: 500)",
    )
    parser.add_argument(
        "--output-dir",
        default="scripts/output",
        help="Output directory (default: scripts/output)",
    )
    args = parser.parse_args()

    # 1. Extract video ID
    try:
        video_id = extract_video_id(args.video)
    except ValueError as e:
        print(f"Error: {e}")
        sys.exit(1)

    print(f"Video ID: {video_id}")

    # 2. Fetch transcript
    snippets, lang_code, is_generated = fetch_transcript(video_id, args.language)
    total_words = sum(len(clean_text(s["text"]).split()) for s in snippets)
    total_duration = max(s["start"] + s["duration"] for s in snippets)
    print(f"Transcript: {len(snippets)} segments, {total_words} words, {format_timestamp(total_duration)} duration")
    if is_generated:
        print("Warning: Using auto-generated captions. Quality may vary.")

    # 3. Segment into chunks
    sections = segment_transcript(snippets, chunk_size=args.chunk_size)
    print(f"\nSegmented into {len(sections)} sections (target ~{args.chunk_size} words each):")
    for i, sec in enumerate(sections):
        start_ts = format_timestamp(sec["start"])
        end_ts = format_timestamp(sec["end"])
        print(f"  [{i}] Part {i + 1} ({start_ts} - {end_ts}): {sec['word_count']} words")

    # 4. Build output
    output = build_output(
        sections,
        video_id,
        resource_id=args.resource_id,
        concept_id=args.concept_id,
    )

    # 5. Save
    out_dir = Path(args.output_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    output_file = out_dir / f"youtube-{video_id}-sections.json"
    output_file.write_text(
        json.dumps(output, indent=2, ensure_ascii=False), encoding="utf-8"
    )

    total_output_words = sum(s["word_count"] for s in output)
    print(f"\nSaved to {output_file}")
    print(f"Total: {total_output_words} words across {len(output)} sections")
    print(f"Next: python scripts/translate-chapter.py {output_file}")


if __name__ == "__main__":
    main()
