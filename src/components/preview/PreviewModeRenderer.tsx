import { useMemo, memo, useRef, useCallback } from 'react'
import type { ResumeSettings } from '@/types'
import { TemplateRenderer } from '@/templates'
import { useResumeStore } from '@/store'
import { usePaginatedLayout, A4_HEIGHT_PX, A4_WIDTH_PX } from './usePaginatedLayout'

export interface ResumePreviewProps {
  templateId: string
  content: string
  settings: ResumeSettings
  zoom?: number
}

const PAGE_GAP = 16

export const ResumePreview = memo(({ templateId, content, settings }: ResumePreviewProps) => {
  return <TemplateRenderer templateId={templateId} content={content} settings={settings} />
})

ResumePreview.displayName = 'ResumePreview'

const FlatPreview = ({
  templateId,
  content,
  settings,
  ref,
}: ResumePreviewProps & { ref?: React.Ref<HTMLDivElement> }) => {
  const padding = settings.spacing.padding

  const settingsWithoutPadding = useMemo(
    () => ({
      ...settings,
      spacing: { ...settings.spacing, padding: 0 },
    }),
    [settings]
  )

  return (
    <div
      ref={ref}
      className="preview-page rounded-lg bg-white"
      style={{
        padding: `${padding}px`,
        position: 'relative',
      }}
    >
      <ResumePreview templateId={templateId} content={content} settings={settingsWithoutPadding} />
    </div>
  )
}

FlatPreview.displayName = 'FlatPreview'

/**
 * 分页预览模式
 * 测量在可见 DOM 的第一个页面容器中进行，消除跨 DOM 布局差异
 */
const PaginatedPreview = ({
  templateId,
  content,
  settings,
  zoom,
  ref,
}: ResumePreviewProps & { ref?: React.Ref<HTMLDivElement> }) => {
  const padding = settings.spacing.padding
  const contentHeight = A4_HEIGHT_PX - padding * 2
  const contentRef = useRef<HTMLDivElement>(null)

  const pages = usePaginatedLayout(contentRef, contentHeight, zoom ?? 1, [content, settings])

  const settingsWithoutPadding = useMemo(
    () => ({
      ...settings,
      spacing: { ...settings.spacing, padding: 0 },
    }),
    [settings]
  )

  // 合并 ref
  const containerRef = useRef<HTMLDivElement>(null)
  const setRef = useCallback(
    (node: HTMLDivElement | null) => {
      ;(containerRef as React.RefObject<HTMLDivElement | null>).current = node
      if (typeof ref === 'function') {
        ref(node)
      } else if (ref) {
        ;(ref as React.RefObject<HTMLDivElement | null>).current = node
      }
    },
    [ref]
  )

  // 分页未计算完成或单页时，显示单个页面容器（结构与分页模式一致，用于测量）
  if (pages.length <= 1) {
    return (
      <div ref={setRef} className="print-preview-container">
        <div
          className="preview-page rounded-lg bg-white"
          style={{
            width: A4_WIDTH_PX,
            height: A4_HEIGHT_PX,
            padding: `${padding}px`,
            boxSizing: 'border-box',
          }}
        >
          <div
            ref={contentRef}
            style={{
              height: contentHeight,
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <ResumePreview templateId={templateId} content={content} settings={settingsWithoutPadding} />
          </div>
        </div>
      </div>
    )
  }

  // 多页渲染
  return (
    <div
      ref={setRef}
      className="print-preview-container"
      style={{ display: 'flex', flexDirection: 'column', gap: PAGE_GAP }}
    >
      {pages.map((page, i) => (
        <div
          key={i}
          className="preview-page rounded-lg bg-white"
          style={{
            width: A4_WIDTH_PX,
            height: A4_HEIGHT_PX,
            padding: `${padding}px`,
            boxSizing: 'border-box',
          }}
        >
          <div
            ref={i === 0 ? contentRef : undefined}
            style={{
              height: page.height,
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <div style={{ transform: `translateY(${-page.startY}px)` }}>
              <ResumePreview templateId={templateId} content={content} settings={settingsWithoutPadding} />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

PaginatedPreview.displayName = 'PaginatedPreview'

export const PreviewModeRenderer = ({
  templateId,
  content,
  settings,
  zoom,
  ref,
  forceFlat,
}: ResumePreviewProps & {
  ref?: React.Ref<HTMLDivElement>
  forceFlat?: boolean
}) => {
  const previewMode = useResumeStore(state => state.previewMode)

  if (!forceFlat && previewMode === 'paginated') {
    return (
      <PaginatedPreview
        templateId={templateId}
        content={content}
        settings={settings}
        zoom={zoom}
        ref={ref}
      />
    )
  }

  return <FlatPreview templateId={templateId} content={content} settings={settings} ref={ref} />
}

PreviewModeRenderer.displayName = 'PreviewModeRenderer'
