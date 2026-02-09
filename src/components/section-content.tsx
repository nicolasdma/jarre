'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface SectionContentProps {
  markdown: string;
}

/**
 * Renders resource section content as native HTML from markdown.
 * Uses react-markdown + remark-gfm for tables/strikethrough support.
 * Styled to match Jarre's design system.
 */
export function SectionContent({ markdown }: SectionContentProps) {
  return (
    <div className="prose-jarre">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h2: ({ children }) => (
            <h2 className="text-xl font-light text-[#2c2c2c] mt-10 mb-4">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base font-medium text-[#2c2c2c] mt-8 mb-3">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="text-[#7a7a6e] leading-relaxed mb-4 text-[15px]">
              {children}
            </p>
          ),
          strong: ({ children }) => (
            <strong className="text-[#2c2c2c] font-medium">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="text-[#9c9a8e] not-italic">{children}</em>
          ),
          ul: ({ children }) => (
            <ul className="space-y-2 mb-4 ml-4">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="space-y-2 mb-4 ml-4 list-decimal">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="text-[#7a7a6e] leading-relaxed text-[15px] pl-1">
              <span className="text-[#c4a07a] mr-2">—</span>
              {children}
            </li>
          ),
          code: ({ className, children }) => {
            const isBlock = className?.includes('language-');
            if (isBlock) {
              return (
                <code className="block bg-[#f5f4f0] border border-[#e8e6e0] p-4 font-mono text-sm text-[#2c2c2c] overflow-x-auto mb-4">
                  {children}
                </code>
              );
            }
            return (
              <code className="bg-[#f5f4f0] border border-[#e8e6e0] px-1.5 py-0.5 font-mono text-sm text-[#4a5d4a]">
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre className="mb-4">{children}</pre>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-[#c4a07a] pl-4 my-4 text-[#9c9a8e] italic">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto mb-4">
              <table className="w-full border-collapse text-sm">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border-b border-[#e8e6e0] py-2 px-3 text-left font-mono text-[10px] tracking-[0.15em] text-[#9c9a8e] uppercase">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border-b border-[#f5f4f0] py-2 px-3 text-[#7a7a6e] text-[15px]">
              {children}
            </td>
          ),
          hr: () => <div className="h-px bg-[#e8e6e0] my-8" />,
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
