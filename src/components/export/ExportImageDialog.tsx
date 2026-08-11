import { useState, useCallback, memo } from 'react'
import { Check, Link2, Loader2, ImageDown } from 'lucide-react'
import { toast } from 'sonner'
import { useResumeStore } from '@/store'
import { useShallow } from 'zustand/react/shallow'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Badge } from '@/components/ui/badge'
import { buildExportUrl, exportResumeImages, type ExportPageMode } from '@/services'

interface ExportImageDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const SCALE_OPTIONS = [1, 2, 3]

/** 单行简历选择项 */
const ResumeRow = memo(
  ({
    name,
    checked,
    isCurrent,
    disabled,
    onToggle,
  }: {
    name: string
    checked: boolean
    isCurrent: boolean
    disabled: boolean
    onToggle: () => void
  }) => (
    <button
      type="button"
      disabled={disabled}
      onClick={onToggle}
      className="flex w-full cursor-pointer items-center gap-2.5 rounded-md border px-3 py-2 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60"
      style={{
        borderColor: checked ? 'var(--accent)' : 'var(--border)',
        background: checked ? 'var(--accent-soft)' : 'transparent',
      }}
    >
      <span
        className="flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border"
        style={{
          borderColor: checked ? 'var(--accent)' : 'var(--border)',
          background: checked ? 'var(--accent)' : 'transparent',
        }}
      >
        {checked && <Check className="h-3 w-3" style={{ color: 'var(--bg-primary)' }} />}
      </span>
      <span className="min-w-0 flex-1 truncate text-sm" style={{ color: 'var(--fg-primary)' }}>
        {name}
      </span>
      {isCurrent && (
        <Badge
          className="shrink-0 rounded-sm border-0 px-1.5 py-0 text-[12px] leading-4"
          style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
        >
          当前
        </Badge>
      )}
    </button>
  )
)

ResumeRow.displayName = 'ResumeRow'

/**
 * 导出表单，仅在对话框打开时挂载，因此每次打开都会重置为默认选项
 */
function ExportImageForm({
  exporting,
  setExporting,
  onClose,
}: {
  exporting: boolean
  setExporting: (value: boolean) => void
  onClose: () => void
}) {
  const { resumes, currentResumeId } = useResumeStore(
    useShallow(state => ({
      resumes: state.resumes,
      currentResumeId: state.currentResumeId,
    }))
  )

  const [selectedIds, setSelectedIds] = useState<string[]>(() =>
    currentResumeId ? [currentResumeId] : []
  )
  const [mode, setMode] = useState<ExportPageMode>('paginated')
  const [scale, setScale] = useState(2)
  const [progress, setProgress] = useState({ done: 0, total: 0 })

  const allSelected = selectedIds.length === resumes.length

  const toggleId = useCallback((id: string) => {
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]))
  }, [])

  const toggleAll = useCallback(() => {
    setSelectedIds(prev => (prev.length === resumes.length ? [] : resumes.map(r => r.id)))
  }, [resumes])

  const handleExport = useCallback(async () => {
    // 保持侧边栏顺序导出，而非勾选顺序
    const targets = resumes.filter(r => selectedIds.includes(r.id))
    if (targets.length === 0) {
      toast.warning('请至少选择一份简历')
      return
    }

    setExporting(true)
    setProgress({ done: 0, total: targets.length })
    try {
      const result = await exportResumeImages(targets, {
        mode,
        scale,
        onProgress: (done, total) => setProgress({ done, total }),
      })
      toast.success(
        result.fileCount > 1
          ? `已导出 ${result.fileCount} 张图片（${result.fileName}）`
          : `已导出 ${result.fileName}`
      )
      onClose()
    } catch (error) {
      console.error('[ExportImage Error]', error)
      toast.error(error instanceof Error ? error.message : '导出失败')
    } finally {
      setExporting(false)
    }
  }, [resumes, selectedIds, mode, scale, setExporting, onClose])

  const handleCopyLink = useCallback(async () => {
    if (selectedIds.length === 0) {
      toast.warning('请至少选择一份简历')
      return
    }
    const url = buildExportUrl(window.location.origin, { ids: selectedIds, mode, scale })
    try {
      await navigator.clipboard.writeText(url)
      toast.success('直链已复制', { description: '简历存在本机浏览器，链接分享给别人打不开' })
    } catch (error) {
      console.error('[CopyExportUrl Error]', error)
      toast.error('复制失败，请手动复制地址栏链接')
    }
  }, [selectedIds, mode, scale])

  return (
    <>
      <DialogHeader>
        <DialogTitle>导出图片</DialogTitle>
        <DialogDescription>
          {mode === 'paginated'
            ? '按 A4 分页，每页导出一张 PNG；多张图片会打包为 zip'
            : '整份简历导出为一张长图；多张图片会打包为 zip'}
        </DialogDescription>
      </DialogHeader>

      {/* 简历选择 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium" style={{ color: 'var(--fg-primary)' }}>
            选择简历
          </span>
          <button
            type="button"
            disabled={exporting}
            onClick={toggleAll}
            className="cursor-pointer text-xs transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
            style={{ color: 'var(--accent)' }}
          >
            {allSelected ? '取消全选' : `全选（${resumes.length}）`}
          </button>
        </div>
        <div className="max-h-56 space-y-1.5 overflow-y-auto pr-0.5">
          {resumes.map(resume => (
            <ResumeRow
              key={resume.id}
              name={resume.name}
              checked={selectedIds.includes(resume.id)}
              isCurrent={resume.id === currentResumeId}
              disabled={exporting}
              onToggle={() => toggleId(resume.id)}
            />
          ))}
        </div>
      </div>

      {/* 页面形式 + 清晰度 */}
      <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
        <div className="space-y-2">
          <span className="block text-sm font-medium" style={{ color: 'var(--fg-primary)' }}>
            页面形式
          </span>
          <ToggleGroup
            type="single"
            value={mode}
            onValueChange={v => v && setMode(v as ExportPageMode)}
            variant="outline"
            size="sm"
            disabled={exporting}
          >
            <ToggleGroupItem value="paginated" title="按 A4 纸分页，每页一张">
              分页
            </ToggleGroupItem>
            <ToggleGroupItem value="flat" title="整份简历一张长图">
              长图
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        <div className="space-y-2">
          <span className="block text-sm font-medium" style={{ color: 'var(--fg-primary)' }}>
            清晰度
          </span>
          <ToggleGroup
            type="single"
            value={String(scale)}
            onValueChange={v => v && setScale(Number(v))}
            variant="outline"
            size="sm"
            disabled={exporting}
          >
            {SCALE_OPTIONS.map(option => (
              <ToggleGroupItem key={option} value={String(option)}>
                {option}x
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      </div>

      <DialogFooter>
        <Button
          variant="ghost"
          size="sm"
          className="sm:mr-auto"
          disabled={exporting || selectedIds.length === 0}
          onClick={handleCopyLink}
          title="复制打开即下载的直链，仅本机浏览器可用"
        >
          <Link2 className="h-4 w-4" />
          复制直链
        </Button>
        <Button variant="outline" disabled={exporting} onClick={onClose}>
          取消
        </Button>
        <Button onClick={handleExport} disabled={exporting || selectedIds.length === 0}>
          {exporting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {`导出中 ${progress.done}/${progress.total}`}
            </>
          ) : (
            <>
              <ImageDown className="h-4 w-4" />
              {`导出（${selectedIds.length}）`}
            </>
          )}
        </Button>
      </DialogFooter>
    </>
  )
}

export function ExportImageDialog({ open, onOpenChange }: ExportImageDialogProps) {
  const [exporting, setExporting] = useState(false)

  return (
    <Dialog
      open={open}
      // 导出过程中禁止关闭，避免表单被卸载后进度丢失
      onOpenChange={next => !exporting && onOpenChange(next)}
    >
      <DialogContent className="sm:max-w-md" showCloseButton={!exporting}>
        {/* 内容随对话框开关挂载卸载，选项每次打开都回到默认值 */}
        <ExportImageForm
          exporting={exporting}
          setExporting={setExporting}
          onClose={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
