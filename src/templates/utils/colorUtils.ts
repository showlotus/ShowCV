/**
 * 将 hex 颜色值转为指定不透明度的 rgba 字符串
 * 支持简写 (#fff) 和完整 (#ffffff) 格式
 */
export function hexToRgba(hex: string, opacity: number): string {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? h[0] + h[0] + h[1] + h[1] + h[2] + h[2] : h
  const r = parseInt(full.slice(0, 2), 16)
  const g = parseInt(full.slice(2, 4), 16)
  const b = parseInt(full.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${opacity})`
}
