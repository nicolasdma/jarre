'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { ConceptVisual, hasConceptVisual } from './concept-visuals';
import { InlineQuiz } from './inline-quiz';
import { useVideoSeek } from '@/lib/video-seek-context';
import { injectFigures } from '@/lib/figure-injector';
import { splitAtBoldHeadings } from '@/lib/markdown-splitter';
import type { FigureRegistry } from '@/lib/figure-registry';
import type { InlineQuiz as InlineQuizType, VideoSegment as VideoSegmentType } from '@/types';

interface SectionContentProps {
  markdown: string;
  conceptId?: string;
  sectionIndex?: number;
  figures?: FigureRegistry;
  inlineQuizzes?: InlineQuizType[];
  videoSegments?: VideoSegmentType[];
}

/**
 * Shared react-markdown component config for Jarre's design system.
 */
const markdownComponents = {
  h2: ({ children }: { children?: React.ReactNode }) => (
    <h2 data-whisper="block" className="text-2xl font-light text-j-text mt-10 mb-4">
      {children}
    </h2>
  ),
  h3: ({ children }: { children?: React.ReactNode }) => (
    <h3 data-whisper="block" className="text-xl font-medium text-j-text mt-8 mb-3">
      {children}
    </h3>
  ),
  p: ({ children, node }: { children?: React.ReactNode; node?: { children?: Array<{ type: string; tagName?: string }> } }) => {
    // If the paragraph contains an image, unwrap it so <figure> isn't nested inside <p>
    const hasImage = node?.children?.some(
      (child) => child.type === 'element' && child.tagName === 'img'
    );
    if (hasImage) return <>{children}</>;
    return (
      <p data-whisper="block" className="text-j-text-body leading-[1.6] mb-6 text-lg">
        {children}
      </p>
    );
  },
  strong: ({ children }: { children?: React.ReactNode }) => (
    <strong className="text-j-text font-medium">{children}</strong>
  ),
  em: ({ children }: { children?: React.ReactNode }) => {
    const text = String(children);
    // Hide figure caption text — it's rendered as <figcaption> by the img component
    if (/^Figura \d+-\d+\./.test(text)) return null;
    return <em className="text-j-text-em italic">{children}</em>;
  },
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul className="space-y-2 mb-6 ml-4">{children}</ul>
  ),
  ol: ({ children }: { children?: React.ReactNode }) => (
    <ol className="space-y-2 mb-6 ml-4 list-decimal">{children}</ol>
  ),
  li: ({ children }: { children?: React.ReactNode }) => (
    <li data-whisper="block" className="text-j-text-body leading-[1.6] text-lg pl-1">
      <span className="text-j-warm mr-2">—</span>
      {children}
    </li>
  ),
  pre: ({ children }: { children?: React.ReactNode }) => (
    <pre className="overflow-x-auto bg-j-bg-alt border border-j-border rounded-lg p-4 mb-6 text-sm whitespace-pre [&_code]:bg-transparent [&_code]:border-0 [&_code]:p-0 [&_code]:rounded-none [&_code]:text-j-text">
      {children}
    </pre>
  ),
  code: ({ children }: { children?: React.ReactNode }) => (
    <code className="bg-j-bg-alt border border-j-border px-1.5 py-0.5 rounded font-mono text-sm text-j-accent">
      {children}
    </code>
  ),
  blockquote: ({ children }: { children?: React.ReactNode }) => (
    <blockquote data-whisper="block" className="border-l-2 border-j-warm pl-4 my-4 text-j-text-tertiary italic">
      {children}
    </blockquote>
  ),
  table: ({ children }: { children?: React.ReactNode }) => (
    <div className="overflow-x-auto mb-6">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  ),
  th: ({ children }: { children?: React.ReactNode }) => (
    <th className="border-b border-j-border py-2 px-3 text-left font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase">
      {children}
    </th>
  ),
  td: ({ children }: { children?: React.ReactNode }) => (
    <td className="border-b border-j-border-light py-2 px-3 text-j-text-body text-lg">
      {children}
    </td>
  ),
  hr: () => <div className="h-px bg-j-border my-8" />,
  img: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    <figure className="my-8 -mx-4">
      {/* eslint-disable-next-line @next/next/no-img-element -- Dynamic markdown images from arbitrary domains; next/image requires allowlisted domains */}
      <img
        src={typeof props.src === 'string' ? props.src : undefined}
        alt={props.alt || ''}
        className="w-full border border-j-border bg-j-bg-white p-3"
        loading="lazy"
      />
      {props.alt && (
        <figcaption className="mt-2 text-center font-mono text-[10px] tracking-[0.1em] text-j-text-tertiary">
          {props.alt}
        </figcaption>
      )}
    </figure>
  ),
};

/**
 * Renders resource section content as native HTML from markdown.
 * Uses react-markdown + remark-gfm for tables/strikethrough support.
 * Styled to match Jarre's design system.
 *
 * When figures are provided, injects images at caption positions.
 * When inlineQuizzes are provided, interleaves quiz components between content segments.
 */
export function SectionContent({
  markdown,
  conceptId,
  sectionIndex,
  figures,
  inlineQuizzes,
  videoSegments,
}: SectionContentProps) {
  // Pre-process markdown to inject figure images at caption positions
  const processed = figures ? injectFigures(markdown, figures) : markdown;

  // If quizzes or video segments are provided, split content and interleave
  const hasQuizzes = inlineQuizzes && inlineQuizzes.length > 0;
  const hasVideoSegments = videoSegments && videoSegments.length > 0;
  const needsInterleaving = hasQuizzes || hasVideoSegments;

  return (
    <div className="prose-jarre max-w-prose mx-auto">
      {conceptId && hasConceptVisual(conceptId, sectionIndex) && (
        <ConceptVisual conceptId={conceptId} sectionIndex={sectionIndex} />
      )}

      {needsInterleaving ? (
        <InterleavedContent
          markdown={processed}
          quizzes={inlineQuizzes ?? []}
          videoSegments={videoSegments ?? []}
        />
      ) : (
        <div data-segment-index={0}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[rehypeKatex]}
            components={markdownComponents}
          >
            {processed}
          </ReactMarkdown>
        </div>
      )}
    </div>
  );
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${m}:${String(s).padStart(2, '0')}`;
}

/**
 * Splits markdown at bold headings and interleaves quiz components.
 * Quizzes are placed after the segment whose heading matches quiz.positionAfterHeading.
 * Video segments render as clickable timestamps next to headings (sticky player handles playback).
 */
function InterleavedContent({
  markdown,
  quizzes,
  videoSegments,
}: {
  markdown: string;
  quizzes: InlineQuizType[];
  videoSegments: VideoSegmentType[];
}) {
  const videoSeek = useVideoSeek();
  const segments = splitAtBoldHeadings(markdown);

  // Build quiz map: heading → quizzes sorted by sortOrder
  const quizMap = new Map<string, InlineQuizType[]>();
  for (const quiz of quizzes) {
    const key = quiz.positionAfterHeading;
    const existing = quizMap.get(key) ?? [];
    existing.push(quiz);
    quizMap.set(key, existing);
  }

  // Build video map: heading → first video segment (for timestamp display)
  const videoMap = new Map<string, VideoSegmentType>();
  for (const vs of videoSegments) {
    const key = vs.positionAfterHeading;
    if (!videoMap.has(key)) {
      videoMap.set(key, vs);
    }
  }

  return (
    <>
      {segments.map((segment, i) => {
        const segmentVideo = segment.heading
          ? videoMap.get(segment.heading)
          : undefined;
        const segmentQuizzes = segment.heading
          ? quizMap.get(segment.heading) ?? []
          : [];

        return (
          <div key={segment.heading ?? `segment-${i}`} data-segment-index={i}>
            {segment.heading && (
              <div className="flex items-baseline gap-3">
                <div className="flex-1">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm, remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                    components={markdownComponents}
                  >
                    {`**${segment.heading}**`}
                  </ReactMarkdown>
                </div>
                {segmentVideo && videoSeek && (
                  <button
                    type="button"
                    onClick={() => videoSeek.seekTo(segmentVideo.startSeconds)}
                    className="shrink-0 font-mono text-xs text-j-text-tertiary hover:text-j-warm cursor-pointer transition-colors"
                    title={segmentVideo.label ?? `Jump to ${formatTime(segmentVideo.startSeconds)}`}
                  >
                    ▸ {formatTime(segmentVideo.startSeconds)}
                  </button>
                )}
              </div>
            )}

            {segment.content && (
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeKatex]}
                components={markdownComponents}
              >
                {segment.content}
              </ReactMarkdown>
            )}

            {/* Quizzes: verify after reading */}
            {segmentQuizzes.map((quiz) => (
              <InlineQuiz
                key={quiz.id}
                quiz={{
                  id: quiz.id,
                  format: quiz.format,
                  questionText: quiz.questionText,
                  options: quiz.options,
                  correctAnswer: quiz.correctAnswer,
                  explanation: quiz.explanation,
                  justificationHint: quiz.justificationHint,
                }}
              />
            ))}
          </div>
        );
      })}
    </>
  );
}
