import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { useResumeStore } from '@/store'
import {
  MAX_MD_FILE_COUNT,
  dedupeResumeNames,
  estimateImportBytes,
  getStorageRoom,
  isMarkdownFile,
  readMarkdownFiles,
  type SkippedFile,
} from '@/services/mdImportService'

/** 把跳过的文件汇总成一行提示 */
function formatSkipped(skipped: SkippedFile[]): string {
  return skipped.map(item => `${item.fileName}（${item.reason}）`).join('、')
}

/**
 * md 批量导入流程，文件选择器与拖拽共用
 * 文件名作为简历名称，样式统一取 T1 默认，重名追加序号
 */
export function useMarkdownImport() {
  const importResumes = useResumeStore(state => state.importResumes)
  const [importing, setImporting] = useState(false)

  const importFiles = useCallback(
    async (files: FileList | File[] | null) => {
      const all = Array.from(files ?? [])
      const candidates = all.filter(isMarkdownFile)
      if (candidates.length === 0) {
        toast.warning(all.length > 0 ? '没有可导入的 .md 文件' : '请选择 .md 文件')
        return
      }
      if (candidates.length > MAX_MD_FILE_COUNT) {
        toast.warning(`一次最多导入 ${MAX_MD_FILE_COUNT} 个文件，当前选了 ${candidates.length} 个`)
        return
      }

      setImporting(true)
      try {
        const { ok, skipped } = await readMarkdownFiles(candidates)
        if (ok.length === 0) {
          toast.error(`导入失败：${formatSkipped(skipped)}`)
          return
        }

        // 配额预检：宁可整批拒绝，也不留下「导了一半」的中间态
        const { used, limit } = getStorageRoom()
        if (used + estimateImportBytes(ok) > limit) {
          toast.error('本地存储空间不足，请先删除一些简历再导入')
          return
        }

        const names = dedupeResumeNames(
          ok.map(item => item.name),
          useResumeStore.getState().resumes.map(resume => resume.name)
        )
        const count = importResumes(ok.map((item, index) => ({ ...item, name: names[index] })))

        toast.success(count > 1 ? `已导入 ${count} 份简历` : `已导入「${names[0]}」`, {
          description: skipped.length > 0 ? `已跳过：${formatSkipped(skipped)}` : undefined,
        })
      } catch (error) {
        // zustand persist 的 setItem 会在 set() 内同步抛出，配额爆掉时走到这里
        console.error('[ImportMarkdown Error]', error)
        toast.error('导入失败，可能是本地存储已满')
      } finally {
        setImporting(false)
      }
    },
    [importResumes]
  )

  return { importFiles, importing }
}
