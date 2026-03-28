import { useRef, useEffect, memo } from 'react'
import { animate } from 'animejs'

const CENTER_X = 4
const MAX_AMPLITUDE = 3
const PERIOD = 10
/** 使曲线关于垂直中点（y = 16）上下对称的相位偏移量，即 5π - 16 * (2π / PERIOD) */
const PHASE_OFFSET = 5 * Math.PI - 16 * ((2 * Math.PI) / PERIOD)

/** strokeLinecap="round" 的帽高 = strokeWidth / 2 */
const CAP = 1.5
const START_Y = CAP
const END_Y = 32 - CAP

/** 根据振幅生成静态正弦波 SVG 路径，端点在视口内以露出圆头帽 */
function generatePath(amplitude: number): string {
  const freq = (Math.PI * 2) / PERIOD
  const step = 0.5
  let d = `M${(CENTER_X + amplitude * Math.sin(START_Y * freq + PHASE_OFFSET)).toFixed(2)},${START_Y}`
  for (let y = START_Y + step; y <= END_Y; y += step) {
    const x = CENTER_X + amplitude * Math.sin(y * freq + PHASE_OFFSET)
    d += ` L${x.toFixed(1)},${y.toFixed(1)}`
  }
  return d
}

/** 波浪指示条：正常态为直线，编辑态平滑过渡为静态正弦曲线 */
export const WaveIndicator = memo(
  ({ isActive, isEditing }: { isActive: boolean; isEditing: boolean }) => {
    const pathRef = useRef<SVGPathElement>(null)
    const params = useRef({ amplitude: 0 })
    /** 记录上一次的 isEditing 值，用于跳过无变化的重复触发 */
    const prevIsEditingRef = useRef<boolean | null>(null)

    useEffect(() => {
      if (prevIsEditingRef.current === isEditing) return
      prevIsEditingRef.current = isEditing

      animate(params.current, {
        amplitude: isEditing ? MAX_AMPLITUDE : 0,
        duration: 300,
        ease: 'inOutQuad',
        onUpdate: () => {
          pathRef.current?.setAttribute('d', generatePath(params.current.amplitude))
        },
      })
    }, [isEditing])

    return (
      <div className="relative h-8 w-[3px] shrink-0">
        <div className="absolute top-0 left-1/2 h-full w-[8px] -translate-x-1/2">
          <svg width="8" height="32" viewBox="0 0 8 32" fill="none">
            <path
              ref={pathRef}
              d={generatePath(0)}
              stroke={isActive || isEditing ? 'var(--accent)' : 'transparent'}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
        </div>
      </div>
    )
  }
)

WaveIndicator.displayName = 'WaveIndicator'
