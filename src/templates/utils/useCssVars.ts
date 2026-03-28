import { useMemo } from 'react'
import type { ResumeSettings } from '@/types'

/**
 * 根据 ResumeSettings 生成模板 CSS 变量对象
 * 供各布局模板通过 style 属性注入，实现主题定制
 */
export function useCssVars(settings: ResumeSettings): React.CSSProperties {
  const { font, color, spacing, avatar } = settings
  return useMemo(
    () =>
      ({
        '--primary-color': color.primary,
        '--text-color': color.text,
        '--muted-color': color.muted,
        '--bg-color': color.background,
        '--h1-title-size': `${font.h1TitleSize}px`,
        '--h2-title-size': `${font.h2TitleSize}px`,
        '--h3-title-size': `${font.h3TitleSize}px`,
        '--body-size': `${font.bodySize}px`,
        '--small-size': `${font.smallSize}px`,
        '--line-height': `${font.lineHeight}px`,
        '--h2-title-top-gap': `${spacing.h2TitleTopGap}px`,
        '--h2-title-bottom-gap': `${spacing.h2TitleBottomGap}px`,
        '--h3-title-top-gap': `${spacing.h3TitleTopGap}px`,
        '--h3-title-bottom-gap': `${spacing.h3TitleBottomGap}px`,
        '--padding': `${spacing.padding}px`,
        '--font-family': font.fontFamily,
        ...(avatar?.src && {
          '--avatar-size': `${avatar.size}px`,
          '--avatar-border-radius': `${avatar.borderRadius}%`,
        }),
      }) as React.CSSProperties,
    [font, color, spacing, avatar]
  )
}
