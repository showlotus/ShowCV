import ReactMarkdown, { type Components } from 'react-markdown'
import { useMemo } from 'react'
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
  const components = useMemo(() => buildMarkdownComponents(settings), [settings])

  return (
    <div
      id="resume-preview"
      className={`resume-template bg-white ${className || ''}`}
      style={{ ...style, padding: settings.spacing.padding }}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkGroupSection]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  )
}

// Markdown 渲染组件工厂
function buildMarkdownComponents(settings: ResumeSettings): Components {
  const avatar = settings.avatar
  const avatarSrc = avatar?.src && avatar.visible ? avatar.src : null
  const avatarRatio =
    avatar?.naturalWidth && avatar?.naturalHeight ? avatar.naturalWidth / avatar.naturalHeight : 1

  return {
    h1: ({ children }) => (
      <div className="mb-4 border-b-2 pb-2" style={{ borderColor: 'var(--primary-color)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: avatarSrc ? '16px' : '0' }}>
          {avatarSrc && (
            <img
              src={avatarSrc}
              alt="Avatar"
              style={{
                height: 'var(--avatar-size)',
                width: `calc(var(--avatar-size) * ${avatarRatio})`,
                borderRadius: 'var(--avatar-border-radius)',
                objectFit: 'cover',
                flexShrink: 0,
              }}
            />
          )}
          <p
            className="font-bold"
            style={{
              fontSize: 'var(--h1-title-size)',
              lineHeight: 'var(--h1-title-size)',
              margin: 0,
            }}
          >
            {children}
          </p>
        </div>
      </div>
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
    ul: ({ children }) => (
      <ul className="resume-list list-inside list-disc space-y-1">{children}</ul>
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
}

export default T1
