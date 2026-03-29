import { useRef, useEffect, useState, memo } from 'react'
import { RotateCcw, AlignLeft, AlignCenter, AlignRight } from 'lucide-react'
import { toast } from 'sonner'
import { useResumeStore } from '@/store'
import { useShallow } from 'zustand/react/shallow'
import { PRESET_COLORS, FONT_PRESETS } from '@/utils/constants'
import { TEMPLATE_IDS } from '@/templates'
import { Slider, ColorPicker } from '../common'
import { AvatarUpload } from './AvatarUpload'
import { ResumePreview } from '../preview'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverAnchor } from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import type { TemplateId, ResumeSettings } from '@/types'

/** 面板展开宽度 */
export const SETTINGS_PANEL_WIDTH = 300

/** 大图预览的固定宽度（px） */
const PREVIEW_POPUP_WIDTH = 320

/**
 * 模板缩略图卡片 - 用真实模板组件 + CSS scale 实现缩略图
 * 鼠标悬浮时在左侧弹出气泡展示大图预览
 */
const TemplateCard = memo(
  ({
    templateId,
    name,
    content,
    settings,
    isActive,
    onSelect,
  }: {
    templateId: TemplateId
    name: string
    content: string
    settings: ResumeSettings
    isActive: boolean
    onSelect: () => void
  }) => {
    const containerRef = useRef<HTMLDivElement>(null)
    // null 表示尚未计算，避免初始值错误导致首帧闪动
    const [scale, setScale] = useState<number | null>(null)
    const [isHovered, setIsHovered] = useState(false)
    // 懒挂载：首次悬浮后保持挂载，避免关闭动画被卸载打断
    const [isMounted, setIsMounted] = useState(false)

    // 动态计算缩放比例，使缩略图宽度撑满卡片容器
    useEffect(() => {
      const el = containerRef.current
      if (!el) return
      const observer = new ResizeObserver(() => {
        setScale(el.offsetWidth / 794)
      })
      observer.observe(el)
      return () => observer.disconnect()
    }, [])

    return (
      <Popover open={isHovered}>
        <div
          onClick={onSelect}
          onMouseEnter={() => {
            setIsHovered(true)
            setIsMounted(true)
          }}
          onMouseLeave={() => setIsHovered(false)}
          className="relative w-full cursor-pointer overflow-hidden rounded-lg text-left transition-all"
          style={{
            border: `1px solid ${isActive || isHovered ? 'var(--accent)' : 'var(--border)'}`,
            background: 'var(--bg-tertiary)',
          }}
        >
          <PopoverAnchor asChild>
            {/* 缩略图区域，A4 比例 1:1.414 */}
            <div
              ref={containerRef}
              className="w-full overflow-hidden bg-white"
              style={{ aspectRatio: '1 / 1.414' }}
            >
              {scale !== null && (
                <div
                  style={{
                    width: '794px',
                    transformOrigin: 'top left',
                    transform: `scale(${scale})`,
                    pointerEvents: 'none',
                    userSelect: 'none',
                  }}
                >
                  <ResumePreview templateId={templateId} content={content} settings={settings} />
                </div>
              )}
            </div>
          </PopoverAnchor>

          {/* 模板名 */}
          <div
            className="flex items-center gap-1.5 px-2 py-1.5"
            style={{
              color: isActive ? 'var(--accent)' : 'var(--fg-secondary)',
              background: isActive ? 'var(--accent-soft)' : undefined,
            }}
          >
            {/* 左侧装饰线 */}
            <div
              className="h-[2px] flex-1 rounded-full transition-all"
              style={{ background: isActive ? 'var(--accent)' : 'transparent' }}
            />
            <span className="shrink-0 text-center text-xs font-medium">{name}</span>
            {/* 右侧装饰线 */}
            <div
              className="h-[2px] flex-1 rounded-full transition-all"
              style={{ background: isActive ? 'var(--accent)' : 'transparent' }}
            />
          </div>
        </div>

        {/* 大图预览气泡，挂载到 body，悬浮时懒渲染 */}
        <PopoverContent
          side="left"
          align="start"
          sideOffset={8}
          alignOffset={-1}
          className="overflow-hidden p-0"
          style={{ width: `${PREVIEW_POPUP_WIDTH}px` }}
          onOpenAutoFocus={e => e.preventDefault()}
        >
          {isMounted && (
            <div className="overflow-hidden bg-white" style={{ aspectRatio: '1 / 1.414' }}>
              <div
                style={{
                  width: '794px',
                  transformOrigin: 'top left',
                  transform: `scale(${PREVIEW_POPUP_WIDTH / 794})`,
                  pointerEvents: 'none',
                  userSelect: 'none',
                }}
              >
                <ResumePreview templateId={templateId} content={content} settings={settings} />
              </div>
            </div>
          )}
        </PopoverContent>
      </Popover>
    )
  }
)

TemplateCard.displayName = 'TemplateCard'

/** 设置分区标题，左侧带 accent 竖线装饰 */
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <div className="h-3.5 w-[3px] rounded-full" style={{ background: 'var(--accent)' }} />
      <span className="text-sm font-semibold" style={{ color: 'var(--fg-primary)' }}>
        {children}
      </span>
    </div>
  )
}

/** 设置分区卡片容器，统一背景和圆角 */
function SectionCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn('rounded-lg border p-3', className)}
      style={{
        borderColor: 'var(--border)',
        background: 'color-mix(in srgb, var(--bg-tertiary) 50%, transparent)',
      }}
    >
      {children}
    </div>
  )
}

/** 带标签和当前值的 Slider 行，滑块两侧带步进按钮 */
function SliderRow({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step?: number
  unit?: string
  onChange: (v: number) => void
}) {
  const stepBy = (dir: -1 | 1) => {
    const s = step ?? 1
    const next = Math.min(max, Math.max(min, value + dir * s))
    onChange(next)
  }

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium" style={{ color: 'var(--fg-secondary)' }}>
          {label}
        </span>
        <span className="text-xs font-medium tabular-nums" style={{ color: 'var(--fg-primary)' }}>
          {value}
          {unit ?? 'px'}
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          tabIndex={-1}
          onClick={() => stepBy(-1)}
          disabled={value <= min}
          className="hover:bg-accent hover:text-accent-foreground flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded-full text-xs text-(--fg-secondary) transition-[color,background-color] disabled:cursor-default disabled:opacity-30"
        >
          −
        </button>
        <Slider
          label=""
          value={value}
          min={min}
          max={max}
          step={step}
          unit={undefined}
          onChange={onChange}
          className="translate-y-px"
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => stepBy(1)}
          disabled={value >= max}
          className="hover:bg-accent hover:text-accent-foreground flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded-full text-xs text-(--fg-secondary) transition-[color,background-color] disabled:cursor-default disabled:opacity-30"
        >
          +
        </button>
      </div>
    </div>
  )
}

export function SettingsPanel({ open }: { open: boolean }) {
  const {
    settings,
    templateId,
    previewContent,
    updateFontSettings,
    updateColorSettings,
    updateSpacingSettings,
    updateLayoutSettings,
    updateAvatarSettings,
    removeAvatar,
    resetSettings,
    setTemplate,
  } = useResumeStore(
    useShallow(state => ({
      settings: state.currentResume?.settings,
      templateId: state.currentResume?.templateId ?? 'simple',
      previewContent: state.currentResume?.content ?? '',
      updateFontSettings: state.updateFontSettings,
      updateColorSettings: state.updateColorSettings,
      updateSpacingSettings: state.updateSpacingSettings,
      updateLayoutSettings: state.updateLayoutSettings,
      updateAvatarSettings: state.updateAvatarSettings,
      removeAvatar: state.removeAvatar,
      resetSettings: state.resetSettings,
      setTemplate: state.setTemplate,
    }))
  )

  if (!settings) return null

  const handleReset = () => {
    resetSettings()
    toast.success('配置已重置')
  }

  return (
    <aside
      className="hidden w-[300px] shrink-0 flex-col overflow-hidden transition-all duration-300 xl:flex"
      style={{
        width: open ? undefined : '0px',
        borderLeft: open ? '1px solid var(--border)' : 'none',
        background: 'var(--bg-secondary)',
      }}
    >
      <Tabs defaultValue="settings" className="flex w-[300px] flex-1 flex-col overflow-hidden">
        {/* 标题栏 */}
        <div
          className="flex h-[44px] shrink-0 items-center border-b px-1"
          style={{ borderColor: 'var(--border)' }}
        >
          <TabsList variant="line">
            <TabsTrigger value="settings" className="after:hidden">
              配置
            </TabsTrigger>
            <TabsTrigger value="template" className="after:hidden">
              模板
            </TabsTrigger>
          </TabsList>
        </div>

        {/* 模板 Tab */}
        <TabsContent value="template" className="mt-0 flex-1 overflow-y-auto p-3">
          <div className="grid grid-cols-2 gap-2">
            {TEMPLATE_IDS.map((id: TemplateId) => (
              <TemplateCard
                key={id}
                templateId={id}
                name={id}
                content={previewContent}
                settings={settings}
                isActive={templateId === id}
                onSelect={() => setTemplate(id)}
              />
            ))}
          </div>
        </TabsContent>

        {/* 配置 Tab */}
        <TabsContent value="settings" className="mt-0 flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 space-y-2 overflow-y-auto p-3">
            {/* 头像设置 */}
            <SectionCard>
              <SectionTitle>头像</SectionTitle>
              <AvatarUpload
                avatar={settings.avatar}
                onUpdateAvatar={updateAvatarSettings}
                onRemoveAvatar={removeAvatar}
              />
            </SectionCard>

            {/* 头部布局 */}
            <SectionCard>
              <SectionTitle>头部布局</SectionTitle>
              <ToggleGroup
                type="single"
                value={settings.layout.headerAlign}
                onValueChange={v => {
                  if (v) updateLayoutSettings({ headerAlign: v as 'left' | 'center' | 'right' })
                }}
                variant="outline"
                size="sm"
                className="w-full"
              >
                <ToggleGroupItem value="left" className="flex-1">
                  <AlignLeft className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="center" className="flex-1">
                  <AlignCenter className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="right" className="flex-1">
                  <AlignRight className="h-4 w-4" />
                </ToggleGroupItem>
              </ToggleGroup>
            </SectionCard>

            {/* 颜色设置 */}
            <SectionCard>
              <SectionTitle>主题色</SectionTitle>
              <ColorPicker
                label=""
                value={settings.color.primary}
                presetColors={PRESET_COLORS}
                onChange={v => updateColorSettings({ primary: v })}
                tooltip="如需打印，建议选择较深主题色"
              />
            </SectionCard>

            {/* 字体设置 */}
            <SectionCard>
              <SectionTitle>字体</SectionTitle>
              <div className="space-y-3">
                <Select
                  value={settings.font.fontFamily}
                  onValueChange={v => updateFontSettings({ fontFamily: v })}
                >
                  <SelectTrigger
                    className="border-border hover:bg-accent hover:text-accent-foreground hover:border-accent-foreground focus-visible:border-border h-8 w-full text-sm transition-[color,background-color,border-color,box-shadow] focus-visible:ring-0 focus-visible:outline-none"
                    style={{ background: 'var(--bg-secondary)' }}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper" sideOffset={4}>
                    {FONT_PRESETS.map(font => (
                      <SelectItem
                        key={font.id}
                        value={font.value}
                        style={{ fontFamily: font.value }}
                      >
                        {font.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <hr style={{ borderColor: 'var(--border)' }} />

                <div className="space-y-3 pt-1">
                  <SliderRow
                    label="一级标题字号"
                    value={settings.font.h1TitleSize}
                    min={20}
                    max={36}
                    onChange={v => updateFontSettings({ h1TitleSize: v })}
                  />
                  <hr style={{ borderColor: 'var(--border)' }} />
                  <SliderRow
                    label="二级标题字号"
                    value={settings.font.h2TitleSize}
                    min={14}
                    max={24}
                    onChange={v => updateFontSettings({ h2TitleSize: v })}
                  />
                  <hr style={{ borderColor: 'var(--border)' }} />
                  <SliderRow
                    label="三级标题字号"
                    value={settings.font.h3TitleSize}
                    min={10}
                    max={20}
                    onChange={v => updateFontSettings({ h3TitleSize: v })}
                  />
                  <hr style={{ borderColor: 'var(--border)' }} />
                  <SliderRow
                    label="正文字号"
                    value={settings.font.bodySize}
                    min={10}
                    max={18}
                    onChange={v => updateFontSettings({ bodySize: v })}
                  />
                  <hr style={{ borderColor: 'var(--border)' }} />
                  <SliderRow
                    label="行高"
                    value={settings.font.lineHeight}
                    min={12}
                    max={28}
                    onChange={v => updateFontSettings({ lineHeight: v })}
                  />
                </div>
              </div>
            </SectionCard>

            {/* 边距设置 */}
            <SectionCard>
              <SectionTitle>边距</SectionTitle>
              <div className="space-y-3">
                <SliderRow
                  label="页边距"
                  value={settings.spacing.padding}
                  min={20}
                  max={60}
                  onChange={v => updateSpacingSettings({ padding: v })}
                />
                <hr style={{ borderColor: 'var(--border)' }} />
                <SliderRow
                  label="二级标题上边距"
                  value={settings.spacing.h2TitleTopGap}
                  min={0}
                  max={40}
                  onChange={v => updateSpacingSettings({ h2TitleTopGap: v })}
                />
                <hr style={{ borderColor: 'var(--border)' }} />
                <SliderRow
                  label="二级标题下边距"
                  value={settings.spacing.h2TitleBottomGap}
                  min={0}
                  max={40}
                  onChange={v => updateSpacingSettings({ h2TitleBottomGap: v })}
                />
                <hr style={{ borderColor: 'var(--border)' }} />
                <SliderRow
                  label="三级标题上边距"
                  value={settings.spacing.h3TitleTopGap}
                  min={0}
                  max={24}
                  onChange={v => updateSpacingSettings({ h3TitleTopGap: v })}
                />
                <hr style={{ borderColor: 'var(--border)' }} />
                <SliderRow
                  label="三级标题下边距"
                  value={settings.spacing.h3TitleBottomGap}
                  min={0}
                  max={24}
                  onChange={v => updateSpacingSettings({ h3TitleBottomGap: v })}
                />
              </div>
            </SectionCard>
          </div>

          {/* 底部重置按钮 */}
          <div className="shrink-0 border-t p-3" style={{ borderColor: 'var(--border)' }}>
            <Button
              variant="outline"
              className="border-border hover:bg-accent hover:text-accent-foreground hover:border-accent-foreground w-full gap-2 text-(--fg-secondary)"
              onClick={handleReset}
            >
              <RotateCcw className="h-4 w-4" />
              重置配置
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </aside>
  )
}
