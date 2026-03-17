import { useMemo, memo, useRef } from 'react'
import type { ResumeSettings } from '@/types'
import { TemplateRenderer } from '@/layouts'

export interface ResumePreviewProps {
  templateId: string
  content: string
  settings: ResumeSettings
}

// 1mm 对应的像素值（96dpi 标准）
const MM_TO_PX = 3.7795275591

// A4 纸高度（px）
const A4_HEIGHT_PX = 297 * MM_TO_PX

/**
 * 根据 templateId 选择对应的简历模板渲染
 * 独立导出供缩略图等场景复用
 */
export const ResumePreview = memo(({ templateId, content, settings }: ResumePreviewProps) => {
  return <TemplateRenderer templateId={templateId} content={content} settings={settings} />
})

ResumePreview.displayName = 'ResumePreview'

/**
 * 根据容器总高度和边距，计算每个分页禁区的起始位置列表
 * 禁区起点 = 当前页内容区底部（A4_HEIGHT_PX - padding），高度为 padding * 2
 */
function calcDangerZoneTops(totalHeight: number, padding: number): number[] {
  const count = Math.floor(totalHeight / A4_HEIGHT_PX)
  return Array.from({ length: count }, (_, i) => (i + 1) * A4_HEIGHT_PX - padding)
}

/**
 * 遍历所有 .resume-section，计算页码、写入 data-page，并对每页首个 section 设置 margin-top
 *
 * 判断规则：
 *   - 每页可用内容高度 = A4_HEIGHT_PX - padding * 2
 *   - section 相对当前页顶部的偏移 = section.offsetTop - (page - 1) * A4_HEIGHT_PX
 *   - 若该偏移 + section.offsetHeight > 每页可用高度，则推到下一页
 *
 * margin-top 计算（针对每页首个 section）：
 *   - 使用 paddingTop 撑开空间，避免 margin collapse 导致偏移不准确
 *   - 第 n 页内容区起始绝对位置 = (n-1) * A4_HEIGHT_PX + padding
 *   - paddingTop = 第 n 页内容区起始 - section 当前 offsetTop
 *   - 注意：必须先清除所有旧 paddingTop，再读取 offsetTop，避免累积误差
 */
function assignSectionPages(wrapper: HTMLElement, padding: number) {
  const sections = wrapper.querySelectorAll<HTMLElement>('.resume-section')
  const pageContentHeight = A4_HEIGHT_PX - padding * 2

  // 先清除所有旧内联样式和 page-first class
  for (const section of sections) {
    section.style.paddingTop = ''
    section.classList.remove('page-first')
  }

  // 强制回流，确保后续读取的 offsetTop 是清除 margin 后的原始值
  void wrapper.offsetHeight

  let page = 1
  let isFirstOfPage = false

  for (const section of sections) {
    const relTop = section.offsetTop - (page - 1) * A4_HEIGHT_PX
    if (relTop + section.offsetHeight > pageContentHeight) {
      page += 1
      isFirstOfPage = true
    }

    if (isFirstOfPage) {
      // offsetTop 相对于 wrapper padding 内侧，目标位置为第 n 页内容区起始（含 padding 偏移）
      const pageContentStart = (page - 1) * A4_HEIGHT_PX + padding
      const top = pageContentStart - section.offsetTop
      section.style.paddingTop = `${top}px`
      section.classList.add('page-first')
      isFirstOfPage = false
    }

    section.dataset.page = String(page)
  }
}

/**
 * 预览组件 - 固定 A4 宽度，高度随内容自动撑开，并用虚线模拟分页效果
 * ref 透传到 .preview-page 根节点，供打印方案直接使用
 */
export const PaginatedPreview = ({
  templateId,
  content,
  settings,
  ref,
}: ResumePreviewProps & { ref?: React.Ref<HTMLDivElement> }) => {
  const padding = settings.spacing.padding
  const wrapperRef = useRef<HTMLDivElement>(null)
  // const [dangerZoneTops, setDangerZoneTops] = useState<number[]>([])

  const settingsWithoutPadding = useMemo(
    () => ({
      ...settings,
      spacing: { ...settings.spacing, padding: 0 },
    }),
    [settings]
  )

  // useEffect(() => {
  //   const wrapper = wrapperRef.current
  //   if (!wrapper) return

  //   const update = () => {
  //     // 延迟一帧，确保 React 已完成 DOM 更新（如行高、字体等 CSS 变量生效后再计算）
  //     requestAnimationFrame(() => {
  //       setDangerZoneTops(calcDangerZoneTops(wrapper.offsetHeight, padding))
  //       // assignSectionPages(wrapper, padding)
  //     })
  //   }

  //   const observer = new ResizeObserver(update)
  //   observer.observe(wrapper)
  //   update()

  //   return () => observer.disconnect()
  // }, [content, settings])

  return (
    <div
      ref={ref ?? wrapperRef}
      className="preview-page rounded-lg bg-white"
      style={{
        padding: `${padding}px`,
        position: 'relative',
      }}
    >
      {/* 分页虚线 */}
      {/* {dangerZoneTops.map(top => (
        <div
          key={top}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: top + padding,
            borderTop: '2px dashed #94a3b8',
            pointerEvents: 'none',
            zIndex: 10,
          }}
        />
      ))} */}
      <ResumePreview templateId={templateId} content={content} settings={settingsWithoutPadding} />
    </div>
  )
}

PaginatedPreview.displayName = 'PaginatedPreview'
