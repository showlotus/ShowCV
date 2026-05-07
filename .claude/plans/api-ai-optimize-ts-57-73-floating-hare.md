# AI 优化接口改为流式输出

## Context

当前 AI 优化功能使用非流式请求（`stream: false`），用户需等待 AI 完整返回后才能看到结果。改为流式输出后，用户可以逐字看到 AI 生成的文本，大幅提升体验。三个版本卡片将随文本流式到达而逐步出现并填充内容。

## 涉及文件

1. **`api/ai/optimize.ts`** — 后端 API，改为流式转发 AI SSE
2. **`src/services/aiService.ts`** — 前端服务层，新增流式请求函数
3. **`src/services/index.ts`** — 导出更新
4. **`src/components/editor/AIOptimizeDialog.tsx`** — UI 组件，支持逐字渲染

## 实现步骤

### 1. 后端：流式转发 AI 响应

**文件**: `api/ai/optimize.ts`

- 将 AI API 请求的 `stream` 改为 `true`
- 设置 SSE 响应头：`Content-Type: text/event-stream`、`Cache-Control: no-cache`、`Connection: keep-alive`
- 读取 AI API 的 SSE 流，提取每个 `delta.content`
- 转发为简化 SSE 格式给前端：`data: {"content":"..."}\n\n`
- 流结束时发送 `data: [DONE]\n\n`
- 删除 `parseVersions` 函数（版本解析移至前端）

### 2. 前端服务：流式请求函数

**文件**: `src/services/aiService.ts`

- 新增 `streamOptimizeText(text, prompt, jobType, callbacks)` 函数
- `callbacks` 包含：
  - `onChunk(text: string)` — 每收到一段增量文本时调用，传入**累计全文**
  - `onError(error: Error)` — 错误回调
- 使用 `fetch` + `response.body.getReader()` 读取 SSE 流
- 返回 `AbortController` 供外部取消请求
- 保留原 `optimizeText` 不动（作为非流式备用），但从 `AIOptimizeDialog` 改为调用新函数

### 3. 前端服务导出

**文件**: `src/services/index.ts`

- 新增导出 `streamOptimizeText`

### 4. UI 组件：逐字渲染

**文件**: `src/components/editor/AIOptimizeDialog.tsx`

**核心思路**：随着流式文本到达，实时检测 `版本X的内容：` 标记，逐步创建并填充版本卡片。

**新增工具函数 `parseStreamingVersions`**：
- 输入：累计流式文本
- 输出：`{ versions: string[], currentIndex: number }`
  - `versions[0..2]` 为已解析的版本内容（未到达的为空字符串）
  - `currentIndex` 为当前正在填充的版本索引（-1 表示前导文本）
- 检测逻辑：按 `版本A的内容：`、`版本B的内容：`、`版本C的内容：` 分割

**状态调整**：
- 移除 `loading` 布尔值，改用 `streaming` 布尔值 + `abortRef` 引用
- 新增 `streamingText` 状态存储累计文本
- `versions` 从 `parseStreamingVersions(streamingText)` 派生

**渲染调整**：
- 当 `currentIndex >= 0` 时，为对应的版本卡片显示流式内容（带闪烁光标）
- 已完成版本的卡片正常显示
- 未到达的版本不显示卡片
- "生成中..." 按钮改为 "停止生成" 按钮（点击调用 `abortRef.current.abort()`）

**取消处理**：
- 对话框关闭时若有进行中的流，调用 `abort()` 取消

## 验证方式

1. `pnpm vercel` 启动后端，`pnpm dev` 启动前端
2. 选中编辑器文本，点击 AI 优化按钮
3. 确认文本逐字出现在版本卡片中，A → B → C 依次出现
4. 测试点击"停止生成"能中断流
5. 测试关闭对话框能取消进行中的请求
6. 测试网络错误时的错误提示
