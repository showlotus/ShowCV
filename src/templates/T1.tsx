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
    <p
      className="mb-4 border-b-2 pb-2 font-bold"
      style={{
        borderColor: 'var(--primary-color)',
        fontSize: 'var(--h1-title-size)',
        lineHeight: 'var(--h1-title-size)',
      }}
    >
      {children}
    </p>
  ),
  h2: ({ children }) => (
    <p
      className="resume-title-h2 flex items-center gap-2 font-semibold"
      style={{ fontSize: 'var(--h2-title-size)' }}
    >
      <span
        className="h-5 w-1.5 rounded-sm"
        style={{ backgroundColor: 'var(--primary-color)' }}
      ></span>
      <PipeSplit>{children}</PipeSplit>
    </p>
  ),
  h3: ({ children }) => (
    <p className="resume-title-h3 font-semibold" style={{ fontSize: 'var(--h3-title-size)' }}>
      <PipeSplit>{children}</PipeSplit>
    </p>
  ),
  // 自定义 section 节点渲染
  section: ({ children, className }) => (
    <section className={`resume-section ${className || ''}`}>{children}</section>
  ),
  p: ({ children }) => (
    <p className="resume-paragraph">
      <PipeSplit>{children}</PipeSplit>
    </p>
  ),
  ul: ({ children }) => <ul className="resume-list list-inside list-disc space-y-1">{children}</ul>,
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
      style={{
        borderColor: 'var(--primary-color)',
        opacity: 0.3,
        margin: `var(--h2-title-top-gap) 0`,
      }}
    />
  ),
  a: ({ href, children }) => (
    <a href={href} className="hover:underline" style={{ color: 'var(--primary-color)' }}>
      {children}
    </a>
  ),
}

export default T1
