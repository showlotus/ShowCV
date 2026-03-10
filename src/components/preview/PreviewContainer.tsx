import { memo } from 'react'
import { useResumeStore } from '@/store'
import { PaginatedPreview } from './PaginatedPreview'

// 预览容器组件，独立订阅 store
export const PreviewContainer = memo(() => {
  const templateId = useResumeStore(state => state.templateId)
  const content = useResumeStore(state => state.content)
  const settings = useResumeStore(state => state.settings)

  return (
    <div className="w-1/2 overflow-auto bg-gray-100 p-6">
      <div className="mx-auto max-w-[210mm]">
        <div className="screen-preview">
          <PaginatedPreview templateId={templateId} content={content} settings={settings} />
        </div>
      </div>
    </div>
  )
})

PreviewContainer.displayName = 'PreviewContainer'
