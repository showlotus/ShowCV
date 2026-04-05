import { normalizeResumeSettings, DEFAULT_AVATAR_SETTINGS, DEFAULT_LAYOUT_SETTINGS } from '@/utils/constants'
import type { ResumeSettings } from '@/types'

const templateDefaults: ResumeSettings = {
  font: {
    h1TitleSize: 24,
    h2TitleSize: 16,
    h3TitleSize: 12,
    bodySize: 12,
    smallSize: 12,
    lineHeight: 12,
    fontFamily: 'sans-serif',
  },
  color: {
    primary: '#d97706',
  },
  spacing: {
    padding: 40,
    h2TitleTopGap: 10,
    h2TitleBottomGap: 10,
    h3TitleTopGap: 4,
    h3TitleBottomGap: 4,
  },
  layout: {
    headerAlign: 'left',
  },
}

describe('normalizeResumeSettings', () => {
  it('returns default structure with no arguments', () => {
    const result = normalizeResumeSettings()
    expect(result).toHaveProperty('font')
    expect(result).toHaveProperty('color')
    expect(result).toHaveProperty('spacing')
    expect(result).toHaveProperty('layout')
    expect(result).not.toHaveProperty('avatar')
  })

  it('returns default structure with null settings', () => {
    const result = normalizeResumeSettings(null, templateDefaults)
    expect(result.font).toEqual(templateDefaults.font)
    expect(result.color).toEqual(templateDefaults.color)
    expect(result.spacing).toEqual(templateDefaults.spacing)
  })

  it('user font overrides template defaults', () => {
    const result = normalizeResumeSettings({ font: { h1TitleSize: 30 } }, templateDefaults)
    expect(result.font.h1TitleSize).toBe(30)
    expect(result.font.h2TitleSize).toBe(templateDefaults.font.h2TitleSize)
    expect(result.font.fontFamily).toBe(templateDefaults.font.fontFamily)
  })

  it('user color overrides template defaults', () => {
    const result = normalizeResumeSettings(
      { color: { primary: '#ff0', text: '#333' } },
      templateDefaults
    )
    expect(result.color.primary).toBe('#ff0')
    expect(result.color.text).toBe('#333')
  })

  it('user spacing overrides template defaults', () => {
    const result = normalizeResumeSettings({ spacing: { padding: 60 } }, templateDefaults)
    expect(result.spacing.padding).toBe(60)
    expect(result.spacing.h2TitleTopGap).toBe(templateDefaults.spacing.h2TitleTopGap)
  })

  it('includes avatar when src is truthy', () => {
    const result = normalizeResumeSettings(
      { avatar: { src: 'data:image/png;base64,test' } },
      templateDefaults
    )
    expect(result.avatar).toBeDefined()
    expect(result.avatar!.src).toBe('data:image/png;base64,test')
    expect(result.avatar!.visible).toBe(DEFAULT_AVATAR_SETTINGS.visible)
    expect(result.avatar!.size).toBe(DEFAULT_AVATAR_SETTINGS.size)
  })

  it('excludes avatar when src is empty', () => {
    const result = normalizeResumeSettings(
      { avatar: { src: '' } },
      templateDefaults
    )
    expect(result).not.toHaveProperty('avatar')
  })

  it('preserves avatar override fields', () => {
    const result = normalizeResumeSettings(
      { avatar: { src: 'data:image/png;base64,test', visible: false, size: 120 } },
      templateDefaults
    )
    expect(result.avatar!.visible).toBe(false)
    expect(result.avatar!.size).toBe(120)
  })

  it('layout defaults to left alignment', () => {
    const result = normalizeResumeSettings()
    expect(result.layout.headerAlign).toBe('left')
  })

  it('user layout overrides defaults', () => {
    const result = normalizeResumeSettings(
      { layout: { headerAlign: 'center' } },
      templateDefaults
    )
    expect(result.layout.headerAlign).toBe('center')
  })

  it('works with null template defaults', () => {
    const result = normalizeResumeSettings(
      { font: { h1TitleSize: 20, h2TitleSize: 14, h3TitleSize: 12, bodySize: 12, smallSize: 10, lineHeight: 10, fontFamily: 'serif' } },
      null
    )
    expect(result.font.h1TitleSize).toBe(20)
    expect(result.font.fontFamily).toBe('serif')
    expect(result.layout.headerAlign).toBe(DEFAULT_LAYOUT_SETTINGS.headerAlign)
  })
})
