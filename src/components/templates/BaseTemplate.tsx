import { useMemo } from 'react'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { ResumeSettings } from '@/types'

interface BaseTemplateProps {
  content: string
  settings: ResumeSettings
  className?: string
}

export function BaseTemplate({ content, settings, className }: BaseTemplateProps) {
  const { font, color, spacing } = settings

  const style = useMemo(
    () =>
      ({
        '--primary-color': color.primary,
        '--text-color': color.text,
        '--muted-color': color.muted,
        '--bg-color': color.background,
        '--title-size': `${font.titleSize}px`,
        '--heading-size': `${font.headingSize}px`,
        '--body-size': `${font.bodySize}px`,
        '--small-size': `${font.smallSize}px`,
        '--line-height': `${font.lineHeight}px`,
        '--section-gap': `${spacing.sectionGap}px`,
        '--padding': `${spacing.padding}px`,
        '--font-family': font.fontFamily,
      }) as React.CSSProperties,
    [font, color, spacing]
  )

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
  )
}

// Markdown 渲染组件
const markdownComponents: Components = {
  h1: ({ children }) => (
    <h1
      className="resume-title mb-4 border-b-2 pb-2"
      style={{ borderColor: 'var(--primary-color)' }}
    >
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="section-title mt-6 mb-3 flex items-center gap-2">
      <span
        className="h-5 w-1.5 rounded-sm"
        style={{ backgroundColor: 'var(--primary-color)' }}
      ></span>
      {children}
    </h2>
  ),
  h3: ({ children }) => <h3 className="subsection-title mt-4 mb-2 font-semibold">{children}</h3>,
  p: ({ children }) => <p className="resume-paragraph mb-2">{children}</p>,
  ul: ({ children }) => (
    <ul className="resume-list ml-2 list-inside list-disc space-y-1">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="resume-list ml-2 list-inside list-decimal space-y-1">{children}</ol>
  ),
  li: ({ children }) => <li className="resume-list-item">{children}</li>,
  em: ({ children }) => (
    <em className="text-sm" style={{ color: 'var(--muted-color)' }}>
      {children}
    </em>
  ),
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  hr: () => (
    <hr className="my-4 border-t" style={{ borderColor: 'var(--primary-color)', opacity: 0.3 }} />
  ),
  a: ({ href, children }) => (
    <a href={href} className="hover:underline" style={{ color: 'var(--primary-color)' }}>
      {children}
    </a>
  ),
}
