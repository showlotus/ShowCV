import { Slider } from '../common'

interface SliderRowProps {
  label: string
  value: number
  min: number
  max: number
  step?: number
  unit?: string
  onChange: (value: number) => void
}

/** 带标签和当前值的 Slider 行，滑块两侧带步进按钮 */
export function SliderRow({ label, value, min, max, step, unit, onChange }: SliderRowProps) {
  const stepBy = (dir: -1 | 1) => {
    const s = step ?? 1
    const next = Math.min(max, Math.max(min, value + dir * s))
    onChange(next)
  }

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium" style={{ color: 'var(--fg-secondary)' }}>
          {label}
        </span>
        <span className="text-xs font-medium tabular-nums" style={{ color: 'var(--fg-primary)' }}>
          {value}
          {unit ?? 'px'}
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          tabIndex={-1}
          onClick={() => stepBy(-1)}
          disabled={value <= min}
          className="hover:bg-accent hover:text-accent-foreground flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded-full text-xs text-(--fg-secondary) transition-[color,background-color] disabled:cursor-default disabled:opacity-30"
        >
          −
        </button>
        <Slider
          label=""
          value={value}
          min={min}
          max={max}
          step={step}
          unit={undefined}
          onChange={onChange}
          className="translate-y-px"
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => stepBy(1)}
          disabled={value >= max}
          className="hover:bg-accent hover:text-accent-foreground flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded-full text-xs text-(--fg-secondary) transition-[color,background-color] disabled:cursor-default disabled:opacity-30"
        >
          +
        </button>
      </div>
    </div>
  )
}
