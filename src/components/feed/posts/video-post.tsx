'use client';

/**
 * A real YouTube video or short on the concept, as a feed post. Rules it
 * follows (docs/feed-mode/04-contenido-real-redes.md, YouTube RMF and
 * Developer Policies):
 *
 * - Embedded only: the privacy-enhanced iframe (youtube-nocookie.com), never
 *   downloaded or re-hosted; the player is never covered, cropped or framed
 *   over (the facade below is shown INSTEAD of the iframe, never on top).
 * - Lazy: a thumbnail facade until the post is the one on screen; the iframe
 *   (~1 MB of player) mounts only to play, so the feed stays light.
 * - Muted autoplay only when the post is the active one AND more than half of
 *   the player is visible, and not with reduced motion. A tap plays with sound.
 * - One player at a time: a tiny module store holds the post that may play;
 *   claiming it unmounts every other player.
 * - Attribution: the channel and the title, a link to the video on YouTube,
 *   a link to YouTube's Terms of Service, and "YouTube" in the header so the
 *   post never passes as Jarre's own content (policy III.C.5).
 * - Swipe-safe: a short is a 9:16 box no taller than ~68% of the screen, with
 *   free palette margins on both sides; a long video keeps a margin around
 *   it, so the scroll gesture always has room outside the iframe.
 */

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Play } from 'lucide-react';
import type { FeedPost } from '@/lib/feed/feed-post';
import { formatSeconds, youtubeEmbedUrl, youtubeThumbUrl, youtubeWatchUrl } from '@/lib/feed/feed-videos';
import { useFeedContext } from '../feed-context';
import { CardFrame, Caption, Media, lessonHrefFor } from './card-frame';

const YOUTUBE_TERMS = 'https://www.youtube.com/t/terms';

// ---------------------------------------------------------------------------
// The one player that may play.
// ---------------------------------------------------------------------------

/** The post that may play, and whether the reader asked for sound (a tap) or it autoplays muted. */
interface Player {
  key: string;
  sound: boolean;
}

let current: Player | null = null;
const listeners = new Set<() => void>();

function claim(next: Player | null): void {
  if (current?.key === next?.key && current?.sound === next?.sound) return;
  current = next;
  for (const l of listeners) l();
}

function release(key: string): void {
  if (current?.key === key) claim(null);
}

function subscribe(l: () => void): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}

function useCurrentPlayer(): Player | null {
  return useSyncExternalStore(subscribe, () => current, () => null);
}

/** More than half of `ref` is in the viewport. One observer per mounted video post. */
function useMostlyVisible(ref: React.RefObject<HTMLElement | null>): boolean {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([e]) => setVisible(e.intersectionRatio > 0.5), { threshold: [0, 0.5, 0.51, 1] });
    io.observe(el);
    return () => io.disconnect();
  }, [ref]);
  return visible;
}

export function VideoPost({ post, active, reducedMotion }: { post: FeedPost; active: boolean; reducedMotion: boolean }) {
  const { graph, accounts } = useFeedContext();
  const video = post.videoId ? graph.videos?.[post.videoId] : undefined;
  const boxRef = useRef<HTMLDivElement>(null);
  const visible = useMostlyVisible(boxRef);
  const player = useCurrentPlayer();
  const currentKey = player?.key ?? null;
  const playing = currentKey === post.key;
  const withSound = playing && Boolean(player?.sound);

  // Muted autoplay: the active post, more than half visible, motion allowed.
  useEffect(() => {
    if (!video) return;
    if (active && visible && !reducedMotion) {
      // Never steal the player from a post the reader started that is still in view.
      if (currentKey === null) claim({ key: post.key, sound: false });
    } else if (!visible) {
      release(post.key);
    }
  }, [active, visible, reducedMotion, video, post.key, currentKey]);

  useEffect(() => () => release(post.key), [post.key]);

  if (!video) return null;

  const isShort = video.kind === 'short';
  const account = accounts[post.conceptId];
  const segment = video.start !== undefined && video.end !== undefined ? `${formatSeconds(video.start)}–${formatSeconds(video.end)}` : null;
  const kindLabel = `YouTube · ${isShort ? 'Short' : segment ? 'Fragmento' : 'Video'}${video.lang === 'es' ? ' · en español' : ''}`;
  const origin = typeof window !== 'undefined' ? window.location.origin : undefined;

  const box = (
    <div
      ref={boxRef}
      className={isShort ? 'relative mx-auto aspect-[9/16] h-[min(68svh,600px)] max-w-full overflow-hidden rounded-[10px] bg-black' : 'relative aspect-video w-full overflow-hidden rounded-[10px] bg-black'}
    >
      {playing ? (
        <iframe
          key={withSound ? 'sound' : 'muted'}
          src={youtubeEmbedUrl(video, { autoplay: true, muted: !withSound, origin })}
          title={video.title}
          className="absolute inset-0 h-full w-full border-0"
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      ) : (
        <button
          type="button"
          onClick={() => claim({ key: post.key, sound: true })}
          aria-label={`Reproducir: ${video.title}`}
          className="group absolute inset-0 h-full w-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- a remote thumbnail facade; next/image would need a remote pattern in next.config */}
          <img
            src={youtubeThumbUrl(video.videoId)}
            alt=""
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover opacity-90 transition-opacity group-hover:opacity-100"
          />
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition-transform group-hover:scale-105">
              <Play size={26} fill="currentColor" className="translate-x-[1px]" />
            </span>
          </span>
          <span className="absolute bottom-2 right-2 rounded bg-black/75 px-1.5 py-0.5 font-mono text-[11px] text-white">
            {segment ?? formatSeconds(video.durationSec)}
          </span>
        </button>
      )}
    </div>
  );

  return (
    <CardFrame
      post={post}
      kindLabel={kindLabel}
      label={`${kindLabel}: ${video.title}`}
      active={active}
      reducedMotion={reducedMotion}
      actions={{ lessonHref: lessonHrefFor(graph.resourceId, post) }}
      media={
        <Media post={post} data-video-kind={video.kind} className={isShort ? 'px-10 py-4 sm:px-14' : 'px-3.5 py-3.5'}>
          {box}
        </Media>
      }
      caption={
        <>
          <Caption handle={video.channel} lang={video.lang}>
            {video.title}
            {video.chapter ? ` · ${video.chapter}` : ''}
          </Caption>
          <p className="px-4 pt-1 text-[12px] text-neutral-500 dark:text-neutral-400">
            <a href={youtubeWatchUrl(video)} target="_blank" rel="noopener noreferrer" className="underline-offset-2 hover:underline">
              Ver en YouTube
            </a>
            {account ? <span> · sobre {account.handle}</span> : null}
            <span> · </span>
            <a href={YOUTUBE_TERMS} target="_blank" rel="noopener noreferrer" className="underline-offset-2 hover:underline">
              Términos de YouTube
            </a>
          </p>
        </>
      }
    />
  );
}
