# AI 文本优化功能实现计划

## Context

ShowCV 是一个 Markdown 简历编辑器，目前没有 AI 辅助功能。用户需要在编辑器中选中文本后，通过 AI 生成 3 个优化版本供选择替换，提升简历撰写效率。

本功能将集成 [job-prep-skills](https://github.com/showlotus/job-prep-skills) 项目中已有的两个 Skill 提示词：
- **Resume Optimizer**（社招）：强动词 + 技术关键词 + STAR 法则 + 语言简洁，输出标准专业版/数据驱动版/专家架构师版
- **Fresh Graduate Resume Optimizer**（校招）：同样四大原则 + 六大模块覆盖，输出基础版/进阶版/高阶版

## 交互流程

1. 用户在 CodeMirror 编辑器中选中一段文本
2. 点击编辑器头部右侧的 ✨ 图标按钮
3. 弹出 Dialog，显示求职类型切换（社招/校招）+ 选中文本 + 指令输入框
4. 用户点击「生成优化版本」，等待 AI 返回 3 个版本
5. 用户点击某个版本的「使用」按钮，替换编辑器中选中的文本；或关闭对话框放弃

## 文件变更清单

### 新建文件（4 个）

| 文件 | 职责 |
|------|------|
| `src/components/editor/AIOptimizeDialog.tsx` | AI 优化对话框：求职类型切换 + 选中文本 + 指令输入 + 3 个版本卡片 |
| `src/services/aiService.ts` | API 客户端：调用 `POST /api/ai/optimize`，返回 3 个版本字符串 |
| `api/ai/optimize.ts` | Vercel Serverless Function：接收文本、指令和求职类型，调用 AI 模型返回 3 个版本 |
| `api/ai/prompts.ts` | 导出 `SOCIAL_SYSTEM_PROMPT` 和 `CAMPUS_SYSTEM_PROMPT` 两个字符串常量 |

### 修改文件（3 个）

| 文件 | 改动 |
|------|------|
| `src/components/editor/CodeMirrorEditor.tsx` | 添加 `EditorHandle` 接口 + `forwardRef` + `useImperativeHandle`，暴露 `getSelection()` 和 `replaceAt()` |
| `src/components/editor/MarkdownEditor.tsx` | 改为 `forwardRef` 透传，导出 `EditorHandle` 类型 |
| `src/App.tsx` | 添加 AI 按钮（Sparkles 图标）、editor ref、对话框状态，渲染 `AIOptimizeDialog` |

### 生成文件（1 个）

| 文件 | 方式 |
|------|------|
| `src/components/ui/textarea.tsx` | `pnpm dlx shadcn@latest add textarea` |

## 详细设计

### 1. CodeMirrorEditor — 暴露选区 API

定义 `EditorHandle` 接口，通过 `useImperativeHandle` 暴露两个方法：

```ts
export interface EditorHandle {
  getSelection: () => { text: string; from: number; to: number } | null
  replaceAt: (from: number, to: number, text: string) => void
}
```

- `getSelection()`：读取 `view.state.selection.main` 的 `from`/`to`，用 `doc.sliceString()` 获取文本
- `replaceAt(from, to, text)`：在指定位置执行 `view.dispatch({ changes: { from, to, insert: text } })`

**关键决策**：`replaceAt` 接收位置参数而非读取当前选区。原因：用户在对话框打开期间可能已改变编辑器中的光标位置，必须使用点击时保存的位置才能正确替换。

### 2. MarkdownEditor — forwardRef 透传

```ts
import { forwardRef } from 'react'
import { CodeMirrorEditor, type EditorHandle } from './CodeMirrorEditor'

export const MarkdownEditor = forwardRef<EditorHandle>((_, ref) => (
  <CodeMirrorEditor ref={ref} />
))
```

### 3. App.tsx — 集成入口

在编辑器头部标签行（第 157-161 行）右侧添加 Sparkles 图标按钮：

```tsx
const editorRef = useRef<EditorHandle>(null)
const [aiDialogOpen, setAiDialogOpen] = useState(false)
const [aiSelection, setAiSelection] = useState<{ text: string; from: number; to: number } | null>(null)
```

- 点击按钮时调用 `editorRef.current?.getSelection()`，无选中则 `toast.error('请先选中需要优化的文本')`
- 有选中则存储 `{ text, from, to }` 并打开对话框
- `onApply` 回调调用 `editorRef.current?.replaceAt(from, to, newText)` 后关闭对话框

### 4. AIOptimizeDialog — 对话框组件

**Props**：
```ts
interface AIOptimizeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedText: string
  onApply: (text: string) => void
}
```

**布局**（使用 shadcn Dialog + 项目现有模式）：
- 顶部：DialogHeader 标题「AI 优化」
- **求职类型切换**：复用已有 `ToggleGroup` 组件（`src/components/ui/toggle-group.tsx`），`社招` / `校招` 两个选项，默认社招。参考 Header 中 ThemeToggle 的使用方式
- 选中文本展示区（只读，用带边框的 div 显示）
- Textarea 输入优化指令（placeholder: "描述你想如何优化这段文本..."）
- 生成按钮（带 Loader2 loading 状态）
- 3 个版本卡片，每个包含文本内容和「使用此版本」按钮
- 使用 Modal 组件中已有的样式模式（`var(--bg-secondary)`、`var(--border)` 等）

### 5. aiService.ts — API 客户端

```ts
export async function optimizeText(text: string, prompt: string, jobType: 'social' | 'campus'): Promise<string[]>
```

遵循 `shareService.ts` 的 fetch 模式：POST JSON → 解析响应 → 错误处理。

### 6. prompts.ts — System Prompt 常量

从 job-prep-skills 项目的 README.md 中提取 System Prompt，导出两个常量：

- `SOCIAL_SYSTEM_PROMPT`：社招版，来自 `resume-optimizer/README.md`
- `CAMPUS_SYSTEM_PROMPT`：校招版，来自 `fresh-graduate-resume-optimizer/README.md`

**内容要点**：
- 两大提示词共享四大核心原则：强动词开头、包含技术关键词、STAR 法则、语言专业简洁
- 社招版输出：版本 A（标准专业版）、版本 B（数据驱动版，含占位符）、版本 C（专家架构师版）
- 校招版输出：版本 A（基础版）、版本 B（进阶版，含占位符）、版本 C（高阶版）
- 两个提示词均定义了固定输出格式：`版本A/B/C的内容：` 标签 + 内容
- 提示词末尾的「请用户提供...」替换为让 AI 直接处理 User Message 的指令

**提取策略**：保留完整的核心原则、强动词库、版本定义模板和输出格式规范。**去除**优秀案例参考部分（案例已在提示词的训练中体现，去除可大幅减少 token 消耗，约减少 60% token）。

### 7. api/ai/optimize.ts — Serverless Function

**环境变量**：
- `AI_API_KEY`：API 密钥
- `AI_BASE_URL`：API 地址（如 `https://api.deepseek.com/v1`）
- `AI_MODEL`：模型名（如 `deepseek-chat`）

**请求构建**：
- System Message：根据 `jobType` 选择 `SOCIAL_SYSTEM_PROMPT` 或 `CAMPUS_SYSTEM_PROMPT`
- User Message：拼接用户的自定义指令（如有）和选中文本

```
用户指令：{prompt || '无特殊要求'}
需要优化的内容：
{text}
```

**请求格式**：OpenAI 兼容的 Chat Completions API（`/chat/completions`），temperature=0.8。

**响应解析**：
1. 提取 `choices[0].message.content`
2. 按提示词定义的纯文本格式解析，用正则 `/版本([ABC])的内容：\n([\s\S]*?)(?=版本[ABC]的内容：|$)/` 提取 3 个版本
3. 校验得到 3 个非空字符串，否则返回错误

## 实现顺序

1. `pnpm dlx shadcn@latest add textarea` 生成 Textarea 组件
2. 修改 `CodeMirrorEditor.tsx`：添加 EditorHandle + forwardRef + useImperativeHandle
3. 修改 `MarkdownEditor.tsx`：forwardRef 透传
4. 创建 `api/ai/prompts.ts`：System Prompt 常量（从 job-prep-skills 提取）
5. 创建 `api/ai/optimize.ts`：Serverless Function
6. 创建 `src/services/aiService.ts`：fetch 封装
7. 更新 `src/services/index.ts`：导出 optimizeText
8. 创建 `src/components/editor/AIOptimizeDialog.tsx`：对话框 UI
9. 修改 `src/App.tsx`：集成 AI 按钮和对话框

## 验证方式

1. `pnpm lint` 通过
2. `pnpm build` 通过
3. `pnpm dev` 启动后：
   - 编辑器头部出现 ✨ 图标
   - 未选中文本时点击图标 → toast 提示
   - 选中文本后点击图标 → 弹出对话框，显示求职类型切换 + 选中文本
   - 切换社招/校招，输入指令后点击生成 → loading 状态 → 显示 3 个版本
   - 点击某个版本的「使用此版本」→ 编辑器中选中文本被替换
   - 点击取消/关闭 → 无变化
