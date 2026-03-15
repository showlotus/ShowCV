import { useMemo } from 'react'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { ResumeSettings } from '@/types'

interface ModernTemplateProps {
  content: string
  settings: ResumeSettings
  className?: string
}

export function ModernTemplate({ content, settings, className }: ModernTemplateProps) {
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
      className={`modern-template flex bg-white ${className || ''}`}
      style={style}
    >
      {/* 左侧边栏 */}
      <aside className="w-1/3 p-6 text-white" style={{ backgroundColor: color.primary }}>
        <div className="modern-sidebar">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={sidebarComponents}>
            {content}
          </ReactMarkdown>
        </div>
      </aside>

      {/* 右侧主体 */}
      <main className="flex-1 p-6">
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={mainComponents}>
          {content}
        </ReactMarkdown>
      </main>
    </div>
  )
}

// 侧边栏组件
const sidebarComponents: Components = {
  h1: ({ children }) => <h1 className="mb-4 text-2xl font-bold">{children}</h1>,
  h2: ({ children }) => (
    <h2 className="mt-6 mb-3 border-b border-white/30 pb-1 text-lg font-semibold">{children}</h2>
  ),
  p: ({ children }) => <p className="mb-2 text-sm opacity-90">{children}</p>,
  ul: ({ children }) => <ul className="space-y-1 text-sm">{children}</ul>,
  li: ({ children }) => (
    <li className="flex items-start gap-2">
      <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-white/70"></span>
      <span>{children}</span>
    </li>
  ),
}

// 主体组件
const mainComponents: Components = {
  h1: () => null, // 标题在侧边栏显示
  h2: ({ children }) => (
    <h2 className="mt-6 mb-3 flex items-center gap-2 text-lg font-semibold">
      <span
        className="h-5 w-1 rounded-sm"
        style={{ backgroundColor: 'var(--primary-color)' }}
      ></span>
      {children}
    </h2>
  ),
  h3: ({ children }) => <h3 className="mt-4 mb-1 font-semibold">{children}</h3>,
  p: ({ children }) => (
    <p className="mb-2 text-sm" style={{ color: 'var(--text-color)' }}>
      {children}
    </p>
  ),
  ul: ({ children }) => (
    <ul className="ml-2 list-inside list-disc space-y-1 text-sm">{children}</ul>
  ),
  li: ({ children }) => <li className="text-sm">{children}</li>,
  em: ({ children }) => (
    <em className="text-xs" style={{ color: 'var(--muted-color)' }}>
      {children}
    </em>
  ),
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
}
