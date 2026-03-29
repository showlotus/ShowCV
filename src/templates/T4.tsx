import ReactMarkdown, { type Components } from 'react-markdown'
import { useMemo } from 'react'
import remarkGfm from 'remark-gfm'
import type { ResumeSettings } from '@/types'
import { remarkGroupSection } from './utils/remarkGroupSection'
import { PipeSplit } from './utils/PipeSplit'
import { useCssVars } from './utils/useCssVars'
import { hexToRgba } from './utils/colorUtils'
import { FONT_PRESETS } from '@/utils/constants'
import { Leaf } from 'lucide-react'

export const T4_DEFAULT_SETTINGS: ResumeSettings = {
  font: {
    h1TitleSize: 24,
    h2TitleSize: 14,
    h3TitleSize: 12,
    bodySize: 12,
    smallSize: 12,
    lineHeight: 15,
    fontFamily: FONT_PRESETS.find(p => p.id === 'default')!.value,
  },
  color: {
    primary: '#d97706',
  },
  spacing: {
    padding: 40,
    h2TitleTopGap: 6,
    h2TitleBottomGap: 6,
    h3TitleTopGap: 2,
    h3TitleBottomGap: 2,
  },
  layout: {
    headerAlign: 'left',
  },
}

export interface LayoutProps {
  content: string
  settings: ResumeSettings
  className?: string
}

function T4({ content, settings, className }: LayoutProps) {
  const style = useCssVars(settings)
  const components = useMemo(() => buildMarkdownComponents(settings), [settings])

  return (
    <div
      id="resume-preview"
      className={`resume-template ${className || ''}`}
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
    header: ({ children, node }) => {
      const name = node?.properties?.['data-name'] as string | undefined
      const align = settings.layout.headerAlign

      if (align === 'center') {
        return (
          <header className="resume-section resume-header">
            <div className="mb-4 flex flex-col items-center gap-4">
              {avatarSrc && (
                <img
                  src={avatarSrc}
                  alt="Avatar"
                  style={{
                    height: 'var(--avatar-size)',
                    width: `calc(var(--avatar-size) * ${avatarRatio})`,
                    borderRadius: 'var(--avatar-border-radius)',
                    objectFit: 'contain',
                    flexShrink: 0,
                  }}
                />
              )}
              <div className="flex flex-col items-center gap-4" style={{ textAlign: 'center' }}>
                <div
                  className="font-bold"
                  style={{
                    fontSize: 'var(--h1-title-size)',
                    lineHeight: 'var(--h1-title-size)',
                    margin: 0,
                  }}
                >
                  {name}
                </div>
                <div style={{ lineHeight: '1.75em' }}>{children}</div>
              </div>
            </div>
          </header>
        )
      }

      const isReversed = align === 'right'
      const textAlign = align === 'right' ? 'right' : 'left'
      return (
        <header className="resume-section resume-header">
          <div className={`mb-4 flex justify-between ${isReversed ? 'flex-row-reverse' : ''}`}>
            <div className="flex flex-col gap-4" style={{ textAlign }}>
              <div
                className="font-bold"
                style={{
                  fontSize: 'var(--h1-title-size)',
                  lineHeight: 'var(--h1-title-size)',
                  margin: 0,
                }}
              >
                {name}
              </div>
              <div style={{ lineHeight: '1.75em' }}>{children}</div>
            </div>
            {avatarSrc && (
              <img
                src={avatarSrc}
                alt="Avatar"
                style={{
                  height: 'var(--avatar-size)',
                  width: `calc(var(--avatar-size) * ${avatarRatio})`,
                  borderRadius: 'var(--avatar-border-radius)',
                  objectFit: 'contain',
                  flexShrink: 0,
                }}
              />
            )}
          </div>
        </header>
      )
    },
    h1: () => null,
    h2: ({ children }) => (
      <p
        className="resume-title-h2 font-semibold whitespace-nowrap"
        style={{
          fontSize: 'var(--h2-title-size)',
          lineHeight: 'var(--h2-title-size)',
        }}
      >
        <div className="relative flex items-end">
          <div
            className="px-2 py-1 text-white"
            style={{
              backgroundColor: settings.color.primary,
            }}
          >
            <PipeSplit>{children}</PipeSplit>
          </div>
          <div
            className="z-1 w-2 py-1"
            style={{
              marginLeft: -1,
              backgroundColor: settings.color.primary,
              clipPath: 'polygon(0 100%, 100% 100%, 3px 0, 0 0)',
            }}
          >
            <span className="opacity-0">{children}</span>
          </div>
          <div
            className="absolute right-0 bottom-0 left-0 z-0"
            style={{ height: 1, backgroundColor: settings.color.primary, opacity: 0.25 }}
          ></div>
        </div>
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
      <a href={href} className="hover:underline" /* style={{ color: 'var(--primary-color)' }} */>
        {children}
      </a>
    ),
  }
}

export default T4
