import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { ResumeSettings } from '@/types'
import { remarkGroupSection } from './utils/remarkGroupSection'
import { PipeSplit } from './utils/PipeSplit'
import { useCssVars } from './utils/useCssVars'

export interface LayoutProps {
  content: string
  settings: ResumeSettings
  className?: string
}

function T3({ content, settings, className }: LayoutProps) {
  const { color, spacing } = settings
  const style = useCssVars(settings)

  return (
    <div
      id="resume-preview"
      className={`creative-layout relative overflow-hidden bg-white ${className || ''}`}
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

      <div className="relative" style={{ padding: spacing.padding }}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkGroupSection]}
          components={markdownComponents(color)}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  )
}

// Markdown 渲染组件
const markdownComponents = (color: ResumeSettings['color']): Components => ({
  h1: ({ children }) => (
    <h1 className="relative mb-2 inline-block text-2xl font-bold" style={{ color: color.text }}>
      {children}
      <span
        className="absolute -bottom-1 left-0 h-1 w-16 rounded-full"
        style={{ backgroundColor: color.primary }}
      ></span>
    </h1>
  ),
  h2: ({ children }) => (
    <h2
      className="mt-8 mb-4 flex items-center gap-3 text-lg font-semibold"
      style={{ color: color.primary }}
    >
      <span className="h-0.5 w-8" style={{ backgroundColor: color.primary }}></span>
      <PipeSplit>{children}</PipeSplit>
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mt-4 mb-2 flex items-center gap-2 font-semibold">
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color.primary }}></span>
      <PipeSplit>{children}</PipeSplit>
    </h3>
  ),
  section: ({ children }) => <section className="resume-section">{children}</section>,
  p: ({ children }) => (
    <p className="mb-2 text-sm leading-relaxed">
      <PipeSplit>{children}</PipeSplit>
    </p>
  ),
  ul: ({ children }) => <ul className="ml-4 space-y-2 text-sm">{children}</ul>,
  ol: ({ children }) => (
    <ol className="ml-4 list-inside list-decimal space-y-2 text-sm">{children}</ol>
  ),
  li: ({ children }) => (
    <li className="flex items-start gap-2">
      <span
        className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full"
        style={{ backgroundColor: color.primary }}
      ></span>
      <span>{children}</span>
    </li>
  ),
  em: ({ children }) => (
    <em
      className="inline-block rounded-full px-2 py-0.5 text-xs"
      style={{ backgroundColor: color.primary, color: 'white', opacity: 0.9 }}
    >
      {children}
    </em>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold" style={{ color: color.primary }}>
      {children}
    </strong>
  ),
  hr: () => (
    <div className="my-6 flex items-center gap-2">
      <span className="h-px flex-1" style={{ backgroundColor: color.primary, opacity: 0.2 }}></span>
      <span
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: color.primary, opacity: 0.5 }}
      ></span>
      <span className="h-px flex-1" style={{ backgroundColor: color.primary, opacity: 0.2 }}></span>
    </div>
  ),
})

export default T3
