import { useMemo } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { ResumeSettings } from '../../types';

interface BaseTemplateProps {
  content: string;
  settings: ResumeSettings;
  className?: string;
}

export function BaseTemplate({ content, settings, className }: BaseTemplateProps) {
  const { font, color, spacing } = settings;

  const style = useMemo(
    () => ({
      '--primary-color': color.primary,
      '--text-color': color.text,
      '--muted-color': color.muted,
      '--bg-color': color.background,
      '--title-size': `${font.titleSize}px`,
      '--heading-size': `${font.headingSize}px`,
      '--body-size': `${font.bodySize}px`,
      '--small-size': `${font.smallSize}px`,
      '--line-height': font.lineHeight,
      '--section-gap': `${spacing.sectionGap}px`,
      '--paragraph-gap': `${spacing.paragraphGap}px`,
      '--padding': `${spacing.padding}px`,
      '--font-family': font.fontFamily,
    }) as React.CSSProperties,
    [font, color, spacing]
  );

  return (
    <div
      id="resume-preview"
      className={`resume-template bg-white ${className || ''}`}
      style={style}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {content}
      </ReactMarkdown>
    </div>
  );
}

// Markdown 渲染组件
const markdownComponents: Components = {
  h1: ({ children }) => (
    <h1 className="resume-title border-b-2 pb-2 mb-4" style={{ borderColor: 'var(--primary-color)' }}>
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="section-title flex items-center gap-2 mt-6 mb-3">
      <span className="w-1.5 h-5 rounded-sm" style={{ backgroundColor: 'var(--primary-color)' }}></span>
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="subsection-title font-semibold mt-4 mb-2">{children}</h3>
  ),
  p: ({ children }) => (
    <p className="resume-paragraph mb-2">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="resume-list list-disc list-inside space-y-1 ml-2">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="resume-list list-decimal list-inside space-y-1 ml-2">{children}</ol>
  ),
  li: ({ children }) => (
    <li className="resume-list-item">{children}</li>
  ),
  em: ({ children }) => (
    <em className="text-sm" style={{ color: 'var(--muted-color)' }}>{children}</em>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold">{children}</strong>
  ),
  hr: () => (
    <hr className="my-4 border-t" style={{ borderColor: 'var(--primary-color)', opacity: 0.3 }} />
  ),
  a: ({ href, children }) => (
    <a href={href} className="hover:underline" style={{ color: 'var(--primary-color)' }}>
      {children}
    </a>
  ),
};
