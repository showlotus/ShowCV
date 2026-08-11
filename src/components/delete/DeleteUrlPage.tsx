import { useCallback, useEffect, useRef, useState } from 'react'
import { AlertTriangle, CheckCircle2, Loader2, RotateCcw, Trash2, XCircle } from 'lucide-react'
import { useResumeStore } from '@/store'
import type { DeleteSnapshot, ResumeItem } from '@/store/resumeStore'
import { Button } from '@/components/ui/button'
import type { DeleteUrlParams } from '@/services/deleteUrlService'

type Status = 'deleting' | 'confirm' | 'done' | 'restored' | 'error'

/**
 * 按直链参数挑出要删除的简历，保持侧边栏顺序
 *
 * 与导出直链不同：没有 id 也没有 all 时返回空数组，绝不回退到「当前简历」
 * @param params 直链参数
 */
function resolveTargets(params: DeleteUrlParams): ResumeItem[] {
  const { resumes } = useResumeStore.getState()
  if (params.all) return resumes
  if (params.ids.length === 0) return []
  return resumes.filter(resume => params.ids.includes(resume.id))
}

/**
 * 批量删除直链页面：/delete?id=...
 *
 * 不带 confirm 参数时先渲染确认页，带 confirm=1 才打开即删。
 * 简历数据来自本机 localStorage，因此链接只在本人浏览器内有效。
 */
export function DeleteUrlPage({ params }: { params: DeleteUrlParams }) {
  // 目标在挂载时定格，之后的删除/撤销都不改变这份列表（页面要一直显示这些名字）
  const [targets] = useState(() => resolveTargets(params))
  const [knownIds] = useState(() => useResumeStore.getState().resumes.map(r => r.id))
  const [restored, setRestored] = useState(false)
  const snapshotRef = useRef<DeleteSnapshot | null>(null)
  const startedRef = useRef(false)

  // 删没删完直接问 store，页面状态因此不需要在 effect 里 setState
  const gone = useResumeStore(state => !targets.some(t => state.resumes.some(r => r.id === t.id)))

  // 删空时 store 会自动补一份空白简历：挂载时不存在的 id 出现了，就说明补过
  const placeholderCreated = useResumeStore(state =>
    state.resumes.some(r => !knownIds.includes(r.id))
  )

  const status: Status =
    targets.length === 0
      ? 'error'
      : restored
        ? 'restored'
        : gone
          ? 'done'
          : params.confirmed
            ? 'deleting'
            : 'confirm'

  const missingCount = params.all
    ? 0
    : params.ids.filter(id => !targets.some(target => target.id === id)).length

  const runDelete = useCallback(() => {
    snapshotRef.current = useResumeStore.getState().deleteResumes(targets.map(t => t.id))
    setRestored(false)
  }, [targets])

  useEffect(() => {
    // 只有 confirm=1 才自动执行；StrictMode 下 effect 会跑两次，用 ref 保证只删一次
    if (!params.confirmed || targets.length === 0 || startedRef.current) return
    startedRef.current = true
    snapshotRef.current = useResumeStore.getState().deleteResumes(targets.map(t => t.id))
  }, [params.confirmed, targets])

  const handleRestore = useCallback(() => {
    if (!snapshotRef.current) return
    useResumeStore.getState().restoreResumes(snapshotRef.current)
    setRestored(true)
  }, [])

  return (
    <div
      className="flex h-screen flex-col items-center justify-center gap-4 px-6 text-center"
      style={{ background: 'var(--bg-primary)' }}
    >
      {status === 'deleting' && (
        <>
          <Loader2 className="h-6 w-6 animate-spin" style={{ color: 'var(--accent)' }} />
          <p style={{ color: 'var(--fg-primary)' }}>正在删除 {targets.length} 份简历…</p>
        </>
      )}

      {status === 'confirm' && (
        <>
          <AlertTriangle className="h-6 w-6" style={{ color: 'var(--warning)' }} />
          <p style={{ color: 'var(--fg-primary)' }}>即将删除 {targets.length} 份简历</p>
          <ul
            className="max-h-60 max-w-md overflow-auto text-sm"
            style={{ color: 'var(--fg-secondary)' }}
          >
            {targets.map(target => (
              <li key={target.id} className="truncate">
                {target.name}
              </li>
            ))}
          </ul>
          {missingCount > 0 && (
            <p className="text-sm" style={{ color: 'var(--fg-muted)' }}>
              另有 {missingCount} 个 id 在本机没找到，已忽略
            </p>
          )}
          <p className="text-sm" style={{ color: 'var(--fg-muted)' }}>
            简历只存在本机浏览器，删除后仅本页面内可撤销
          </p>
          <div className="flex items-center gap-2">
            <Button variant="destructive" onClick={runDelete}>
              <Trash2 className="h-4 w-4" />
              确认删除
            </Button>
            <Button variant="outline" asChild>
              <a href="/">返回编辑器</a>
            </Button>
          </div>
        </>
      )}

      {status === 'done' && (
        <>
          <CheckCircle2 className="h-6 w-6" style={{ color: 'var(--success)' }} />
          <p style={{ color: 'var(--fg-primary)' }}>已删除 {targets.length} 份简历</p>
          {placeholderCreated && (
            <p className="text-sm" style={{ color: 'var(--fg-muted)' }}>
              简历已被清空，已自动新建一份空白简历
            </p>
          )}
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleRestore}>
              <RotateCcw className="h-4 w-4" />
              撤销
            </Button>
            <Button variant="outline" asChild>
              <a href="/">返回编辑器</a>
            </Button>
          </div>
        </>
      )}

      {status === 'restored' && (
        <>
          <CheckCircle2 className="h-6 w-6" style={{ color: 'var(--success)' }} />
          <p style={{ color: 'var(--fg-primary)' }}>已恢复 {targets.length} 份简历</p>
          <Button variant="outline" asChild>
            <a href="/">返回编辑器</a>
          </Button>
        </>
      )}

      {status === 'error' && (
        <>
          <XCircle className="h-6 w-6" style={{ color: 'var(--danger)' }} />
          <p style={{ color: 'var(--fg-primary)' }}>
            {params.ids.length === 0 && !params.all
              ? '直链里没有指定要删除的简历，请带上 id 参数或 all=1'
              : '未找到对应的简历，直链中的 id 只在保存过该简历的浏览器内有效'}
          </p>
          <Button variant="outline" asChild>
            <a href="/">返回编辑器</a>
          </Button>
        </>
      )}
    </div>
  )
}
