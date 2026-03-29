import { useRef, useCallback } from 'react'
import { Upload, X, User } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Slider } from '../common'
import type { AvatarSettings } from '@/types'

const MAX_AVATAR_SIZE = 200 * 1024
const AVATAR_TARGET_SIZE = 200
const AVATAR_QUALITY = 0.8

function processImage(
  file: File
): Promise<{ dataUrl: string; naturalWidth: number; naturalHeight: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Canvas not supported'))
          return
        }

        const naturalWidth = img.naturalWidth
        const naturalHeight = img.naturalHeight

        let { width, height } = img
        if (width > height) {
          if (width > AVATAR_TARGET_SIZE) {
            height = (height * AVATAR_TARGET_SIZE) / width
            width = AVATAR_TARGET_SIZE
          }
        } else {
          if (height > AVATAR_TARGET_SIZE) {
            width = (width * AVATAR_TARGET_SIZE) / height
            height = AVATAR_TARGET_SIZE
          }
        }

        canvas.width = width
        canvas.height = height
        ctx.drawImage(img, 0, 0, width, height)
        resolve({
          dataUrl: canvas.toDataURL('image/jpeg', AVATAR_QUALITY),
          naturalWidth,
          naturalHeight,
        })
      }
      img.onerror = reject
      img.src = e.target?.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

interface AvatarUploadProps {
  avatar?: AvatarSettings
  onUpdateAvatar: (avatar: Partial<AvatarSettings>) => void
  onRemoveAvatar: () => void
}

export function AvatarUpload({ avatar, onUpdateAvatar, onRemoveAvatar }: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) {
        toast.error('请选择图片文件')
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('图片大小不能超过 5MB')
        return
      }
      try {
        const { dataUrl, naturalWidth, naturalHeight } = await processImage(file)
        if (dataUrl.length > MAX_AVATAR_SIZE) {
          toast.error('图片压缩后仍然过大，请选择更小的图片')
          return
        }
        onUpdateAvatar({ src: dataUrl, visible: true, naturalWidth, naturalHeight })
      } catch {
        toast.error('图片处理失败')
      }
    },
    [onUpdateAvatar]
  )

  return (
    <div className="space-y-3">
      {/* 头像预览 / 上传区域 */}
      <div
        onClick={() => inputRef.current?.click()}
        className="group hover:border-accent-foreground flex cursor-pointer items-center gap-3 rounded-lg border border-dashed p-3 transition-colors"
        style={{ background: 'var(--bg-secondary)' }}
      >
        {avatar?.src ? (
          <img
            src={avatar.src}
            alt="Avatar"
            className="h-14 w-14 shrink-0 rounded object-contain"
          />
        ) : (
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded"
            style={{ background: 'var(--bg-tertiary)' }}
          >
            <User className="h-6 w-6" style={{ color: 'var(--fg-muted)' }} />
          </div>
        )}
        <div className="flex-1">
          <div className="group-hover:text-accent-foreground text-xs font-medium text-(--fg-secondary) transition-colors">
            {avatar?.src ? '点击更换头像' : '点击上传头像'}
          </div>
          <div className="text-xs" style={{ color: 'var(--fg-muted)' }}>
            {/* 支持 JPG、PNG */}
          </div>
        </div>
        {avatar?.src && (
          <Button
            variant="ghost"
            size="sm"
            onClick={e => {
              e.stopPropagation()
              onRemoveAvatar()
            }}
            className="h-8 w-8 p-0 text-(--fg-secondary)"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={e => {
            const file = e.target.files?.[0]
            if (file) handleFile(file)
            e.target.value = ''
          }}
        />
      </div>

      {/* 头像配置选项（仅上传后显示） */}
      {avatar?.src && (
        <>
          <hr style={{ borderColor: 'var(--border)' }} />
          {/* 显示开关 */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium" style={{ color: 'var(--fg-secondary)' }}>
              显示头像
            </span>
            <Switch
              size="sm"
              checked={avatar.visible}
              onCheckedChange={v => onUpdateAvatar({ visible: v })}
            />
          </div>

          <div
            className="space-y-3 transition-opacity"
            style={{ opacity: avatar.visible ? 1 : 0.4 }}
          >
            <hr style={{ borderColor: 'var(--border)' }} />
            {/* 尺寸滑块 */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium" style={{ color: 'var(--fg-secondary)' }}>
                  头像大小
                </span>
                <span
                  className="text-xs font-medium tabular-nums"
                  style={{ color: 'var(--fg-primary)' }}
                >
                  {avatar.size}px
                </span>
              </div>
              <Slider
                label=""
                value={avatar.size}
                min={40}
                max={120}
                onChange={v => onUpdateAvatar({ size: v })}
              />
            </div>
            <hr style={{ borderColor: 'var(--border)' }} />
            {/* 圆角滑块 */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium" style={{ color: 'var(--fg-secondary)' }}>
                  圆角
                </span>
                <span
                  className="text-xs font-medium tabular-nums"
                  style={{ color: 'var(--fg-primary)' }}
                >
                  {avatar.borderRadius}%
                </span>
              </div>
              <Slider
                label=""
                value={avatar.borderRadius}
                min={0}
                max={50}
                onChange={v => onUpdateAvatar({ borderRadius: v })}
              />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
