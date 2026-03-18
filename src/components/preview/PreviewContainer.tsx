import { memo, useRef, useEffect, useState, useCallback } from 'react'
import type { RefObject } from 'react'
import { useResumeStore } from '@/store'
import { PreviewModeRenderer } from './PreviewModeRenderer'
import { DEFAULT_SETTINGS } from '@/utils/constants'

/** A4 纸宽度像素值 (210mm ≈ 794px) */
const A4_WIDTH_PX = 794

/**
 * 预览容器组件，独立订阅 store
 * ref 透传给 PaginatedPreview，供打印方案直接使用简历内容根节点
 */
export const PreviewContainer = memo(({ ref }: { ref?: RefObject<HTMLDivElement | null> }) => {
  const currentResume = useResumeStore(state => state.currentResume)
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  const updateScale = useCallback((width: number) => {
    // contentRect.width 已是 content 区域宽度，无需减去 padding
    setScale(Math.min(width / A4_WIDTH_PX, 1))
  }, [])

  useEffect(() => {
    const container = containerRef.current?.parentElement
    if (!container) return

    const observer = new ResizeObserver(entries => {
      const { width } = entries[0].contentRect
      updateScale(width)
    })

    observer.observe(container)
    return () => observer.disconnect()
  }, [updateScale])

  if (!currentResume) {
    return (
      <div
        className="resume-preview mx-auto overflow-hidden rounded-lg"
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          maxWidth: '210mm',
        }}
      >
        <div className="p-6 text-center" style={{ color: 'var(--fg-muted)' }}>
          选择或创建一个简历开始编辑
        </div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="animate-fade-in mx-auto overflow-hidden rounded-lg"
      style={{
        // background: 'var(--card)',
        // border: '1px solid var(--border)',
        width: 794,
        minHeight: '100%',
        zoom: scale,
      }}
    >
      <div className="resume-preview">
        <PreviewModeRenderer
          ref={ref}
          templateId={currentResume.templateId}
          content={currentResume.content}
          settings={currentResume.settings || DEFAULT_SETTINGS}
        />
      </div>
    </div>
  )
})

PreviewContainer.displayName = 'PreviewContainer'
