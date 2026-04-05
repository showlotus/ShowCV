import { cn, generateId, formatDate } from '@/utils'

describe('cn', () => {
  it('returns empty string with no arguments', () => {
    expect(cn()).toBe('')
  })

  it('returns single string', () => {
    expect(cn('foo')).toBe('foo')
  })

  it('joins multiple strings', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('filters falsy values', () => {
    const includeB = false
    expect(cn('a', includeB && 'b', 'c')).toBe('a c')
  })

  it('handles object syntax', () => {
    expect(cn({ a: true, b: false })).toBe('a')
  })

  it('merges conflicting Tailwind classes', () => {
    expect(cn('p-4', 'p-2')).toBe('p-2')
  })

  it('handles mixed inputs', () => {
    expect(cn('text-red-500', { 'bg-white': true, 'bg-black': false }, 'flex')).toBe(
      'text-red-500 bg-white flex'
    )
  })
})

describe('generateId', () => {
  it('returns a string', () => {
    expect(typeof generateId()).toBe('string')
  })

  it('matches expected format: timestamp-random', () => {
    expect(generateId()).toMatch(/^\d+-\w+$/)
  })

  it('generates unique ids', () => {
    const id1 = generateId()
    const id2 = generateId()
    expect(id1).not.toBe(id2)
  })
})

describe('formatDate', () => {
  it('formats Date object', () => {
    const result = formatDate(new Date(2025, 0, 15, 9, 30))
    expect(result).toContain('2025')
  })

  it('formats ISO string', () => {
    const result = formatDate('2025-06-20T14:00:00')
    expect(result).toContain('2025')
  })

  it('formats date-only string', () => {
    const result = formatDate('2024-12-25')
    expect(result).toContain('2024')
  })
})
