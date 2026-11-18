'use client';

/**
 * Concept nugget: the "photo post" of the feed. The concept in big type on a
 * color block, never a paragraph. Three looks by the matrix's visual vibe, so
 * two nuggets never read the same:
 * - polished: a poster (huge title, its subtitle as a kicker, the lead line,
 *   hashtag chips, a geometric mark).
 * - plain: a pull quote (the lead line in display serif, a giant quote mark).
 * - raw: a note pinned to the block (ruled paper, mono, a marker underline).
 * With a recording, the bottom of the media is a voice strip (play, waveform,
 * the phrase being said) and the caption carries the full spoken text,
 * karaoke-lit. The optional-tap variant hides the lead line behind a blur you
 * tap to read (or don't).
 */

import { useState } from 'react';
import type { FeedPost } from '@/lib/feed/feed-post';
import { hashtags, leadLine } from '@/lib/feed/feed-identity';
import { useFeedContext } from '../feed-context';
import { CardFrame, Caption, Media, lessonHrefFor, participationHint } from './card-frame';
import { KaraokeCaption, VoiceStrip } from './audio-bits';
import { InlineText } from './inline-text';

function titleSize(title: string): string {
  if (title.length > 44) return 'text-[30px] sm:text-[34px]';
  if (title.length > 26) return 'text-[36px] sm:text-[40px]';
  return 'text-[46px] sm:text-[52px]';
}

/** The lead line, or a blurred version you tap to read. */
function Lead({ text, hidden, onReveal, className }: { text: string; hidden: boolean; onReveal: () => void; className: string }) {
  if (!hidden) return <p lang="en" className={className}><InlineText text={text} /></p>;
  return (
    <button type="button" onClick={onReveal} className="relative block w-full text-left focus-visible:outline focus-visible:outline-2" aria-label="Ver qué es">
      <span aria-hidden lang="en" className={`${className} block select-none blur-[6px]`}>{text}</span>
      <span
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full px-3.5 py-1.5 text-[12px] font-semibold"
        style={{ background: 'var(--fp-ink)', color: 'var(--fp-bg)' }}
      >
        ¿Qué es? · tocá
      </span>
    </button>
  );
}

export function ConceptNugget({ post, active, reducedMotion }: { post: FeedPost; active: boolean; reducedMotion: boolean }) {
  const { graph, accounts, controller, audioUrl } = useFeedContext();
  const concept = graph.concepts.find((c) => c.id === post.conceptId);
  const account = post.conceptId ? accounts[post.conceptId] : undefined;
  const drill = post.drillSlug ? graph.drills[post.drillSlug] : undefined;
  const canFlip = post.profile.participation === 'optional-tap';
  const [shown, setShown] = useState(!canFlip);
  if (!concept || !account) return null;

  const title = account.title;
  const lead = leadLine(concept.definition, title);
  const audio = audioUrl(post.drillSlug);
  const keywords = hashtags(account.subtitle ?? concept.name);
  const vibe = post.profile.visual;
  const reveal = () => setShown(true);

  const repeat = () => {
    setShown(!canFlip);
    if (audio && controller) {
      controller.prime();
      if (controller.getStatus().activeKey === post.key) controller.restart();
      else {
        controller.setActive(post.key, audio);
        controller.play();
      }
    }
  };

  const voice = audio && drill ? (
    <VoiceStrip postKey={post.key} src={audio} text={drill.textEn} segments={drill.segments} controller={controller} />
  ) : null;
  // Room at the bottom for the voice strip so text never sits under it.
  const pad = voice ? 'pb-[150px]' : 'pb-7';

  let media: React.ReactNode;
  if (vibe === 'plain') {
    media = (
      <Media post={post} className="aspect-[4/5]">
        <div className={`flex h-full flex-col px-7 pt-8 ${pad}`}>
          <span aria-hidden className="font-[family-name:var(--font-serif-display)] text-[120px] leading-[0.6]" style={{ color: 'var(--fp-accent)' }}>
            &ldquo;
          </span>
          <div className="flex flex-1 items-center py-4">
            <Lead
              text={lead}
              hidden={!shown}
              onReveal={reveal}
              className="line-clamp-5 font-[family-name:var(--font-serif-display)] text-[30px] leading-[1.12] sm:text-[33px]"
            />
          </div>
          {/* With a voice strip the attribution would crowd its subtitle; the header names the account. */}
          {!voice && (
            <p className="mt-4 text-[13px] font-semibold uppercase tracking-[0.12em]" style={{ color: 'var(--fp-soft)' }}>
              — {title}
            </p>
          )}
        </div>
        {voice}
      </Media>
    );
  } else if (vibe === 'raw') {
    media = (
      <Media post={post} className={voice ? "aspect-[4/5]" : "aspect-square"}>
        <div className={`flex h-full items-start justify-center px-6 pt-8 ${voice ? 'pb-[150px]' : 'pb-8'}`}>
          <div
            className="relative w-full max-w-[380px] rotate-[-1.5deg] rounded-[4px] px-5 pb-5 pt-7 font-mono shadow-[0_10px_30px_-12px_rgba(0,0,0,0.45)]"
            style={{
              background: '#fbf8ef',
              color: '#24221c',
              backgroundImage: 'repeating-linear-gradient(to bottom, transparent 0 25px, rgba(60,90,160,0.16) 25px 26px)',
            }}
          >
            <span aria-hidden className="absolute -top-3 left-1/2 h-6 w-24 -translate-x-1/2 rotate-[2deg] rounded-[2px] opacity-80" style={{ background: 'rgba(222, 205, 160, 0.85)' }} />
            <p className="text-[11px] uppercase tracking-[0.16em] text-[#6f695a]">nota</p>
            <p className="mt-1 text-[22px] font-bold leading-tight">
              <span style={{ backgroundImage: 'linear-gradient(transparent 55%, rgba(253, 224, 71, 0.75) 55%)' }}>{title}</span>
            </p>
            <div className="mt-3">
              <Lead text={lead} hidden={!shown} onReveal={reveal} className="line-clamp-5 text-[14px] leading-[26px]" />
            </div>
          </div>
        </div>
        {voice}
      </Media>
    );
  } else {
    media = (
      <Media post={post} className="aspect-[4/5]">
        {/* A geometric mark: a disc half off the corner and a dot field. */}
        <svg aria-hidden className="absolute -right-16 -top-16 h-64 w-64" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="50" fill="var(--fp-accent)" opacity="0.9" />
          <circle cx="50" cy="50" r="30" fill="none" stroke="var(--fp-bg)" strokeWidth="1.2" opacity="0.5" />
        </svg>
        {!voice && (
          <svg aria-hidden className="absolute bottom-6 right-6 h-20 w-20 opacity-30" viewBox="0 0 60 60">
            {Array.from({ length: 36 }, (_, i) => (
              <circle key={i} cx={5 + (i % 6) * 10} cy={5 + Math.floor(i / 6) * 10} r="1.6" fill="var(--fp-ink)" />
            ))}
          </svg>
        )}
        <div className={`relative flex h-full flex-col justify-end px-6 pt-8 ${pad}`}>
          {account.subtitle && (
            // On a phone the kicker can climb into the disc (a long subtitle, or
            // the voice strip pushing the text up). Each of its lines sits on a
            // band of the block's own color, invisible on the plain block and a
            // clean cut-out where it crosses the disc, so it always reads.
            <p className="-ml-1 mb-2 max-w-[85%] text-[13px] font-semibold uppercase leading-[1.55] tracking-[0.14em]" style={{ color: 'var(--fp-soft)' }}>
              <span className="rounded-[3px] px-1 py-px [-webkit-box-decoration-break:clone] [box-decoration-break:clone]" style={{ background: 'var(--fp-bg)' }}>
                {account.subtitle}
              </span>
            </p>
          )}
          <h2 className={`font-black leading-[0.95] tracking-[-0.03em] ${titleSize(title)}`} style={{ color: 'var(--fp-ink)' }}>
            {title}
          </h2>
          <div className="mt-4 max-w-[92%]">
            <Lead text={lead} hidden={!shown} onReveal={reveal} className="line-clamp-3 text-[16px] leading-snug" />
          </div>
          {!voice && (
            <div className="mt-5 flex flex-wrap gap-1.5">
              {keywords.map((k) => (
                <span key={k} className="rounded-full px-2.5 py-1 text-[12px] font-semibold" style={{ background: 'var(--fp-accent)', color: 'var(--fp-on-accent)' }}>
                  #{k}
                </span>
              ))}
            </div>
          )}
        </div>
        {voice}
      </Media>
    );
  }

  return (
    <CardFrame
      post={post}
      active={active}
      reducedMotion={reducedMotion}
      label={`${title}: concepto`}
      kindLabel={post.profile.novelty === 'new' ? 'Concepto nuevo' : 'Concepto · repaso'}
      hint={participationHint(post)}
      media={media}
      actions={{ audioSrc: audio, onRepeat: repeat, lessonHref: lessonHrefFor(graph.resourceId, post) }}
      caption={
        <Caption handle={account.handle} lang="en">
          {drill ? <KaraokeCaption postKey={post.key} text={drill.textEn} segments={drill.segments} controller={controller} /> : concept.definition}
        </Caption>
      }
    />
  );
}
