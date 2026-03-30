import { useState, useCallback, memo } from 'react'
import {
  Download,
  Share2,
  Check,
  Sun,
  Moon,
  Github,
  Star,
  Image,
  PanelLeft,
  PanelRight,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { useResumeStore } from '@/store'
import { useShallow } from 'zustand/react/shallow'
import { generateShareUrl } from '@/services'
import { cn } from '@/utils'
import { useGitHubStars } from '@/hooks/useGitHubStars'
import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

interface HeaderProps {
  onExportPDF: () => void
  onCopyImage: () => Promise<void>
  sidebarOpen: boolean
  settingsPanelOpen: boolean
  onToggleSidebar: () => void
  onToggleSettingsPanel: () => void
}

// 深色/浅色主题切换
const ThemeToggle = memo(() => {
  const { theme, setTheme } = useResumeStore(
    useShallow(state => ({
      theme: state.theme,
      setTheme: state.setTheme,
    }))
  )

  return (
    <ToggleGroup
      type="single"
      value={theme}
      onValueChange={v => v && setTheme(v as 'light' | 'dark')}
      variant="outline"
      size="sm"
    >
      <ToggleGroupItem value="light" title="浅色模式">
        <Sun />
      </ToggleGroupItem>
      <ToggleGroupItem value="dark" title="深色模式">
        <Moon />
      </ToggleGroupItem>
    </ToggleGroup>
  )
})

ThemeToggle.displayName = 'ThemeToggle'

export function Header({
  onExportPDF,
  onCopyImage,
  sidebarOpen,
  settingsPanelOpen,
  onToggleSidebar,
  onToggleSettingsPanel,
}: HeaderProps) {
  const [copySuccess, setCopySuccess] = useState(false)
  const [copyImageSuccess, setCopyImageSuccess] = useState(false)
  const [copyImageLoading, setCopyImageLoading] = useState(false)
  const starCount = useGitHubStars('showlotus/showcv')

  /** 截图预览区并复制为 PNG 到剪贴板 */
  const handleCopyImage = useCallback(async () => {
    setCopyImageLoading(true)
    try {
      await onCopyImage()
      setCopyImageSuccess(true)
      toast.success('图片已复制')
      setTimeout(() => setCopyImageSuccess(false), 2000)
    } catch (e) {
      console.error('[CopyImage Error]', e)
      toast.error('复制失败')
    } finally {
      setCopyImageLoading(false)
    }
  }, [onCopyImage])

  /** 点击时直接读取最新 store 数据，无需订阅 currentResume */
  const handleShare = useCallback(async () => {
    const resume = useResumeStore.getState().currentResume
    if (!resume?.settings) {
      toast.error('请先创建简历')
      return
    }
    const shareUrl = generateShareUrl({
      content: resume.content,
      templateId: resume.templateId,
      settings: resume.settings,
      name: resume.name,
    })
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopySuccess(true)
      toast.success('链接已复制')
      setTimeout(() => setCopySuccess(false), 2000)
    } catch {
      toast.error('复制失败')
    }
  }, [])

  return (
    <header
      className="flex items-center justify-between border-b px-4 py-3 md:px-6"
      style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}
    >
      {/* Logo */}
      <div className="z-1 flex items-center gap-3">
        <img src="./icon.svg" alt="ShowCV" className="h-9 w-9" />
        <div className="hidden sm:block">
          <h1 className="font-display text-lg font-bold" style={{ color: 'var(--fg-primary)' }}>
            ShowCV
          </h1>
        </div>
      </div>

      {/* 右侧操作按钮 */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* 布局面板折叠控制 */}
        <ToggleGroup
          type="multiple"
          value={[sidebarOpen ? 'left' : '', settingsPanelOpen ? 'right' : ''].filter(Boolean)}
          variant="outline"
          size="sm"
        >
          <ToggleGroupItem value="left" title="左侧面板" onClick={onToggleSidebar}>
            <PanelLeft />
          </ToggleGroupItem>
          <ToggleGroupItem value="right" title="右侧面板" onClick={onToggleSettingsPanel}>
            <PanelRight />
          </ToggleGroupItem>
        </ToggleGroup>

        <ThemeToggle />
        <div className="hidden h-5 w-px md:block" style={{ background: 'var(--border)' }} />

        {/* 分享 */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleShare}
          className={cn(
            'border-border hover:bg-accent hover:text-accent-foreground hover:border-accent-foreground text-(--fg-secondary)',
            copySuccess &&
              'border-(--success) bg-(--success-soft)! text-(--success)! hover:border-(--success)! hover:bg-(--success-soft)! hover:text-(--success)!'
          )}
        >
          {copySuccess ? (
            <>
              <Check className="h-4 w-4" />
              <span className="hidden md:inline">已复制</span>
            </>
          ) : (
            <>
              <Share2 className="h-4 w-4" />
              <span className="hidden md:inline">分享</span>
            </>
          )}
        </Button>

        {/* 复制为图片 */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopyImage}
          disabled={copyImageLoading}
          className={cn(
            'border-border hover:bg-accent hover:text-accent-foreground hover:border-accent-foreground text-(--fg-secondary)',
            copyImageSuccess &&
              'border-(--success) bg-(--success-soft)! text-(--success)! hover:border-(--success)! hover:bg-(--success-soft)! hover:text-(--success)!'
          )}
        >
          {copyImageLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="hidden md:inline">生成中…</span>
            </>
          ) : copyImageSuccess ? (
            <>
              <Check className="h-4 w-4" />
              <span className="hidden md:inline">已复制</span>
            </>
          ) : (
            <>
              <Image className="h-4 w-4" />
              <span className="hidden md:inline">复制</span>
            </>
          )}
        </Button>

        {/* 导出 JSON */}
        {/* <Button
          variant="outline"
          size="sm"
          onClick={onExportJSON}
          className="hidden border-border text-(--fg-secondary) hover:bg-accent hover:text-accent-foreground hover:border-accent-foreground md:flex"
        >
          <Download className="h-4 w-4" />
          JSON
        </Button> */}

        {/* 导出 PDF */}
        <Button
          variant="outline"
          size="sm"
          onClick={onExportPDF}
          className="border-border hover:bg-accent hover:text-accent-foreground hover:border-accent-foreground text-(--fg-secondary)"
        >
          {/* <FileDown className="h-4 w-4" /> */}
          <Download className="h-4 w-4" />
          导出
        </Button>

        <div className="hidden h-5 w-px md:block" style={{ background: 'var(--border)' }} />

        {/* GitHub 仓库链接 */}
        <Button
          variant="outline"
          size={starCount != null ? 'sm' : 'icon-sm'}
          asChild
          className="hover:bg-accent hover:text-accent-foreground hover:border-accent-foreground text-(--fg-secondary)"
        >
          <a
            href="https://github.com/showlotus/showcv"
            target="_blank"
            rel="noopener noreferrer"
            title="GitHub 仓库"
          >
            <Github className="h-4 w-4" />
            {starCount != null && (
              <>
                <Star className="h-3 w-3" />
                <span className="hidden md:inline text-xs">
                  {starCount >= 1000
                    ? `${(starCount / 1000).toFixed(1)}k`
                    : starCount}
                </span>
              </>
            )}
          </a>
        </Button>
      </div>
    </header>
  )
}
