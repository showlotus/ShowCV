/** 批量删除直链的路径 */
export const DELETE_PATH = '/delete'

const TRUTHY = ['1', 'true', 'yes']

export interface DeleteUrlParams {
  /** 指定要删除的简历 id */
  ids: string[]
  /** 是否删除全部简历 */
  all: boolean
  /** URL 带 confirm=1 时跳过确认页直接删除 */
  confirmed: boolean
}

/**
 * 解析批量删除直链参数，路径不是 /delete 时返回 null
 *
 * 与 parseExportUrl 的关键差异：`id` 缺省时不回退到当前简历。
 * 导出没参数就导当前简历是安全的，删除不能这样——目标为空时页面会提示而不是删掉任何东西。
 * @param href 完整 URL
 */
export function parseDeleteUrl(href: string): DeleteUrlParams | null {
  let url: URL
  try {
    url = new URL(href)
  } catch {
    return null
  }

  // 容忍尾随斜杠
  if (url.pathname.replace(/\/+$/, '') !== DELETE_PATH) return null

  const ids = url.searchParams
    .getAll('id')
    .flatMap(value => value.split(','))
    .map(value => value.trim())
    .filter(Boolean)

  const all =
    ids.includes('all') || TRUTHY.includes((url.searchParams.get('all') ?? '').toLowerCase())
  const confirmed = TRUTHY.includes((url.searchParams.get('confirm') ?? '').toLowerCase())

  return { ids: ids.filter(id => id !== 'all'), all, confirmed }
}

/**
 * 构造批量删除直链
 * @param origin 站点 origin，如 location.origin
 * @param params 删除参数，confirmed 为真时生成打开即删的链接
 */
export function buildDeleteUrl(origin: string, params: Partial<DeleteUrlParams> = {}): string {
  const { ids, all, confirmed } = params
  const url = new URL(DELETE_PATH, origin)
  if (all) {
    url.searchParams.set('all', '1')
  } else {
    ids?.forEach(id => url.searchParams.append('id', id))
  }
  if (confirmed) url.searchParams.set('confirm', '1')
  return url.toString()
}
