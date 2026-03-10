import { strFromU8, strToU8, unzlibSync, zlibSync } from 'fflate'
import type { ResumeSettings, TemplateId } from '@/types'

// 分享数据结构（使用最短键名）
interface ShareData {
  c: string // content - Markdown 内容
  t: TemplateId // templateId - 模板 ID
  ft: [number, number, number, number, number, string] // font: titleSize, headingSize, bodySize, smallSize, lineHeight, fontFamily
  cl: [string, string, string, string] // color: primary, text, muted, background
  sp: [number, number, number] // spacing: sectionGap, paragraphGap, padding
}

/**
 * 将 ResumeSettings 转换为紧凑数组格式
 */
function compressSettings(settings: ResumeSettings): ShareData {
  return {
    c: '', // 由调用者填充
    t: '' as TemplateId, // 由调用者填充
    ft: [
      settings.font.titleSize,
      settings.font.headingSize,
      settings.font.bodySize,
      settings.font.smallSize,
      Math.round(settings.font.lineHeight * 10), // 乘10存储避免小数
      settings.font.fontFamily,
    ],
    cl: [
      settings.color.primary,
      settings.color.text,
      settings.color.muted,
      settings.color.background,
    ],
    sp: [settings.spacing.sectionGap, settings.spacing.paragraphGap, settings.spacing.padding],
  }
}

/**
 * 从紧凑数组格式还原 ResumeSettings
 */
function decompressSettings(data: ShareData): {
  settings: ResumeSettings
  content: string
  templateId: TemplateId
} {
  return {
    content: data.c,
    templateId: data.t,
    settings: {
      font: {
        titleSize: data.ft[0],
        headingSize: data.ft[1],
        bodySize: data.ft[2],
        smallSize: data.ft[3],
        lineHeight: data.ft[4] / 10,
        fontFamily: data.ft[5],
      },
      color: {
        primary: data.cl[0],
        text: data.cl[1],
        muted: data.cl[2],
        background: data.cl[3],
      },
      spacing: {
        sectionGap: data.sp[0],
        paragraphGap: data.sp[1],
        padding: data.sp[2],
      },
    },
  }
}

/**
 * 压缩并编码数据为 URL Hash 字符串
 * 使用 fflate zlib 压缩 + Base64 编码（参考 Vue SFC Playground）
 */
export function encodeShareData(
  content: string,
  templateId: TemplateId,
  settings: ResumeSettings
): string {
  const data = compressSettings(settings)
  data.c = content
  data.t = templateId

  const json = JSON.stringify(data)
  const buffer = strToU8(json)
  const zipped = zlibSync(buffer, { level: 9 })
  const binary = strFromU8(zipped, true)
  return btoa(binary)
}

/**
 * 解码并解压 URL Hash 数据
 */
export function decodeShareData(hash: string): {
  content: string
  templateId: TemplateId
  settings: ResumeSettings
} | null {
  try {
    const binary = atob(hash)
    // 检查 zlib header (0x78 0xDA 表示 zlib level 9)
    if (binary.startsWith('\x78\xDA')) {
      const buffer = strToU8(binary, true)
      const unzipped = unzlibSync(buffer)
      const json = strFromU8(unzipped)
      const data = JSON.parse(json) as ShareData
      return decompressSettings(data)
    }
    return null
  } catch (error) {
    console.error('Failed to decode share data:', error)
    return null
  }
}

/**
 * 生成分享链接
 */
export function generateShareUrl(
  content: string,
  templateId: TemplateId,
  settings: ResumeSettings
): string {
  const hash = encodeShareData(content, templateId, settings)
  return `${window.location.origin}${window.location.pathname}#${hash}`
}

/**
 * 获取当前 URL 的分享数据
 */
export function getShareDataFromUrl(): {
  content: string
  templateId: TemplateId
  settings: ResumeSettings
} | null {
  const hash = window.location.hash.slice(1) // 移除 # 前缀
  if (!hash) return null
  return decodeShareData(hash)
}

/**
 * 清除 URL 中的分享数据
 */
export function clearShareHash(): void {
  const url = new URL(window.location.href)
  url.hash = ''
  window.history.replaceState({}, '', url.toString())
}
