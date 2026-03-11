# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 在此仓库中工作时提供指导。

## 项目概述

ShowCV 是一个基于 Markdown 的简历编辑器，使用 React + Vite + TypeScript 构建。支持实时预览、多种简历模板、PDF 导出和分享功能。

## 包管理器

- 使用 **pnpm** 作为包管理器

## 常用命令

```bash
pnpm dev          # 启动开发服务器
pnpm build        # 生产构建（先运行 tsc 再 vite build）
pnpm lint         # 运行 ESLint 检查
pnpm preview      # 预览生产构建
pnpm format       # 使用 Prettier 格式化代码
pnpm format:check # 检查代码格式
```

## 架构说明

### 状态管理 (Zustand)

应用使用 Zustand 进行状态管理，支持持久化。主 store 位于 `src/store/resumeStore.ts`：

- **多简历支持**: `resumes: ResumeItem[]` - 简历对象数组
- **当前简历**: `currentResume` - 根据 `currentResumeId` 计算
- **主题**: `theme: AppTheme` - 支持 'dark' | 'light' | 'ocean' | 'forest'
- **持久化**: 使用 `zustand/middleware`，localStorage 键名为 `showcv-resume`

关键模式：更新当前简历时，同时更新 `resumes` 数组中对应的项。

### 主题系统

主题基于 CSS 变量实现，参见 `src/index.css`：
- 变量：`--bg-primary`, `--bg-secondary`, `--accent`, `--fg-primary` 等
- 通过 `<html>` 元素的 `data-theme` 属性切换主题
- Store 负责主题持久化，在 rehydration 时应用主题

### 简历模板

三个模板位于 `src/layouts/` 目录：
- `SimpleLayout.tsx` - 经典简约风格
- `ModernLayout.tsx` - 现代专业风格
- `CreativeLayout.tsx` - 创意设计风格

模板使用 CSS 变量实现主题化，接收 `content`（Markdown 字符串）和 `settings`（ResumeSettings）作为 props。

### PDF 导出

`src/services/pdfService.ts` 提供多种导出方式：
1. `usePDFExport()` - 基于 iframe 的打印方案（主要方案）
2. `useReactToPrintExport()` - react-to-print 库方案
3. `exportToPDFLegacy()` - html2canvas + jsPDF（备用方案）

### 分享功能

`src/services/shareService.ts` 处理基于 URL 的分享：
- 使用 fflate zlib 压缩简历数据
- 编码为 base64 存储在 URL hash 中
- 主要函数：`generateShareUrl()` / `getShareDataFromUrl()` / `clearShareHash()`

### 组件结构

```
src/components/
├── common/       # 通用 UI 组件：Slider, ColorPicker, Modal, Toast, Background
├── editor/       # 基于 CodeMirror 的 Markdown 编辑器
├── layout/       # Header, Sidebar（简历列表）
├── preview/      # PaginatedPreview, PreviewContainer
├── settings/     # SettingsPanel（右侧配置面板）
└── templates/    # 基础模板组件
```

### 类型定义

关键类型位于 `src/types/`：
- `ResumeSettings` - 字体、颜色、间距配置
- `TemplateId` - 'simple' | 'modern' | 'creative'
- `AppTheme` - 'dark' | 'light' | 'ocean' | 'forest'
- `ResumeData` - 可导出的简历格式

### 常量定义

`src/utils/constants.ts` 包含：
- `DEFAULT_SETTINGS` - 默认简历配置
- `DEFAULT_CONTENT` - 示例简历 Markdown
- `TEMPLATE_LIST` - 可用模板列表
- `THEME_LIST` - 可用主题列表
- `PRESET_COLORS` - 颜色选择器预设
- `FONT_PRESETS` - 字体预设选项
