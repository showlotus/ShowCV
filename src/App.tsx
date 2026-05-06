import { useCallback, useRef, useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Header, Sidebar } from './components/layout'
import { MarkdownEditor } from './components/editor'
import { PreviewContainer } from './components/preview'
import { SettingsPanel } from './components/settings'
import { Background } from './components/common'
import { Toaster } from './components/ui/sonner'
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from './components/ui/resizable'
import { Switch } from './components/ui/switch'
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from './components/ui/tooltip'
import { useResumeStore } from './store'
import { useShallow } from 'zustand/react/shallow'
import {
  useReactToPrintExport,
  useCopyImageExport,
  fetchShareData,
  getShareIdFromUrl,
  clearSharePath,
} from './services'
import { toast } from 'sonner'
// import { downloadFile } from './utils'
import './index.css'

/** A4 宽度基准像素值（暂未使用，预留给后续缩放功能） */
// const A4_WIDTH_PX = 794

function App() {
  const hasResume = useResumeStore(state => !!state.currentResume)
  // const exportData = useResumeStore(state => state.exportData)
  const createResume = useResumeStore(state => state.createResume)

  const isWideScreen = window.innerWidth > 1600
  const [sidebarOpen, setSidebarOpen] = useState(isWideScreen)
  const [settingsPanelOpen, setSettingsPanelOpen] = useState(isWideScreen)
  const { previewMode, setPreviewMode } = useResumeStore(
    useShallow(state => ({
      previewMode: state.previewMode,
      setPreviewMode: state.setPreviewMode,
    }))
  )

  const printRef = useRef<HTMLDivElement>(null)
  const copyRef = useRef<HTMLDivElement>(null)
  const { handlePrint } = useReactToPrintExport(printRef)
  const { handleCopyImage } = useCopyImageExport(copyRef)

  /** 根据预览面板像素宽度实时计算缩放比例，上限为 1 */
  // const [scale, setScale] = useState(1)

  /** onResize 回调，PanelSize.inPixels 直接提供像素宽度 */
  // const handlePreviewResize = useCallback(({ inPixels }: { inPixels: number }) => {
  //   setScale(Math.min(inPixels / A4_WIDTH_PX, 1))
  // }, [])

  const [shareLoading, setShareLoading] = useState(false)

  // 页面加载时检查服务端分享链接 /s/{shareId}
  useEffect(() => {
    const shareId = getShareIdFromUrl()
    if (!shareId) return

    setShareLoading(true)
    fetchShareData(shareId)
      .then(shareData => {
        createResume({
          name: shareData.name,
          content: shareData.content,
          templateId: shareData.templateId,
          settings: shareData.settings,
          fromShare: true,
        })
      })
      .catch(error => {
        console.error('[Fetch Share Error]', error)
        toast.error(error instanceof Error ? error.message : '无法加载分享内容')
      })
      .finally(() => {
        setShareLoading(false)
        clearSharePath()
      })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleExportPDF = useCallback(() => handlePrint(), [handlePrint])
  const handleCopyImagePNG = useCallback(() => handleCopyImage(), [handleCopyImage])

  // const handleExportJSON = useCallback(() => {
  //   const data = exportData()
  //   downloadFile(JSON.stringify(data, null, 2), `${data.title}.json`, 'application/json')
  // }, [exportData])

  if (shareLoading || !hasResume) {
    return (
      <>
        <div
          className="flex h-screen items-center justify-center gap-2"
          style={{ background: 'var(--bg-primary)' }}
        >
          {shareLoading && (
            <Loader2 className="h-5 w-5 animate-spin" style={{ color: 'var(--fg-muted)' }} />
          )}
          <p style={{ color: 'var(--fg-muted)' }}>
            {shareLoading ? '正在加载分享简历...' : '加载中...'}
          </p>
        </div>
        <Toaster position="top-center" duration={2000} />
      </>
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
            <div className="mx-3 mb-3 flex items-center justify-between">
              <span className="text-sm font-medium" style={{ color: 'var(--fg-primary)' }}>
                Markdown 编辑器
              </span>
            </div>
            <div
              className="editor-wrapper flex-1 overflow-hidden rounded-lg"
              style={{ background: 'var(--bg-secondary)' }}
            >
              <MarkdownEditor />
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle style={{ background: 'var(--border)' }} />

          {/* 预览区 */}
          <ResizablePanel defaultSize={50} minSize={15} className="flex flex-col p-4">
            <div className="mx-3 mb-3 flex items-center justify-between">
              <span className="text-sm font-medium" style={{ color: 'var(--fg-primary)' }}>
                实时预览
              </span>
              <TooltipProvider>
                <span className="inline-flex items-center gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span
                        className="cursor-pointer text-xs transition-colors"
                        style={{
                          color: previewMode === 'flat' ? 'var(--accent)' : 'var(--fg-muted)',
                        }}
                        onClick={() => setPreviewMode('flat')}
                      >
                        平铺
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="left" sideOffset={8}>
                      连贯展示（复制为图片时的效果）
                    </TooltipContent>
                  </Tooltip>
                  <Switch
                    checked={previewMode === 'paginated'}
                    onCheckedChange={checked => setPreviewMode(checked ? 'paginated' : 'flat')}
                  />
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span
                        className="cursor-pointer text-xs transition-colors"
                        style={{
                          color: previewMode === 'paginated' ? 'var(--accent)' : 'var(--fg-muted)',
                        }}
                        onClick={() => setPreviewMode('paginated')}
                      >
                        分页
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="right" sideOffset={8}>
                      按 A4 纸自动分页（导出为 PDF 时的效果）
                    </TooltipContent>
                  </Tooltip>
                </span>
              </TooltipProvider>
            </div>
            <div
              className="flex-1 overflow-x-hidden overflow-y-auto rounded-lg p-4"
              style={{ background: 'var(--bg-tertiary)' }}
            >
              <PreviewContainer ref={copyRef} printRef={printRef} />
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
