import { useState, useEffect, useRef, useCallback } from 'react'
import { Info } from 'lucide-react'
import { cn } from '@/utils'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

// HSV 颜色模型，H: 0-360，S: 0-1，V: 0-1
interface HSV {
  h: number
  s: number
  v: number
}

/** 将十六进制颜色转换为 HSV 对象 */
function hexToHsv(hex: string): HSV {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const d = max - min
  let h = 0
  if (d !== 0) {
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
    else if (max === g) h = ((b - r) / d + 2) / 6
    else h = ((r - g) / d + 4) / 6
  }
  return { h: h * 360, s: max === 0 ? 0 : d / max, v: max }
}

/** 将 HSV 对象转换为十六进制颜色 */
function hsvToHex({ h, s, v }: HSV): string {
  const f = (n: number) => {
    const k = (n + h / 60) % 6
    return v - v * s * Math.max(0, Math.min(k, 4 - k, 1))
  }
  const toHex = (x: number) =>
    Math.round(x * 255)
      .toString(16)
      .padStart(2, '0')
  return `#${toHex(f(5))}${toHex(f(3))}${toHex(f(1))}`
}

/** 将色相 H 值（0-360）转换为纯色十六进制（Saturation=1, Value=1） */
function hueToHex(h: number): string {
  return hsvToHex({ h, s: 1, v: 1 })
}

/** 校验十六进制颜色格式是否合法 */
function isValidHex(hex: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(hex)
}

/** 使用鼠标/触摸拖拽交互，返回 onMouseDown 处理函数 */
function useDrag(ref: React.RefObject<HTMLDivElement | null>, onDrag: (x: number, y: number) => void) {
  const getPos = useCallback(
    (clientX: number, clientY: number) => {
      const el = ref.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
      const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height))
      onDrag(x, y)
    },
    [ref, onDrag]
  )

  const onMouseMove = useCallback(
    (e: MouseEvent) => getPos(e.clientX, e.clientY),
    [getPos]
  )

  const handleUp = useCallback(() => {
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', handleUp)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      getPos(e.clientX, e.clientY)
      window.addEventListener('mousemove', onMouseMove)
      window.addEventListener('mouseup', handleUp)
    },
    [getPos, onMouseMove, handleUp]
  )

  return onMouseDown
}

interface ColorPickerProps {
  label: string
  value: string
  presetColors?: { name: string; value: string }[]
  onChange: (value: string) => void
  className?: string
  /** 悬浮提示信息，不为空时在右侧显示 info icon */
  tooltip?: string
}

/** Sketch 风格颜色选择器，包含色域面板、色相滑条、十六进制输入和预设色板 */
export function ColorPicker({
  label,
  value,
  presetColors,
  onChange,
  className,
  tooltip,
}: ColorPickerProps) {
  const [open, setOpen] = useState(false)
  // 本地 HSV 状态，避免每次拖拽都触发外部更新
  const [hsv, setHsv] = useState<HSV>(() =>
    isValidHex(value) ? hexToHsv(value) : { h: 0, s: 1, v: 1 }
  )
  // 十六进制输入框的本地文本
  const [hexInput, setHexInput] = useState(value)

  // 外部 value 变化时同步（如切换简历）
  useEffect(() => {
    if (isValidHex(value)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- 同步外部 prop 到本地状态
      setHsv(hexToHsv(value))
      setHexInput(value)
    }
  }, [value])

  /** 更新 HSV 并立即通知外部（色域/色相拖拽时调用） */
  const updateHsv = useCallback(
    (next: HSV) => {
      setHsv(next)
      const hex = hsvToHex(next)
      setHexInput(hex)
      onChange(hex)
    },
    [onChange]
  )

  // 色域面板拖拽（改变 S 和 V）
  const satRef = useRef<HTMLDivElement>(null)
  const onSatDrag = useDrag(
    satRef,
    useCallback((x: number, y: number) => updateHsv({ ...hsv, s: x, v: 1 - y }), [hsv, updateHsv])
  )

  // 色相滑条拖拽（改变 H）
  const hueRef = useRef<HTMLDivElement>(null)
  const onHueDrag = useDrag(
    hueRef,
    useCallback((x: number) => updateHsv({ ...hsv, h: x * 360 }), [hsv, updateHsv])
  )

  /** 处理十六进制输入框变化 */
  const handleHexChange = (input: string) => {
    setHexInput(input)
    const hex = input.startsWith('#') ? input : `#${input}`
    if (isValidHex(hex)) {
      const next = hexToHsv(hex)
      setHsv(next)
      onChange(hex)
    }
  }

  const currentHex = hsvToHex(hsv)
  const hueColor = hueToHex(hsv.h)

  return (
    <div className={cn('space-y-2', className)}>
      <label className="text-sm" style={{ color: 'var(--fg-muted)' }}>
        {label}
      </label>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            className="border-border hover:bg-accent hover:text-accent-foreground hover:border-accent-foreground flex h-9 w-full cursor-pointer items-center gap-2 rounded-md border px-3 text-sm transition-[color,background-color,border-color,box-shadow]"
            style={{ background: 'var(--bg-secondary)' }}
          >
            {/* 色块预览 */}
            <span
              className="h-5 w-5 shrink-0 rounded"
              style={{ backgroundColor: currentHex, border: '1px solid var(--border)' }}
            />
            <span className="flex-1 text-left" style={{ color: 'var(--fg-primary)' }}>
              {currentHex.toUpperCase()}
            </span>
            {/* Tooltip 提示 icon */}
            {tooltip && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info
                    className="h-4 w-4 shrink-0 cursor-help"
                    style={{ color: 'var(--fg-muted)' }}
                    onClick={e => e.stopPropagation()}
                  />
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  sideOffset={8}
                  className="max-w-[200px] text-(--fg-secondary)"
                >
                  {tooltip}
                </TooltipContent>
              </Tooltip>
            )}
          </button>
        </PopoverTrigger>

        <PopoverContent
          className="w-60 p-3"
          align="start"
          sideOffset={6}
          onOpenAutoFocus={e => e.preventDefault()}
          style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
        >
          {/* 色域面板：X 轴为饱和度，Y 轴为明度 */}
          <div
            ref={satRef}
            onMouseDown={onSatDrag}
            className="relative mb-3 h-36 w-full cursor-crosshair rounded-sm"
            style={{
              background: `linear-gradient(to bottom, transparent, #000),
                           linear-gradient(to right, #fff, ${hueColor})`,
            }}
          >
            {/* 拾色游标 */}
            <div
              className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow"
              style={{
                left: `${hsv.s * 100}%`,
                top: `${(1 - hsv.v) * 100}%`,
                width: 12,
                height: 12,
                backgroundColor: currentHex,
              }}
            />
          </div>

          {/* 色相滑条 */}
          <div
            ref={hueRef}
            onMouseDown={onHueDrag}
            className="relative mb-3 h-3 w-full cursor-pointer rounded-full"
            style={{
              background: 'linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)',
            }}
          >
            {/* 色相游标 */}
            <div
              className="pointer-events-none absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow"
              style={{
                left: `${(hsv.h / 360) * 100}%`,
                width: 14,
                height: 14,
                backgroundColor: hueColor,
              }}
            />
          </div>

          {/* 十六进制输入 + 当前色预览 */}
          <div className="mb-3 flex items-center gap-2">
            <div
              className="h-8 w-8 shrink-0 rounded"
              style={{ backgroundColor: currentHex, border: '1px solid var(--border)' }}
            />
            <Input
              value={hexInput}
              onChange={e => handleHexChange(e.target.value)}
              className="h-8 uppercase transition-[color,background-color,border-color,box-shadow] focus-visible:ring-0"
              style={{
                background: 'var(--bg-primary)',
                color: 'var(--fg-primary)',
                borderColor: 'var(--border)',
              }}
              onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
            />
          </div>

          {/* 预设色板 */}
          {presetColors && (
            <div className="flex flex-wrap gap-1.5">
              {presetColors.map(color => (
                <button
                  key={color.value}
                  onClick={() => {
                    const next = hexToHsv(color.value)
                    setHsv(next)
                    setHexInput(color.value)
                    onChange(color.value)
                  }}
                  className="h-5 w-5 cursor-pointer rounded transition-transform hover:scale-110"
                  style={{
                    backgroundColor: color.value,
                    ...(value === color.value && {
                      boxShadow: '0 0 0 2px var(--bg-secondary), 0 0 0 4px var(--accent)',
                    }),
                  }}
                  title={color.name}
                />
              ))}
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  )
}
