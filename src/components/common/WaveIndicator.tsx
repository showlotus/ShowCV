import { useRef, useEffect, useCallback, memo } from 'react'
import { animate } from 'animejs'

const CENTER_X = 4
const MAX_AMPLITUDE = 3
const PERIOD = 10
/** 每秒滚动的周期数，0.67 约等于 1200ms 一个完整周期 */
const CYCLES_PER_SECOND = 2 / 3
const SCROLL_SPEED = PERIOD * CYCLES_PER_SECOND

/** strokeLinecap="round" 的帽高 = strokeWidth / 2 */
const CAP = 1.5
const START_Y = CAP
const END_Y = 32 - CAP

/** 根据振幅和相位实时生成正弦波 SVG 路径，端点在视口内以露出圆头帽 */
function generatePath(amplitude: number, phase: number): string {
  const freq = (Math.PI * 2) / PERIOD
  const step = 0.5
  let d = `M${(CENTER_X + amplitude * Math.sin((START_Y + phase) * freq)).toFixed(2)},${START_Y}`
  for (let y = START_Y + step; y <= END_Y; y += step) {
    const x = CENTER_X + amplitude * Math.sin((y + phase) * freq)
    d += ` L${x.toFixed(1)},${y.toFixed(1)}`
  }
  return d
}

/** 波浪指示条：静止时为垂直直线，激活时正弦波形变 + 无限向下滚动 */
export const WaveIndicator = memo(
  ({ isActive, isAnimating }: { isActive: boolean; isAnimating: boolean }) => {
    const pathRef = useRef<SVGPathElement>(null)
    const params = useRef({ amplitude: 0, phase: 0 })
    const rafRef = useRef(0)
    const lastTimeRef = useRef(0)
    const isAnimatingRef = useRef(false)
    /** 记录上一次的 isAnimating 值，用于跳过无变化的重复触发 */
    const prevIsAnimatingRef = useRef<boolean | null>(null)

    /** rAF 渲染循环：每帧推进相位、读取 anime.js 驱动的振幅、重新生成路径 */
    const tick = useCallback((time: number) => {
      const dt = lastTimeRef.current ? (time - lastTimeRef.current) / 1000 : 0
      lastTimeRef.current = time

      const p = params.current
      if (p.amplitude > 0.01) {
        p.phase += dt * SCROLL_SPEED
      }

      pathRef.current?.setAttribute('d', generatePath(p.amplitude, p.phase))

      if (isAnimatingRef.current || p.amplitude > 0.01) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        rafRef.current = 0
        p.phase = 0
        pathRef.current?.setAttribute('d', generatePath(0, 0))
      }
    }, [])

    useEffect(() => {
      if (prevIsAnimatingRef.current === isAnimating) return
      prevIsAnimatingRef.current = isAnimating

      isAnimatingRef.current = isAnimating

      animate(params.current, {
        amplitude: isAnimating ? MAX_AMPLITUDE : 0,
        duration: 300,
        ease: 'inOutQuad',
      })

      if (!rafRef.current) {
        lastTimeRef.current = 0
        rafRef.current = requestAnimationFrame(tick)
      }

      return () => {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = 0
      }
    }, [isAnimating, tick])

    return (
      <div className="relative h-8 w-[3px] shrink-0">
        <div className="absolute top-0 left-1/2 h-full w-[8px] -translate-x-1/2">
          <svg width="8" height="32" viewBox="0 0 8 32" fill="none">
            <path
              ref={pathRef}
              d={generatePath(0, 0)}
              stroke={isActive ? 'var(--accent)' : 'transparent'}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              style={{ transition: 'stroke 0.5s' }}
            />
          </svg>
        </div>
      </div>
    )
  }
)

WaveIndicator.displayName = 'WaveIndicator'
