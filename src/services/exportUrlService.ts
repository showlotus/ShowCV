import type { ExportPageMode } from './imageExportService'

/** 图片下载直链的路径 */
export const EXPORT_PATH = '/export'

/** 允许的像素倍率 */
const VALID_SCALES = [1, 2, 3]

const TRUTHY = ['1', 'true', 'yes']

export interface ExportUrlParams {
  /** 指定的简历 id，为空时导出当前简历 */
  ids: string[]
  /** 是否导出全部简历 */
  all: boolean
  mode: ExportPageMode
  scale: number
}

/**
 * 解析图片下载直链参数，路径不是 /export 时返回 null
 * @param href 完整 URL
 */
export function parseExportUrl(href: string): ExportUrlParams | null {
  let url: URL
  try {
    url = new URL(href)
  } catch {
    return null
  }

  // 容忍尾随斜杠
  if (url.pathname.replace(/\/+$/, '') !== EXPORT_PATH) return null

  const ids = url.searchParams
    .getAll('id')
    .flatMap(value => value.split(','))
    .map(value => value.trim())
    .filter(Boolean)

  const all =
    ids.includes('all') || TRUTHY.includes((url.searchParams.get('all') ?? '').toLowerCase())
  const mode: ExportPageMode = url.searchParams.get('mode') === 'flat' ? 'flat' : 'paginated'
  const rawScale = Number(url.searchParams.get('scale'))
  const scale = VALID_SCALES.includes(rawScale) ? rawScale : 2

  return { ids: ids.filter(id => id !== 'all'), all, mode, scale }
}

/**
 * 构造图片下载直链
 * @param origin 站点 origin，如 location.origin
 * @param params 导出参数，ids 为空且 all 为假时表示当前简历
 */
export function buildExportUrl(origin: string, params: Partial<ExportUrlParams> = {}): string {
  const { ids, all, mode, scale } = params
  const url = new URL(EXPORT_PATH, origin)
  if (all) {
    url.searchParams.set('all', '1')
  } else {
    ids?.forEach(id => url.searchParams.append('id', id))
  }
  if (mode) url.searchParams.set('mode', mode)
  if (scale) url.searchParams.set('scale', String(scale))
  return url.toString()
}
