import { memo } from 'react'
import type { ResumeSettings } from '@/types'

// 同步导入所有模板
import T1 from './T1'
import T2 from './T2'
import T3 from './T3'
import T4 from './T4'
// 新增模板时在这里添加 import

export interface LayoutProps {
  content: string
  settings: ResumeSettings
  className?: string
}

// 模板映射表
export const TEMPLATE_MAP = {
  T1,
  T2,
  T3,
  T4,
  // 新增模板时在这里添加
} as const

export type TemplateId = keyof typeof TEMPLATE_MAP

// 模板 ID 列表
export const TEMPLATE_IDS: TemplateId[] = Object.keys(TEMPLATE_MAP) as TemplateId[]

// 类型守卫
function isTemplateId(id: string): id is TemplateId {
  return Object.prototype.hasOwnProperty.call(TEMPLATE_MAP, id)
}

/**
 * 模板渲染器 - 统一入口
 */
export const TemplateRenderer = memo(
  ({ templateId, content, settings, className }: LayoutProps & { templateId: string }) => {
    const id = isTemplateId(templateId) ? templateId : 'T1'
    const Component = TEMPLATE_MAP[id]
    return <Component content={content} settings={settings} className={className} />
  }
)

TemplateRenderer.displayName = 'TemplateRenderer'
