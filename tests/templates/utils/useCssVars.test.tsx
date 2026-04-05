// @vitest-environment jsdom
import { renderHook } from '@testing-library/react'
import { useCssVars } from '@/templates/utils/useCssVars'
import type { ResumeSettings } from '@/types'

const baseSettings: ResumeSettings = {
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

function getVars(result: { current: React.CSSProperties }): Record<string, string> {
  return result.current as unknown as Record<string, string>
}

describe('useCssVars', () => {
  it('returns CSS variables object with correct values', () => {
    const { result } = renderHook(() => useCssVars(baseSettings))
    expect(getVars(result)['--primary-color']).toBe('#d97706')
  })

  it('includes font size variables', () => {
    const { result } = renderHook(() => useCssVars(baseSettings))
    const vars = getVars(result)
    expect(vars['--h1-title-size']).toBe('24px')
    expect(vars['--h2-title-size']).toBe('16px')
    expect(vars['--h3-title-size']).toBe('12px')
    expect(vars['--body-size']).toBe('12px')
    expect(vars['--small-size']).toBe('12px')
  })

  it('includes line-height variable', () => {
    const { result } = renderHook(() => useCssVars(baseSettings))
    expect(getVars(result)['--line-height']).toBe('12px')
  })

  it('includes spacing variables', () => {
    const { result } = renderHook(() => useCssVars(baseSettings))
    const vars = getVars(result)
    expect(vars['--padding']).toBe('40px')
    expect(vars['--h2-title-top-gap']).toBe('10px')
    expect(vars['--h2-title-bottom-gap']).toBe('10px')
    expect(vars['--h3-title-top-gap']).toBe('4px')
    expect(vars['--h3-title-bottom-gap']).toBe('4px')
  })

  it('includes font-family variable', () => {
    const { result } = renderHook(() => useCssVars(baseSettings))
    expect(getVars(result)['--font-family']).toBe('sans-serif')
  })

  it('includes avatar variables when avatar has src', () => {
    const settings: ResumeSettings = {
      ...baseSettings,
      avatar: {
        src: 'data:image/png;base64,test',
        visible: true,
        size: 80,
        naturalWidth: 200,
        naturalHeight: 200,
        borderRadius: 10,
      },
    }
    const { result } = renderHook(() => useCssVars(settings))
    const vars = getVars(result)
    expect(vars['--avatar-size']).toBe('80px')
    expect(vars['--avatar-border-radius']).toBe('10%')
  })

  it('excludes avatar variables when avatar has no src', () => {
    const settings: ResumeSettings = {
      ...baseSettings,
      avatar: {
        src: '',
        visible: true,
        size: 80,
        naturalWidth: 0,
        naturalHeight: 0,
        borderRadius: 10,
      },
    }
    const { result } = renderHook(() => useCssVars(settings))
    const vars = getVars(result)
    expect(vars['--avatar-size']).toBeUndefined()
    expect(vars['--avatar-border-radius']).toBeUndefined()
  })

  it('returns same reference for same settings (memoized)', () => {
    const { result, rerender } = renderHook(
      ({ settings }) => useCssVars(settings),
      { initialProps: { settings: baseSettings } }
    )
    const first = result.current
    rerender({ settings: baseSettings })
    expect(result.current).toBe(first)
  })
})
