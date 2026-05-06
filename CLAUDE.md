# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

ShowCV 是一个基于 Markdown 的简历编辑器，使用 React 19 + Vite + TypeScript 构建。支持实时预览、多种简历模板、PDF 导出和分享功能。前端纯客户端运行，分享功能依赖 Vercel Serverless Functions + Upstash Redis。

## 包管理器

使用 **pnpm**（`packageManager: pnpm@8.15.4`）。

## 常用命令

```bash
pnpm dev            # 启动前端开发服务器（Vite，端口 5173）
pnpm vercel         # 启动 Vercel API 服务（端口 3001，需先 vercel link & env pull）
pnpm build          # 生产构建（先 tsc -b 再 vite build）
pnpm lint           # TypeScript + ESLint 检查
pnpm lint:fix       # 自动修复 lint 问题
pnpm format         # Prettier 格式化
pnpm format:check   # 检查代码格式
pnpm test           # 运行所有测试（vitest run）
pnpm test:watch     # 监听模式运行测试
pnpm test:coverage  # 运行测试并生成覆盖率报告
```

测试使用 Vitest，配置文件为 `vitest.config.ts`，测试文件位于 `tests/` 目录。

本地开发分享功能时需同时启动两个服务：`pnpm vercel`（API）+ `pnpm dev`（前端）。Vite 已配置 `/api` 代理到 `localhost:3001`。

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
- `setTemplate()` 切换模板时仅保留 `color.primary` 和 `font.fontFamily`，其余设置重置为新模板默认值

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

### 分享机制

项目实现了**服务端分享**（主方案）和**客户端 hash 分享**（旧方案）两套机制，共用 `src/services/shareService.ts` 中的 `encodeShareData` / `decodeShareData` 编解码逻辑。

**服务端分享**（`createServerShare` / `fetchShareData`）：
- 客户端编码压缩 → POST `/api/share/create` → 服务端 AES-256-GCM 加密 → 存入 Upstash Redis（24h TTL）
- 返回 12 位 nanoid 分享 ID，分享 URL 格式：`${origin}/s/${shareId}`
- 读取时 Lua 脚本原子 GET+DEL（阅后即焚），解密后返回数据
- API 实现位于 `api/share/`（Vercel Serverless Functions），工具位于 `api/_lib/`

**客户端 hash 分享**（旧方案）：
- 简历数据 → 紧凑编码 + fflate zlib 压缩 + Base64 → 写入 URL hash
- 打开时解码创建简历（`fromShare: true`），随后清除 hash

**API 注意事项：**
- `api/` 中的 TypeScript 文件不在项目 tsconfig 范围内，IDE 可能报类型错误，不影响 Vercel 运行
- 相对导入必须带 `.js` 扩展名（ESM 规范），如 `from '../_lib/redis.js'`
- Redis 客户端使用 `KV_REST_API_URL` / `KV_REST_API_TOKEN`（Vercel KV 环境变量），非 `UPSTASH_*`
- 加密密钥通过 `ENCRYPTION_KEY` 环境变量配置（32 字节 hex）

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

### Avatar 存储

头像以 base64 data URL 直接存储在 Zustand store / localStorage 中。大图会膨胀 localStorage，`naturalWidth`/`naturalHeight` 用于计算渲染比例。
