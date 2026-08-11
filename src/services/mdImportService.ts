/** 认作 Markdown 的扩展名 */
export const MD_EXTENSIONS = ['.md', '.markdown']

/** 单个文件大小上限 */
export const MAX_MD_FILE_SIZE = 1024 * 1024

/** 单次导入的文件数量上限 */
export const MAX_MD_FILE_COUNT = 50

/** localStorage 容量上限，与侧边栏占用条口径一致 */
export const STORAGE_LIMIT_BYTES = 5 * 1024 * 1024

const STORAGE_KEY = 'showcv-resume'

const FALLBACK_RESUME_NAME = '未命名简历'

export interface ImportedMarkdown {
  name: string
  content: string
}

export interface SkippedFile {
  fileName: string
  reason: string
}

export interface ReadMarkdownResult {
  ok: ImportedMarkdown[]
  skipped: SkippedFile[]
}

/**
 * 判断是否为 Markdown 文件
 * 按扩展名判断而非 file.type —— Windows 上 .md 的 MIME 常常是空字符串
 */
export function isMarkdownFile(file: File): boolean {
  const name = file.name.toLowerCase()
  return MD_EXTENSIONS.some(ext => name.endsWith(ext))
}

/**
 * 由文件名推导简历名称：剥掉目录前缀与扩展名
 * @param fileName 原始文件名，可能带 webkitRelativePath 那样的目录前缀
 */
export function resumeNameFromFileName(fileName: string): string {
  const base = fileName.split(/[\\/]/).pop() ?? ''
  const lower = base.toLowerCase()
  const ext = MD_EXTENSIONS.find(e => lower.endsWith(e))
  // 只有扩展名（如 ".md"）时不剥，否则会得到空名字
  const stem = ext && base.length > ext.length ? base.slice(0, -ext.length) : base
  return stem.trim() || FALLBACK_RESUME_NAME
}

/**
 * 重名时追加序号，同时避开已有简历名和同批次内已分配的名字
 * @param incoming 待导入的名称，按文件顺序
 * @param existing 已存在的简历名称
 */
export function dedupeResumeNames(incoming: string[], existing: string[]): string[] {
  const taken = new Set(existing)
  return incoming.map(name => {
    let candidate = name
    let index = 2
    while (taken.has(candidate)) {
      candidate = `${name} (${index})`
      index++
    }
    taken.add(candidate)
    return candidate
  })
}

/**
 * 读取一批文件的文本内容，逐个容错：非 md、超大、读取失败都记入 skipped 而不中断整批
 * @param files 待读取的文件
 */
export async function readMarkdownFiles(files: File[]): Promise<ReadMarkdownResult> {
  const ok: ImportedMarkdown[] = []
  const skipped: SkippedFile[] = []

  for (const file of files) {
    if (!isMarkdownFile(file)) {
      skipped.push({ fileName: file.name, reason: '不是 .md 文件' })
      continue
    }
    if (file.size > MAX_MD_FILE_SIZE) {
      skipped.push({ fileName: file.name, reason: '超过 1MB' })
      continue
    }
    try {
      const content = await file.text()
      ok.push({ name: resumeNameFromFileName(file.name), content })
    } catch (error) {
      console.error('[ReadMarkdown Error]', file.name, error)
      skipped.push({ fileName: file.name, reason: '读取失败' })
    }
  }

  return { ok, skipped }
}

/** 读取 localStorage 当前占用与剩余空间 */
export function getStorageRoom(): { used: number; limit: number; free: number } {
  let used = 0
  try {
    used = new Blob([localStorage.getItem(STORAGE_KEY) ?? '']).size
  } catch {
    used = 0
  }
  return { used, limit: STORAGE_LIMIT_BYTES, free: Math.max(STORAGE_LIMIT_BYTES - used, 0) }
}

/** 估算一批导入内容的字节数 */
export function estimateImportBytes(items: ImportedMarkdown[]): number {
  return items.reduce((sum, item) => sum + new Blob([item.name, item.content]).size, 0)
}
