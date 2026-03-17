import { useCallback, useRef, useEffect, useState } from 'react'
import { Header, Sidebar } from './components/layout'
import { MarkdownEditor } from './components/editor'
import { PreviewContainer } from './components/preview'
import { SettingsPanel } from './components/settings'
import { Background } from './components/common'
import { Toaster } from './components/ui/sonner'
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from './components/ui/resizable'
import { useResumeStore } from './store'
import {
  useReactToPrintExport,
  useCopyImageExport,
  getShareDataFromUrl,
  clearShareHash,
} from './services'
// import { downloadFile } from './utils'
import './index.css'

/** A4 宽度基准像素值（暂未使用，预留给后续缩放功能） */
// const A4_WIDTH_PX = 794

function App() {
  // 只订阅 padding，避免其他 settings 变化触发 App 重渲染
  const padding = useResumeStore(state => state.currentResume?.settings.spacing.padding ?? 0)
  const hasResume = useResumeStore(state => !!state.currentResume)
  // const exportData = useResumeStore(state => state.exportData)
  const createResume = useResumeStore(state => state.createResume)

  const isWideScreen = window.innerWidth > 1600
  const [sidebarOpen, setSidebarOpen] = useState(isWideScreen)
  const [settingsPanelOpen, setSettingsPanelOpen] = useState(isWideScreen)

  const previewRef = useRef<HTMLDivElement>(null)
  const { handlePrint } = useReactToPrintExport(previewRef, padding)
  const { handleCopyImage } = useCopyImageExport(previewRef)

  /** 根据预览面板像素宽度实时计算缩放比例，上限为 1 */
  // const [scale, setScale] = useState(1)

  /** onResize 回调，PanelSize.inPixels 直接提供像素宽度 */
  // const handlePreviewResize = useCallback(({ inPixels }: { inPixels: number }) => {
  //   setScale(Math.min(inPixels / A4_WIDTH_PX, 1))
  // }, [])

  // 页面加载时检查 URL Hash 中的分享数据
  useEffect(() => {
    const shareData = getShareDataFromUrl()
    if (shareData) {
      createResume({
        name: shareData.name,
        content: shareData.content,
        templateId: shareData.templateId,
        settings: shareData.settings,
        fromShare: true,
      })
      clearShareHash()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleExportPDF = useCallback(() => handlePrint(), [handlePrint])
  const handleCopyImagePNG = useCallback(() => handleCopyImage(), [handleCopyImage])

  // const handleExportJSON = useCallback(() => {
  //   const data = exportData()
  //   downloadFile(JSON.stringify(data, null, 2), `${data.title}.json`, 'application/json')
  // }, [exportData])

  if (!hasResume) {
    return (
      <div
        className="flex h-screen items-center justify-center"
        style={{ background: 'var(--bg-primary)' }}
      >
        <p style={{ color: 'var(--fg-muted)' }}>加载中...</p>
      </div>
    )
  }

  return (
    <div className="relative z-10 flex h-screen flex-col overflow-hidden">
      <Background />

      <Header
        onExportPDF={handleExportPDF}
        onCopyImage={handleCopyImagePNG}
        sidebarOpen={sidebarOpen}
        settingsPanelOpen={settingsPanelOpen}
        onToggleSidebar={() => setSidebarOpen((v: boolean) => !v)}
        onToggleSettingsPanel={() => setSettingsPanelOpen((v: boolean) => !v)}
      />

      {/* 三栏布局：Sidebar + [编辑器 | 分割线 | 预览] + SettingsPanel */}
      <div className="relative z-10 flex flex-1 overflow-hidden">
        {/* 简历列表 */}
        <Sidebar open={sidebarOpen} />

        {/* 中间区域：编辑器 + 可拖动分割线 + 预览区 */}
        <ResizablePanelGroup
          orientation="horizontal"
          className="flex-1 transition-all duration-300"
        >
          {/* 编辑区 */}
          <ResizablePanel defaultSize={50} minSize={20} className="flex flex-col p-4">
            <div
              className="editor-wrapper flex-1 overflow-hidden rounded-lg"
              style={{ background: 'var(--bg-secondary)' }}
            >
              <MarkdownEditor />
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle style={{ background: 'var(--border)' }} />

          {/* 预览区 */}
          <ResizablePanel
            defaultSize={50}
            minSize={15}
            className="flex flex-col p-4"
          >
            <div
              className="flex-1 overflow-x-hidden overflow-y-auto rounded-lg p-4"
              style={{ background: 'var(--bg-tertiary)' }}
            >
              <PreviewContainer ref={previewRef} />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>

        {/* 配置面板：固定宽度 */}
        <SettingsPanel open={settingsPanelOpen} />
      </div>

      <Toaster position="top-center" duration={2000} />
    </div>
  )
}

export default App
