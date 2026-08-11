import { buildDeleteUrl, DELETE_PATH, parseDeleteUrl } from '@/services/deleteUrlService'

const ORIGIN = 'https://showcv.example.com'

describe('parseDeleteUrl', () => {
  it('returns null for other paths', () => {
    expect(parseDeleteUrl(`${ORIGIN}/`)).toBeNull()
    expect(parseDeleteUrl(`${ORIGIN}/export?id=a1`)).toBeNull()
    expect(parseDeleteUrl(`${ORIGIN}/deleted`)).toBeNull()
  })

  it('returns null for malformed urls', () => {
    expect(parseDeleteUrl('not a url')).toBeNull()
  })

  it('tolerates trailing slashes', () => {
    expect(parseDeleteUrl(`${ORIGIN}${DELETE_PATH}///?id=a1`)?.ids).toEqual(['a1'])
  })

  it('collects repeated and comma separated ids', () => {
    const params = parseDeleteUrl(`${ORIGIN}${DELETE_PATH}?id=a1&id=b2,c3&id=%20d4%20`)
    expect(params?.ids).toEqual(['a1', 'b2', 'c3', 'd4'])
  })

  it('drops empty id segments', () => {
    expect(parseDeleteUrl(`${ORIGIN}${DELETE_PATH}?id=a1,,&id=`)?.ids).toEqual(['a1'])
  })

  it('treats id=all as delete-all and keeps it out of ids', () => {
    const params = parseDeleteUrl(`${ORIGIN}${DELETE_PATH}?id=all&id=a1`)
    expect(params?.all).toBe(true)
    expect(params?.ids).toEqual(['a1'])
  })

  it('accepts 1 / true / yes for all', () => {
    expect(parseDeleteUrl(`${ORIGIN}${DELETE_PATH}?all=1`)?.all).toBe(true)
    expect(parseDeleteUrl(`${ORIGIN}${DELETE_PATH}?all=TRUE`)?.all).toBe(true)
    expect(parseDeleteUrl(`${ORIGIN}${DELETE_PATH}?all=yes`)?.all).toBe(true)
    expect(parseDeleteUrl(`${ORIGIN}${DELETE_PATH}?all=0`)?.all).toBe(false)
    expect(parseDeleteUrl(`${ORIGIN}${DELETE_PATH}?all=maybe`)?.all).toBe(false)
  })

  it('only skips the confirm page for truthy confirm values', () => {
    expect(parseDeleteUrl(`${ORIGIN}${DELETE_PATH}?id=a1&confirm=1`)?.confirmed).toBe(true)
    expect(parseDeleteUrl(`${ORIGIN}${DELETE_PATH}?id=a1&confirm=yes`)?.confirmed).toBe(true)
    expect(parseDeleteUrl(`${ORIGIN}${DELETE_PATH}?id=a1&confirm=0`)?.confirmed).toBe(false)
    expect(parseDeleteUrl(`${ORIGIN}${DELETE_PATH}?id=a1&confirm=`)?.confirmed).toBe(false)
    expect(parseDeleteUrl(`${ORIGIN}${DELETE_PATH}?id=a1`)?.confirmed).toBe(false)
  })

  it('never falls back to a target when no id is given', () => {
    // 安全默认：/delete 不带参数时什么都不选中，页面只提示而不删除
    const params = parseDeleteUrl(`${ORIGIN}${DELETE_PATH}`)
    expect(params).toEqual({ ids: [], all: false, confirmed: false })
  })
})

describe('buildDeleteUrl', () => {
  it('appends each id separately', () => {
    const url = buildDeleteUrl(ORIGIN, { ids: ['a1', 'b2'] })
    expect(url).toBe(`${ORIGIN}${DELETE_PATH}?id=a1&id=b2`)
  })

  it('uses all=1 instead of ids when all is set', () => {
    const url = buildDeleteUrl(ORIGIN, { ids: ['a1'], all: true })
    expect(url).toBe(`${ORIGIN}${DELETE_PATH}?all=1`)
  })

  it('omits confirm unless explicitly requested', () => {
    expect(buildDeleteUrl(ORIGIN, { ids: ['a1'] })).not.toContain('confirm')
    expect(buildDeleteUrl(ORIGIN, { ids: ['a1'], confirmed: true })).toContain('confirm=1')
  })

  it('round-trips through parseDeleteUrl', () => {
    const params = { ids: ['a1', 'b2'], all: false, confirmed: true }
    expect(parseDeleteUrl(buildDeleteUrl(ORIGIN, params))).toEqual(params)
  })

  it('round-trips the delete-all form', () => {
    const parsed = parseDeleteUrl(buildDeleteUrl(ORIGIN, { all: true }))
    expect(parsed).toEqual({ ids: [], all: true, confirmed: false })
  })
})
