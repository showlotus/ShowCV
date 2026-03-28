import { useState, useLayoutEffect, useCallback } from 'react'
import type { RefObject } from 'react'

// 1mm 对应的像素值（96dpi 标准）
const MM_TO_PX = 3.7795275591

// A4 纸高度（px）
export const A4_HEIGHT_PX = 297 * MM_TO_PX

// A4 纸宽度（px）
export const A4_WIDTH_PX = 210 * MM_TO_PX

export interface SectionMeasure {
  index: number
  top: number
  height: number
  bottom: number
}

export interface PageInfo {
  startY: number
  height: number
}

/**
 * 归一化像素值，避免亚像素边界导致分页露头
 * @param value 原始像素值
 */
function normalizePx(value: number): number {
  return Math.round(value)
}

/**
 * 从可见 DOM 内容容器中测量 section 位置
 * @param container 内容容器 DOM
 * @param zoom 当前 CSS zoom 值，用于将 getBoundingClientRect 的视觉像素转换为布局像素
 */
function measureSections(container: HTMLElement, zoom: number): SectionMeasure[] {
  const resumeEl = container.querySelector('#resume-preview')
  if (!resumeEl) return []

  const mainEl =
    resumeEl.querySelector('main') ||
    resumeEl.querySelector(':scope > div') ||
    resumeEl

  const sectionEls = mainEl.querySelectorAll(':scope > .resume-section')
  if (sectionEls.length === 0) return []

  const mainRect = (mainEl as HTMLElement).getBoundingClientRect()

  return Array.from(sectionEls).map((el, index) => {
    const htmlEl = el as HTMLElement
    const rect = htmlEl.getBoundingClientRect()
    const style = window.getComputedStyle(htmlEl)
    const marginBottom = parseFloat(style.marginBottom) || 0
    // getBoundingClientRect 返回视觉像素，除以 zoom 得到布局像素
    const top = normalizePx((rect.top - mainRect.top) / zoom)
    const height = normalizePx(rect.height / zoom)
    return {
      index,
      top,
      height,
      bottom: normalizePx(top + height + marginBottom / zoom),
    }
  })
}

/**
 * 分页算法
 */
function computePages(sections: SectionMeasure[], contentHeight: number): PageInfo[] {
  if (sections.length === 0) return []

  const pages: PageInfo[] = []
  let pageStartY = 0

  for (const section of sections) {
    const relativeTop = section.top - pageStartY
    // bottom 包含 marginBottom，确保 section 后的间距也被计入
    const relativeBottom = section.bottom - pageStartY

    if (section.height > contentHeight) {
      if (relativeTop > 0) {
        pages.push({
          startY: normalizePx(pageStartY),
          height: normalizePx(relativeTop),
        })
      }
      pages.push({
        startY: normalizePx(section.top),
        height: normalizePx(contentHeight),
      })
      pageStartY = normalizePx(section.bottom)
      continue
    }

    if (relativeBottom <= contentHeight) {
      // 放得下
    } else {
      pages.push({
        startY: normalizePx(pageStartY),
        height: normalizePx(relativeTop),
      })
      pageStartY = normalizePx(section.top)
    }
  }

  pages.push({
    startY: normalizePx(pageStartY),
    height: normalizePx(contentHeight),
  })
  return pages
}

/**
 * 分页布局 hook
 * @param contentRef 第一个页面容器内内容区域的 ref
 * @param contentHeight 每页可用内容高度（布局像素）
 * @param zoom 当前 CSS zoom 值
 * @param deps 重新计算的依赖数组
 */
export function usePaginatedLayout(
  contentRef: RefObject<HTMLDivElement | null>,
  contentHeight: number,
  zoom: number,
  deps: unknown[]
): PageInfo[] {
  const [pages, setPages] = useState<PageInfo[]>([])

  const measure = useCallback(() => {
    const el = contentRef.current
    if (!el) return

    const sections = measureSections(el, zoom)
    if (sections.length === 0) return

    const computed = computePages(sections, contentHeight)
    setPages(computed)
  }, [contentRef, contentHeight, zoom])

  useLayoutEffect(() => {
    measure()
  }, [measure])

  useLayoutEffect(() => {
    measure()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return pages
}
