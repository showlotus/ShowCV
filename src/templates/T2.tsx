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

function T2({ content, settings, className }: LayoutProps) {
  const { color, spacing } = settings
  const style = useCssVars(settings)

  return (
    <div
      id="resume-preview"
      className={`modern-layout flex min-h-[297mm] bg-white ${className || ''}`}
      style={style}
    >
      {/* 左侧边栏 */}
      <aside
        className="w-1/3 text-white"
        style={{ backgroundColor: color.primary, padding: spacing.padding }}
      >
        <div className="modern-sidebar">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={sidebarComponents}>
            {content}
          </ReactMarkdown>
        </div>
      </aside>

      {/* 右侧主体 */}
      <main className="flex-1" style={{ padding: spacing.padding }}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkGroupSection]}
          components={mainComponents(color)}
        >
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
    <h2 className="mt-6 mb-3 border-b border-white/30 pb-1 text-lg font-semibold">
      <PipeSplit>{children}</PipeSplit>
    </h2>
  ),
  p: ({ children }) => (
    <p className="mb-2 text-sm opacity-90">
      <PipeSplit>{children}</PipeSplit>
    </p>
  ),
  ul: ({ children }) => <ul className="space-y-1 text-sm">{children}</ul>,
  li: ({ children }) => (
    <li className="flex items-start gap-2">
      <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-white/70"></span>
      <span>{children}</span>
    </li>
  ),
}

// 主体组件（需要 color 参数）
const mainComponents = (color: ResumeSettings['color']): Components => ({
  h1: () => null, // 标题在侧边栏显示
  h2: ({ children }) => (
    <h2 className="mt-6 mb-3 flex items-center gap-2 text-lg font-semibold">
      <span className="h-5 w-1 rounded-sm" style={{ backgroundColor: color.primary }}></span>
      <PipeSplit>{children}</PipeSplit>
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mt-4 mb-1 font-semibold">
      <PipeSplit>{children}</PipeSplit>
    </h3>
  ),
  section: ({ children }) => (
    <section className="resume-section" style={{ marginBottom: 'var(--section-gap)' }}>
      {children}
    </section>
  ),
  p: ({ children }) => (
    <p className="mb-2 text-sm" style={{ color: color.text }}>
      <PipeSplit>{children}</PipeSplit>
    </p>
  ),
  ul: ({ children }) => (
    <ul className="ml-2 list-inside list-disc space-y-1 text-sm">{children}</ul>
  ),
  li: ({ children }) => <li className="text-sm">{children}</li>,
  em: ({ children }) => (
    <em className="text-xs" style={{ color: color.muted }}>
      {children}
    </em>
  ),
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
})

export default T2
