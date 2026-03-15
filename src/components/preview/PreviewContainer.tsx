import { memo } from 'react'
import type { RefObject } from 'react'
import { useResumeStore } from '@/store'
import { PaginatedPreview } from './PaginatedPreview'
import { DEFAULT_SETTINGS } from '@/utils/constants'

/**
 * 预览容器组件，独立订阅 store
 * ref 透传给 PaginatedPreview，供打印方案直接使用简历内容根节点
 */
export const PreviewContainer = memo(({ ref }: { ref?: RefObject<HTMLDivElement | null> }) => {
  const currentResume = useResumeStore(state => state.currentResume)

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
      className="resume-preview animate-fade-in mx-auto overflow-hidden rounded-lg shadow-xs"
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        // 设置 A4 纸大小
        maxWidth: '210mm',
        minHeight: '297mm',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      <PaginatedPreview
        ref={ref}
        templateId={currentResume.templateId}
        content={currentResume.content}
        settings={currentResume.settings || DEFAULT_SETTINGS}
      />
    </div>
  )
})

PreviewContainer.displayName = 'PreviewContainer'
