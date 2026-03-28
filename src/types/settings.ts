// 字体设置
export interface FontSettings {
  h1TitleSize: number // 一级标题字号 px
  h2TitleSize: number // 二级标题字号 px
  h3TitleSize: number // 三级标题字号 px
  bodySize: number // 正文字号 px
  smallSize: number // 小字字号 px
  lineHeight: number // 行高 px
  fontFamily: string // 字体
}

// 颜色设置
export interface ColorSettings {
  primary: string // 主题色
  text?: string // 正文颜色
  muted?: string // 辅助文字
  background?: string // 背景
}

// 间距设置
export interface SpacingSettings {
  padding: number // 内边距 px
  h2TitleTopGap: number // 二级标题上间距 px
  h2TitleBottomGap: number // 二级标题下间距 px
  h3TitleTopGap: number // 三级标题上间距 px
  h3TitleBottomGap: number // 三级标题下间距 px
}

// 头像设置
export interface AvatarSettings {
  src: string // base64 data URL
  visible: boolean // 是否展示头像
  size: number // 头像显示尺寸 px（高度）
  naturalWidth: number // 图片原始宽度 px
  naturalHeight: number // 图片原始高度 px
  borderRadius: number // 圆角百分比 0-50
}

// 完整简历设置
export interface ResumeSettings {
  font: FontSettings
  color: ColorSettings
  spacing: SpacingSettings
  avatar?: AvatarSettings
}

// 模板 ID - 从 templates 模块导出
export type { TemplateId } from '@/templates'

// 主题相关类型 - 从 themes 模块重新导出
export type { AppTheme, ThemeInfo, ThemeVariables } from '@/themes'
