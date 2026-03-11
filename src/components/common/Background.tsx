import { memo } from 'react'

export const Background = memo(() => {
  return (
    <>
      {/* 网格背景 */}
      <div className="fixed inset-0 bg-grid bg-grid-animated pointer-events-none" />

      {/* 发光球体 */}
      <div
        className="glow-orb w-96 h-96 -top-48 -left-48"
        style={{ background: 'var(--accent)' }}
      />
      <div
        className="glow-orb w-80 h-80 bottom-0 right-0"
        style={{ background: 'var(--accent)', animationDelay: '-4s' }}
      />
    </>
  )
})

Background.displayName = 'Background'
