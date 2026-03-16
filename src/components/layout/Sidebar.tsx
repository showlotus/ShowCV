import { useState, useRef, useEffect, memo, useCallback, useMemo } from 'react'
import { Plus, X, Copy } from 'lucide-react'
import { toast } from 'sonner'
import { useResumeStore } from '@/store'
import { useShallow } from 'zustand/react/shallow'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { WaveIndicator } from '@/components/common/WaveIndicator'
import type { ResumeItem } from '@/store/resumeStore'

// 简历标签项
const ResumeTab = memo(
  ({
    resume,
    isActive,
    onSelect,
    onRename,
    onDuplicate,
    onDelete,
  }: {
    resume: ResumeItem
    isActive: boolean
    onSelect: () => void
    onRename: (name: string) => void
    onDuplicate: () => void
    onDelete: () => void
  }) => {
    const [isEditing, setIsEditing] = useState(false)
    const [editName, setEditName] = useState(resume.name)
    const [isHovered, setIsHovered] = useState(false)
    const [open, setOpen] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
      if (isEditing) {
        inputRef.current?.focus()
      }
    }, [isEditing])

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
          background: isActive ? 'var(--accent-soft)' : 'transparent',
          border: `1px solid ${isActive ? 'var(--accent)' : 'var(--border)'}`,
        }}
        onClick={() => !isEditing && onSelect()}
        onDoubleClick={handleDoubleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <WaveIndicator isActive={isActive} isAnimating={isEditing} />

        {/* 内容 */}
        <div className="relative min-w-0 flex-1">
          <div
            className="transition-all duration-200 ease-in-out"
            style={{
              opacity: isEditing ? 0 : 1,
              transform: isEditing ? 'translateY(4px)' : 'translateY(0)',
              pointerEvents: isEditing ? 'none' : 'auto',
            }}
          >
            <div
              className="resume-name truncate text-sm font-medium"
              style={{ color: 'var(--fg-primary)' }}
            >
              {resume.name}
            </div>
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
              opacity: isEditing ? 1 : 0,
              transform: isEditing ? 'translateY(0)' : 'translateY(-4px)',
              pointerEvents: isEditing ? 'auto' : 'none',
            }}
          >
            <Input
              ref={inputRef}
              value={editName}
              onChange={e => setEditName(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              tabIndex={isEditing ? 0 : -1}
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

        {/* 复制按钮 + 删除按钮 + Shadcn Popover 气泡确认 */}
        <div
          className="flex shrink-0 items-center gap-1 overflow-hidden transition-all duration-200"
          style={{
            opacity: isEditing ? 0 : 1,
            maxWidth: isEditing ? 0 : 60,
            pointerEvents: isEditing ? 'none' : 'auto',
          }}
        >
          <button
            className="hover:bg-accent flex h-6 w-6 items-center justify-center rounded transition-all"
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
                className="delete-btn flex h-6 w-6 items-center justify-center rounded transition-all hover:bg-(--danger-soft)"
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
    if (storageUsage.percent >= 50) return '#f59e0b'
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

  return (
    <>
      <aside
        className="sidebar absolute top-0 left-0 z-10 flex h-full w-[300px] shrink-0 flex-col overflow-hidden transition-all duration-300"
        style={{
          transform: open ? 'translateX(0)' : 'translateX(-300px)',
          background: 'var(--bg-secondary)',
          borderRight: '1px solid var(--border)',
        }}
      >
        <div className="flex w-[300px] flex-1 flex-col overflow-hidden">
          {/* 标题栏 */}
          <div
            className="flex h-[44px] shrink-0 items-center justify-between border-b p-3"
            style={{ borderColor: 'var(--border)' }}
          >
            <span className="text-sm font-semibold" style={{ color: 'var(--fg-secondary)' }}>
              我的简历
            </span>
            <Badge
              style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
              className="rounded-full border-0 px-2 py-0.5 text-xs"
            >
              {resumes.length}
            </Badge>
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
                  onSelect={() => selectResume(resume.id)}
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
                    deleteResume(resume.id)
                    toast(`「${resume.name}」已删除`)
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

          {/* 新建按钮 */}
          <div className="shrink-0 border-t p-3" style={{ borderColor: 'var(--border)' }}>
            <Button
              variant="outline"
              className="border-border hover:bg-accent hover:text-accent-foreground hover:border-accent-foreground w-full gap-2 border-dashed text-(--fg-secondary)"
              onClick={handleCreateResume}
            >
              <Plus className="h-4 w-4" />
              新建简历
            </Button>
          </div>
        </div>
      </aside>
    </>
  )
})

Sidebar.displayName = 'Sidebar'
