import { useCallback, useEffect, useRef, useState } from 'react'
import { CheckCircle2, Download, Loader2, XCircle } from 'lucide-react'
import { useResumeStore } from '@/store'
import type { ResumeItem } from '@/store/resumeStore'
import { Button } from '@/components/ui/button'
import { exportResumeImages } from '@/services'
import type { ExportUrlParams } from '@/services/exportUrlService'

type Status = 'running' | 'done' | 'error'

/**
 * 按直链参数挑出要导出的简历，保持侧边栏顺序
 * @param params 直链参数
 */
function resolveTargets(params: ExportUrlParams): ResumeItem[] {
  const { resumes, currentResumeId } = useResumeStore.getState()
  if (params.all) return resumes
  if (params.ids.length > 0) return resumes.filter(resume => params.ids.includes(resume.id))
  const current = resumes.find(resume => resume.id === currentResumeId)
  return current ? [current] : resumes.slice(0, 1)
}

/**
 * 图片下载直链页面：打开 /export?... 后自动渲染并下载
 * 简历数据来自本机 localStorage，因此链接只在本人浏览器内有效
 */
export function ExportUrlPage({ params }: { params: ExportUrlParams }) {
  const [status, setStatus] = useState<Status>('running')
  const [progress, setProgress] = useState({ done: 0, total: 0 })
  const [fileName, setFileName] = useState('')
  const [error, setError] = useState('')
  const startedRef = useRef(false)

  const run = useCallback(async () => {
    try {
      const targets = resolveTargets(params)
      if (targets.length === 0) {
        throw new Error('未找到对应的简历，直链中的 id 只在保存过该简历的浏览器内有效')
      }
      const result = await exportResumeImages(targets, {
        mode: params.mode,
        scale: params.scale,
        onProgress: (done, total) => setProgress({ done, total }),
      })
      setFileName(result.fileName)
      setStatus('done')
    } catch (e) {
      console.error('[ExportUrl Error]', e)
      setError(e instanceof Error ? e.message : '导出失败')
      setStatus('error')
    }
  }, [params])

  useEffect(() => {
    // StrictMode 下 effect 会执行两次，用 ref 保证只导出一次
    if (startedRef.current) return
    startedRef.current = true
    void run()
  }, [run])

  const handleRetry = useCallback(() => {
    setStatus('running')
    setError('')
    void run()
  }, [run])

  return (
    <div
      className="flex h-screen flex-col items-center justify-center gap-4 px-6 text-center"
      style={{ background: 'var(--bg-primary)' }}
    >
      {status === 'running' && (
        <>
          <Loader2 className="h-6 w-6 animate-spin" style={{ color: 'var(--accent)' }} />
          <p style={{ color: 'var(--fg-primary)' }}>
            {progress.total > 1
              ? `正在生成图片 ${progress.done}/${progress.total}…`
              : '正在生成图片…'}
          </p>
        </>
      )}

      {status === 'done' && (
        <>
          <CheckCircle2 className="h-6 w-6" style={{ color: 'var(--success)' }} />
          <p style={{ color: 'var(--fg-primary)' }}>已下载 {fileName}</p>
          <p className="text-sm" style={{ color: 'var(--fg-muted)' }}>
            浏览器未弹出下载时，可点击下方按钮重新生成
          </p>
        </>
      )}

      {status === 'error' && (
        <>
          <XCircle className="h-6 w-6" style={{ color: 'var(--danger)' }} />
          <p style={{ color: 'var(--fg-primary)' }}>{error}</p>
        </>
      )}

      {status !== 'running' && (
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleRetry}>
            <Download className="h-4 w-4" />
            重新下载
          </Button>
          <Button variant="outline" asChild>
            <a href="/">返回编辑器</a>
          </Button>
        </div>
      )}
    </div>
  )
}
