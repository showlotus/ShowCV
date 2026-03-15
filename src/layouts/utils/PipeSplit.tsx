import type { ReactNode } from 'react'

/**
 * 将 ReactNode children 按第一个 || 分割为左右两组
 * 找不到 || 则返回 null
 */
function splitChildrenByPipe(
  children: ReactNode
): { left: ReactNode[]; right: ReactNode[] } | null {
  const nodes = Array.isArray(children) ? children : [children]
  const left: ReactNode[] = []
  const right: ReactNode[] = []
  let splitFound = false

  for (const node of nodes) {
    if (!splitFound && typeof node === 'string' && node.includes('||')) {
      const idx = node.indexOf('||')
      const l = node.slice(0, idx).trimEnd()
      const r = node.slice(idx + 2).trimStart()
      if (l) left.push(l)
      if (r) right.push(r)
      splitFound = true
    } else if (splitFound) {
      right.push(node)
    } else {
      left.push(node)
    }
  }

  return splitFound ? { left, right } : null
}

/**
 * 渲染带 || 分割的行内内容，左侧正常、右侧右对齐
 * 无 || 时直接返回原 children
 */
export function PipeSplit({ children }: { children: ReactNode }) {
  const result = splitChildrenByPipe(children)
  if (!result) return <>{children}</>
  return (
    <span className="flex justify-between">
      <span>{result.left}</span>
      <span>{result.right}</span>
    </span>
  )
}
