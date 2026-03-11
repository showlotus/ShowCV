import { useState, memo, useCallback } from 'react'
import { Plus, X } from 'lucide-react'
import { useResumeStore } from '@/store'
import { useToastStore } from '@/store/toastStore'
import { DeleteConfirmModal } from '../common'
import type { ResumeItem } from '@/store/resumeStore'

interface SidebarProps {
  isOpen: boolean
}

// 简历标签项
const ResumeTab = memo(
  ({
    resume,
    isActive,
    onSelect,
    onRename,
    onDelete,
  }: {
    resume: ResumeItem
    isActive: boolean
    onSelect: () => void
    onRename: (name: string) => void
    onDelete: () => void
  }) => {
    const [isEditing, setIsEditing] = useState(false)
    const [editName, setEditName] = useState(resume.name)

    const handleDoubleClick = () => {
      setIsEditing(true)
      setEditName(resume.name)
    }

    const handleBlur = () => {
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
      return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
    }

    return (
      <div
        className={`resume-tab p-3 rounded-lg flex items-center gap-3 cursor-pointer transition-all ${
          isActive ? 'active' : ''
        }`}
        style={{
          background: isActive ? 'var(--accent-soft)' : 'transparent',
          border: `1px solid ${isActive ? 'var(--accent)' : 'transparent'}`,
        }}
        onClick={() => !isEditing && onSelect()}
        onDoubleClick={handleDoubleClick}
      >
        {/* 指示条 */}
        <div
          className="tab-indicator w-0.5 h-8 rounded-full flex-shrink-0 transition-all"
          style={{
            background: isActive ? 'var(--accent)' : 'transparent',
            width: isActive ? '3px' : '2px',
          }}
        />

        {/* 内容 */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              className="rename-input w-full px-2 py-1 rounded text-sm"
              style={{
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--accent)',
                color: 'var(--fg-primary)',
                outline: 'none',
              }}
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <>
              <div
                className="resume-name text-sm font-medium truncate"
                style={{ color: 'var(--fg-primary)' }}
              >
                {resume.name}
              </div>
              <div
                className="text-xs mt-0.5"
                style={{ color: 'var(--fg-muted)' }}
              >
                {formatDate(resume.updatedAt)}
              </div>
            </>
          )}
        </div>

        {/* 删除按钮 */}
        <button
          className="delete-btn w-6 h-6 rounded flex items-center justify-center flex-shrink-0 opacity-0 hover:opacity-100 transition-opacity"
          style={{ background: 'var(--danger-soft)' }}
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
        >
          <X className="w-3.5 h-3.5" style={{ color: 'var(--danger)' }} />
        </button>

        <style>{`
          .resume-tab:hover {
            background: var(--bg-tertiary);
            border-color: var(--border);
          }
          .resume-tab:hover .delete-btn {
            opacity: 1;
          }
        `}</style>
      </div>
    )
  }
)

ResumeTab.displayName = 'ResumeTab'

export const Sidebar = memo(({ isOpen }: SidebarProps) => {
  const { resumes, currentResumeId, createResume, deleteResume, renameResume, selectResume } =
    useResumeStore()
  const { showToast } = useToastStore()
  const [deleteTarget, setDeleteTarget] = useState<ResumeItem | null>(null)

  const handleCreateResume = useCallback(() => {
    createResume()
    showToast('已创建新简历', 'success')
  }, [createResume, showToast])

  const handleDeleteConfirm = useCallback(() => {
    if (deleteTarget) {
      deleteResume(deleteTarget.id)
      showToast('简历已删除', 'info')
      setDeleteTarget(null)
    }
  }, [deleteTarget, deleteResume, showToast])

  return (
    <>
      <aside
        className="sidebar flex flex-col transition-all overflow-hidden"
        style={{
          width: isOpen ? '14rem' : '0',
          background: 'var(--bg-secondary)',
          borderRight: isOpen ? '1px solid var(--border)' : 'none',
        }}
      >
        {/* 标题栏 */}
        <div
          className="p-3 border-b flex items-center justify-between flex-shrink-0"
          style={{ borderColor: 'var(--border)' }}
        >
          <span className="text-sm font-semibold" style={{ color: 'var(--fg-secondary)' }}>
            我的简历
          </span>
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
          >
            {resumes.length}
          </span>
        </div>

        {/* 简历列表 */}
        <div className="flex-1 overflow-auto p-2 space-y-1">
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
                onRename={(name) => renameResume(resume.id, name)}
                onDelete={() => setDeleteTarget(resume)}
              />
            </div>
          ))}
        </div>

        {/* 新建按钮 */}
        <div
          className="p-3 border-t flex-shrink-0"
          style={{ borderColor: 'var(--border)' }}
        >
          <button
            onClick={handleCreateResume}
            className="new-tab-btn w-full py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all"
            style={{
              background: 'var(--bg-tertiary)',
              color: 'var(--fg-secondary)',
              border: '1px dashed var(--border)',
            }}
          >
            <Plus className="w-4 h-4" />
            新建简历
          </button>
        </div>
      </aside>

      {/* 删除确认模态框 */}
      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        resumeName={deleteTarget?.name || ''}
      />
    </>
  )
})

Sidebar.displayName = 'Sidebar'
