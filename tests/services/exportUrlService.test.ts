import { describe, it, expect } from 'vitest'
import { EXPORT_PATH, parseExportUrl, buildExportUrl } from '@/services/exportUrlService'

describe('parseExportUrl', () => {
  it('非 /export 路径返回 null', () => {
    expect(parseExportUrl('https://showcv.dev/')).toBeNull()
    expect(parseExportUrl('https://showcv.dev/s/abc123')).toBeNull()
    expect(parseExportUrl('https://showcv.dev/exports')).toBeNull()
  })

  it('非法 URL 返回 null', () => {
    expect(parseExportUrl('/export?id=a')).toBeNull()
    expect(parseExportUrl('')).toBeNull()
  })

  it('容忍尾随斜杠', () => {
    expect(parseExportUrl('https://showcv.dev/export/')).not.toBeNull()
    expect(parseExportUrl('https://showcv.dev/export///')).not.toBeNull()
  })

  it('无参数时使用默认值', () => {
    expect(parseExportUrl('https://showcv.dev/export')).toEqual({
      ids: [],
      all: false,
      mode: 'paginated',
      scale: 2,
    })
  })

  it('支持重复 id 与逗号分隔', () => {
    expect(parseExportUrl('https://showcv.dev/export?id=a&id=b,c')?.ids).toEqual(['a', 'b', 'c'])
    expect(parseExportUrl('https://showcv.dev/export?id=%20a%20,,b')?.ids).toEqual(['a', 'b'])
  })

  it('id=all 与 all=true 都表示导出全部', () => {
    const byId = parseExportUrl('https://showcv.dev/export?id=all')
    expect(byId).toMatchObject({ all: true, ids: [] })

    for (const value of ['1', 'true', 'TRUE', 'yes']) {
      expect(parseExportUrl(`https://showcv.dev/export?all=${value}`)?.all).toBe(true)
    }
    expect(parseExportUrl('https://showcv.dev/export?all=0')?.all).toBe(false)
  })

  it('id=all 与其他 id 混用时剔除 all 关键字', () => {
    expect(parseExportUrl('https://showcv.dev/export?id=a,all')).toMatchObject({
      ids: ['a'],
      all: true,
    })
  })

  it('mode 仅接受 flat，其余回落到 paginated', () => {
    expect(parseExportUrl('https://showcv.dev/export?mode=flat')?.mode).toBe('flat')
    expect(parseExportUrl('https://showcv.dev/export?mode=long')?.mode).toBe('paginated')
  })

  it('scale 仅接受 1/2/3，其余回落到 2', () => {
    expect(parseExportUrl('https://showcv.dev/export?scale=1')?.scale).toBe(1)
    expect(parseExportUrl('https://showcv.dev/export?scale=3')?.scale).toBe(3)
    expect(parseExportUrl('https://showcv.dev/export?scale=4')?.scale).toBe(2)
    expect(parseExportUrl('https://showcv.dev/export?scale=abc')?.scale).toBe(2)
    expect(parseExportUrl('https://showcv.dev/export?scale=')?.scale).toBe(2)
  })
})

describe('buildExportUrl', () => {
  it('无参数时只带路径', () => {
    expect(buildExportUrl('https://showcv.dev')).toBe(`https://showcv.dev${EXPORT_PATH}`)
  })

  it('多个 id 追加为重复参数', () => {
    expect(buildExportUrl('https://showcv.dev', { ids: ['a', 'b'], mode: 'flat', scale: 3 })).toBe(
      'https://showcv.dev/export?id=a&id=b&mode=flat&scale=3'
    )
  })

  it('all 为真时忽略 ids', () => {
    expect(buildExportUrl('https://showcv.dev', { all: true, ids: ['a'] })).toBe(
      'https://showcv.dev/export?all=1'
    )
  })

  it('构造结果可被解析回同样的参数', () => {
    const url = buildExportUrl('https://showcv.dev', { ids: ['x', 'y'], mode: 'flat', scale: 1 })
    expect(parseExportUrl(url)).toEqual({ ids: ['x', 'y'], all: false, mode: 'flat', scale: 1 })
  })
})
