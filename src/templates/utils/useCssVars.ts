import { useMemo } from 'react'
import type { ResumeSettings } from '@/types'

/**
 * 根据 ResumeSettings 生成模板 CSS 变量对象
 * 供各布局模板通过 style 属性注入，实现主题定制
 */
export function useCssVars(settings: ResumeSettings): React.CSSProperties {
  const { font, color, spacing } = settings
  return useMemo(
    () =>
      ({
        '--primary-color': color.primary,
        '--text-color': color.text,
        '--muted-color': color.muted,
        '--bg-color': color.background,
        '--title-size': `${font.titleSize}px`,
        '--heading-size': `${font.headingSize}px`,
        '--body-size': `${font.bodySize}px`,
        '--small-size': `${font.smallSize}px`,
        '--line-height': `${font.lineHeight}px`,
        '--section-gap': `${spacing.sectionGap}px`,
        '--padding': `${spacing.padding}px`,
        '--font-family': font.fontFamily,
      }) as React.CSSProperties,
    [font, color, spacing]
  )
}
