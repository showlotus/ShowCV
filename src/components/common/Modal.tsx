import { memo, useEffect, useCallback } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  title?: string
  maxWidth?: 'sm' | 'md' | 'lg'
}

export const Modal = memo(
  ({ isOpen, onClose, children, title, maxWidth = 'sm' }: ModalProps) => {
    // ESC 关闭
    const handleKeyDown = useCallback(
      (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose()
      },
      [onClose]
    )

    useEffect(() => {
      if (isOpen) {
        document.addEventListener('keydown', handleKeyDown)
        document.body.style.overflow = 'hidden'
      }
      return () => {
        document.removeEventListener('keydown', handleKeyDown)
        document.body.style.overflow = ''
      }
    }, [isOpen, handleKeyDown])

    if (!isOpen) return null

    const maxWidthClass = {
      sm: 'max-w-sm',
      md: 'max-w-md',
      lg: 'max-w-lg',
    }[maxWidth]

    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 opacity-0 pointer-events-none transition-opacity duration-200"
        style={{ opacity: isOpen ? 1 : 0, pointerEvents: isOpen ? 'auto' : 'none' }}
      >
        {/* 遮罩 */}
        <div
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* 内容 */}
        <div
          className={`relative rounded-2xl p-6 w-full ${maxWidthClass} transform transition-transform duration-200`}
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            transform: isOpen ? 'scale(1)' : 'scale(0.95)',
          }}
        >
          {title && (
            <div className="flex items-center justify-between mb-4">
              <h3
                className="font-semibold text-lg"
                style={{ color: 'var(--fg-primary)' }}
              >
                {title}
              </h3>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                style={{ background: 'var(--bg-tertiary)' }}
              >
                <X className="w-5 h-5" style={{ color: 'var(--fg-muted)' }} />
              </button>
            </div>
          )}
          {children}
        </div>
      </div>
    )
  }
)

Modal.displayName = 'Modal'

// 删除确认模态框
interface DeleteConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  resumeName: string
}

export const DeleteConfirmModal = memo(
  ({ isOpen, onClose, onConfirm, resumeName }: DeleteConfirmModalProps) => {
    return (
      <Modal isOpen={isOpen} onClose={onClose}>
        <div className="text-center">
          <div
            className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{ background: 'var(--danger-soft)' }}
          >
            <svg
              className="w-6 h-6"
              style={{ color: 'var(--danger)' }}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </div>
          <h3
            className="font-semibold text-lg mb-2"
            style={{ color: 'var(--fg-primary)' }}
          >
            删除简历
          </h3>
          <p className="text-sm mb-6" style={{ color: 'var(--fg-secondary)' }}>
            确定要删除「{resumeName}」吗？此操作无法撤销。
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors"
              style={{
                background: 'var(--bg-tertiary)',
                color: 'var(--fg-secondary)',
              }}
            >
              取消
            </button>
            <button
              onClick={() => {
                onConfirm()
                onClose()
              }}
              className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors"
              style={{ background: 'var(--danger)', color: 'white' }}
            >
              删除
            </button>
          </div>
        </div>
      </Modal>
    )
  }
)

DeleteConfirmModal.displayName = 'DeleteConfirmModal'

// 分享模态框
interface ShareModalProps {
  isOpen: boolean
  onClose: () => void
  shareUrl: string
}

export const ShareModal = memo(({ isOpen, onClose, shareUrl }: ShareModalProps) => {
  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="分享简历">
      <div className="space-y-4">
        <div>
          <label
            className="text-xs mb-2 block"
            style={{ color: 'var(--fg-muted)' }}
          >
            分享链接
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="flex-1 p-2.5 rounded-lg text-sm"
              style={{
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border)',
                color: 'var(--fg-primary)',
              }}
            />
            <button
              onClick={handleCopy}
              className="btn-primary px-4 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-90"
              style={{ background: 'var(--accent)', color: '#000' }}
            >
              复制
            </button>
          </div>
        </div>
        <p className="text-xs" style={{ color: 'var(--fg-muted)' }}>
          复制链接发送给他人即可查看你的简历
        </p>
      </div>
    </Modal>
  )
})

ShareModal.displayName = 'ShareModal'
