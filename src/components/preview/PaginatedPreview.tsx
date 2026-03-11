import { useRef, useEffect, useState, useMemo, useCallback } from 'react'
import type { TemplateId, ResumeSettings } from '@/types'
import { SimpleLayout, ModernLayout, CreativeLayout } from '@/layouts'

// A4 纸张尺寸 (像素，96dpi: 1mm ≈ 3.78px)
export const A4_HEIGHT_PX = Math.round(297 * 3.78) // ≈ 1122px
export const A4_WIDTH_PX = Math.round(210 * 3.78) // ≈ 794px

interface ResumePreviewProps {
  templateId: TemplateId
  content: string
  settings: ResumeSettings
}

// 简历预览组件（使用 memo 优化）
const ResumePreview = ({ templateId, content, settings }: ResumePreviewProps) => {
  switch (templateId) {
    case 'modern':
      return <ModernLayout content={content} settings={settings} />
    case 'creative':
      return <CreativeLayout content={content} settings={settings} />
    default:
      return <SimpleLayout content={content} settings={settings} />
  }
}

// 分页预览组件 - 按 A4 纸分页展示
export const PaginatedPreview = ({ templateId, content, settings }: ResumePreviewProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [pageCount, setPageCount] = useState(1)

  const padding = settings.spacing.padding

  // 创建不带 padding 的设置，用于内容渲染和测量
  const settingsWithoutPadding = useMemo(
    () => ({
      ...settings,
      spacing: {
        ...settings.spacing,
        padding: 0,
      },
    }),
    [settings]
  )

  // 每页可用内容高度 = A4高度 - 上下边距
  const availableHeight = A4_HEIGHT_PX - padding * 2

  // 计算页数
  const calculatePages = useCallback(() => {
    if (!containerRef.current) return 1

    const contentHeight = containerRef.current.scrollHeight
    const pages = Math.max(1, Math.ceil(contentHeight / availableHeight))

    return pages
  }, [availableHeight])

  useEffect(() => {
    const timer = setTimeout(() => {
      setPageCount(calculatePages())
    }, 200)
    return () => clearTimeout(timer)
  }, [content, settings, padding, calculatePages])

  return (
    <div className="paginated-preview flex flex-col gap-6" data-page-count={pageCount}>
      {/* 隐藏的测量容器 - 用于测量完整内容高度 */}
      <div
        ref={containerRef}
        style={{
          position: 'absolute',
          left: '-9999px',
          width: `${A4_WIDTH_PX - padding * 2}px`,
          visibility: 'hidden',
          pointerEvents: 'none',
        }}
      >
        <ResumePreview
          templateId={templateId}
          content={content}
          settings={settingsWithoutPadding}
        />
      </div>

      {/* 分页展示 - 每页是一个带边距的 A4 视窗 */}
      {Array.from({ length: pageCount }).map((_, pageIndex) => (
        <div
          key={pageIndex}
          className="preview-page relative bg-white shadow-lg rounded-lg"
          data-page={pageIndex + 1}
          style={{
            width: `${A4_WIDTH_PX}px`,
            height: `${A4_HEIGHT_PX}px`,
            padding: `${padding}px`,
            boxSizing: 'border-box',
            overflow: 'hidden',
          }}
        >
          {/* 内容层 - 通过 transform 定位到对应页面位置 */}
          <div
            className="preview-page-content"
            style={{
              position: 'absolute',
              top: padding,
              left: padding,
              right: padding,
              bottom: padding,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                transform: `translateY(-${pageIndex * availableHeight}px)`,
                width: '100%',
              }}
            >
              <ResumePreview
                templateId={templateId}
                content={content}
                settings={settingsWithoutPadding}
              />
            </div>
          </div>
          {/* 页码指示 */}
          {pageCount > 1 && (
            <div className="page-number absolute right-4 bottom-2 z-10 text-xs text-gray-400 print:hidden">
              {pageIndex + 1} / {pageCount}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
