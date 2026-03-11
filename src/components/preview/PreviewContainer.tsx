import { memo } from 'react'
import { useResumeStore } from '@/store'
import { PaginatedPreview } from './PaginatedPreview'
import { DEFAULT_SETTINGS } from '@/utils/constants'

// 预览容器组件，独立订阅 store
export const PreviewContainer = memo(() => {
  const currentResume = useResumeStore((state) => state.currentResume)

  // 如果没有当前简历，显示空状态
  if (!currentResume) {
    return (
      <div
        className="resume-preview rounded-lg overflow-hidden max-w-2xl mx-auto"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
      >
        <div className="p-6 text-center" style={{ color: 'var(--fg-muted)' }}>
          选择或创建一个简历开始编辑
        </div>
      </div>
    )
  }

  return (
    <div className="resume-preview rounded-lg overflow-hidden max-w-2xl mx-auto animate-fade-in"
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      }}>
      <PaginatedPreview
        templateId={currentResume.templateId}
        content={currentResume.content}
        settings={currentResume.settings || DEFAULT_SETTINGS}
      />
    </div>
  )
})

PreviewContainer.displayName = 'PreviewContainer'
