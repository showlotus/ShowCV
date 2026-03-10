import { useRef, useEffect, useState, useMemo } from 'react'
import type { TemplateId, ResumeSettings } from '@/types'
import { SimpleLayout, ModernLayout, CreativeLayout } from '@/layouts'

// A4 纸张尺寸 (像素，96dpi: 1mm ≈ 3.78px)
const A4_HEIGHT_PX = Math.round(297 * 3.78) // ≈ 1122px
const A4_WIDTH_PX = Math.round(210 * 3.78) // ≈ 794px

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

  // 计算页数
  useEffect(() => {
    const calculatePages = () => {
      if (!containerRef.current) return

      const contentHeight = containerRef.current.scrollHeight
      // 可用高度 = A4高度 - 上下边距
      const availableHeight = A4_HEIGHT_PX - padding * 2
      const pages = Math.max(1, Math.ceil(contentHeight / availableHeight))

      setPageCount(pages)
    }

    const timer = setTimeout(calculatePages, 200)
    return () => clearTimeout(timer)
  }, [content, settings, padding])

  return (
    <div className="space-y-6">
      {/* 隐藏的测量容器 - 使用不带 padding 的设置 */}
      <div
        ref={containerRef}
        style={{
          position: 'absolute',
          left: '-9999px',
          width: `${A4_WIDTH_PX}px`,
          visibility: 'hidden',
          padding: `${padding}px`,
          boxSizing: 'border-box',
        }}
      >
        <ResumePreview
          templateId={templateId}
          content={content}
          settings={settingsWithoutPadding}
        />
      </div>

      {/* 分页展示 - 每页是一个带边距的视窗 */}
      {Array.from({ length: pageCount }).map((_, pageIndex) => (
        <div
          key={pageIndex}
          className="relative bg-white shadow-lg"
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
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                transform: `translateY(-${pageIndex * (A4_HEIGHT_PX - padding * 2)}px)`,
                width: '100%',
                padding: `${padding}px`,
                boxSizing: 'border-box',
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
            <div className="absolute right-4 bottom-2 z-10 text-xs text-gray-400 print:hidden">
              {pageIndex + 1} / {pageCount}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
