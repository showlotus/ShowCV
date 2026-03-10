import { useState, useCallback, forwardRef, useRef, useEffect, useMemo, memo } from 'react'
import { Header } from './components/layout'
import { MarkdownEditor } from './components/editor'
import { PreviewContainer } from './components/preview'
import { SettingsPanel } from './components/settings'
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

    // 计算页数（同步计算，确保打印时已确定）
    useEffect(() => {
      const calculatePages = () => {
        if (!containerRef.current) return

        const contentHeight = containerRef.current.scrollHeight
        const availableHeight = A4_HEIGHT_PX - padding * 2
        const pages = Math.max(1, Math.ceil(contentHeight / availableHeight))

        setPageCount(pages)
      }

      // 立即计算一次
      calculatePages()

      const timer = setTimeout(calculatePages, 100)
      return () => clearTimeout(timer)
    }, [content, settings, padding])

    return (
      <div ref={ref} className="print:shadow-none">
        {/* 隐藏的测量容器 */}
        <div
          ref={containerRef}
          style={{
            position: 'absolute',
            left: '-9999px',
            width: `${A4_WIDTH_PX}px`,
            visibility: 'hidden',
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
            className="print-page"
            style={{
              width: `${A4_WIDTH_PX}px`,
              height: `${A4_HEIGHT_PX}px`,
              padding: `${padding}px`,
              boxSizing: 'border-box',
              overflow: 'hidden',
              backgroundColor: 'white',
              position: 'relative',
              pageBreakAfter: pageIndex < pageCount - 1 ? 'always' : 'auto',
            }}
          >
            {/* 内容层 */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  transform: `translateY(-${pageIndex * (A4_HEIGHT_PX - padding * 2)}px)`,
                  width: '100%',
                  padding: `${padding}px`,
                  boxSizing: 'border-box',
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

  // 只订阅 actions 和打印需要的状态，不订阅会频繁变化的 content
  const templateId = useResumeStore(state => state.templateId)
  const content = useResumeStore(state => state.content)
  const settings = useResumeStore(state => state.settings)
  const exportData = useResumeStore(state => state.exportData)
  const setTemplate = useResumeStore(state => state.setTemplate)
  const setContent = useResumeStore(state => state.setContent)
  const updateFontSettings = useResumeStore(state => state.updateFontSettings)
  const updateColorSettings = useResumeStore(state => state.updateColorSettings)
  const updateSpacingSettings = useResumeStore(state => state.updateSpacingSettings)

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

  return (
    <div className="flex h-screen flex-col bg-gray-100">
      <Header
        onOpenSettings={handleOpenSettings}
        onExportPDF={handleExportPDF}
        onExportJSON={handleExportJSON}
        onPrintWithReactToPrint={handlePrintWithReactToPrint}
      />

      <main className="flex min-h-0 flex-1">
        {/* 左侧编辑区 */}
        <div className="flex min-h-0 w-1/2 flex-col border-r border-gray-200 bg-white">
          <MarkdownEditor />
        </div>

        {/* 右侧预览区 - 使用独立的预览容器组件 */}
        <PreviewContainer />
      </main>

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

      <SettingsPanel isOpen={isSettingsOpen} onClose={handleCloseSettings} />
    </div>
  )
}

export default App
