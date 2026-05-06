import { strFromU8, strToU8, unzlibSync, zlibSync } from 'fflate'
import type { ResumeSettings, TemplateId } from '@/types'
import { normalizeResumeSettings } from '@/utils/constants'

type ShareFontData = [number, number, number, number, number, number, string]
type ShareSpacingData = [number, number, number, number, number]

// 分享数据结构（使用最短键名）
interface ShareData {
  c: string // content - Markdown 内容
  t: TemplateId // templateId - 模板 ID
  ft: ShareFontData // font: h1TitleSize, h2TitleSize, h3TitleSize, bodySize, smallSize, lineHeight, fontFamily
  cl: [string, string, string, string] // color: primary, text, muted, background
  sp: ShareSpacingData // spacing: padding, h2TitleTopGap, h2TitleBottomGap, h3TitleTopGap, h3TitleBottomGap
  la: 'left' | 'center' | 'right' // layout: headerAlign
  n: string // name - 简历名称
}

/**
 * 将 ResumeSettings 转换为紧凑数组格式
 */
function compressSettings(settings: ResumeSettings): ShareData {
  return {
    c: '', // 由调用者填充
    t: '' as TemplateId, // 由调用者填充
    n: '', // 由调用者填充
    ft: [
      settings.font.h1TitleSize,
      settings.font.h2TitleSize,
      settings.font.h3TitleSize,
      settings.font.bodySize,
      settings.font.smallSize,
      Math.round(settings.font.lineHeight), // lineHeight px 整数存储
      settings.font.fontFamily,
    ],
    cl: [
      settings.color.primary,
      settings.color.text ?? '',
      settings.color.muted ?? '',
      settings.color.background ?? '',
    ],
    sp: [
      settings.spacing.padding,
      settings.spacing.h2TitleTopGap,
      settings.spacing.h2TitleBottomGap,
      settings.spacing.h3TitleTopGap,
      settings.spacing.h3TitleBottomGap,
    ],
    la: settings.layout.headerAlign,
  }
}

/**
 * 还原分享数据中的字体设置
 * @param font 分享数据中的字体数组
 */
function decompressFontSettings(font: ShareFontData): ResumeSettings['font'] {
  return normalizeResumeSettings({
    font: {
      h1TitleSize: font[0],
      h2TitleSize: font[1],
      h3TitleSize: font[2],
      bodySize: font[3],
      smallSize: font[4],
      lineHeight: font[5],
      fontFamily: font[6],
    },
  }).font
}

/**
 * 还原分享数据中的间距设置
 * @param spacing 分享数据中的间距数组
 */
function decompressSpacingSettings(spacing: ShareSpacingData): ResumeSettings['spacing'] {
  const [padding, h2TitleTopGap, h2TitleBottomGap] = spacing
  return normalizeResumeSettings({
    spacing: {
      padding,
      h2TitleTopGap,
      h2TitleBottomGap,
      h3TitleTopGap: spacing[3],
      h3TitleBottomGap: spacing[4],
    },
  }).spacing
}

/**
 * 从紧凑数组格式还原 ResumeSettings
 */
function decompressSettings(data: ShareData): {
  settings: ResumeSettings
  content: string
  templateId: TemplateId
  name: string
} {
  return {
    content: data.c,
    templateId: data.t,
    name: data.n,
    settings: normalizeResumeSettings({
      font: decompressFontSettings(data.ft),
      color: {
        primary: data.cl[0],
        text: data.cl[1],
        muted: data.cl[2],
        background: data.cl[3],
      },
      spacing: decompressSpacingSettings(data.sp),
      layout: {
        headerAlign: data.la ?? 'left',
      },
    }),
  }
}

/**
 * 压缩并编码数据为 Base64 字符串
 * 使用 fflate zlib 压缩 + Base64 编码
 */
export function encodeShareData({
  content,
  templateId,
  settings,
  name,
}: {
  content: string
  templateId: TemplateId
  settings: ResumeSettings
  name: string
}): string {
  const data = compressSettings(settings)
  data.c = content
  data.t = templateId
  data.n = name

  const json = JSON.stringify(data)
  const buffer = strToU8(json)
  const zipped = zlibSync(buffer, { level: 9 })
  const binary = strFromU8(zipped, true)
  return btoa(binary)
}

/**
 * 解码并解压 Base64 数据为简历数据
 */
export function decodeShareData(encoded: string): {
  content: string
  templateId: TemplateId
  settings: ResumeSettings
  name: string
} | null {
  try {
    const binary = atob(encoded)
    const buffer = strToU8(binary, true)
    const unzipped = unzlibSync(buffer)
    const json = strFromU8(unzipped)
    const data = JSON.parse(json) as ShareData
    return decompressSettings(data)
  } catch (error) {
    console.error('Failed to decode share data:', error)
    return null
  }
}

/**
 * 通过服务端 API 创建加密分享链接
 * 流程：压缩数据 → POST 到服务端 → 服务端加密存储 → 返回 shareId
 */
export async function createServerShare(params: {
  content: string
  templateId: TemplateId
  settings: ResumeSettings
  name: string
}): Promise<string> {
  const encoded = encodeShareData(params)
  const response = await fetch('/api/share/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: encoded }),
  })

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.error || `分享创建失败: ${response.status}`)
  }

  const { shareId } = (await response.json()) as { shareId: string }
  return `${window.location.origin}/s/${shareId}`
}

/**
 * 通过服务端 API 读取分享数据（阅后即焚）
 * @param shareId 分享 ID
 * @returns 解码后的简历数据，或 null（链接已失效）
 */
export async function fetchShareData(shareId: string): Promise<{
  content: string
  templateId: TemplateId
  settings: ResumeSettings
  name: string
} | null> {
  const response = await fetch(`/api/share/${shareId}`)

  if (response.status === 410) {
    return null
  }

  if (!response.ok) {
    throw new Error(`获取分享数据失败: ${response.status}`)
  }

  const { data } = (await response.json()) as { data: string }
  return decodeShareData(data)
}

/** 检测 URL 是否包含服务端分享 ID */
export function getShareIdFromUrl(): string | null {
  const match = window.location.pathname.match(/^\/s\/([A-Za-z0-9_-]{12})$/)
  return match ? match[1] : null
}

/** 清除 URL 中的分享路径 */
export function clearSharePath(): void {
  window.history.replaceState({}, '', window.location.origin + window.location.pathname.replace(/\/s\/[A-Za-z0-9_-]{12}$/, ''))
}
