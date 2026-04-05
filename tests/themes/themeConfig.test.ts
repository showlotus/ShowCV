import { getThemeById, THEME_LIST } from '@/themes'
import type { AppTheme } from '@/themes'

describe('getThemeById', () => {
  it('finds dark theme', () => {
    const theme = getThemeById('dark')
    expect(theme).toBeDefined()
    expect(theme!.id).toBe('dark')
    expect(theme!.variables).toBeDefined()
    expect(theme!.variables.bgPrimary).toBe('#09090b')
  })

  it('finds light theme', () => {
    const theme = getThemeById('light')
    expect(theme).toBeDefined()
    expect(theme!.id).toBe('light')
    expect(theme!.variables.bgPrimary).toBe('#f8f7f4')
  })

  it('returns undefined for ocean (commented out)', () => {
    expect(getThemeById('ocean')).toBeUndefined()
  })

  it('returns undefined for forest (commented out)', () => {
    expect(getThemeById('forest')).toBeUndefined()
  })

  it('returns undefined for unknown theme', () => {
    expect(getThemeById('nonexistent' as AppTheme)).toBeUndefined()
  })
})

describe('THEME_LIST', () => {
  it('contains only 2 themes (light and dark)', () => {
    expect(THEME_LIST).toHaveLength(2)
  })

  it('each theme has required variable keys', () => {
    const requiredKeys = [
      'bgPrimary',
      'bgSecondary',
      'bgTertiary',
      'fgPrimary',
      'fgSecondary',
      'fgMuted',
      'accent',
      'accentFg',
      'accentSoft',
      'border',
      'card',
      'glow',
      'danger',
      'dangerSoft',
      'success',
      'successSoft',
    ]
    for (const theme of THEME_LIST) {
      for (const key of requiredKeys) {
        expect(theme.variables).toHaveProperty(key)
      }
    }
  })
})
