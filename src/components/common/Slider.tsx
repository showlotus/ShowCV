import { cn } from '@/utils'
import { Slider as ShadcnSlider } from '@/components/ui/slider'

interface SliderProps {
  label: string
  value: number
  min: number
  max: number
  step?: number
  unit?: string
  onChange: (value: number) => void
  className?: string
}

export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  unit,
  onChange,
  className,
}: SliderProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {(label || unit !== undefined) && (
        <div className="flex items-center justify-between">
          {label && (
            <label className="text-sm" style={{ color: 'var(--fg-muted)' }}>
              {label}
            </label>
          )}
          <span className={cn('text-sm font-medium', !label && 'ml-auto')} style={{ color: 'var(--fg-primary)' }}>
            {value}
            {unit ?? 'px'}
          </span>
        </div>
      )}
      <ShadcnSlider
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={vals => onChange(vals[0])}
        className="**:data-[slot=slider-track]:bg-muted **:data-[slot=slider-range]:bg-accent-foreground **:data-[slot=slider-thumb]:border-accent-foreground **:data-[slot=slider-thumb]:ring-accent-foreground"
      />
    </div>
  )
}
