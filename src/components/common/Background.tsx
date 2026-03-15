import { memo } from 'react'

export const Background = memo(() => {
  return (
    <>
      {/* 网格背景 */}
      <div className="bg-grid bg-grid-animated pointer-events-none fixed inset-0" />

      {/* 发光球体 */}
      <div
        className="glow-orb -top-48 -left-48 h-96 w-96"
        style={{ background: 'var(--accent)' }}
      />
      <div
        className="glow-orb right-0 bottom-0 h-80 w-80"
        style={{ background: 'var(--accent)', animationDelay: '-4s' }}
      />
    </>
  )
})

Background.displayName = 'Background'
