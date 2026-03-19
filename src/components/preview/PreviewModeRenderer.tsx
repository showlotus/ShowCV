import { useMemo, memo, useRef, useState, useEffect, useCallback } from 'react'
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
const PAGE_GAP = 0 // 16

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

  // 抽取计算逻辑为独立函数
  const calculatePageLayout = useCallback(
    (container: HTMLElement) => {
      const height = container.offsetHeight
      const breaks = calcPageBreaks(height)
      setPageBreaks(breaks)

      // 每页可用内容高度 = A4 高度 - 上下 padding
      const pageContentHeight = A4_HEIGHT_PX - padding * 2

      // 只选择最外层的 resume-section（直接子元素），避免选择嵌套的内层 section
      const innerContainer = container.querySelector('#resume-preview') || container
      const sections = innerContainer.querySelectorAll(':scope > .resume-section')

      // 清除旧属性
      sections.forEach(section => {
        const el = section as HTMLElement
        el.removeAttribute('data-page-last')
      })

      // 标记页码
      let lastPageNum = 0
      sections.forEach(section => {
        const el = section as HTMLElement
        const offsetTop = el.offsetTop - padding
        const pageNum = Math.floor(offsetTop / pageContentHeight) + 1
        el.setAttribute('data-page', String(pageNum))

        if (pageNum > 1 && pageNum !== lastPageNum) {
          el.setAttribute('data-page-break', 'true')
        }

        lastPageNum = pageNum
      })

      // 识别每页最后一个 section
      const pageLastSections = new Map<number, HTMLElement>()
      sections.forEach(section => {
        const el = section as HTMLElement
        const pageNum = parseInt(el.getAttribute('data-page') || '1', 10)
        pageLastSections.set(pageNum, el)
      })

      // 计算并更新剩余高度
      const updates: { el: HTMLElement; height: number }[] = []

      pageLastSections.forEach(el => {
        const sectionBottom = el.offsetTop + el.offsetHeight
        const pageNum = parseInt(el.getAttribute('data-page') || '1', 10)
        const pageBreakLineTop = pageNum * A4_HEIGHT_PX
        const remainingHeight = pageBreakLineTop - sectionBottom

        updates.push({ el, height: Math.max(0, Math.ceil(remainingHeight)) })
      })

      updates.forEach(({ el, height }) => {
        el.style.setProperty('--page-remaining-height', `${height}px`)
        el.setAttribute('data-page-last', 'true')
      })
    },
    [padding]
  )

  // 防止同一帧内重复计算
  const rafIdRef = useRef<number>(0)
  const scheduledRef = useRef(false)

  const scheduleUpdate = useCallback(
    (container: HTMLElement) => {
      if (scheduledRef.current) return
      scheduledRef.current = true

      cancelAnimationFrame(rafIdRef.current)
      rafIdRef.current = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          scheduledRef.current = false
          calculatePageLayout(container)
        })
      })
    },
    [calculatePageLayout]
  )

  // Effect 1: ResizeObserver - 监听容器尺寸变化
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new ResizeObserver(() => scheduleUpdate(container))
    observer.observe(container)
    scheduleUpdate(container) // 首次渲染

    return () => {
      observer.disconnect()
      cancelAnimationFrame(rafIdRef.current)
    }
  }, [scheduleUpdate])

  // Effect 2: settings 变化时触发
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    scheduleUpdate(container)
  }, [settings, scheduleUpdate])

  // Effect 3: content 变化时触发
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    scheduleUpdate(container)
  }, [content, scheduleUpdate])

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
