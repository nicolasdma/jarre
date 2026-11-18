'use client';

/**
 * Concept nugget: signaling keywords big (Mayer: keywords, not the whole
 * script), the concept in one line, and when the drill has a recording, the
 * audio for the in-view post with karaoke captions. Passive by default; the
 * optional-tap variant flips to the definition. Nothing is required.
 */

import { useState } from 'react';
import type { FeedPost } from '@/lib/feed/feed-post';
import { conceptKeywords, type FeedGraph } from '@/lib/feed/feed-graph';
import type { FeedAudioController } from '../feed-audio';
import { ParticipationPill, PostShell } from './post-shell';
import { AudioToggle, CaptionLine } from './audio-bits';

export function ConceptNugget({
  post,
  graph,
  controller,
  active,
  reducedMotion,
}: {
  post: FeedPost;
  graph: FeedGraph;
  controller: FeedAudioController | null;
  active: boolean;
  reducedMotion: boolean;
}) {
  const concept = graph.concepts.find((c) => c.id === post.conceptId);
  const drill = post.drillSlug ? graph.drills[post.drillSlug] : undefined;
  const [flipped, setFlipped] = useState(false);
  const canFlip = post.profile.participation === 'optional-tap';
  const hasAudio = Boolean(drill?.audioUrl);
  if (!concept) return null;

  const keywords = conceptKeywords(concept.name);

  return (
    <PostShell
      post={post}
      active={active}
      reducedMotion={reducedMotion}
      label={`${concept.name}: concepto`}
      eyebrow={<>
        <span>{post.profile.novelty === 'new' ? 'Concepto' : 'Repaso'}</span>
        <ParticipationPill post={post} />
      </>}
      hint={canFlip ? 'Tocá para ver la definición · o seguí scrolleando' : undefined}
    >
      <div className="flex flex-wrap gap-2">
        {keywords.map((k) => (
          <span
            key={k}
            className="rounded-lg px-2.5 py-1 text-sm font-medium"
            style={{ background: 'color-mix(in srgb, var(--fp-accent) 14%, transparent)', color: 'var(--fp-accent)' }}
          >
            {k}
          </span>
        ))}
      </div>

      <h2 className="text-3xl font-semibold leading-tight sm:text-4xl" style={{ color: 'var(--fp-ink)' }}>
        {concept.name}
      </h2>

      {(!canFlip || flipped) ? (
        <p className="text-base leading-relaxed sm:text-lg" style={{ color: 'var(--fp-soft)' }} lang="es">
          {concept.definition}
        </p>
      ) : (
        <button
          type="button"
          onClick={() => setFlipped(true)}
          className="self-start rounded-xl border px-4 py-2 text-sm focus-visible:outline focus-visible:outline-2"
          style={{ background: 'var(--fp-surface)', color: 'var(--fp-ink)', borderColor: 'color-mix(in srgb, var(--fp-soft) 40%, transparent)' }}
        >
          ¿Qué es? · tocá para ver
        </button>
      )}

      {drill && (
        <div className="mt-2 space-y-3 border-l-2 pl-4" style={{ borderColor: 'color-mix(in srgb, var(--fp-accent) 40%, transparent)' }}>
          {hasAudio && <AudioToggle controller={controller} active={active} hasAudio={hasAudio} />}
          <CaptionLine controller={controller} active={active} text={drill.textEn} segments={drill.segments} />
        </div>
      )}
    </PostShell>
  );
}
