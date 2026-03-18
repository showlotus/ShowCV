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

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let rafId: number

    const update = () => {
      // 清除之前的待执行任务
      cancelAnimationFrame(rafId)

      // 使用双重 rAF 确保布局完成后再计算
      rafId = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const height = container.offsetHeight
          const breaks = calcPageBreaks(height)
          setPageBreaks(breaks)

          // 每页可用内容高度 = A4 高度 - 上下 padding
          const pageContentHeight = A4_HEIGHT_PX - padding * 2

          // 只选择最外层的 resume-section（直接子元素），避免选择嵌套的内层 section
          const innerContainer = container.querySelector('#resume-preview') || container
          const sections = innerContainer.querySelectorAll(':scope > .resume-section')

          // 第一步：先清除 data-page-last，稍后重新设置
          // 但不清除 --page-remaining-height，避免伪元素高度跳变
          sections.forEach(section => {
            const el = section as HTMLElement
            el.removeAttribute('data-page-last')
          })

          // 第二步：标记页码（基于 section 顶部位置）
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

          // 第三步：识别每页最后一个 section
          // 直接取每个 data-page 的最后一个 section
          const pageLastSections = new Map<number, HTMLElement>()
          sections.forEach(section => {
            const el = section as HTMLElement
            const pageNum = parseInt(el.getAttribute('data-page') || '1', 10)
            // 后面的会覆盖，最终保留该页最后一个
            pageLastSections.set(pageNum, el)
          })

          // 先计算所有新值，再统一更新，减少重排次数
          const updates: { el: HTMLElement; height: number }[] = []

          pageLastSections.forEach(el => {
            // section 的 offsetTop 是相对于 #resume-preview 容器的
            // 获取 computedStyle 以读取 margin-bottom
            const computedStyle = window.getComputedStyle(el)
            const marginBottom = parseFloat(computedStyle.marginBottom) || 0

            // section 底部（不包含 margin）相对于 preview-page 的位置
            const sectionBottom = el.offsetTop + el.offsetHeight // + padding

            // 计算该 section 所在页的分页线位置
            // 虚线位置 = pageNum * A4_HEIGHT_PX（相对于 preview-page 顶部）
            const pageNum = parseInt(el.getAttribute('data-page') || '1', 10)
            const pageBreakLineTop = pageNum * A4_HEIGHT_PX

            // ::after 需要撑开的高度 = 虚线位置 - section 底部（不包含 margin）
            // 这样 ::after 会从 section 内容底部开始，覆盖 margin-bottom 区域并延伸到虚线
            const remainingHeight = pageBreakLineTop - sectionBottom

            // DEBUG
            console.log(
              `[Page ${pageNum}] offsetTop: ${el.offsetTop}, height: ${el.offsetHeight}, marginBottom: ${marginBottom}, padding: ${padding}, sectionBottom: ${sectionBottom}, pageBreakLineTop: ${pageBreakLineTop}, remainingHeight: ${remainingHeight}`
            )

            // 始终设置，负数时设为 0
            updates.push({ el, height: Math.max(0, Math.ceil(remainingHeight)) })
          })

          // 统一更新 DOM
          updates.forEach(({ el, height }) => {
            el.style.setProperty('--page-remaining-height', `${height}px`)
            el.setAttribute('data-page-last', 'true')
          })
        })
      })
    }

    const observer = new ResizeObserver(update)
    observer.observe(container)
    update()

    return () => {
      observer.disconnect()
      cancelAnimationFrame(rafId)
    }
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
