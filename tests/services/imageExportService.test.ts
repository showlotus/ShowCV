// @vitest-environment jsdom

// 该服务静态依赖预览组件与 store，需要 DOM 环境；头像资源以 ?url 导入
vi.mock('@/assets/avatar.png?url', () => ({ default: 'data:image/png;base64,mock-avatar' }))

import {
  sanitizeFileName,
  buildPageFileNames,
  dedupeFileNames,
} from '@/services/imageExportService'

describe('sanitizeFileName', () => {
  it('keeps normal names untouched', () => {
    expect(sanitizeFileName('前端工程师 - 张三')).toBe('前端工程师 - 张三')
  })

  it('strips path separators and reserved characters', () => {
    expect(sanitizeFileName('a/b\\c:d*e?f"g<h>i|j')).toBe('abcdefghij')
  })

  it('collapses whitespace and trims', () => {
    expect(sanitizeFileName('  我的   简历  ')).toBe('我的 简历')
  })

  it('drops trailing dots (invalid on Windows)', () => {
    expect(sanitizeFileName('resume...')).toBe('resume')
  })

  it('falls back when nothing usable remains', () => {
    expect(sanitizeFileName('///')).toBe('简历')
    expect(sanitizeFileName('   ')).toBe('简历')
  })
})

describe('buildPageFileNames', () => {
  it('omits the index for a single page', () => {
    expect(buildPageFileNames('张三', 1)).toEqual(['张三.png'])
  })

  it('treats a zero page count as single page', () => {
    expect(buildPageFileNames('张三', 0)).toEqual(['张三.png'])
  })

  it('numbers multiple pages from 1', () => {
    expect(buildPageFileNames('张三', 3)).toEqual(['张三-1.png', '张三-2.png', '张三-3.png'])
  })

  it('zero-pads to a consistent width', () => {
    const names = buildPageFileNames('张三', 10)
    expect(names[0]).toBe('张三-01.png')
    expect(names[9]).toBe('张三-10.png')
  })

  it('sanitizes the base name', () => {
    expect(buildPageFileNames('a/b', 2)).toEqual(['ab-1.png', 'ab-2.png'])
  })
})

describe('dedupeFileNames', () => {
  it('leaves unique names alone', () => {
    expect(dedupeFileNames(['a.png', 'b.png'])).toEqual(['a.png', 'b.png'])
  })

  it('appends an index to duplicates, keeping the extension', () => {
    expect(dedupeFileNames(['a.png', 'a.png', 'a.png'])).toEqual([
      'a.png',
      'a (1).png',
      'a (2).png',
    ])
  })

  it('skips indices that would collide with an existing name', () => {
    expect(dedupeFileNames(['a.png', 'a (1).png', 'a.png'])).toEqual([
      'a.png',
      'a (1).png',
      'a (2).png',
    ])
  })

  it('handles names without an extension', () => {
    expect(dedupeFileNames(['a', 'a'])).toEqual(['a', 'a (1)'])
  })
})
