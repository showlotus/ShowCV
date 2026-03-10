import { useMemo } from 'react'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { ResumeSettings } from '@/types'

interface CreativeTemplateProps {
  content: string
  settings: ResumeSettings
  className?: string
}

export function CreativeTemplate({ content, settings, className }: CreativeTemplateProps) {
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
        '--line-height': font.lineHeight,
        '--section-gap': `${spacing.sectionGap}px`,
        '--paragraph-gap': `${spacing.paragraphGap}px`,
        '--padding': `${spacing.padding}px`,
        '--font-family': font.fontFamily,
      }) as React.CSSProperties,
    [font, color, spacing]
  )

  return (
    <div
      id="resume-preview"
      className={`creative-template relative overflow-hidden bg-white ${className || ''}`}
      style={style}
    >
      {/* 装饰元素 */}
      <div
        className="absolute top-0 right-0 h-32 w-32 rounded-bl-full opacity-10"
        style={{ backgroundColor: color.primary }}
      ></div>
      <div
        className="absolute bottom-0 left-0 h-24 w-24 rounded-tr-full opacity-10"
        style={{ backgroundColor: color.primary }}
      ></div>

      <div className="relative p-8">
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
          {content}
        </ReactMarkdown>
      </div>
    </div>
  )
}

// Markdown 渲染组件
const markdownComponents: Components = {
  h1: ({ children }) => (
    <h1
      className="relative mb-2 inline-block text-2xl font-bold"
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
      className="mt-8 mb-4 flex items-center gap-3 text-lg font-semibold"
      style={{ color: 'var(--primary-color)' }}
    >
      <span className="h-0.5 w-8" style={{ backgroundColor: 'var(--primary-color)' }}></span>
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mt-4 mb-2 flex items-center gap-2 font-semibold">
      <span
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: 'var(--primary-color)' }}
      ></span>
      {children}
    </h3>
  ),
  p: ({ children }) => <p className="mb-2 text-sm leading-relaxed">{children}</p>,
  ul: ({ children }) => <ul className="ml-4 space-y-2 text-sm">{children}</ul>,
  ol: ({ children }) => (
    <ol className="ml-4 list-inside list-decimal space-y-2 text-sm">{children}</ol>
  ),
  li: ({ children }) => (
    <li className="flex items-start gap-2">
      <span
        className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full"
        style={{ backgroundColor: 'var(--primary-color)' }}
      ></span>
      <span>{children}</span>
    </li>
  ),
  em: ({ children }) => (
    <em
      className="inline-block rounded-full px-2 py-0.5 text-xs"
      style={{ backgroundColor: 'var(--primary-color)', color: 'white', opacity: 0.9 }}
    >
      {children}
    </em>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold" style={{ color: 'var(--primary-color)' }}>
      {children}
    </strong>
  ),
  hr: () => (
    <div className="my-6 flex items-center gap-2">
      <span
        className="h-px flex-1"
        style={{ backgroundColor: 'var(--primary-color)', opacity: 0.2 }}
      ></span>
      <span
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: 'var(--primary-color)', opacity: 0.5 }}
      ></span>
      <span
        className="h-px flex-1"
        style={{ backgroundColor: 'var(--primary-color)', opacity: 0.2 }}
      ></span>
    </div>
  ),
}
