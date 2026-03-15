# ShowCV

> 基于 Markdown 的在线简历编辑器，支持实时预览、多种模板、PDF 导出和链接分享。

## ✨ 功能特性

- **Markdown 编辑** — 使用 CodeMirror 6 打造的编辑器，支持语法高亮和右对齐语法
- **实时预览** — A4 尺寸实时渲染，所见即所得
- **多份简历** — 侧边栏管理多份简历，独立保存、随时切换
- **多种模板** — 简约 / 现代 / 创意，三种风格满足不同岗位需求
- **主题切换** — 浅色 / 深色两套编辑器主题
- **样式定制** — 自由调节字号、行高、主题色、间距、字体等参数
- **PDF 导出** — 基于浏览器打印，打印样式与预览保持一致
- **复制为图片** — 一键将简历复制为 PNG 图片
- **链接分享** — 生成分享链接，对方打开后自动导入简历内容（标记为"来自分享"）

## 🚀 快速开始

**环境要求**：Node.js 18+、pnpm

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 生产构建
pnpm build
```

## 📦 技术栈

| 分类 | 依赖 |
|------|------|
| 框架 | React 19 + TypeScript + Vite |
| 样式 | Tailwind CSS v4 + shadcn/ui |
| 编辑器 | CodeMirror 6 |
| Markdown 渲染 | react-markdown + remark-gfm |
| 状态管理 | Zustand（含 localStorage 持久化） |
| PDF 导出 | react-to-print |
| 截图 | modern-screenshot |
| 分享压缩 | fflate (zlib) |
| 图标 | lucide-react |

## 📁 项目结构

```
src/
├── components/
│   ├── common/       # 通用组件：Slider、ColorPicker、Modal、Background 等
│   ├── editor/       # Markdown 编辑器（基于 CodeMirror）
│   ├── layout/       # Header、Sidebar（简历列表）
│   ├── preview/      # 实时预览区（支持 A4 分页）
│   ├── settings/     # 右侧样式配置面板
│   ├── templates/    # 模板组件
│   └── ui/           # shadcn/ui 基础组件
├── layouts/          # 简历布局模板（Simple / Modern / Creative）
├── services/         # PDF 导出、图片复制、链接分享
├── store/            # Zustand 状态管理
├── themes/           # 主题配置与 CSS 变量
├── types/            # TypeScript 类型定义
└── utils/            # 常量、工具函数
```

## 🎨 简历模板

| 模板 ID | 名称 | 适合岗位 |
|---------|------|----------|
| `simple` | 简约 | 传统行业 |
| `modern` | 现代 | 互联网 / 科技 |
| `creative` | 创意 | 设计 / 创意岗位 |

## ⚙️ 样式配置项

在右侧配置面板中可调整以下参数：

- **字体** — 字体族（默认 / 苹方 / 思源黑体）、标题 / 正文 / 小字字号、行高
- **颜色** — 主题色、正文色、辅助色、背景色（支持预设色盘与自定义）
- **间距** — 章节间距、页面内边距

## 🔗 分享机制

分享链接将简历数据（内容 + 模板 + 配置）经 fflate zlib 压缩后 Base64 编码，存储在 URL Hash 中。对方打开链接后，数据自动解码并创建为本地简历（标记 `fromShare: true`），随后清除 Hash，避免 URL 过长。

## 📋 常用命令

```bash
pnpm dev           # 启动开发服务器
pnpm build         # 生产构建（tsc + vite build）
pnpm preview       # 预览生产构建
pnpm lint          # ESLint 检查
pnpm format        # Prettier 格式化
pnpm format:check  # 检查格式
```

## 📄 许可证

[MIT](LICENSE) © showlotus
