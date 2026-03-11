import { X, RotateCcw } from 'lucide-react'
import { useResumeStore, useToastStore } from '@/store'
import { PRESET_COLORS, FONT_PRESETS } from '@/utils/constants'
import { Slider } from '../common'

interface SettingsPanelProps {
  isOpen: boolean
  onClose: () => void
}

export function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const { currentResume, updateFontSettings, updateColorSettings, updateSpacingSettings, resetSettings } =
    useResumeStore()
  const { showToast } = useToastStore()

  const settings = currentResume?.settings

  if (!settings) return null

  const handleReset = () => {
    resetSettings()
    showToast('设置已重置', 'success')
  }

  return (
    <>
      {/* 遮罩层 */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 transition-opacity"
          style={{ opacity: isOpen ? 1 : 0 }}
          onClick={onClose}
        />
      )}

      {/* 侧边栏 */}
      <aside
        className="fixed top-0 right-0 z-50 h-full w-72 overflow-y-auto transition-transform duration-300"
        style={{
          background: 'var(--bg-secondary)',
          borderLeft: '1px solid var(--border)',
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
        }}
      >
        {/* 标题栏 */}
        <div
          className="flex items-center justify-between border-b p-4"
          style={{ borderColor: 'var(--border)' }}
        >
          <h2
            className="font-display font-semibold text-sm"
            style={{ color: 'var(--fg-primary)' }}
          >
            简历配置
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
              style={{ background: 'var(--bg-tertiary)' }}
              title="重置设置"
            >
              <RotateCcw className="h-4 w-4" style={{ color: 'var(--fg-muted)' }} />
            </button>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
              style={{ background: 'var(--bg-tertiary)' }}
            >
              <X className="h-4 w-4" style={{ color: 'var(--fg-muted)' }} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-5">
          {/* 字体设置 */}
          <div className="space-y-3">
            <h3
              className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: 'var(--fg-muted)' }}
            >
              字体设置
            </h3>
            <div>
              <label className="text-xs mb-1 block" style={{ color: 'var(--fg-muted)' }}>
                正文字体
              </label>
              <div className="flex gap-2">
                {FONT_PRESETS.map((font) => (
                  <button
                    key={font.id}
                    onClick={() => updateFontSettings({ fontFamily: font.value })}
                    className="flex-1 rounded-lg border px-2 py-1.5 text-xs transition-all"
                    style={{
                      fontFamily: font.value,
                      borderColor:
                        settings.font.fontFamily === font.value
                          ? 'var(--accent)'
                          : 'var(--border)',
                      background:
                        settings.font.fontFamily === font.value
                          ? 'var(--accent-soft)'
                          : 'var(--bg-tertiary)',
                      color:
                        settings.font.fontFamily === font.value
                          ? 'var(--accent)'
                          : 'var(--fg-secondary)',
                    }}
                  >
                    {font.name}
                  </button>
                ))}
              </div>
            </div>
            <Slider
              label="标题字号"
              value={settings.font.titleSize}
              min={20}
              max={36}
              onChange={(v) => updateFontSettings({ titleSize: v })}
            />
            <Slider
              label="二级标题字号"
              value={settings.font.headingSize}
              min={14}
              max={24}
              onChange={(v) => updateFontSettings({ headingSize: v })}
            />
            <Slider
              label="正文字号"
              value={settings.font.bodySize}
              min={12}
              max={18}
              onChange={(v) => updateFontSettings({ bodySize: v })}
            />
            <Slider
              label="行高"
              value={settings.font.lineHeight}
              min={1.2}
              max={2.0}
              step={0.1}
              unit=""
              onChange={(v) => updateFontSettings({ lineHeight: v })}
            />
          </div>

          {/* 颜色设置 */}
          <div className="space-y-3">
            <h3
              className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: 'var(--fg-muted)' }}
            >
              颜色设置
            </h3>
            <div>
              <label className="text-xs mb-2 block" style={{ color: 'var(--fg-muted)' }}>
                主题色
              </label>
              <div className="flex gap-2 flex-wrap mb-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => updateColorSettings({ primary: color.value })}
                    className="w-7 h-7 rounded-lg border-2 border-transparent hover:border-white/50 transition-all"
                    style={{
                      background: color.value,
                      borderColor:
                        settings.color.primary === color.value
                          ? 'var(--fg-primary)'
                          : 'transparent',
                      boxShadow:
                        settings.color.primary === color.value
                          ? '0 0 0 2px var(--accent-soft)'
                          : 'none',
                    }}
                    title={color.name}
                  />
                ))}
              </div>
              <input
                type="color"
                value={settings.color.primary}
                onChange={(e) => updateColorSettings({ primary: e.target.value })}
                className="w-full h-9 rounded-lg cursor-pointer"
                style={{ background: 'var(--bg-tertiary)' }}
              />
            </div>
          </div>

          {/* 间距设置 */}
          <div className="space-y-3">
            <h3
              className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: 'var(--fg-muted)' }}
            >
              间距设置
            </h3>
            <Slider
              label="区块间距"
              value={settings.spacing.sectionGap}
              min={16}
              max={40}
              onChange={(v) => updateSpacingSettings({ sectionGap: v })}
            />
            <Slider
              label="段落间距"
              value={settings.spacing.paragraphGap}
              min={8}
              max={20}
              onChange={(v) => updateSpacingSettings({ paragraphGap: v })}
            />
            <Slider
              label="内边距"
              value={settings.spacing.padding}
              min={20}
              max={60}
              onChange={(v) => updateSpacingSettings({ padding: v })}
            />
          </div>
        </div>
      </aside>
    </>
  )
}
