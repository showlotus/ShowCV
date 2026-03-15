import { memo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  title?: string
  maxWidth?: 'sm' | 'md' | 'lg'
}

export const Modal = memo(({ isOpen, onClose, children, title, maxWidth = 'sm' }: ModalProps) => {
  const maxWidthClass = { sm: 'sm:max-w-sm', md: 'sm:max-w-md', lg: 'sm:max-w-lg' }[maxWidth]

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent
        className={maxWidthClass}
        style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
      >
        {title && (
          <DialogHeader>
            <DialogTitle style={{ color: 'var(--fg-primary)' }}>{title}</DialogTitle>
          </DialogHeader>
        )}
        {children}
      </DialogContent>
    </Dialog>
  )
})

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
      <AlertDialog open={isOpen} onOpenChange={open => !open && onClose()}>
        <AlertDialogContent
          size="sm"
          style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle style={{ color: 'var(--fg-primary)' }}>删除简历</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除「{resumeName}」吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              variant="ghost"
              style={{ color: 'var(--fg-secondary)' }}
              onClick={onClose}
            >
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                onConfirm()
                onClose()
              }}
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
          <label className="mb-2 block text-xs" style={{ color: 'var(--fg-muted)' }}>
            分享链接
          </label>
          <div className="flex gap-2">
            <Input
              readOnly
              value={shareUrl}
              style={{
                background: 'var(--bg-tertiary)',
                borderColor: 'var(--border)',
                color: 'var(--fg-primary)',
              }}
            />
            <Button
              onClick={handleCopy}
              className="bg-(--accent) text-(--accent-fg) hover:opacity-90"
            >
              复制
            </Button>
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
