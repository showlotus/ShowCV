import { hexToRgba } from '@/templates/utils/colorUtils'

describe('hexToRgba', () => {
  it('converts full hex with opacity 1', () => {
    expect(hexToRgba('#ff0000', 1)).toBe('rgba(255, 0, 0, 1)')
  })

  it('converts full hex with opacity 0.5', () => {
    expect(hexToRgba('#00ff00', 0.5)).toBe('rgba(0, 255, 0, 0.5)')
  })

  it('converts full hex with opacity 0', () => {
    expect(hexToRgba('#0000ff', 0)).toBe('rgba(0, 0, 255, 0)')
  })

  it('converts shorthand hex #fff', () => {
    expect(hexToRgba('#fff', 1)).toBe('rgba(255, 255, 255, 1)')
  })

  it('converts shorthand hex #000', () => {
    expect(hexToRgba('#000', 0.8)).toBe('rgba(0, 0, 0, 0.8)')
  })

  it('converts mixed shorthand hex #abc', () => {
    expect(hexToRgba('#abc', 0.3)).toBe('rgba(170, 187, 204, 0.3)')
  })

  it('handles hex without # prefix', () => {
    expect(hexToRgba('ff0000', 1)).toBe('rgba(255, 0, 0, 1)')
  })

  it('returns rgba format string', () => {
    expect(hexToRgba('#123456', 1)).toMatch(/^rgba\(\d+, \d+, \d+, .+\)$/)
  })
})
