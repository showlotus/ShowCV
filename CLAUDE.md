# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

ShowCV 是一个基于 Markdown 的简历编辑器，使用 React 19 + Vite + TypeScript 构建。支持实时预览、多种简历模板、PDF 导出和分享功能。前端纯客户端运行，分享与 AI 优化功能支持两种部署方式：Vercel Serverless Functions（云部署）或 Express + SQLite 自托管。

## 包管理器

使用 **pnpm**（`packageManager: pnpm@8.15.4`）。

## 常用命令

```bash
pnpm dev            # 启动前端开发服务器（Vite，端口 3080）
pnpm dev:server     # 启动 Express API 服务（端口 3070，SQLite 存储）
pnpm build          # 前端构建（tsc -b + vite build，输出到 dist/）
pnpm build:server   # 完整构建（前端 + Express 服务，统一输出到 dist/）
pnpm lint           # TypeScript + ESLint 检查
pnpm lint:fix       # 自动修复 lint 问题
pnpm format         # Prettier 格式化
pnpm format:check   # 检查代码格式
pnpm test           # 运行所有测试（vitest run）
pnpm test:watch     # 监听模式运行测试
pnpm test:coverage  # 运行测试并生成覆盖率报告
```

测试使用 Vitest，配置文件为 `vitest.config.ts`，测试文件位于 `tests/` 目录。

本地开发需同时启动两个服务：`pnpm dev:server`（Express API，端口 3070）+ `pnpm dev`（Vite 前端，端口 3080）。Vite 已配置 `/api` 代理到 `localhost:3070`。

Vercel 开发模式（可选）：`pnpm vercel`（端口 3070），需先 `vercel link` + `vercel env pull`，此时需手动修改 Vite 代理目标为 3070。

## 代码风格

- Prettier：无分号、单引号、2 空格缩进、100 字符行宽、ES5 尾逗号、省略箭头函数单参数括号
- `prettier-plugin-tailwindcss` 自动排序 Tailwind 类名
- TypeScript 严格模式，`verbatimModuleSyntax: true`（类型导入必须用 `import type`）
- ESLint 使用 flat config，`no-unused-vars` 设为 `warn`（非 error）

## 架构说明

### 状态管理 (Zustand)

主 store 位于 `src/store/resumeStore.ts`，使用 `persist` 中间件持久化到 `localStorage`（键名 `showcv-resume`）。

```ts
{
  theme: AppTheme,           // 'light' | 'dark' | 'ocean' | 'forest'
  previewMode: 'flat' | 'paginated',
  resumes: ResumeItem[],     // 所有简历
  currentResumeId: string | null,
  currentResume: ResumeItem | null,  // 反规范化缓存，不持久化
}
```

**关键模式：**
- `currentResume` 是 `resumes[]` 的缓存副本，每个 mutation action 必须同时更新两者
- `partialize` 排除 `currentResume` 不序列化；`onRehydrateStorage` 从 `currentResumeId` 重建
- 所有 mutation 以 `if (!state.currentResumeId) return state` 做前置守卫
- `setTemplate()` 切换模板时保留 `color.primary`、`font.fontFamily`、`avatar`、`layout`，其余设置重置为新模板默认值

### 双层主题系统

**App 主题**（编辑器 UI 外观）：
- 通过 `<html data-theme="...">` 切换，CSS 变量定义在 `src/themes/themes.css`
- 4 套主题：light、dark、ocean、forest（ocean/forest CSS 已定义但在 `THEME_LIST` 中被注释）
- 变量：`--bg-primary`, `--fg-primary`, `--accent`, `--border` 等

**简历主题**（每份简历独立样式）：
- 通过 `useCssVars(settings)` hook 将 `ResumeSettings` 转为 CSS 自定义属性，以内联 style 注入模板根元素
- 变量：`--primary-color`, `--h1-title-size`, `--line-height`, `--padding` 等
- 模板 CSS 引用这些变量，定义在 `src/styles/templates.css`

**shadcn 桥接层**：`src/index.css` 的 `@theme inline` 将 app 主题变量映射到 shadcn 语义 token。

### 简历模板

4 个模板注册在 `src/templates/index.tsx` 的 `TEMPLATE_MAP` 中，`TemplateId` = `keyof typeof TEMPLATE_MAP`（`'T1' | 'T2' | 'T3' | 'T4'`）。

所有模板遵循相同契约：
```tsx
(props: { content: string; settings: ResumeSettings; className?: string }) => JSX.Element
```

模板内部流程：`useCssVars(settings)` → `buildMarkdownComponents(settings)` → `<ReactMarkdown>` 渲染。每个模板导出 `Tn_DEFAULT_SETTINGS` 作为默认值。

模板间仅 `h2` 渲染样式和默认设置不同，其余组件（header、p、ul、ol、li、section 等）完全一致。

**关键工具**（`src/templates/utils/`）：
- `remarkGroupSection` — 三遍 AST 变换：h3→section → h2→section → h1→header（使用 mdast blockquote + `data.hName` 产生自定义 HTML 元素）
- `PipeSplit` — 解析 `||` 语法实现标题左右双栏
- `useCssVars` — 将 ResumeSettings 转为 CSSProperties

**注意：** h1 在模板中渲染为 null，标题内容由 `remarkGroupSection` 提取并注入到 `<header data-name="...">` 中。

### PDF 导出与截图

`src/services/pdfService.ts` 提供三种方案：
1. `useReactToPrintExport(ref)` — react-to-print（主方案）
2. `usePDFExport(ref)` — iframe 打印方案
3. `exportToPDFLegacy()` — html2canvas + jsPDF（备用）

`useCopyImageExport(ref)` 使用 `modern-screenshot` 的 `domToBlob()` 生成 2x PNG 写入剪贴板。

### 批量导出 PNG

`src/services/imageExportService.ts` 的 `exportResumeImages(resumes, options)` 支持一次导出多份简历的图片，入口为 Header 的「图片」按钮 → `src/components/export/ExportImageDialog.tsx`（可多选简历、切换分页/长图、选择 1x~3x 倍率）。

**关键实现：**
- 预览只渲染 `currentResume`，因此批量导出用 `createRoot` 把每份简历渲染到临时离屏容器（`position: fixed; left: -9999px`，宽度 A4），截图后立即 `unmount` 并移除；**串行**处理避免高倍率图片同时占用内存
- 分页在 `useLayoutEffect` 中测量、没有完成回调，所以用 `waitForStableLayout()` 轮询：`document.fonts.ready` → `.preview-page` 数量连续两帧不变（5s 超时兜底）→ 等 `img.decode()`
- `PreviewModeRenderer` 的 `forcePaginated` prop 用于让离屏渲染不受全局 `previewMode` 影响（与 `forceFlat` 对称）
- 截图时用 `style: { borderRadius: '0', boxShadow: 'none' }` 抹掉预览装饰，避免图片出现透明边角
- 单张直接下载 PNG，多张用 `fflate.zip(files, { level: 0 })` 打包（PNG 已压缩，不再二次压缩）

**图片下载直链**：`/export?id=&mode=&scale=`（`src/services/exportUrlService.ts` + `src/components/export/ExportUrlPage.tsx`）。

- `src/main.tsx` 在挂载前用 `parseExportUrl(location.href)` 判断路径，命中则渲染 `ExportUrlPage` 而不加载 `<App />`；项目无路由库，与 `/s/{id}` 一样靠手动解析路径
- 参数：`id` 可重复或逗号分隔；`id=all` / `all=1` 导出全部；`mode=flat` 为长图（默认 `paginated`）；`scale` 仅接受 1/2/3（默认 2）；`id` 缺省时导出当前简历
- 打开即自动调用 `exportResumeImages`，`startedRef` 防止 StrictMode 下重复导出；对话框的「复制直链」用 `buildExportUrl` 生成
- **限制**：简历数据存在本机 `localStorage`，直链发给别人打不开（找不到 id 时提示而非静默失败）；zustand persist 同步 rehydrate，因此挂载时 `getState().resumes` 已就绪
- 部署无需额外配置：`vercel.json` 的 catch-all rewrite、nginx `location /`、Express `app.get('*')` 已覆盖 SPA fallback

### 分享机制

项目实现了**服务端分享**（主方案）和**客户端 hash 分享**（旧方案）两套机制，共用 `src/services/shareService.ts` 中的 `encodeShareData` / `decodeShareData` 编解码逻辑。

**服务端分享**（`createServerShare` / `fetchShareData`）：
- 客户端编码压缩 → POST `/api/share/create` → 服务端 AES-256-GCM 加密 → 存入 Upstash Redis（24h TTL）
- 返回 12 位 nanoid 分享 ID，分享 URL 格式：`${origin}/s/${shareId}`
- 读取时 Lua 脚本原子 GET+DEL（阅后即焚），解密后返回数据
- API 实现位于 `api/share/`（Vercel Serverless Functions），工具位于 `api/_lib/`

**自托管分享**（Express + SQLite）：
- `server/index.ts` 启动 Express 服务，复用 `api/ai/optimize.ts`（AI 优化）和 `api/_lib/crypto.ts`（加解密）
- 分享 handler 位于 `server/handlers/shareCreate.ts` 和 `server/handlers/shareGet.ts`，逻辑与 `api/share/` 一致但使用 `server/lib/db.ts`（SQLite）替代 Upstash Redis
- SQLite 数据库默认 `data/showcv.db`，可通过 `DB_PATH` 环境变量覆盖
- TTL 通过定时清理过期记录实现（每小时），阅后即焚通过 SQLite 事务保证原子性
- `api/` 下文件零改动，保持 Vercel 部署兼容

**客户端 hash 分享**（旧方案）：
- 简历数据 → 紧凑编码 + fflate zlib 压缩 + Base64 → 写入 URL hash
- 打开时解码创建简历（`fromShare: true`），随后清除 hash

**API 注意事项：**
- `api/` 和 `server/` 不在主 tsconfig（`tsconfig.json` 引用 `tsconfig.app/node/test`，仅覆盖 `src`）范围内，IDE 可能报类型错误；但 `build:server` 通过 `tsconfig.server.json`（`include: ["api/**/*.ts", "server/**/*.ts"]`）编译它们，不影响 Vercel 运行
- 相对导入必须带 `.js` 扩展名（ESM 规范），如 `from '../_lib/redis.js'`
- Redis 客户端使用 `KV_REST_API_URL` / `KV_REST_API_TOKEN`（Vercel KV 环境变量），非 `UPSTASH_*`
- 加密密钥通过 `ENCRYPTION_KEY` 环境变量配置（32 字节 hex）

### Vercel 部署

`vercel.json` 配置要点：
- 仅 `v2` 分支触发自动部署，`master` 不部署
- `/s/*`（分享链接）和前端路由重写到 `index.html`，`/api/*` 由 Serverless Functions 处理
- 构建命令 `pnpm run build`，输出目录 `dist`，框架识别为 `vite`

环境变量：分享功能需要 `KV_REST_API_URL` / `KV_REST_API_TOKEN` / `ENCRYPTION_KEY`；AI 功能需要 `AI_API_KEY` / `AI_BASE_URL` / `AI_MODEL` / `AI_THINKING`（均为可选）。

### 自托管部署（Express + SQLite）

**构建与启动**：
```bash
pnpm build:server   # 完整构建（前端 + Express 服务，统一输出到 dist/）
node dist/server/index.js     # 启动（直接 node）
pm2 start ecosystem.config.cjs  # 启动（PM2，fork 模式，script 指向 dist/server/index.js）
```

**环境变量**：仅需 `ENCRYPTION_KEY`（32 字节 hex，`openssl rand -hex 32` 生成）；`PORT` 可选（默认 `3070`）；`DB_PATH` 可选（默认 `data/showcv.db`）；AI 功能可选配置 `AI_API_KEY` / `AI_BASE_URL` / `AI_MODEL` / `AI_THINKING`。

**Nginx 反代**：参考 `nginx.conf`（项目根），SSE 端点 `/api/ai/optimize` 需单独配置 `proxy_http_version 1.1` + `proxy_buffering off`。

### 预览系统

`src/components/preview/PreviewContainer.tsx` 使用 CSS `zoom` 缩放 A4 预览至面板宽度（`ResizeObserver` 监听容器变化）。

**双 DOM 渲染**：预览区渲染两份模板——一份可见（zoom 缩放后），一份隐藏在 `-9999px`（原始尺寸）。截图功能使用隐藏副本，因为 CSS `zoom` 会扭曲截图。修改预览功能时需同时考虑两份副本。

**分页算法**（`usePaginatedLayout.ts`）：测量 `.resume-section` 元素高度，贪心分配到 A4 页面。每页渲染完整内容 + `transform: translateY(-startY)` + `overflow: hidden`，因此分页模式下 Markdown 会被渲染 N 次。

### 全局 UI 组件

- `<Toaster>` 挂载在 `src/main.tsx` 的顶层，始终存在，不受组件状态切换影响
- `<TooltipProvider>` 同样在顶层，包裹整个 `<App />`

### 路径别名

`@` → `src/`（在 `vite.config.ts` 和 `tsconfig.app.json` 中配置）。

### 类型定义

关键类型在 `src/types/settings.ts` 和 `src/types/resume.ts`。注意跨模块依赖：`settings.ts` 从 `@/templates` 导出 `TemplateId`，从 `@/themes` 导出 `AppTheme`。

`ResumeSettings` 结构：`font` / `color` / `spacing` / `avatar?` / `layout`（`LayoutSettings.headerAlign: 'left' | 'center' | 'right'` 控制头部对齐）。

### AI 文本优化

`src/components/editor/AIOptimizeDialog.tsx` 提供 AI 驱动的简历文本优化，支持社招/校招两种模式，通过 Cmd/Ctrl+J 快捷键触发。

**工作流程**：选中文本 → SSE 流式请求 `/api/ai/optimize` → 返回 3 个版本（标准/数据驱动/专家级，以 `---` 分隔）→ 用户选择或手动编辑后应用。

**关键实现**：
- 行级缓存：上下箭头切换行时保留已生成结果
- 格式保留：自动保护 `**bold**`、`||` 双栏、行内代码、链接等 Markdown 语法
- 客户端封装位于 `src/services/aiService.ts`（`optimizeText` / `streamOptimizeText`），API 实现位于 `api/ai/optimize.ts`，系统 prompt 在 `api/ai/prompts.ts`

**环境变量**：`AI_API_KEY`、`AI_BASE_URL`、`AI_MODEL`、`AI_THINKING`（思考模式开关，可选）

### Avatar 存储

头像以 base64 data URL 直接存储在 Zustand store / localStorage 中。大图会膨胀 localStorage，`naturalWidth`/`naturalHeight` 用于计算渲染比例。
