// 字体设置
export interface FontSettings {
  titleSize: number // 标题字号 px
  headingSize: number // 二级标题字号 px
  bodySize: number // 正文字号 px
  smallSize: number // 小字字号 px
  lineHeight: number // 行高 px
  fontFamily: string // 字体
}

// 颜色设置
export interface ColorSettings {
  primary: string // 主题色
  text: string // 正文颜色
  muted: string // 辅助文字
  background: string // 背景
}

// 间距设置
export interface SpacingSettings {
  sectionGap: number // 区块间距 px
  padding: number // 内边距 px
}

// 完整简历设置
export interface ResumeSettings {
  font: FontSettings
  color: ColorSettings
  spacing: SpacingSettings
}

// 模板 ID
export type TemplateId = 'simple' | 'modern' | 'creative'

// 模板信息
export interface TemplateInfo {
  id: TemplateId
  name: string
  description: string
}

// 主题相关类型 - 从 themes 模块重新导出
export type { AppTheme, ThemeInfo, ThemeVariables } from '@/themes'
