import { useState, useCallback, forwardRef, useRef, useEffect, useMemo, memo } from 'react'
import { Header, Sidebar } from './components/layout'
import { MarkdownEditor } from './components/editor'
import { PreviewContainer } from './components/preview'
import { SettingsPanel } from './components/settings'
import { Background, Toast } from './components/common'
import { SimpleLayout, ModernLayout, CreativeLayout } from './layouts'
import { useResumeStore } from './store'
import {
  usePDFExport,
  useReactToPrintExport,
  getShareDataFromUrl,
  clearShareHash,
} from './services'
import { downloadFile } from './utils'
import type { TemplateId, ResumeSettings } from './types'
import './index.css'

// A4 纸张尺寸 (像素，96dpi: 1mm ≈ 3.78px)
const A4_HEIGHT_PX = Math.round(297 * 3.78) // ≈ 1122px
const A4_WIDTH_PX = Math.round(210 * 3.78) // ≈ 794px

interface ResumePreviewProps {
  templateId: TemplateId
  content: string
  settings: ResumeSettings
}

// 简历预览组件（使用 memo 优化）
const ResumePreview = memo(({ templateId, content, settings }: ResumePreviewProps) => {
  switch (templateId) {
    case 'modern':
      return <ModernLayout content={content} settings={settings} />
    case 'creative':
      return <CreativeLayout content={content} settings={settings} />
    default:
      return <SimpleLayout content={content} settings={settings} />
  }
})

ResumePreview.displayName = 'ResumePreview'

// 可打印的分页简历组件 - 与预览组件使用相同的分页逻辑
const PrintablePaginatedResume = forwardRef<HTMLDivElement, ResumePreviewProps>(
  ({ templateId, content, settings }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const [pageCount, setPageCount] = useState(1)

    const padding = settings.spacing.padding

    // 创建不带 padding 的设置
    const settingsWithoutPadding = useMemo(
      () => ({
        ...settings,
        spacing: {
          ...settings.spacing,
          padding: 0,
        },
      }),
      [settings]
    )

    // 每页可用内容高度 = A4高度 - 上下边距
    const availableHeight = A4_HEIGHT_PX - padding * 2

    // 计算页数（同步计算，确保打印时已确定）
    useEffect(() => {
      const calculatePages = () => {
        if (!containerRef.current) return

        const contentHeight = containerRef.current.scrollHeight
        const pages = Math.max(1, Math.ceil(contentHeight / availableHeight))

        setPageCount(pages)
      }

      // 立即计算一次
      calculatePages()

      const timer = setTimeout(calculatePages, 100)
      return () => clearTimeout(timer)
    }, [content, settings, padding, availableHeight])

    return (
      <div ref={ref} className="paginated-preview print:shadow-none">
        {/* 隐藏的测量容器 */}
        <div
          ref={containerRef}
          style={{
            position: 'absolute',
            left: '-9999px',
            width: `${A4_WIDTH_PX - padding * 2}px`,
            visibility: 'hidden',
            pointerEvents: 'none',
          }}
        >
          <ResumePreview
            templateId={templateId}
            content={content}
            settings={settingsWithoutPadding}
          />
        </div>

        {/* 每页独立渲染 */}
        {Array.from({ length: pageCount }).map((_, pageIndex) => (
          <div
            key={pageIndex}
            className="preview-page"
            style={{
              width: `${A4_WIDTH_PX}px`,
              height: `${A4_HEIGHT_PX}px`,
              padding: `${padding}px`,
              boxSizing: 'border-box',
              overflow: 'hidden',
              backgroundColor: 'white',
              position: 'relative',
            }}
          >
            {/* 内容层 - 通过 transform 定位到对应页面位置 */}
            <div
              className="preview-page-content"
              style={{
                position: 'absolute',
                top: padding,
                left: padding,
                right: padding,
                bottom: padding,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  transform: `translateY(-${pageIndex * availableHeight}px)`,
                  width: '100%',
                }}
              >
                <ResumePreview
                  templateId={templateId}
                  content={content}
                  settings={settingsWithoutPadding}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }
)

PrintablePaginatedResume.displayName = 'PrintablePaginatedResume'

function App() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  // 从 store 获取状态
  const currentResume = useResumeStore((state) => state.currentResume)
  const templateId = currentResume?.templateId || 'simple'
  const content = currentResume?.content || ''
  const settings = currentResume?.settings

  const exportData = useResumeStore((state) => state.exportData)
  const setTemplate = useResumeStore((state) => state.setTemplate)
  const setContent = useResumeStore((state) => state.setContent)
  const updateFontSettings = useResumeStore((state) => state.updateFontSettings)
  const updateColorSettings = useResumeStore((state) => state.updateColorSettings)
  const updateSpacingSettings = useResumeStore((state) => state.updateSpacingSettings)

  const { contentRef, handlePrint } = usePDFExport()
  const { contentRef: reactToPrintRef, handlePrint: handleReactToPrint } = useReactToPrintExport()

  // 页面加载时检查 URL Hash 中的分享数据
  useEffect(() => {
    const shareData = getShareDataFromUrl()
    if (shareData) {
      // 导入分享数据
      setContent(shareData.content)
      setTemplate(shareData.templateId)
      updateFontSettings(shareData.settings.font)
      updateColorSettings(shareData.settings.color)
      updateSpacingSettings(shareData.settings.spacing)
      // 清除 URL 中的 hash，避免刷新后重复导入
      clearShareHash()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleOpenSettings = useCallback(() => {
    setIsSettingsOpen(true)
  }, [])

  const handleCloseSettings = useCallback(() => {
    setIsSettingsOpen(false)
  }, [])

  const handleToggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => !prev)
  }, [])

  const handleExportPDF = useCallback(() => {
    handlePrint()
  }, [handlePrint])

  const handlePrintWithReactToPrint = useCallback(() => {
    handleReactToPrint()
  }, [handleReactToPrint])

  const handleExportJSON = useCallback(() => {
    const data = exportData()
    const json = JSON.stringify(data, null, 2)
    downloadFile(json, `${data.title}.json`, 'application/json')
  }, [exportData])

  // 如果没有设置，显示加载状态
  if (!settings) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <p style={{ color: 'var(--fg-muted)' }}>加载中...</p>
      </div>
    )
  }

  return (
    <div className="relative z-10 flex flex-col h-screen overflow-hidden">
      {/* 动态背景 */}
      <Background />

      {/* Header */}
      <Header
        onOpenSettings={handleOpenSettings}
        onExportPDF={handleExportPDF}
        onExportJSON={handleExportJSON}
        onPrintWithReactToPrint={handlePrintWithReactToPrint}
        onToggleSidebar={handleToggleSidebar}
      />

      {/* 主内容区 */}
      <div className="flex-1 flex overflow-hidden relative z-10">
        {/* 左侧边栏 */}
        <Sidebar isOpen={isSidebarOpen} />

        {/* 编辑区 */}
        <div
          className="flex-1 flex flex-col p-4 min-w-0"
          style={{ background: 'transparent' }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full" style={{ background: '#ff5f57' }} />
                <div className="w-3 h-3 rounded-full" style={{ background: '#febc2e' }} />
                <div className="w-3 h-3 rounded-full" style={{ background: '#28c840' }} />
              </div>
              <span
                className="ml-3 text-sm font-medium"
                style={{ color: 'var(--fg-muted)' }}
              >
                Markdown 编辑器
              </span>
            </div>
          </div>
          <div
            className="flex-1 rounded-xl overflow-hidden"
            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
          >
            <MarkdownEditor />
          </div>
        </div>

        {/* 预览区 */}
        <div
          className="flex-1 flex flex-col p-4 min-w-0 hidden md:flex"
          style={{ background: 'transparent' }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium" style={{ color: 'var(--fg-muted)' }}>
              实时预览
            </span>
            <div className="flex items-center gap-2">
              <span
                className="text-xs px-2 py-1 rounded"
                style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
              >
                A4
              </span>
            </div>
          </div>
          <div
            className="flex-1 overflow-auto rounded-xl p-4"
            style={{ background: 'var(--bg-tertiary)' }}
          >
            <PreviewContainer />
          </div>
        </div>
      </div>

      {/* 隐藏的打印内容 */}
      <div className="hidden print:block">
        {/* 原有的 iframe 打印方案 */}
        <PrintablePaginatedResume
          ref={contentRef}
          templateId={templateId}
          content={content}
          settings={settings}
        />
        {/* react-to-print 打印方案 */}
        <PrintablePaginatedResume
          ref={reactToPrintRef}
          templateId={templateId}
          content={content}
          settings={settings}
        />
      </div>

      {/* 配置面板 */}
      <SettingsPanel isOpen={isSettingsOpen} onClose={handleCloseSettings} />

      {/* Toast 通知 */}
      <Toast />
    </div>
  )
}

export default App
