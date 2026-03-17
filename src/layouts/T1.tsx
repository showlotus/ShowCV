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

function T1({ content, settings, className }: LayoutProps) {
  const style = useCssVars(settings)

  return (
    <div
      id="resume-preview"
      className={`resume-template bg-white ${className || ''}`}
      style={{ ...style, padding: settings.spacing.padding }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkGroupSection]}
        components={markdownComponents}
      >
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
    <section className="resume-section">
      <h2 className="section-title flex items-center gap-2">
        <span
          className="h-5 w-1.5 rounded-sm"
          style={{ backgroundColor: 'var(--primary-color)' }}
        ></span>
        <PipeSplit>{children}</PipeSplit>
      </h2>
    </section>
  ),
  h3: ({ children }) => (
    <h3 className="subsection-title mb-1.5 font-semibold">
      <PipeSplit>{children}</PipeSplit>
    </h3>
  ),
  // 自定义 section 节点渲染，包裹 h3 及其子内容
  section: ({ children, className }) => (
    <section className={`resume-section ${className || ''}`}>{children}</section>
  ),
  p: ({ children }) => (
    <p className="resume-paragraph mb-2">
      <PipeSplit>{children}</PipeSplit>
    </p>
  ),
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
    <hr
      className="border-t"
      style={{ borderColor: 'var(--primary-color)', opacity: 0.3, margin: `var(--section-gap) 0` }}
    />
  ),
  a: ({ href, children }) => (
    <a href={href} className="hover:underline" style={{ color: 'var(--primary-color)' }}>
      {children}
    </a>
  ),
}

export default T1
