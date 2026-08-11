import { FileUp } from 'lucide-react'

/**
 * 拖入 md 文件时的全屏提示蒙层
 * @param visible 是否正在拖拽文件
 */
export function MarkdownDropOverlay({ visible }: { visible: boolean }) {
  if (!visible) return null

  return (
    <div
      className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-8"
      style={{ background: 'color-mix(in srgb, var(--bg-primary) 70%, transparent)' }}
    >
      <div
        className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed px-12 py-10"
        style={{ borderColor: 'var(--accent)', background: 'var(--bg-secondary)' }}
      >
        <FileUp className="h-8 w-8" style={{ color: 'var(--accent)' }} />
        <p className="text-base font-medium" style={{ color: 'var(--fg-primary)' }}>
          松手导入 .md 文件
        </p>
        <p className="text-sm" style={{ color: 'var(--fg-muted)' }}>
          文件名将作为简历名称，可一次拖入多个
        </p>
      </div>
    </div>
  )
}
