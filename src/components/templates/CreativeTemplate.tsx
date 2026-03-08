import { useMemo } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { ResumeSettings } from '../../types';

interface CreativeTemplateProps {
  content: string;
  settings: ResumeSettings;
  className?: string;
}

export function CreativeTemplate({ content, settings, className }: CreativeTemplateProps) {
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
      className={`creative-template bg-white relative overflow-hidden ${className || ''}`}
      style={style}
    >
      {/* 装饰元素 */}
      <div
        className="absolute top-0 right-0 w-32 h-32 rounded-bl-full opacity-10"
        style={{ backgroundColor: color.primary }}
      ></div>
      <div
        className="absolute bottom-0 left-0 w-24 h-24 rounded-tr-full opacity-10"
        style={{ backgroundColor: color.primary }}
      ></div>

      <div className="relative p-8">
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
}

// Markdown 渲染组件
const markdownComponents: Components = {
  h1: ({ children }) => (
    <h1
      className="text-2xl font-bold mb-2 relative inline-block"
      style={{ color: 'var(--text-color)' }}
    >
      {children}
      <span
        className="absolute -bottom-1 left-0 h-1 w-16 rounded-full"
        style={{ backgroundColor: 'var(--primary-color)' }}
      ></span>
    </h1>
  ),
  h2: ({ children }) => (
    <h2
      className="text-lg font-semibold mt-8 mb-4 flex items-center gap-3"
      style={{ color: 'var(--primary-color)' }}
    >
      <span className="w-8 h-0.5" style={{ backgroundColor: 'var(--primary-color)' }}></span>
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="font-semibold mt-4 mb-2 flex items-center gap-2">
      <span
        className="w-2 h-2 rounded-full"
        style={{ backgroundColor: 'var(--primary-color)' }}
      ></span>
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p className="text-sm mb-2 leading-relaxed">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="text-sm space-y-2 ml-4">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="text-sm space-y-2 ml-4 list-decimal list-inside">{children}</ol>
  ),
  li: ({ children }) => (
    <li className="flex items-start gap-2">
      <span
        className="mt-2 w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: 'var(--primary-color)' }}
      ></span>
      <span>{children}</span>
    </li>
  ),
  em: ({ children }) => (
    <em className="text-xs px-2 py-0.5 rounded-full inline-block" style={{ backgroundColor: 'var(--primary-color)', color: 'white', opacity: 0.9 }}>
      {children}
    </em>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold" style={{ color: 'var(--primary-color)' }}>
      {children}
    </strong>
  ),
  hr: () => (
    <div className="flex items-center gap-2 my-6">
      <span className="flex-1 h-px" style={{ backgroundColor: 'var(--primary-color)', opacity: 0.2 }}></span>
      <span
        className="w-2 h-2 rounded-full"
        style={{ backgroundColor: 'var(--primary-color)', opacity: 0.5 }}
      ></span>
      <span className="flex-1 h-px" style={{ backgroundColor: 'var(--primary-color)', opacity: 0.2 }}></span>
    </div>
  ),
};
