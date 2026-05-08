import { useState, useCallback, useRef, useMemo, useEffect } from 'react'
import { Sparkles, Check, StopCircle, Info } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { streamOptimizeText } from '@/services'
import { toast } from 'sonner'

interface AIOptimizeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedText: string
  lineNumber?: number
  onApply: (text: string) => void
  onNavigateLine: (direction: 'up' | 'down') => void
}

/** 每行生成结果的缓存结构 */
interface CachedResult {
  streamingText: string
  editedVersions: Record<number, string>
  appliedIndex: number | null
}

/** 三个版本的标签映射 */
const VERSION_LABELS = ['A', 'B', 'C'] as const

/** 提取行首 Markdown 前缀（列表、标题、引用、表格等） */
const MARKDOWN_PREFIX = /^(\s*(?:[-*+]|\d+\.|#{1,6}|>|\|)\s*)/

/** 中英文标点映射 */
const PUNCT_PAIRS: Record<string, string> = {
  ',': '，',
  ':': '：',
  ';': '；',
  '!': '！',
  '?': '？',
  '(': '（',
  ')': '）',
}
const CN_PUNCTS = new Set(Object.values(PUNCT_PAIRS))
const EN_PUNCTS = new Set(Object.keys(PUNCT_PAIRS))
const TRAILING_PUNCTS = new Set(['.', '。', ',', '，', ';', '；', ':', '：', '!', '！', '?', '？'])

/** 根据输入文本的标点体系，统一输出文本的标点符号，并保持末尾标点一致 */
function normalizePunctuation(output: string, input: string): string {
  const inputTrimmed = input.trim()
  const outputTrimmed = output.trimEnd()
  if (!inputTrimmed || !outputTrimmed) return output

  // 判断输入的标点体系：统计中英文标点出现次数
  let cnCount = 0
  let enCount = 0
  for (const ch of inputTrimmed) {
    if (CN_PUNCTS.has(ch)) cnCount++
    if (EN_PUNCTS.has(ch)) enCount++
  }

  let result = outputTrimmed

  // 统一标点体系
  if (cnCount > enCount) {
    for (const [en, cn] of Object.entries(PUNCT_PAIRS)) {
      result = result.replaceAll(en, cn)
    }
  } else if (enCount > cnCount) {
    for (const [en, cn] of Object.entries(PUNCT_PAIRS)) {
      result = result.replaceAll(cn, en)
    }
  }

  // 末尾标点保持一致
  const inputEnd = inputTrimmed.at(-1)!
  const outputEnd = result.at(-1)!
  const inputHasTrailingPunct = TRAILING_PUNCTS.has(inputEnd)

  if (inputHasTrailingPunct && !TRAILING_PUNCTS.has(outputEnd)) {
    result += inputEnd
  } else if (!inputHasTrailingPunct && TRAILING_PUNCTS.has(outputEnd)) {
    result = result.slice(0, -1)
  }

  return result
}


/** 版本分隔符 */
const VERSION_SEPARATOR = '---'

/** 各版本的标识色（蓝、琥珀、翠绿） */
const VERSION_COLORS = ['#3b82f6', '#06b6d4', '#8b5cf6'] as const

/**
 * 从累计流式文本中按 --- 分隔符解析版本
 * @param accumulated 累计文本
 * @returns 各版本内容及当前正在填充的版本索引
 */
function parseStreamingVersions(accumulated: string): {
  versions: string[]
  currentIndex: number
} {
  const versions = ['', '', '']
  const trimmed = accumulated.trim()
  if (!trimmed) return { versions, currentIndex: -1 }

  // 兼容旧格式：如果存在版本标记，仍按标记解析
  if (trimmed.includes('版本A的内容：')) {
    const MARKERS = ['版本A的内容：', '版本B的内容：', '版本C的内容：']
    let currentIdx = -1
    for (let i = 0; i < MARKERS.length; i++) {
      const markerIdx = trimmed.indexOf(MARKERS[i])
      if (markerIdx === -1) break
      if (currentIdx >= 0) {
        const prevStart = trimmed.indexOf(MARKERS[currentIdx]) + MARKERS[currentIdx].length
        versions[currentIdx] = trimmed.substring(prevStart, markerIdx).trim()
      }
      currentIdx = i
    }
    if (currentIdx >= 0) {
      const currentStart = trimmed.indexOf(MARKERS[currentIdx]) + MARKERS[currentIdx].length
      versions[currentIdx] = trimmed.substring(currentStart)
    }
    return { versions, currentIndex: currentIdx }
  }

  // 按 --- 分隔符解析
  const parts = trimmed.split(VERSION_SEPARATOR)

  for (let i = 0; i < Math.min(parts.length, 3); i++) {
    versions[i] = parts[i].trim()
  }

  return {
    versions,
    currentIndex: Math.min(parts.length - 1, 2),
  }
}

export function AIOptimizeDialog({
  open,
  onOpenChange,
  selectedText,
  lineNumber,
  onApply,
  onNavigateLine,
}: AIOptimizeDialogProps) {
  const [jobType, setJobType] = useState<'social' | 'campus'>('social')
  const [prompt, setPrompt] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [streamingText, setStreamingText] = useState('')
  const [appliedIndex, setAppliedIndex] = useState<number | null>(null)
  const [editedVersions, setEditedVersions] = useState<Record<number, string>>({})
  const [flashArrow, setFlashArrow] = useState<'up' | 'down' | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const cacheRef = useRef<Map<number, CachedResult>>(new Map())
  const prevLineRef = useRef<number | null>(null)

  /** 目标行变化时保存当前行缓存、恢复目标行缓存 */
  useEffect(() => {
    // 先保存旧行的生成结果到缓存
    if (prevLineRef.current != null && streamingText) {
      cacheRef.current.set(prevLineRef.current, {
        streamingText,
        editedVersions,
        appliedIndex,
      })
    }
    prevLineRef.current = lineNumber ?? null

    abortRef.current?.abort()
    abortRef.current = null
    setStreaming(false)

    // 尝试恢复目标行的缓存
    const cached = lineNumber != null ? cacheRef.current.get(lineNumber) : undefined
    if (cached) {
      setStreamingText(cached.streamingText)
      setAppliedIndex(cached.appliedIndex)
      setEditedVersions(cached.editedVersions)
    } else {
      setStreamingText('')
      setAppliedIndex(null)
      setEditedVersions({})
    }
  }, [selectedText])

  /** 从行文本中提取 Markdown 前缀，用于 AI 结果兜底补全 */
  const prefixMatch = selectedText.match(MARKDOWN_PREFIX)
  const prefix = prefixMatch?.[1] ?? ''

  /** 原文是否包含 || 分隔符 */
  const hasPipe = selectedText.includes('||')

  /** 确保 AI 结果保留 || 分隔符（兜底） */
  const ensurePipeSeparator = useCallback(
    (text: string): string => {
      if (!hasPipe || text.includes('||')) return text
      const pipeIdx = selectedText.indexOf('||')
      const rightSide = selectedText.slice(pipeIdx + 2).trim()
      return `${text} || ${rightSide}`
    },
    [hasPipe, selectedText]
  )

  /** 确保 AI 结果包含行首 Markdown 前缀、|| 分隔符和标点一致性（兜底） */
  const ensurePrefix = useCallback(
    (text: string) => {
      let result = normalizePunctuation(text, selectedText)
      result = prefix && !result.startsWith(prefix) ? prefix + result : result
      result = ensurePipeSeparator(result)
      return result
    },
    [selectedText, prefix, ensurePipeSeparator]
  )

  /** 从流式文本派生出版本数据 */
  const { versions, currentIndex } = useMemo(
    () => parseStreamingVersions(streamingText),
    [streamingText]
  )

  /** 调用 AI 流式生成优化版本 */
  const handleGenerate = useCallback(() => {
    if (!selectedText.trim()) {
      toast.warning('当前行为空，请选择有内容的行')
      return
    }
    setStreaming(true)
    setStreamingText('')
    setAppliedIndex(null)

    const controller = streamOptimizeText(selectedText, prompt, jobType, {
      onChunk: fullText => setStreamingText(fullText),
      onComplete: () => {
        setStreaming(false)
        abortRef.current = null
      },
      onError: error => {
        console.error('[AI Optimize Error]', error)
        toast.error(error.message || 'AI 优化失败')
        setStreaming(false)
        abortRef.current = null
      },
    })

    abortRef.current = controller
  }, [selectedText, prompt, jobType])

  /** 停止生成 */
  const handleStop = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    setStreaming(false)
  }, [])

  /** 应用选中的版本到编辑器，优先使用手动编辑后的内容 */
  const handleApply = useCallback(
    (index: number) => {
      const raw = versions[index]?.trim()
      if (!raw) return
      const text = editedVersions[index] ?? ensurePrefix(raw)
      onApply(text)
      setStreamingText('')
      setAppliedIndex(null)
      setEditedVersions({})
      // 已应用到编辑器，从缓存中移除
      if (lineNumber != null) cacheRef.current.delete(lineNumber)
      toast.success(`已应用版本 ${VERSION_LABELS[index]}`)
      onOpenChange(false)
    },
    [versions, editedVersions, ensurePrefix, onApply, lineNumber, onOpenChange]
  )

  /** 键盘导航：↑↓ 切换目标行，Enter 快速生成（可编辑输入框内不触发） */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const el = e.target as HTMLElement
      const isEditableInput =
        (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') && !(el as HTMLInputElement).readOnly
      if (isEditableInput || el.tagName === 'SELECT') return

      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setFlashArrow('up')
        onNavigateLine('up')
        setTimeout(() => setFlashArrow(prev => (prev === 'up' ? null : prev)), 200)
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setFlashArrow('down')
        onNavigateLine('down')
        setTimeout(() => setFlashArrow(prev => (prev === 'down' ? null : prev)), 200)
      } else if (e.key === 'Enter' && el.tagName !== 'BUTTON' && !streaming) {
        e.preventDefault()
        handleGenerate()
      }
    },
    [onNavigateLine, handleGenerate, streaming]
  )

  /** 对话框关闭时重置状态并清空缓存 */
  const handleClose = useCallback(
    (isOpen: boolean) => {
      if (!isOpen) {
        abortRef.current?.abort()
        abortRef.current = null
        setStreaming(false)
        setPrompt('')
        setAppliedIndex(null)
        setEditedVersions({})
        cacheRef.current.clear()
      }
      onOpenChange(isOpen)
    },
    [onOpenChange]
  )

  /** 每次打开弹窗时清空上次残留的流式文本，避免关闭时的布局突变 */
  useEffect(() => {
    if (open) setStreamingText('')
  }, [open])

  /** 是否有可显示的版本 */
  const hasVersions = versions.some(v => v.length > 0)

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="flex max-h-[70vh] flex-col sm:max-w-3xl"
        style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
        onKeyDown={handleKeyDown}
        onOpenAutoFocus={e => {
          e.preventDefault()
          ;(e.currentTarget as HTMLElement).focus()
        }}
      >
        <DialogHeader>
          <DialogTitle
            className="flex items-center justify-between"
            style={{ color: 'var(--accent)' }}
          >
            <span className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              AI 优化
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto">
          {/* 当前行文本展示 */}
          <div>
            <label className="mb-1.5 flex items-center justify-between text-sm font-semibold">
              <span style={{ color: 'var(--fg-primary)' }}>当前行</span>
              <span className="text-xs font-normal" style={{ color: 'var(--fg-muted)' }}>
                按{' '}
                <span
                  className="font-bold transition-colors duration-100"
                  style={{ color: flashArrow === 'up' ? 'var(--accent)' : undefined }}
                >
                  ↑
                </span>
                <span
                  className="font-bold transition-colors duration-100"
                  style={{ color: flashArrow === 'down' ? 'var(--accent)' : undefined }}
                >
                  ↓
                </span>
                {' 切换行'}
              </span>
            </label>
            <Input
              value={selectedText}
              readOnly
              className="selection:bg-transparent focus-visible:border-[var(--border)]"
              style={{
                background: 'var(--bg-secondary)',
                borderColor: 'var(--border)',
                color: 'var(--fg-primary)',
              }}
            />
          </div>

          {/* 求职类型切换 */}
          <div>
            <label
              className="mb-1.5 block text-sm font-semibold"
              style={{ color: 'var(--fg-primary)' }}
            >
              求职类型
            </label>
            <Select value={jobType} onValueChange={v => setJobType(v as 'social' | 'campus')}>
              <SelectTrigger
                className="border-border hover:bg-accent hover:border-accent-foreground focus-visible:border-border h-8 w-full text-sm transition-[color,background-color,border-color,box-shadow] focus-visible:ring-0 focus-visible:outline-none"
                style={{
                  background: 'var(--bg-secondary)',
                }}
                tabIndex={-1}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent
                position="popper"
                sideOffset={4}
                style={{
                  background: 'var(--bg-secondary)',
                  borderColor: 'var(--border)',
                  color: 'var(--fg-primary)',
                }}
              >
                <SelectItem value="social">社招</SelectItem>
                <SelectItem value="campus">校招</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 自定义指令输入 */}
          <div>
            <div className="mb-1.5 flex items-center gap-1.5">
              <label className="text-sm font-semibold" style={{ color: 'var(--fg-primary)' }}>
                提示词（可选）
              </label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info
                    className="h-3.5 w-3.5 cursor-help"
                    style={{ color: 'var(--fg-secondary)' }}
                  />
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={8} className="max-w-[300px] text-xs">
                  系统已有内置优化指令，此处可补充个性化要求
                </TooltipContent>
              </Tooltip>
            </div>
            <Textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder='如 "更正式一点"、"突出项目经验"...'
              rows={2}
              className="border-[var(--border)]"
              style={{
                background: 'var(--bg-secondary)',
                color: 'var(--fg-primary)',
                maxHeight: '200px',
              }}
            />
          </div>

          {/* 版本卡片 - 仅显示已有内容的版本 */}
          {hasVersions && (
            <>
              <div>
                <label
                  className="mb-1.5 block text-sm font-semibold"
                  style={{ color: 'var(--fg-primary)' }}
                >
                  优化结果{' '}
                </label>
                <div className="space-y-3">
                  {VERSION_LABELS.map((label, index) => {
                    const content = versions[index]
                    if (!content && currentIndex < index) return null

                    return (
                      <div
                        key={label}
                        className="space-y-2 rounded-md border-l-[3px] p-3"
                        style={{
                          background: 'var(--bg-tertiary)',
                          borderColor: 'var(--border)',
                          borderLeftColor: VERSION_COLORS[index],
                        }}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                            style={{
                              background: `${VERSION_COLORS[index]}18`,
                              color: VERSION_COLORS[index],
                              border: `1px solid ${VERSION_COLORS[index]}40`,
                            }}
                          >
                            版本 {label}
                          </span>
                          {!streaming && content.trim() && (
                            <Button
                              size="sm"
                              variant={appliedIndex === index ? 'default' : 'outline'}
                              className="h-6 gap-1 px-2 text-xs"
                              onClick={() => handleApply(index)}
                              disabled={appliedIndex !== null}
                            >
                              <Check className="h-3 w-3" />
                              应用
                            </Button>
                          )}
                        </div>
                        {streaming ? (
                          <p
                            className="text-sm break-words whitespace-pre-wrap"
                            style={{ color: 'var(--fg-primary)' }}
                          >
                            {ensurePrefix(content)}
                            {currentIndex === index && (
                              <span
                                className="inline-block h-4 w-[2px] animate-pulse align-middle"
                                style={{ background: 'var(--accent)' }}
                              />
                            )}
                          </p>
                        ) : (
                          <Textarea
                            value={editedVersions[index] ?? ensurePrefix(content)}
                            onChange={e =>
                              setEditedVersions(prev => ({ ...prev, [index]: e.target.value }))
                            }
                            rows={3}
                            className="resize-none border-[var(--border)]"
                            style={{
                              background: 'var(--bg-secondary)',
                              color: 'var(--fg-primary)',
                            }}
                          />
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* 底部操作栏：生成/停止/重新生成 */}
        <div className="pt-2">
          {streaming && !hasVersions ? (
            <div className="relative">
              <svg
                className="pointer-events-none absolute -inset-px h-[calc(100%+2px)] w-[calc(100%+2px)]"
                aria-hidden="true"
              >
                <rect
                  width="100%"
                  height="100%"
                  rx="8"
                  ry="8"
                  stroke="var(--accent)"
                  strokeWidth="2"
                  strokeDasharray="8 4"
                  fill="none"
                  className="animate-march-ants"
                />
              </svg>
              <Button
                variant="outline"
                className="relative z-10 flex w-full items-center justify-center text-sm"
                style={{
                  color: 'var(--accent)',
                  background: 'var(--bg-secondary)',
                  borderColor: 'transparent',
                }}
              >
                AI 正在思考...
              </Button>
            </div>
          ) : streaming ? (
            <Button
              onClick={handleStop}
              variant="outline"
              className="flex w-full items-center justify-center gap-2 text-sm"
            >
              <StopCircle className="h-4 w-4" />
              停止生成
            </Button>
          ) : (
            <Button
              onClick={handleGenerate}
              variant="outline"
              className="flex w-full items-center justify-center gap-2 text-sm"
            >
              <Sparkles className="h-4 w-4" />
              {hasVersions ? '重新生成' : '生成优化版本'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
