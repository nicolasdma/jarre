'use client';

/**
 * The card every feed post is: a self-contained publication in a column, the
 * way a social feed shows a post. Header (the topic "account": avatar, handle,
 * family, what kind of post), a media block in the post's palette (each kind
 * draws its own), an action row with REAL actions (listen, repeat, open in the
 * lesson, save for later; no likes, no follower counts, no comments), and a
 * caption under it.
 *
 * The chrome is neutral and follows the app theme; the color lives in the
 * media. The matrix profile is written to data-* so the feed is inspectable
 * and testable. Nothing here blocks the scroll: interaction is in the media,
 * always optional.
 */

import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import {
  AppWindow,
  ArrowLeftRight,
  ArrowRightLeft,
  ArrowUpRight,
  Bookmark,
  Bug,
  ChartNoAxesColumn,
  ChartSpline,
  Grid3x3,
  Hash,
  Headphones,
  Layers,
  Pause,
  RotateCcw,
  Sparkles,
  SquareSplitHorizontal,
  SquareStack,
  Table2,
  Timer,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FeedPost } from '@/lib/feed/feed-post';
import type { AccountIcon, FeedAccount } from '@/lib/feed/feed-identity';
import { avatarColors, paletteVars } from '../feed-palette';
import { useFeedContext } from '../feed-context';
import { savedId, useSavedVersion } from '../feed-saved';
import { useFeedAudioStatus } from '../use-feed-audio';

export { lessonHrefFor, participationHint } from '@/lib/feed/feed-links';

const ICONS: Record<AccountIcon, LucideIcon> = {
  hash: Hash,
  stack: SquareStack,
  window: AppWindow,
  grid: Grid3x3,
  split: SquareSplitHorizontal,
  table: Table2,
  pointers: ArrowLeftRight,
  bars: ChartNoAxesColumn,
  bug: Bug,
  layers: Layers,
  arrows: ArrowRightLeft,
  curve: ChartSpline,
  clock: Timer,
  spark: Sparkles,
};

/** The account's round avatar: its family icon on its own stable color. */
export function AccountAvatar({ account, size = 32, ring = false }: { account: FeedAccount | null; size?: number; ring?: boolean }) {
  const Icon = account ? ICONS[account.icon] : Sparkles;
  const colors = avatarColors(account?.avatarIndex ?? 6);
  const inner = (
    <span
      aria-hidden
      className="flex shrink-0 items-center justify-center rounded-full"
      style={{ width: size, height: size, background: colors.bg, color: colors.ink }}
    >
      <Icon size={Math.round(size * 0.5)} strokeWidth={2.2} />
    </span>
  );
  if (!ring) return inner;
  return (
    <span
      aria-hidden
      className="flex shrink-0 items-center justify-center rounded-full p-[2px]"
      style={{ background: 'conic-gradient(from 210deg, #f59e0b, #ef4444, #a855f7, #3b82f6, #10b981, #f59e0b)' }}
    >
      <span className="rounded-full bg-white p-[2px] dark:bg-[#0f0f10]">{inner}</span>
    </span>
  );
}

/** A post's palette applied to its media block, with the post's look attributes. */
export function Media({
  post,
  children,
  className,
  style,
  ...rest
}: { post: FeedPost; children: ReactNode; className?: string; style?: React.CSSProperties } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('relative overflow-hidden', className)}
      style={{ ...paletteVars(post.paletteIndex), background: 'var(--fp-bg)', color: 'var(--fp-ink)', ...style }}
      {...rest}
    >
      {children}
    </div>
  );
}

export interface CardActionsSpec {
  /** The recording this card can play, if any. */
  audioSrc?: string | null;
  /** Reset the card's interaction (and replay its audio). */
  onRepeat?: () => void;
  /** Where in the lesson this lives. */
  lessonHref?: string | null;
}

function ActionButton({
  label,
  onClick,
  children,
  pressed,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
  pressed?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={pressed}
      title={label}
      className="-m-1.5 flex h-10 w-10 items-center justify-center rounded-full text-neutral-900 transition-colors hover:bg-black/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 dark:text-neutral-100 dark:hover:bg-white/10"
    >
      {children}
    </button>
  );
}

function CardActions({ post, spec }: { post: FeedPost; spec: CardActionsSpec }) {
  const { controller, saved } = useFeedContext();
  useSavedVersion(saved);
  const status = useFeedAudioStatus(controller);
  const id = savedId(post);
  const isSaved = saved?.has(id) ?? false;
  const mine = status.activeKey === post.key;
  const playing = mine && status.playing;

  const listen = () => {
    if (!controller || !spec.audioSrc) return;
    controller.prime();
    if (!mine) {
      controller.setActive(post.key, spec.audioSrc);
      controller.play();
    } else {
      controller.toggle();
    }
  };

  return (
    <div className="flex items-center gap-4 px-4 pt-3">
      {spec.audioSrc && (
        <ActionButton label={playing ? 'Pausar' : 'Escuchar'} onClick={listen} pressed={playing}>
          {playing ? <Pause size={24} strokeWidth={1.9} /> : <Headphones size={24} strokeWidth={1.9} />}
        </ActionButton>
      )}
      {spec.onRepeat && (
        <ActionButton label="Repetir" onClick={spec.onRepeat}>
          <RotateCcw size={23} strokeWidth={1.9} />
        </ActionButton>
      )}
      {spec.lessonHref && (
        <Link
          href={spec.lessonHref}
          aria-label="Abrir en la lección"
          title="Abrir en la lección"
          className="-m-1.5 flex h-10 w-10 items-center justify-center rounded-full text-neutral-900 transition-colors hover:bg-black/5 focus-visible:outline focus-visible:outline-2 dark:text-neutral-100 dark:hover:bg-white/10"
        >
          <ArrowUpRight size={25} strokeWidth={1.9} />
        </Link>
      )}
      <span className="flex-1" />
      <ActionButton label={isSaved ? 'Quitar de guardados' : 'Guardar para después'} onClick={() => saved?.toggle(id)} pressed={isSaved}>
        <Bookmark size={24} strokeWidth={1.9} fill={isSaved ? 'currentColor' : 'none'} />
      </ActionButton>
    </div>
  );
}

/** A caption that clamps to two lines, with an honest "más" only when it overflows. */
export function Caption({ handle, children, lang }: { handle?: string; children: ReactNode; lang?: string }) {
  const [open, setOpen] = useState(false);
  const [overflows, setOverflows] = useState(false);
  const ref = useRef<HTMLParagraphElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (el && !open) setOverflows(el.scrollHeight > el.clientHeight + 1);
  }, [open, children]);
  return (
    <div className="px-4 pt-2 text-[14px] leading-[1.45] text-neutral-900 dark:text-neutral-100">
      <p ref={ref} lang={lang} className={cn(!open && 'line-clamp-2')}>
        {handle && <span className="mr-1.5 font-semibold">{handle}</span>}
        {children}
      </p>
      {!open && overflows && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-0.5 text-[14px] text-neutral-500 hover:underline focus-visible:outline focus-visible:outline-2 dark:text-neutral-400"
        >
          más
        </button>
      )}
    </div>
  );
}

/** The quiet line at the bottom of a card (the place a timestamp goes). */
function MetaLine({ post }: { post: FeedPost }) {
  const text =
    post.profile.novelty === 'new'
      ? 'Nuevo en tu feed'
      : post.pass > 0
        ? `Vuelve · ${post.pass + 1}ª vez`
        : 'Repaso';
  return (
    <p className="px-4 pb-4 pt-1.5 text-[11px] uppercase tracking-[0.06em] text-neutral-500 dark:text-neutral-400">{text}</p>
  );
}

export function CardFrame({
  post,
  kindLabel,
  hint,
  media,
  caption,
  actions,
  active,
  reducedMotion,
  label,
  compact = false,
}: {
  post: FeedPost;
  /** A short card: no action row and no meta line (the progress card). */
  compact?: boolean;
  /** What this post is: "Concepto", "Quiz", "Big-O"… shown under the handle. */
  kindLabel: string;
  /** Optional participation note on the right of the header ("tocá si querés"). */
  hint?: string;
  media: ReactNode;
  caption?: ReactNode;
  actions: CardActionsSpec;
  active: boolean;
  reducedMotion: boolean;
  /** aria-label for the article. */
  label: string;
}) {
  const { accounts } = useFeedContext();
  const account = post.conceptId ? accounts[post.conceptId] ?? null : null;
  return (
    <article
      aria-label={label}
      data-feed-post
      data-kind={post.kind}
      data-participation={post.profile.participation}
      data-energy={post.profile.energy}
      data-visual={post.profile.visual}
      data-density={post.profile.density}
      data-novelty={post.profile.novelty}
      data-palette={post.paletteIndex}
      data-pass={post.pass}
      data-active={active ? 'true' : 'false'}
      className={cn(
        'overflow-hidden rounded-[14px] border border-black/[0.08] bg-white dark:border-white/[0.09] dark:bg-[#0f0f10]',
        !reducedMotion && 'motion-safe:animate-[feedcard-in_360ms_ease-out_both]',
      )}
    >
      <header className="flex items-center gap-3 px-3.5 py-2.5">
        <AccountAvatar account={account} ring={post.profile.novelty === 'new'} />
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate text-[14px] text-neutral-900 dark:text-neutral-100">
            <span className="font-semibold">{account?.handle ?? 'jarre'}</span>
            {account && <span className="text-neutral-500 dark:text-neutral-400"> · {account.family}</span>}
          </p>
          <p className="truncate text-[12px] text-neutral-500 dark:text-neutral-400">{kindLabel}</p>
        </div>
        {hint && (
          <span className="shrink-0 rounded-full border border-black/10 px-2.5 py-1 text-[11px] text-neutral-600 dark:border-white/15 dark:text-neutral-300">
            {hint}
          </span>
        )}
      </header>
      {media}
      {!compact && <CardActions post={post} spec={actions} />}
      {caption}
      {compact ? <div className="h-1" /> : <MetaLine post={post} />}
    </article>
  );
}
