import { useState, useRef, useEffect, memo, useCallback, useMemo } from 'react'
import { Plus, X, Copy, Pencil, Check, ListChecks, Link2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useResumeStore } from '@/store'
import { useShallow } from 'zustand/react/shallow'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { WaveIndicator } from '@/components/common/WaveIndicator'
import { useBatchDelete } from '@/hooks/useBatchDelete'
import { buildDeleteUrl } from '@/services/deleteUrlService'
import type { ResumeItem } from '@/store/resumeStore'

// 简历标签项
const ResumeTab = memo(
  ({
    resume,
    isActive,
    selecting,
    selected,
    onSelect,
    onToggleSelect,
    onRename,
    onDuplicate,
    onDelete,
  }: {
    resume: ResumeItem
    isActive: boolean
    /** 是否处于批量删除的勾选模式 */
    selecting: boolean
    selected: boolean
    onSelect: () => void
    onToggleSelect: () => void
    onRename: (name: string) => void
    onDuplicate: () => void
    onDelete: () => void
  }) => {
    const [isEditing, setIsEditing] = useState(false)
    const [editName, setEditName] = useState(resume.name)
    const [isHovered, setIsHovered] = useState(false)
    const [isTruncated, setIsTruncated] = useState(false)
    const [open, setOpen] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)
    const nameRef = useRef<HTMLDivElement>(null)

    // 勾选模式下强行退出重命名态（用派生值而非 effect 里 setState）
    const editing = isEditing && !selecting
    // 勾选模式下高亮跟随勾选，否则跟随当前简历
    const highlighted = selecting ? selected : isActive

    const checkTruncated = useCallback(() => {
      const el = nameRef.current
      if (el) setIsTruncated(el.scrollWidth > el.clientWidth)
    }, [])

    useEffect(() => {
      if (editing) {
        inputRef.current?.focus()
      }
    }, [editing])

    const handleDoubleClick = () => {
      setIsEditing(true)
      setEditName(resume.name)
    }

    const handleBlur = () => {
      if (!isEditing) return
      if (editName.trim() && editName !== resume.name) {
        onRename(editName.trim())
      }
      setIsEditing(false)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleBlur()
      } else if (e.key === 'Escape') {
        setEditName(resume.name)
        setIsEditing(false)
      }
    }

    const formatDate = (timestamp: number) => {
      const date = new Date(timestamp)
      return date.toLocaleString('zh-CN', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    }

    return (
      <div
        className={`resume-tab flex h-[64px] cursor-pointer items-center gap-3 rounded-lg p-3 transition-all ${
          isActive ? 'active' : ''
        }`}
        style={{
          background: highlighted ? 'var(--accent-soft)' : 'transparent',
          border: `1px solid ${highlighted ? 'var(--accent)' : 'var(--border)'}`,
        }}
        onClick={() => {
          if (selecting) {
            onToggleSelect()
            return
          }
          if (!editing) onSelect()
        }}
        onDoubleClick={() => {
          if (!selecting) handleDoubleClick()
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {selecting ? (
          <span
            className="flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border transition-colors"
            style={{
              borderColor: selected ? 'var(--accent)' : 'var(--border)',
              background: selected ? 'var(--accent)' : 'transparent',
            }}
            aria-hidden
          >
            {selected && <Check className="h-3 w-3" style={{ color: 'var(--bg-primary)' }} />}
          </span>
        ) : (
          <WaveIndicator isActive={isActive} isEditing={editing} />
        )}

        {/* 内容 */}
        <div className="relative min-w-0 flex-1">
          <div
            className="transition-all duration-200 ease-in-out"
            style={{
              opacity: editing ? 0 : 1,
              transform: editing ? 'translateY(4px)' : 'translateY(0)',
              pointerEvents: editing ? 'none' : 'auto',
            }}
          >
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    ref={nameRef}
                    className="resume-name truncate text-sm font-medium"
                    style={{ color: 'var(--fg-primary)' }}
                    onMouseEnter={checkTruncated}
                  >
                    {resume.name}
                  </div>
                </TooltipTrigger>
                {isTruncated && <TooltipContent side="right">{resume.name}</TooltipContent>}
              </Tooltip>
            </TooltipProvider>
            <div className="mt-1 flex items-center justify-between gap-1.5">
              <span className="truncate text-xs" style={{ color: 'var(--fg-muted)' }}>
                {formatDate(resume.updatedAt)}
              </span>
              {resume.fromShare && (
                <Badge
                  className="shrink-0 rounded-sm border-0 px-1.5 py-0 text-[12px] leading-4"
                  style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
                >
                  来自分享
                </Badge>
              )}
            </div>
          </div>
          <div
            className="absolute inset-0 flex items-center transition-all duration-200 ease-in-out"
            style={{
              opacity: editing ? 1 : 0,
              transform: editing ? 'translateY(0)' : 'translateY(-4px)',
              pointerEvents: editing ? 'auto' : 'none',
            }}
          >
            <Input
              ref={inputRef}
              value={editName}
              onChange={e => setEditName(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              tabIndex={editing ? 0 : -1}
              className="h-8 w-full rounded-sm px-2 py-1 text-sm"
              style={{
                background: 'var(--bg-primary)',
                borderColor: 'var(--accent)',
                color: 'var(--fg-primary)',
              }}
              onClick={e => e.stopPropagation()}
            />
          </div>
        </div>

        {/* 重命名按钮 + 复制按钮 + 删除按钮 + Shadcn Popover 气泡确认 */}
        <div
          className="flex shrink-0 items-center gap-1 overflow-hidden transition-all duration-200"
          style={{
            opacity: editing || selecting ? 0 : 1,
            maxWidth: editing || selecting ? 0 : 84,
            pointerEvents: editing || selecting ? 'none' : 'auto',
          }}
        >
          <button
            className="hover:bg-accent flex h-6 w-6 cursor-pointer items-center justify-center rounded transition-all"
            style={{ opacity: isHovered ? 1 : 0 }}
            tabIndex={isHovered ? 0 : -1}
            aria-label={`重命名简历 ${resume.name}`}
            onClick={e => {
              e.stopPropagation()
              handleDoubleClick()
            }}
          >
            <Pencil className="h-3.5 w-3.5" style={{ color: 'var(--fg-muted)' }} />
          </button>
          <button
            className="hover:bg-accent flex h-6 w-6 cursor-pointer items-center justify-center rounded transition-all"
            style={{ opacity: isHovered ? 1 : 0 }}
            tabIndex={isHovered ? 0 : -1}
            aria-label={`复制简历 ${resume.name}`}
            onClick={e => {
              e.stopPropagation()
              onDuplicate()
            }}
          >
            <Copy className="h-3.5 w-3.5" style={{ color: 'var(--fg-muted)' }} />
          </button>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <button
                className="delete-btn flex h-6 w-6 cursor-pointer items-center justify-center rounded transition-all hover:bg-(--danger-soft)"
                style={{ opacity: isHovered || open ? 1 : 0 }}
                tabIndex={isHovered || open ? 0 : -1}
                aria-label={`删除简历 ${resume.name}`}
                onClick={e => e.stopPropagation()}
              >
                <X
                  className="h-3.5 w-3.5 transition-colors"
                  style={{ color: open ? 'var(--danger)' : 'var(--fg-muted)' }}
                />
              </button>
            </PopoverTrigger>
            <PopoverContent
              className="w-44 p-3"
              side="right"
              align="center"
              onClick={e => e.stopPropagation()}
            >
              <p className="mb-2.5 text-xs" style={{ color: 'var(--fg-secondary)' }}>
                确定删除此简历？
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="xs"
                  className="hover:bg-accent hover:text-accent-foreground flex-1 rounded-sm text-(--fg-secondary)"
                  onClick={() => setOpen(false)}
                >
                  取消
                </Button>
                <Button
                  variant="destructive"
                  size="xs"
                  className="flex-1 rounded-sm"
                  onClick={() => {
                    setOpen(false)
                    onDelete()
                  }}
                >
                  删除
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    )
  }
)

ResumeTab.displayName = 'ResumeTab'

export const Sidebar = memo(({ open }: { open: boolean }) => {
  const { resumes, currentResumeId, createResume, deleteResume, renameResume, selectResume } =
    useResumeStore(
      useShallow(state => ({
        resumes: state.resumes,
        currentResumeId: state.currentResumeId,
        createResume: state.createResume,
        deleteResume: state.deleteResume,
        renameResume: state.renameResume,
        selectResume: state.selectResume,
      }))
    )

  const [selecting, setSelecting] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const { deleteWithUndo } = useBatchDelete()

  /** 计算 localStorage 中当前简历数据的字节占用 */
  const storageUsage = useMemo(() => {
    const LIMIT = 5 * 1024 * 1024 // 5MB
    try {
      const raw = localStorage.getItem('showcv-resume') ?? ''
      const used = new Blob([raw]).size
      return { used, limit: LIMIT, percent: Math.min((used / LIMIT) * 100, 100) }
    } catch {
      return { used: 0, limit: LIMIT, percent: 0 }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumes])

  /** 根据占用比例返回对应颜色变量 */
  const storageColor = useMemo(() => {
    if (storageUsage.percent >= 80) return 'var(--danger)'
    if (storageUsage.percent >= 50) return 'var(--warning)'
    return 'var(--success)'
  }, [storageUsage.percent])

  /** 格式化字节数为可读字符串 */
  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`
  }

  const handleCreateResume = useCallback(() => {
    createResume()
    toast.success('已创建新简历')
  }, [createResume])

  const exitSelecting = useCallback(() => {
    setSelecting(false)
    setSelectedIds([])
  }, [])

  const toggleSelected = useCallback((id: string) => {
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]))
  }, [])

  const toggleSelectAll = useCallback(() => {
    setSelectedIds(prev => (prev.length === resumes.length ? [] : resumes.map(r => r.id)))
  }, [resumes])

  const handleBatchDelete = useCallback(() => {
    // 按列表顺序传入，让 toast 里的名称顺序与侧边栏一致
    const ids = resumes.filter(r => selectedIds.includes(r.id)).map(r => r.id)
    if (deleteWithUndo(ids) > 0) exitSelecting()
  }, [resumes, selectedIds, deleteWithUndo, exitSelecting])

  const handleCopyDeleteUrl = useCallback(async () => {
    const ids = resumes.filter(r => selectedIds.includes(r.id)).map(r => r.id)
    if (ids.length === 0) {
      toast.warning('请至少选择一份简历')
      return
    }
    const url = buildDeleteUrl(window.location.origin, { ids, confirmed: true })
    try {
      await navigator.clipboard.writeText(url)
      toast.success('删除直链已复制', { description: '打开即删，且只在本机浏览器内有效' })
    } catch (error) {
      console.error('[CopyDeleteUrl Error]', error)
      toast.error('复制失败，请手动复制地址栏链接')
    }
  }, [resumes, selectedIds])

  // 勾选模式下按 Esc 退出
  useEffect(() => {
    if (!selecting) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') exitSelecting()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [selecting, exitSelecting])

  return (
    <>
      <aside
        className="sidebar relative z-10 flex h-full w-[300px] shrink-0 flex-col overflow-hidden transition-all duration-300"
        style={{
          width: open ? undefined : '0px',
          background: 'var(--bg-secondary)',
          borderRight: open ? '1px solid var(--border)' : 'none',
        }}
      >
        <div className="flex w-[300px] flex-1 flex-col overflow-hidden">
          {/* 标题栏 */}
          <div
            className="flex h-[44px] shrink-0 items-center justify-between border-b p-3"
            style={{ borderColor: 'var(--border)' }}
          >
            <span className="text-sm font-semibold" style={{ color: 'var(--fg-primary)' }}>
              {selecting ? `已选 ${selectedIds.length} / ${resumes.length}` : '我的简历'}
            </span>
            <div className="flex items-center gap-1.5">
              {selecting && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      className="hover:bg-accent flex h-6 w-6 cursor-pointer items-center justify-center rounded transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                      disabled={selectedIds.length === 0}
                      aria-label="复制删除直链"
                      onClick={handleCopyDeleteUrl}
                    >
                      <Link2 className="h-3.5 w-3.5" style={{ color: 'var(--fg-muted)' }} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">复制删除直链（打开即删）</TooltipContent>
                </Tooltip>
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className="hover:bg-accent flex h-6 w-6 cursor-pointer items-center justify-center rounded transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                    disabled={!selecting && resumes.length <= 1}
                    aria-label={selecting ? '退出批量删除' : '批量删除'}
                    onClick={() => (selecting ? exitSelecting() : setSelecting(true))}
                  >
                    {selecting ? (
                      <X className="h-3.5 w-3.5" style={{ color: 'var(--fg-muted)' }} />
                    ) : (
                      <ListChecks className="h-3.5 w-3.5" style={{ color: 'var(--fg-muted)' }} />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  {selecting ? '退出批量删除（Esc）' : '批量删除'}
                </TooltipContent>
              </Tooltip>
              <Badge
                style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
                className="rounded-full border-0 px-2 py-0.5 text-xs"
              >
                {resumes.length}
              </Badge>
            </div>
          </div>

          {/* 简历列表 */}
          <div className="flex-1 space-y-2 overflow-auto p-3">
            {resumes.map((resume, index) => (
              <div
                key={resume.id}
                className="animate-slide-in"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <ResumeTab
                  resume={resume}
                  isActive={resume.id === currentResumeId}
                  selecting={selecting}
                  selected={selectedIds.includes(resume.id)}
                  onSelect={() => selectResume(resume.id)}
                  onToggleSelect={() => toggleSelected(resume.id)}
                  onRename={name => renameResume(resume.id, name)}
                  onDuplicate={() => {
                    createResume({
                      name: `${resume.name} 副本`,
                      content: resume.content,
                      templateId: resume.templateId,
                      settings: resume.settings,
                    })
                    toast.success('已复制简历')
                  }}
                  onDelete={() => {
                    if (resumes.length <= 1) {
                      toast.warning('至少保留一份简历')
                      return
                    }
                    deleteResume(resume.id)
                    toast.success(`「${resume.name}」已删除`)
                  }}
                />
              </div>
            ))}
          </div>

          {/* 本地存储占用进度 */}
          <div className="shrink-0 border-t px-3 py-2.5" style={{ borderColor: 'var(--border)' }}>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-[11px]" style={{ color: 'var(--fg-muted)' }}>
                本地存储
              </span>
              <span className="text-[11px]" style={{ color: storageColor }}>
                {formatBytes(storageUsage.used)} / 5 MB
              </span>
            </div>
            <div
              className="h-1 w-full overflow-hidden rounded-full"
              style={{ background: 'var(--bg-tertiary)' }}
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${storageUsage.percent}%`, background: storageColor }}
              />
            </div>
          </div>

          {/* 新建按钮 / 勾选模式下的批量删除操作 */}
          <div className="shrink-0 border-t p-3" style={{ borderColor: 'var(--border)' }}>
            {selecting ? (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="border-border hover:bg-accent hover:text-accent-foreground hover:border-accent-foreground flex-1 text-(--fg-secondary)"
                  onClick={toggleSelectAll}
                >
                  {selectedIds.length === resumes.length ? '取消全选' : '全选'}
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1 gap-2"
                  disabled={selectedIds.length === 0}
                  onClick={handleBatchDelete}
                >
                  <Trash2 className="h-4 w-4" />
                  删除 {selectedIds.length} 份
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                className="border-border hover:bg-accent hover:text-accent-foreground hover:border-accent-foreground w-full gap-2 text-(--fg-secondary)"
                onClick={handleCreateResume}
              >
                <Plus className="h-4 w-4" />
                新建简历
              </Button>
            )}
          </div>
        </div>
      </aside>
    </>
  )
})

Sidebar.displayName = 'Sidebar'
