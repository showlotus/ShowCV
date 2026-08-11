import { createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { zip } from 'fflate'
import { PreviewModeRenderer } from '@/components/preview/PreviewModeRenderer'
import { A4_WIDTH_PX } from '@/components/preview/usePaginatedLayout'
import { T1_DEFAULT_SETTINGS } from '@/templates/T1'
import type { ResumeItem } from '@/store/resumeStore'
import { downloadBlob } from '@/utils'

/** 页面形式：分页（每页一张 A4）/ 平铺（整份一张长图） */
export type ExportPageMode = 'paginated' | 'flat'

export interface ExportImageOptions {
  mode?: ExportPageMode
  /** 像素倍率，2 表示 2x 高清图 */
  scale?: number
  /** 进度回调，done 为已完成的简历份数 */
  onProgress?: (done: number, total: number) => void
  signal?: AbortSignal
}

export interface ExportImageResult {
  /** 实际生成的图片张数 */
  fileCount: number
  /** 落盘的文件名（单张为 png，多张为 zip） */
  fileName: string
}

/** 等待离屏渲染稳定的超时兜底（毫秒） */
const LAYOUT_TIMEOUT_MS = 5000

/** 文件名非法字符：路径分隔符与 Windows 保留字符 */
const INVALID_FILENAME_CHARS = /[\\/:*?"<>|]/g

/** 控制字符在文件名中同样非法，用码点判断以免正则字面量里出现控制字符 */
function isControlChar(char: string): boolean {
  const code = char.codePointAt(0) ?? 0
  return code <= 0x1f || code === 0x7f
}

/**
 * 清洗文件名中的非法字符
 * @param name 简历名称
 */
export function sanitizeFileName(name: string): string {
  const cleaned = Array.from(name)
    .filter(char => !isControlChar(char))
    .join('')
    .replace(INVALID_FILENAME_CHARS, '')
    .replace(/\s+/g, ' ')
    .trim()
  // Windows 不允许文件名以点号结尾
  return cleaned.replace(/\.+$/, '').trim() || '简历'
}

/**
 * 为一份简历的多页图片生成文件名，单页不加序号
 * @param baseName 简历名称
 * @param pageCount 页数
 */
export function buildPageFileNames(baseName: string, pageCount: number): string[] {
  const base = sanitizeFileName(baseName)
  if (pageCount <= 1) return [`${base}.png`]
  const width = String(pageCount).length
  return Array.from(
    { length: pageCount },
    (_, i) => `${base}-${String(i + 1).padStart(width, '0')}.png`
  )
}

/**
 * 同名文件追加序号去重，保证 zip 内文件名唯一
 * @param names 原始文件名列表
 */
export function dedupeFileNames(names: string[]): string[] {
  const used = new Set<string>()
  return names.map(name => {
    if (!used.has(name)) {
      used.add(name)
      return name
    }
    const dot = name.lastIndexOf('.')
    const stem = dot === -1 ? name : name.slice(0, dot)
    const ext = dot === -1 ? '' : name.slice(dot)
    let index = 1
    let candidate = `${stem} (${index})${ext}`
    while (used.has(candidate)) {
      index++
      candidate = `${stem} (${index})${ext}`
    }
    used.add(candidate)
    return candidate
  })
}

function throwIfAborted(signal?: AbortSignal) {
  if (signal?.aborted) throw new DOMException('导出已取消', 'AbortError')
}

function nextFrame(): Promise<void> {
  return new Promise(resolve => requestAnimationFrame(() => resolve()))
}

/**
 * 等待离屏内容渲染稳定：字体就绪 + 分页数量连续两帧不变 + 图片解码完成
 * 分页在 useLayoutEffect 中测量且没有完成回调，因此只能轮询 DOM 判定
 * @param container 离屏容器
 */
async function waitForStableLayout(container: HTMLElement): Promise<void> {
  const deadline = Date.now() + LAYOUT_TIMEOUT_MS

  // 字体直接影响 section 高度，必须在测量前就绪
  await document.fonts?.ready

  let lastCount = -1
  let stableFrames = 0
  while (Date.now() < deadline) {
    await nextFrame()
    const count = container.querySelectorAll('.preview-page').length
    if (count > 0 && count === lastCount) {
      stableFrames++
      if (stableFrames >= 2) break
    } else {
      stableFrames = 0
    }
    lastCount = count
  }

  // 头像为 base64，不影响布局高度，但需解码完成才能被截取到
  await Promise.all(
    Array.from(container.querySelectorAll('img')).map(img =>
      img.complete || typeof img.decode !== 'function'
        ? Promise.resolve()
        : img.decode().catch(() => undefined)
    )
  )
}

/**
 * 将一份简历离屏渲染并逐页截图
 * @param resume 简历数据
 * @param mode 页面形式
 * @param scale 像素倍率
 * @param signal 取消信号
 */
async function renderResumePages(
  resume: ResumeItem,
  mode: ExportPageMode,
  scale: number,
  signal?: AbortSignal
): Promise<Blob[]> {
  // modern-screenshot 体积较大，按需加载
  const { domToBlob } = await import('modern-screenshot')

  const host = document.createElement('div')
  host.setAttribute('aria-hidden', 'true')
  Object.assign(host.style, {
    position: 'fixed',
    left: '-9999px',
    top: '0',
    width: `${A4_WIDTH_PX}px`,
    pointerEvents: 'none',
  })
  document.body.appendChild(host)

  const root = createRoot(host)
  try {
    root.render(
      createElement(PreviewModeRenderer, {
        templateId: resume.templateId,
        content: resume.content,
        settings: resume.settings || T1_DEFAULT_SETTINGS,
        zoom: 1,
        forceFlat: mode === 'flat',
        forcePaginated: mode === 'paginated',
      })
    )

    await waitForStableLayout(host)
    throwIfAborted(signal)

    const pages = Array.from(host.querySelectorAll<HTMLElement>('.preview-page'))
    if (pages.length === 0) throw new Error(`「${resume.name}」渲染失败`)

    const blobs: Blob[] = []
    for (const page of pages) {
      throwIfAborted(signal)
      const blob = await domToBlob(page, {
        scale,
        backgroundColor: '#ffffff',
        // 预览用的圆角与阴影会在图片上留下透明边角
        style: { borderRadius: '0', boxShadow: 'none' },
      })
      if (!blob) throw new Error(`「${resume.name}」生成图片失败`)
      blobs.push(blob)
    }
    return blobs
  } finally {
    root.unmount()
    host.remove()
  }
}

function zipFiles(files: Record<string, Uint8Array>): Promise<Blob> {
  return new Promise((resolve, reject) => {
    // PNG 已压缩，level 0 仅打包，速度更快
    zip(files, { level: 0 }, (err, data) => {
      if (err) {
        reject(err)
        return
      }
      const buffer = data.buffer.slice(
        data.byteOffset,
        data.byteOffset + data.byteLength
      ) as ArrayBuffer
      resolve(new Blob([buffer], { type: 'application/zip' }))
    })
  })
}

function todayStamp(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`
}

/**
 * 批量导出简历 PNG：串行离屏渲染每份简历并逐页截图
 * 单张直接下载 PNG，多张打包为 zip
 * @param resumes 待导出的简历列表
 * @param options 导出选项
 */
export async function exportResumeImages(
  resumes: ResumeItem[],
  options: ExportImageOptions = {}
): Promise<ExportImageResult> {
  const { mode = 'paginated', scale = 2, onProgress, signal } = options
  if (resumes.length === 0) throw new Error('请至少选择一份简历')

  const entries: { name: string; blob: Blob }[] = []
  onProgress?.(0, resumes.length)

  // 串行渲染，避免多份高倍率图片同时占用内存
  for (let i = 0; i < resumes.length; i++) {
    throwIfAborted(signal)
    const resume = resumes[i]
    const blobs = await renderResumePages(resume, mode, scale, signal)
    const names = buildPageFileNames(resume.name, blobs.length)
    blobs.forEach((blob, index) => entries.push({ name: names[index], blob }))
    onProgress?.(i + 1, resumes.length)
  }

  const fileNames = dedupeFileNames(entries.map(e => e.name))

  if (entries.length === 1) {
    downloadBlob(entries[0].blob, fileNames[0])
    return { fileCount: 1, fileName: fileNames[0] }
  }

  const files: Record<string, Uint8Array> = {}
  for (let i = 0; i < entries.length; i++) {
    files[fileNames[i]] = new Uint8Array(await entries[i].blob.arrayBuffer())
  }
  const zipBlob = await zipFiles(files)
  const zipName = `showcv-images-${todayStamp()}.zip`
  downloadBlob(zipBlob, zipName)
  return { fileCount: entries.length, fileName: zipName }
}
