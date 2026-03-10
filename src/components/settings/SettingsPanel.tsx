import { X, RotateCcw } from 'lucide-react'
import { useResumeStore } from '@/store'
import { PRESET_COLORS, FONT_PRESETS } from '@/utils/constants'
import { Slider, ColorPicker } from '../common'

interface SettingsPanelProps {
  isOpen: boolean
  onClose: () => void
}

export function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const {
    settings,
    updateFontSettings,
    updateColorSettings,
    updateSpacingSettings,
    resetSettings,
  } = useResumeStore()

  if (!isOpen) return null

  return (
    <>
      {/* 遮罩层 */}
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />

      {/* 侧边栏 */}
      <aside className="fixed top-0 right-0 z-50 h-full w-80 overflow-y-auto bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 p-4">
          <h2 className="text-lg font-semibold">样式设置</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={resetSettings}
              className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
              title="重置设置"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="space-y-6 p-4">
          {/* 字体设置 */}
          <section>
            <h3 className="mb-4 border-b border-gray-100 pb-2 font-medium text-gray-800">
              字体设置
            </h3>
            <div className="space-y-4">
              {/* 字体选择 */}
              <div className="space-y-2">
                <label className="text-sm text-gray-600">字体</label>
                <div className="flex gap-2">
                  {FONT_PRESETS.map(font => (
                    <button
                      key={font.id}
                      onClick={() => updateFontSettings({ fontFamily: font.value })}
                      className={`flex-1 rounded-lg border px-3 py-2 text-sm transition-colors ${
                        settings.font.fontFamily === font.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                      style={{ fontFamily: font.value }}
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
                onChange={v => updateFontSettings({ titleSize: v })}
              />
              <Slider
                label="二级标题字号"
                value={settings.font.headingSize}
                min={14}
                max={24}
                onChange={v => updateFontSettings({ headingSize: v })}
              />
              <Slider
                label="正文字号"
                value={settings.font.bodySize}
                min={12}
                max={18}
                onChange={v => updateFontSettings({ bodySize: v })}
              />
              <Slider
                label="行高"
                value={settings.font.lineHeight}
                min={1.2}
                max={2.0}
                step={0.1}
                unit=""
                onChange={v => updateFontSettings({ lineHeight: v })}
              />
            </div>
          </section>

          {/* 颜色设置 */}
          <section>
            <h3 className="mb-4 border-b border-gray-100 pb-2 font-medium text-gray-800">
              颜色设置
            </h3>
            <div className="space-y-4">
              <ColorPicker
                label="主题色"
                value={settings.color.primary}
                presetColors={PRESET_COLORS}
                onChange={v => updateColorSettings({ primary: v })}
              />
              <ColorPicker
                label="文字颜色"
                value={settings.color.text}
                onChange={v => updateColorSettings({ text: v })}
              />
            </div>
          </section>

          {/* 间距设置 */}
          <section>
            <h3 className="mb-4 border-b border-gray-100 pb-2 font-medium text-gray-800">
              间距设置
            </h3>
            <div className="space-y-4">
              <Slider
                label="区块间距"
                value={settings.spacing.sectionGap}
                min={16}
                max={40}
                onChange={v => updateSpacingSettings({ sectionGap: v })}
              />
              <Slider
                label="段落间距"
                value={settings.spacing.paragraphGap}
                min={8}
                max={20}
                onChange={v => updateSpacingSettings({ paragraphGap: v })}
              />
              <Slider
                label="内边距"
                value={settings.spacing.padding}
                min={20}
                max={60}
                onChange={v => updateSpacingSettings({ padding: v })}
              />
            </div>
          </section>
        </div>
      </aside>
    </>
  )
}
