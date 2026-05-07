import { useState, useCallback } from 'react'
import { Sparkles, Loader2, Check } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { optimizeText } from '@/services'
import { toast } from 'sonner'

interface AIOptimizeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedText: string
  onApply: (text: string) => void
}

/** 三个版本的标签映射 */
const VERSION_LABELS = ['A', 'B', 'C'] as const

export function AIOptimizeDialog({
  open,
  onOpenChange,
  selectedText,
  onApply,
}: AIOptimizeDialogProps) {
  const [jobType, setJobType] = useState<'social' | 'campus'>('social')
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [versions, setVersions] = useState<string[]>([])
  const [appliedIndex, setAppliedIndex] = useState<number | null>(null)

  /** 调用 AI 生成优化版本 */
  const handleGenerate = useCallback(async () => {
    setLoading(true)
    setVersions([])
    setAppliedIndex(null)
    try {
      const result = await optimizeText(selectedText, prompt, jobType)
      setVersions(result)
    } catch (error) {
      console.error('[AI Optimize Error]', error)
      toast.error(error instanceof Error ? error.message : 'AI 优化失败')
    } finally {
      setLoading(false)
    }
  }, [selectedText, prompt, jobType])

  /** 应用选中的版本到编辑器 */
  const handleApply = useCallback(
    (index: number) => {
      onApply(versions[index])
      setAppliedIndex(index)
      setTimeout(() => {
        onOpenChange(false)
        setVersions([])
        setPrompt('')
        setAppliedIndex(null)
      }, 500)
    },
    [versions, onApply, onOpenChange]
  )

  /** 对话框关闭时重置状态 */
  const handleClose = useCallback(
    (isOpen: boolean) => {
      if (!isOpen) {
        setVersions([])
        setPrompt('')
        setAppliedIndex(null)
      }
      onOpenChange(isOpen)
    },
    [onOpenChange]
  )

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="sm:max-w-2xl max-h-[85vh] overflow-y-auto"
        style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2" style={{ color: 'var(--fg-primary)' }}>
            <Sparkles className="h-5 w-5" style={{ color: 'var(--accent)' }} />
            AI 优化
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 求职类型切换 */}
          <div className="flex items-center gap-3">
            <span className="text-sm shrink-0" style={{ color: 'var(--fg-muted)' }}>
              求职类型
            </span>
            <ToggleGroup
              type="single"
              value={jobType}
              onValueChange={v => v && setJobType(v as 'social' | 'campus')}
              variant="outline"
              size="sm"
            >
              <ToggleGroupItem value="social">社招</ToggleGroupItem>
              <ToggleGroupItem value="campus">校招</ToggleGroupItem>
            </ToggleGroup>
          </div>

          {/* 选中文本展示 */}
          <div>
            <label className="mb-1.5 block text-xs" style={{ color: 'var(--fg-muted)' }}>
              选中文本
            </label>
            <div
              className="rounded-md border p-3 text-sm whitespace-pre-wrap break-words max-h-32 overflow-y-auto"
              style={{
                background: 'var(--bg-tertiary)',
                borderColor: 'var(--border)',
                color: 'var(--fg-primary)',
              }}
            >
              {selectedText}
            </div>
          </div>

          {/* 自定义指令输入 */}
          <div>
            <label className="mb-1.5 block text-xs" style={{ color: 'var(--fg-muted)' }}>
              优化指令（可选）
            </label>
            <Textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="描述你想如何优化这段文本..."
              rows={2}
              style={{
                background: 'var(--bg-tertiary)',
                borderColor: 'var(--border)',
                color: 'var(--fg-primary)',
              }}
            />
          </div>

          {/* 生成按钮 */}
          <Button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                生成中...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                生成优化版本
              </>
            )}
          </Button>

          {/* 三个版本卡片 */}
          {versions.length > 0 && (
            <div className="space-y-3">
              {VERSION_LABELS.map((label, index) => (
                <div
                  key={label}
                  className="rounded-md border p-3 space-y-2"
                  style={{
                    background: 'var(--bg-tertiary)',
                    borderColor: 'var(--border)',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium" style={{ color: 'var(--fg-muted)' }}>
                      版本 {label}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleApply(index)}
                      disabled={appliedIndex !== null}
                    >
                      {appliedIndex === index ? (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          已应用
                        </>
                      ) : (
                        '使用此版本'
                      )}
                    </Button>
                  </div>
                  <p
                    className="text-sm whitespace-pre-wrap break-words"
                    style={{ color: 'var(--fg-primary)' }}
                  >
                    {versions[index]}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
