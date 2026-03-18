import { useMemo, memo, useRef, useState, useEffect } from 'react'
import type { ResumeSettings } from '@/types'
import { TemplateRenderer } from '@/templates'
import { useResumeStore } from '@/store'

export interface ResumePreviewProps {
  templateId: string
  content: string
  settings: ResumeSettings
}

// 1mm 对应的像素值（96dpi 标准）
const MM_TO_PX = 3.7795275591

// A4 纸高度（px）
const A4_HEIGHT_PX = 297 * MM_TO_PX

// 页面间距（px）
const PAGE_GAP = 16

/**
 * 根据 templateId 选择对应的简历模板渲染
 * 独立导出供缩略图等场景复用
 */
export const ResumePreview = memo(({ templateId, content, settings }: ResumePreviewProps) => {
  return <TemplateRenderer templateId={templateId} content={content} settings={settings} />
})

ResumePreview.displayName = 'ResumePreview'

/**
 * 根据容器总高度计算需要分页的位置（每页顶部）
 */
function calcPageBreaks(totalHeight: number): number[] {
  const count = Math.floor(totalHeight / A4_HEIGHT_PX)
  return Array.from({ length: count }, (_, i) => (i + 1) * A4_HEIGHT_PX)
}

/**
 * 平铺模式预览 - 连续展示，无分页
 */
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
 * 分页预览模式 - 分页展示，带虚线分隔
 */
const PaginatedPreview = ({
  templateId,
  content,
  settings,
  ref,
}: ResumePreviewProps & { ref?: React.Ref<HTMLDivElement> }) => {
  const padding = settings.spacing.padding
  const containerRef = useRef<HTMLDivElement>(null)
  const [pageBreaks, setPageBreaks] = useState<number[]>([])

  const settingsWithoutPadding = useMemo(
    () => ({
      ...settings,
      spacing: { ...settings.spacing, padding: 0 },
    }),
    [settings]
  )

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const update = () => {
      requestAnimationFrame(() => {
        const height = container.offsetHeight
        const breaks = calcPageBreaks(height)
        setPageBreaks(breaks)

        // 每页可用内容高度 = A4 高度 - 上下 padding
        const pageContentHeight = A4_HEIGHT_PX - padding * 2

        // 为每个 resume-section 标记所属页码
        const sections = container.querySelectorAll('.resume-section')

        // 第一步：清除所有旧的伪元素属性
        sections.forEach(section => {
          const el = section as HTMLElement
          el.style.removeProperty('--page-break-offset')
          el.style.removeProperty('--page-break-gap')
          el.removeAttribute('data-page-break')
        })

        // 强制 reflow，确保清除后的布局已更新
        void container.offsetHeight

        // 第二步：重新计算并设置
        let lastPageNum = 0
        sections.forEach(section => {
          const el = section as HTMLElement
          // offsetTop 是相对于 offsetParent 的距离，需要减去 padding
          const offsetTop = el.offsetTop - padding
          const pageNum = Math.floor(offsetTop / pageContentHeight) + 1
          el.setAttribute('data-page', String(pageNum))

          // 给每页（除第一页外）的第一个 section 添加分页伪元素
          if (pageNum > 1 && pageNum !== lastPageNum) {
            const pageBreakOffset = A4_HEIGHT_PX - offsetTop + padding
            // 高度减去半个间隙，让伪元素从虚线下方开始
            const adjustedOffset = pageBreakOffset - PAGE_GAP / 2
            // el.style.setProperty('--page-break-offset', `${adjustedOffset}px`)
            // el.style.setProperty('--page-break-gap', `${PAGE_GAP}px`)
            // el.style.setProperty('--preview-padding', `${padding}px`)
            el.setAttribute('data-page-break', 'true')
          }

          lastPageNum = pageNum
        })
      })
    }

    const observer = new ResizeObserver(update)
    observer.observe(container)
    update()

    return () => observer.disconnect()
  }, [content, settings, padding])

  return (
    <div
      ref={(node: HTMLDivElement | null) => {
        // 同时设置内部 ref 和外部 ref
        ;(containerRef as React.RefObject<HTMLDivElement | null>).current = node
        if (typeof ref === 'function') {
          ref(node)
        } else if (ref) {
          ;(ref as React.RefObject<HTMLDivElement | null>).current = node
        }
      }}
      className="print-preview-container"
    >
      <div
        className="preview-page rounded-lg bg-white"
        style={{
          padding: `${padding}px`,
          position: 'relative',
        }}
      >
        {/* 分页虚线 - 放在 preview-page 内部，限制在预览区域 */}
        {pageBreaks.map((top, index) => (
          <div
            key={index}
            className="page-break-line"
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: top + PAGE_GAP / 2,
              borderTop: '2px dashed #94a3b8',
              pointerEvents: 'none',
              zIndex: 10,
            }}
          />
        ))}
        <ResumePreview
          templateId={templateId}
          content={content}
          settings={settingsWithoutPadding}
        />
      </div>
    </div>
  )
}

PaginatedPreview.displayName = 'PaginatedPreview'

/**
 * 预览模式渲染器 - 根据模式切换平铺/分页展示
 * ref 透传到预览根节点，供打印和截图方案使用
 */
export const PreviewModeRenderer = ({
  templateId,
  content,
  settings,
  ref,
}: ResumePreviewProps & { ref?: React.Ref<HTMLDivElement> }) => {
  const previewMode = useResumeStore(state => state.previewMode)

  if (previewMode === 'paginated') {
    return (
      <PaginatedPreview templateId={templateId} content={content} settings={settings} ref={ref} />
    )
  }

  return <FlatPreview templateId={templateId} content={content} settings={settings} ref={ref} />
}

PreviewModeRenderer.displayName = 'PreviewModeRenderer'
