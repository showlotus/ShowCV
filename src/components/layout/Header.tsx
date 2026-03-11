import { useState, useCallback, memo } from 'react'
import {
  FileDown,
  Settings,
  Download,
  Printer,
  Share2,
  Check,
  PanelLeft,
  FileText,
} from 'lucide-react'
import { useResumeStore, useToastStore } from '@/store'
import { TEMPLATE_LIST, THEME_LIST } from '@/utils/constants'
import { generateShareUrl } from '@/services'
import { cn } from '@/utils'

interface HeaderProps {
  onOpenSettings: () => void
  onExportPDF: () => void
  onExportJSON: () => void
  onPrintWithReactToPrint?: () => void
  onToggleSidebar: () => void
}

// 主题选择器
const ThemeSelector = memo(() => {
  const { theme, setTheme } = useResumeStore()

  return (
    <div
      className="hidden lg:flex items-center gap-2 ml-4 pl-4 border-l"
      style={{ borderColor: 'var(--border)' }}
    >
      {THEME_LIST.map((t) => (
        <button
          key={t.id}
          onClick={() => setTheme(t.id)}
          className={cn(
            'theme-option w-7 h-7 rounded-full border-2 cursor-pointer transition-all hover:scale-110',
            theme === t.id && 'active'
          )}
          style={{
            background: t.gradient,
            borderColor: theme === t.id ? 'var(--fg-primary)' : 'transparent',
            boxShadow: theme === t.id ? '0 0 0 2px var(--accent-soft)' : 'none',
          }}
          aria-label={t.name}
          title={t.name}
        />
      ))}
    </div>
  )
})

ThemeSelector.displayName = 'ThemeSelector'

// 模板选择器
const TemplateSelector = memo(() => {
  const { currentResume, setTemplate } = useResumeStore()
  const templateId = currentResume?.templateId || 'simple'

  return (
    <div className="flex items-center gap-1.5">
      {TEMPLATE_LIST.map((template) => (
        <button
          key={template.id}
          onClick={() => setTemplate(template.id)}
          className="rounded-lg px-3 py-1.5 text-sm font-medium transition-all"
          style={{
            background:
              templateId === template.id ? 'var(--accent)' : 'var(--bg-tertiary)',
            color: templateId === template.id ? '#000' : 'var(--fg-secondary)',
          }}
        >
          {template.name}
        </button>
      ))}
    </div>
  )
})

TemplateSelector.displayName = 'TemplateSelector'

export function Header({
  onOpenSettings,
  onExportPDF,
  onExportJSON,
  onPrintWithReactToPrint,
  onToggleSidebar,
}: HeaderProps) {
  const currentResume = useResumeStore((state) => state.currentResume)
  const { showToast } = useToastStore()
  const [copySuccess, setCopySuccess] = useState(false)

  const content = currentResume?.content || ''
  const settings = currentResume?.settings
  const templateId = currentResume?.templateId || 'simple'

  const handleShare = useCallback(async () => {
    if (!settings) {
      showToast('请先创建简历', 'error')
      return
    }
    const shareUrl = generateShareUrl(content, templateId, settings)
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopySuccess(true)
      showToast('链接已复制', 'success')
      setTimeout(() => setCopySuccess(false), 2000)
    } catch {
      showToast('复制失败', 'error')
    }
  }, [content, templateId, settings, showToast])

  return (
    <header
      className="flex items-center justify-between px-4 md:px-6 py-3 border-b"
      style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}
    >
      {/* 左侧 */}
      <div className="flex items-center gap-4">
        {/* 侧边栏切换 */}
        <button
          onClick={onToggleSidebar}
          className="w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:scale-105"
          style={{ background: 'var(--bg-tertiary)', color: 'var(--fg-primary)' }}
        >
          <PanelLeft className="w-5 h-5" />
        </button>

        {/* Logo */}
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--accent)' }}
          >
            <FileText className="w-5 h-5" style={{ color: '#000' }} />
          </div>
          <div className="hidden sm:block">
            <h1
              className="font-display text-lg font-bold"
              style={{ color: 'var(--fg-primary)' }}
            >
              ShowCV
            </h1>
          </div>
        </div>

        {/* 主题选择器 */}
        <ThemeSelector />
      </div>

      {/* 中间 - 模板选择 */}
      <TemplateSelector />

      {/* 右侧 - 操作按钮 */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* 配置 */}
        <button
          onClick={onOpenSettings}
          className="btn-ghost px-3 md:px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-all"
          style={{
            background: 'transparent',
            border: '1px solid var(--border)',
            color: 'var(--fg-secondary)',
          }}
        >
          <Settings className="w-4 h-4" />
          <span className="hidden md:inline">配置</span>
        </button>

        {/* 分享 */}
        <button
          onClick={handleShare}
          className="btn-ghost px-3 md:px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-all"
          style={{
            background: copySuccess ? 'var(--success-soft)' : 'transparent',
            border: `1px solid ${copySuccess ? 'var(--success)' : 'var(--border)'}`,
            color: copySuccess ? 'var(--success)' : 'var(--fg-secondary)',
          }}
        >
          {copySuccess ? (
            <>
              <Check className="w-4 h-4" />
              <span className="hidden md:inline">已复制</span>
            </>
          ) : (
            <>
              <Share2 className="w-4 h-4" />
              <span className="hidden md:inline">分享</span>
            </>
          )}
        </button>

        {/* 导出 JSON */}
        <button
          onClick={onExportJSON}
          className="hidden md:flex btn-ghost px-3 md:px-4 py-2 rounded-lg font-medium text-sm items-center gap-2 transition-all"
          style={{
            background: 'transparent',
            border: '1px solid var(--border)',
            color: 'var(--fg-secondary)',
          }}
        >
          <Download className="w-4 h-4" />
          <span>JSON</span>
        </button>

        {/* 打印 */}
        {onPrintWithReactToPrint && (
          <button
            onClick={onPrintWithReactToPrint}
            className="hidden md:flex btn-ghost px-3 md:px-4 py-2 rounded-lg font-medium text-sm items-center gap-2 transition-all"
            style={{
              background: 'var(--success-soft)',
              border: '1px solid var(--success)',
              color: 'var(--success)',
            }}
          >
            <Printer className="w-4 h-4" />
            <span>打印</span>
          </button>
        )}

        {/* 导出 PDF */}
        <button
          onClick={onExportPDF}
          className="btn-primary px-4 md:px-5 py-2 rounded-lg text-sm flex items-center gap-2 transition-all"
          style={{ background: 'var(--accent)', color: '#000' }}
        >
          <FileDown className="w-4 h-4" />
          <span>导出</span>
        </button>
      </div>

      <style>{`
        .btn-ghost:hover {
          background: var(--accent-soft);
          border-color: var(--accent);
          color: var(--accent);
        }
        .btn-primary:hover {
          filter: brightness(1.1);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px var(--glow);
        }
        .btn-primary:active {
          transform: translateY(0);
        }
      `}</style>
    </header>
  )
}
