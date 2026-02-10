'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ConceptVisual, hasConceptVisual } from './concept-visuals';
import { InlineQuiz } from './inline-quiz';
import { injectFigures } from '@/lib/figure-injector';
import { splitAtBoldHeadings } from '@/lib/markdown-splitter';
import type { FigureRegistry } from '@/lib/figure-registry';
import type { InlineQuiz as InlineQuizType } from '@/types';

interface SectionContentProps {
  markdown: string;
  conceptId?: string;
  sectionIndex?: number;
  figures?: FigureRegistry;
  inlineQuizzes?: InlineQuizType[];
}

/**
 * Shared react-markdown component config for Jarre's design system.
 */
const markdownComponents = {
  h2: ({ children }: { children?: React.ReactNode }) => (
    <h2 className="text-2xl font-light text-[#2c2c2c] mt-10 mb-4">
      {children}
    </h2>
  ),
  h3: ({ children }: { children?: React.ReactNode }) => (
    <h3 className="text-xl font-medium text-[#2c2c2c] mt-8 mb-3">
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
      <p className="text-[#3d3d3a] leading-[1.6] mb-6 text-lg">
        {children}
      </p>
    );
  },
  strong: ({ children }: { children?: React.ReactNode }) => (
    <strong className="text-[#2c2c2c] font-medium">{children}</strong>
  ),
  em: ({ children }: { children?: React.ReactNode }) => {
    const text = String(children);
    // Hide figure caption text — it's rendered as <figcaption> by the img component
    if (/^Figura \d+-\d+\./.test(text)) return null;
    return <em className="text-[#6b6b62] italic">{children}</em>;
  },
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul className="space-y-2 mb-6 ml-4">{children}</ul>
  ),
  ol: ({ children }: { children?: React.ReactNode }) => (
    <ol className="space-y-2 mb-6 ml-4 list-decimal">{children}</ol>
  ),
  li: ({ children }: { children?: React.ReactNode }) => (
    <li className="text-[#3d3d3a] leading-[1.6] text-lg pl-1">
      <span className="text-[#c4a07a] mr-2">—</span>
      {children}
    </li>
  ),
  pre: ({ children }: { children?: React.ReactNode }) => (
    <pre className="overflow-x-auto bg-[#f5f4f0] border border-[#e8e6e0] rounded-lg p-4 mb-6 text-sm whitespace-pre [&_code]:bg-transparent [&_code]:border-0 [&_code]:p-0 [&_code]:rounded-none [&_code]:text-[#2c2c2c]">
      {children}
    </pre>
  ),
  code: ({ children }: { children?: React.ReactNode }) => (
    <code className="bg-[#f5f4f0] border border-[#e8e6e0] px-1.5 py-0.5 rounded font-mono text-sm text-[#4a5d4a]">
      {children}
    </code>
  ),
  blockquote: ({ children }: { children?: React.ReactNode }) => (
    <blockquote className="border-l-2 border-[#c4a07a] pl-4 my-4 text-[#9c9a8e] italic">
      {children}
    </blockquote>
  ),
  table: ({ children }: { children?: React.ReactNode }) => (
    <div className="overflow-x-auto mb-6">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  ),
  th: ({ children }: { children?: React.ReactNode }) => (
    <th className="border-b border-[#e8e6e0] py-2 px-3 text-left font-mono text-[10px] tracking-[0.15em] text-[#9c9a8e] uppercase">
      {children}
    </th>
  ),
  td: ({ children }: { children?: React.ReactNode }) => (
    <td className="border-b border-[#f5f4f0] py-2 px-3 text-[#3d3d3a] text-lg">
      {children}
    </td>
  ),
  hr: () => <div className="h-px bg-[#e8e6e0] my-8" />,
  img: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    <figure className="my-8 -mx-4">
      <img
        src={typeof props.src === 'string' ? props.src : undefined}
        alt={props.alt || ''}
        className="w-full border border-[#e8e6e0] bg-white p-3"
        loading="lazy"
      />
      {props.alt && (
        <figcaption className="mt-2 text-center font-mono text-[10px] tracking-[0.1em] text-[#9c9a8e]">
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
}: SectionContentProps) {
  // Pre-process markdown to inject figure images at caption positions
  const processed = figures ? injectFigures(markdown, figures) : markdown;

  // If quizzes are provided, split content and interleave
  const hasQuizzes = inlineQuizzes && inlineQuizzes.length > 0;

  return (
    <div className="prose-jarre max-w-prose mx-auto">
      {conceptId && hasConceptVisual(conceptId, sectionIndex) && (
        <ConceptVisual conceptId={conceptId} sectionIndex={sectionIndex} />
      )}

      {hasQuizzes ? (
        <InterleavedContent
          markdown={processed}
          quizzes={inlineQuizzes}
        />
      ) : (
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={markdownComponents}
        >
          {processed}
        </ReactMarkdown>
      )}
    </div>
  );
}

/**
 * Splits markdown at bold headings and interleaves quiz components.
 * Quizzes are placed after the segment whose heading matches quiz.positionAfterHeading.
 */
function InterleavedContent({
  markdown,
  quizzes,
}: {
  markdown: string;
  quizzes: InlineQuizType[];
}) {
  const segments = splitAtBoldHeadings(markdown);

  // Build quiz map: heading → quizzes sorted by sortOrder
  const quizMap = new Map<string, InlineQuizType[]>();
  for (const quiz of quizzes) {
    const key = quiz.positionAfterHeading;
    const existing = quizMap.get(key) ?? [];
    existing.push(quiz);
    quizMap.set(key, existing);
  }

  return (
    <>
      {segments.map((segment, i) => {
        const segmentQuizzes = segment.heading
          ? quizMap.get(segment.heading) ?? []
          : [];

        return (
          <div key={i}>
            {segment.heading && (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={markdownComponents}
              >
                {`**${segment.heading}**`}
              </ReactMarkdown>
            )}
            {segment.content && (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={markdownComponents}
              >
                {segment.content}
              </ReactMarkdown>
            )}

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
                }}
              />
            ))}
          </div>
        );
      })}
    </>
  );
}
