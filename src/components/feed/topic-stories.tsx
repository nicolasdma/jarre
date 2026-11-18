'use client';

/**
 * The row on top of the feed, where a social feed puts its stories: here, the
 * lesson's topics as round "accounts". A topic not yet seen in this session
 * wears the color ring; a seen one, a quiet gray ring. Tap one to jump to the
 * next post about it. Honest: these are topics, not people, and the ring says
 * only "you have not seen it yet today".
 */

import type { FeedAccount } from '@/lib/feed/feed-identity';
import { AccountAvatar } from './posts/card-frame';

export function TopicStories({
  accounts,
  order,
  seen,
  onJump,
}: {
  accounts: Record<string, FeedAccount>;
  /** Concept ids in lesson order. */
  order: string[];
  seen: ReadonlySet<string>;
  onJump: (conceptId: string) => void;
}) {
  return (
    <nav aria-label="Temas de la lección" className="rounded-[14px] border border-black/[0.08] bg-white py-3 dark:border-white/[0.09] dark:bg-[#0f0f10]">
      <ul className="flex gap-3.5 overflow-x-auto px-3.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {order.map((id) => {
          const a = accounts[id];
          if (!a) return null;
          const fresh = !seen.has(id);
          return (
            <li key={id} className="shrink-0">
              <button
                type="button"
                onClick={() => onJump(id)}
                className="flex w-[66px] flex-col items-center gap-1.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                aria-label={`Ir a ${a.title}${fresh ? ' (todavía no lo viste hoy)' : ''}`}
              >
                {fresh ? (
                  <AccountAvatar account={a} size={54} ring />
                ) : (
                  <span className="rounded-full p-[2px] ring-1 ring-black/15 dark:ring-white/20">
                    <span className="block rounded-full p-[2px]">
                      <AccountAvatar account={a} size={54} />
                    </span>
                  </span>
                )}
                <span className="w-full truncate text-center text-[11px] text-neutral-700 dark:text-neutral-300">{a.name}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
