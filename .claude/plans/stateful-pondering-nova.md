# AI 优化弹窗 - 上下键导航优化

## Context

当前 `AIOptimizeDialog` 的上下键导航存在两个体验问题：
1. **输入框内按键误触发**：`onKeyDown` 挂在 `DialogContent` 上，当用户在 Textarea（优化指令 / 版本编辑）或 ToggleGroup 中按上下键时，也会触发行切换
2. **生成结果丢失**：切换行时 `useEffect` 直接清空所有状态，已生成的 3 个版本瞬间消失

## 修改文件

`src/components/editor/AIOptimizeDialog.tsx`

## 方案

### 问题 1：输入框内按键误触发

在 `handleKeyDown` 中增加焦点判断，当活跃元素是可交互控件时不触发导航：

```ts
const handleKeyDown = useCallback(
  (e: React.KeyboardEvent) => {
    const tag = (e.target as HTMLElement).tagName
    const isEditable = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
    const isContentEditable = (e.target as HTMLElement).isContentEditable
    if (isEditable || isContentEditable) return

    if (e.key === 'ArrowUp') {
      e.preventDefault()
      onNavigateLine('up')
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      onNavigateLine('down')
    }
  },
  [onNavigateLine]
)
```

### 问题 2：缓存生成结果

采用**缓存方案**而非提示方案，理由：
- 提示方案打断用户操作节奏，且用户可能频繁上下切换
- 缓存方案零打扰，切换回来结果还在，体验更自然

**实现思路**：用 `useRef` 维护一个 `Map<number, CachedResult>`，以 `lineNumber` 为 key 缓存每行的生成结果。`lineNumber` 已作为 prop 传入弹窗。

#### 新增缓存类型和 ref

```ts
interface CachedResult {
  streamingText: string
  editedVersions: Record<number, string>
  appliedIndex: number | null
}

const cacheRef = useRef<Map<number, CachedResult>>(new Map())
```

#### 修改 `useEffect`（行 78-86）

当 `selectedText` 变化时（行切换），通过 `lineNumber` 保存和恢复缓存：

```ts
useEffect(() => {
  // abort 当前请求
  abortRef.current?.abort()
  abortRef.current = null
  setStreaming(false)

  // 尝试恢复缓存（lineNumber 为 key）
  const cached = lineNumber != null ? cacheRef.current.get(lineNumber) : undefined
  if (cached) {
    setStreamingText(cached.streamingText)
    setAppliedIndex(cached.appliedIndex)
    setEditedVersions(cached.editedVersions)
  } else {
    setStreamingText('')
    setAppliedIndex(null)
    setEditedVersions({})
  }
}, [selectedText]) // selectedText 变化意味着行切换
```

#### 在 `handleApply` 中移除缓存

应用版本成功后，从缓存中移除该行（已应用到编辑器，无需保留）：

```ts
if (lineNumber != null) cacheRef.current.delete(lineNumber)
```

#### 关闭弹窗时清空所有缓存

在 `handleClose` 中添加 `cacheRef.current.clear()`。

> **未来浮窗化**：关闭弹窗时不再 `clear()`，浮窗组件持续挂载，`useRef` 缓存自动持久化，迁移时只需去掉 `clear()` 调用。

### 边界情况

- **行号精确映射**：用 `lineNumber` 比 `selectedText` 更精确，避免不同位置相同文本的冲突
- **编辑过版本后切换**：`editedVersions` 一并缓存，切回来时恢复用户编辑
- **缓存容量**：弹窗关闭时全部清空，不会无限增长
- **streaming 中切换**：abort 后不缓存未完成的 streamingText
- **浮窗化注意**：浮窗模式下用户可能在编辑器中增删行导致行号偏移，但这是浮窗功能本身的挑战，当前阶段不处理（YAGNI）

## 验证

1. 在弹窗内聚焦"优化指令" Textarea，按上下键 → 不触发行切换，Textarea 正常滚动
2. 聚焦版本卡片的 Textarea，按上下键 → 不触发行切换
3. 不聚焦任何输入框时按上下键 → 正常切换行
4. 生成结果后切换到其他行再切回来 → 缓存结果恢复显示
5. 未生成结果时切换行 → 状态正常重置
6. 应用版本后切换行再切回 → 不恢复（已应用的已从缓存移除）
7. 关闭弹窗后重新打开 → 缓存已清空
