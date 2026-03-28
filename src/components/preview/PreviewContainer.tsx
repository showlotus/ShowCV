import { memo, useRef, useEffect, useState, useCallback } from 'react'
import type { RefObject } from 'react'
import { useResumeStore } from '@/store'
import { PreviewModeRenderer } from './PreviewModeRenderer'
import { DEFAULT_SETTINGS } from '@/utils/constants'

/** A4 纸宽度像素值 (210mm ≈ 794px) */
const A4_WIDTH_PX = 794

/**
 * 预览容器组件，独立订阅 store
 * ref 透传给隐藏的无缩放副本 DOM，供截图方案使用（不受 CSS zoom 影响）
 * printRef 透传给可见的预览 DOM，供打印方案使用
 */
export const PreviewContainer = memo(
  ({ ref, printRef }: { ref?: RefObject<HTMLDivElement | null>; printRef?: RefObject<HTMLDivElement | null> }) => {
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

    const rendererProps = {
      templateId: currentResume.templateId,
      content: currentResume.content,
      settings: currentResume.settings || DEFAULT_SETTINGS,
    }

    return (
      <>
        {/* 可见的预览 DOM（带 zoom 缩放） */}
        <div
          ref={containerRef}
          className="animate-fade-in mx-auto overflow-hidden rounded-lg"
          style={{
            width: 794,
            minHeight: '100%',
            zoom: scale,
          }}
        >
          <div className="resume-preview">
            <PreviewModeRenderer {...rendererProps} ref={printRef} />
          </div>
        </div>

        {/* 隐藏的无缩放副本 DOM（供 modern-screenshot 截图使用，不受 CSS zoom 影响） */}
        <div
          aria-hidden="true"
          style={{
            position: 'fixed',
            left: '-9999px',
            top: 0,
            width: 794,
            pointerEvents: 'none',
          }}
        >
          <PreviewModeRenderer {...rendererProps} ref={ref} />
        </div>
      </>
    )
  }
)

PreviewContainer.displayName = 'PreviewContainer'
