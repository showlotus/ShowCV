# AI 优化：行级连续优化工作流

## Context
当前 AI 优化是"选文本→生成→替换→关闭"的一次性流程。用户优化多行简历时需要反复开/关对话框，效率低。
改为：打开对话框后，以光标所在行为目标，支持 ↑↓ 键连续切行优化，应用后不关闭对话框。

## 交互流程
1. 光标在编辑器某行 → 点击 AI 优化 → 读取该行完整内容 → 打开对话框
2. 对话框顶部：`第 X 行 · 按 ↑↓ 切换行`
3. 生成 3 个版本 → 用户选择 → 应用到编辑器 → 对话框**不关闭**
4. 用户按 ↓ → 编辑器光标下移 → 对话框刷新为新行内容 → 继续优化
5. 手动关闭对话框（X / Esc）

## 改动文件

### 1. `src/components/editor/CodeMirrorEditor.tsx` — EditorHandle 扩展

新增两个方法，`highlightActiveLine()` 已启用，光标移动即高亮，无需额外装饰。

```ts
// EditorHandle 接口新增：
getCurrentLine: () => { text: string; lineNumber: number; from: number; to: number } | null
moveToLine: (direction: 'up' | 'down') => { text: string; lineNumber: number; from: number; to: number } | null

// getCurrentLine 实现：
const pos = view.state.selection.main.head
const line = view.state.doc.lineAt(pos)
return { text: line.text, lineNumber: line.number, from: line.from, to: line.to }

// moveToLine 实现：
const currentLine = view.state.doc.lineAt(view.state.selection.main.head)
const targetNumber = direction === 'up' ? currentLine.number - 1 : currentLine.number + 1
if (targetNumber < 1 || targetNumber > view.state.doc.lines) return null
const targetLine = view.state.doc.line(targetNumber)
view.dispatch({ selection: { anchor: targetLine.from }, scrollIntoView: true })
return { text: targetLine.text, lineNumber: targetLine.number, from: targetLine.from, to: targetLine.to }
```

### 2. `src/App.tsx` — 状态管理重构

```ts
// 替换 aiSelection 为 aiLineInfo
const [aiLineInfo, setAiLineInfo] = useState<{
  text: string; lineNumber: number; from: number; to: number
} | null>(null)

// handleAIOptimize：用 getCurrentLine 替代 getSelection
const selection = editorRef.current?.getSelection()
// 如果有选区就用选区，没有就取光标行
const line = selection
  ? expandToLineBoundary(selection)  // 保留选中文本的支持
  : editorRef.current?.getCurrentLine()

// 新增 handleNavigateLine
const handleNavigateLine = useCallback((direction: 'up' | 'down') => {
  const line = editorRef.current?.moveToLine(direction)
  if (line) setAiLineInfo(line)
}, [])

// handleAIApply：替换后刷新行信息，不关闭对话框
const handleAIApply = useCallback((text: string) => {
  if (!aiLineInfo) return
  editorRef.current?.replaceAt(aiLineInfo.from, aiLineInfo.to, text)
  const updated = editorRef.current?.getCurrentLine()
  if (updated) setAiLineInfo(updated)
}, [aiLineInfo])

// Dialog props 新增：
<AIOptimizeDialog
  selectedText={aiLineInfo?.text ?? ''}
  lineNumber={aiLineInfo?.lineNumber}
  onApply={handleAIApply}
  onNavigateLine={handleNavigateLine}
  // ...其他不变
/>
```

### 3. `src/components/editor/AIOptimizeDialog.tsx` — 对话框改造

**Props 新增：**
```ts
lineNumber?: number
onNavigateLine: (direction: 'up' | 'down') => void
```

**键盘监听（DialogContent 上）：**
```ts
onKeyDown={(e) => {
  if (e.key === 'ArrowUp') { e.preventDefault(); onNavigateLine('up') }
  if (e.key === 'ArrowDown') { e.preventDefault(); onNavigateLine('down') }
}}
```

**顶部行指示器：**
在 DialogHeader 中显示：`第 {lineNumber} 行 · 按 ↑↓ 切换行`

**selectedText 变化时重置内部状态：**
```ts
useEffect(() => {
  setStreamingText('')
  setAppliedIndex(null)
  setStreaming(false)
  abortRef.current?.abort()
}, [selectedText])
```

**handleApply 不关闭对话框：**
```ts
setTimeout(() => {
  // 删除 onOpenChange(false)
  setStreamingText('')
  setAppliedIndex(null)
}, 500)
```

### 4. `api/ai/prompts.ts` — 保留 Markdown 格式

在两个 system prompt 的"步骤 3"之前插入：
```
## 格式要求
保留输入内容中的 Markdown 格式标记（如列表符号 `- `、加粗 `**`、分隔符 `|` 等），
仅优化文字内容本身，不改变 Markdown 结构。
```

## 验证
1. 光标在第 5 行 → 点击 AI 优化 → 对话框显示第 5 行内容 + 行号提示
2. 按 ↓ → 编辑器光标下移，对话框显示第 6 行内容
3. 生成 → 选择版本 → 应用 → 编辑器内容更新，对话框保持打开
4. 继续按 ↓ 优化下一行
5. 按 Esc 关闭对话框
6. 验证原有"选中文本优化"流程仍然正常（兼容保留）
