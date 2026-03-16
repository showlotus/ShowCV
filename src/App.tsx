import { useCallback, useRef, useEffect, useState } from 'react'
import { Header, Sidebar } from './components/layout'
import { MarkdownEditor } from './components/editor'
import { PreviewContainer } from './components/preview'
import { SettingsPanel } from './components/settings'
import { Background } from './components/common'
import { Toaster } from './components/ui/sonner'
import { useResumeStore } from './store'
import {
  useReactToPrintExport,
  useCopyImageExport,
  getShareDataFromUrl,
  clearShareHash,
} from './services'
// import { downloadFile } from './utils'
import './index.css'

function App() {
  // 只订阅 padding，避免其他 settings 变化触发 App 重渲染
  const padding = useResumeStore(state => state.currentResume?.settings.spacing.padding ?? 0)
  const hasResume = useResumeStore(state => !!state.currentResume)
  // const exportData = useResumeStore(state => state.exportData)
  const createResume = useResumeStore(state => state.createResume)

  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [settingsPanelOpen, setSettingsPanelOpen] = useState(true)

  const previewRef = useRef<HTMLDivElement>(null)
  const { handlePrint } = useReactToPrintExport(previewRef, padding)
  const { handleCopyImage } = useCopyImageExport(previewRef)

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

      {/* 三栏常驻布局 */}
      <div className="relative z-10 flex flex-1 overflow-hidden">
        {/* 简历列表：固定宽度 */}
        <Sidebar open={sidebarOpen} />

        {/* 编辑区：弹性填充剩余空间 */}
        <div
          className="flex min-w-[300px] flex-1 flex-col p-4 transition-all duration-300"
          style={{ marginLeft: sidebarOpen ? '300px' : '0px' }}
        >
          {/* <span className="mb-3 ml-3 text-sm font-medium" style={{ color: 'var(--fg-muted)' }}>
            Markdown 编辑器
          </span> */}
          <div
            className="editor-wrapper flex-1 overflow-hidden rounded-lg"
            style={{ background: 'var(--bg-secondary)' }}
          >
            <MarkdownEditor />
          </div>
        </div>

        {/* 预览区：固定 A4 宽度，不参与 flex 压缩 */}
        <div className="hidden shrink-0 flex-col p-4 xl:flex" style={{ width: '210mm' }}>
          {/* <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-medium" style={{ color: 'var(--fg-muted)' }}>
              实时预览
            </span>
            <span
              className="rounded px-2 py-1 text-xs"
              style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
            >
              A4
            </span>
          </div> */}
          <div
            className="flex-1 overflow-auto rounded-lg p-4"
            style={{ background: 'var(--bg-tertiary)' }}
          >
            <PreviewContainer ref={previewRef} />
          </div>
        </div>

        {/* 配置面板：固定宽度，小屏隐藏 */}
        <SettingsPanel open={settingsPanelOpen} />
      </div>

      <Toaster position="top-center" duration={2000} />
    </div>
  )
}

export default App
