import { useCallback } from 'react'
import { toast } from 'sonner'
import { useResumeStore } from '@/store'

/** 撤销按钮的存活时间，全局 Toaster 的 2s 对撤销太短 */
const UNDO_DURATION = 8000

/** description 里最多列几个简历名，超出折叠为「等 N 份」 */
const MAX_LISTED_NAMES = 3

/**
 * 拼接被删简历的名称，用于 toast 的 description
 * @param names 被删简历名称，按列表顺序
 */
function describeNames(names: string[]): string {
  if (names.length <= MAX_LISTED_NAMES) return names.join('、')
  return `${names.slice(0, MAX_LISTED_NAMES).join('、')} 等 ${names.length} 份`
}

/**
 * 批量删除简历并给出撤销机会
 *
 * 侧边栏勾选模式与 /delete 直链共用，保证两处的提示文案和撤销行为一致。
 * 快照只存在内存里，刷新页面后无法再撤销。
 */
export function useBatchDelete() {
  const deleteWithUndo = useCallback((ids: string[]): number => {
    if (ids.length === 0) {
      toast.warning('请至少选择一份简历')
      return 0
    }

    const { resumes, deleteResumes, restoreResumes } = useResumeStore.getState()
    // 按列表顺序取名字，而非勾选顺序
    const names = resumes.filter(resume => ids.includes(resume.id)).map(resume => resume.name)
    const snapshot = deleteResumes(ids)

    if (snapshot.deleted.length === 0) {
      toast.error('未找到要删除的简历')
      return 0
    }

    const emptied = snapshot.placeholderId !== null
    const description = emptied
      ? `${describeNames(names)}，已自动新建一份空白简历`
      : describeNames(names)

    toast.success(`已删除 ${snapshot.deleted.length} 份简历`, {
      description,
      duration: UNDO_DURATION,
      action: {
        label: '撤销',
        onClick: () => {
          restoreResumes(snapshot)
          toast.success('已恢复')
        },
      },
    })

    return snapshot.deleted.length
  }, [])

  return { deleteWithUndo }
}
