# ShowCV

基于 Markdown 的在线简历编辑器，专注于高效编辑、实时预览与高质量导出。纯客户端运行，无后端、无环境变量。

![ShowCV 预览](./res/combine.png)

## 快速导航

- [核心能力](#核心能力)
- [架构亮点](#架构亮点)
- [快速开始](#快速开始)
- [开发与测试命令](#开发与测试命令)
- [FAQ / 已知限制](#faq--已知限制)
- [贡献方式](#贡献方式)

## 核心能力

### 编辑体验
- 基于 CodeMirror 6 的 Markdown 编辑器，支持语法高亮与标题双栏语法 `||`
- 支持多份简历管理，可重命名、复制、删除并快速切换

### 预览与输出
- A4 实时预览，支持平铺与分页两种模式
- 基于浏览器打印能力导出 PDF，预览与导出样式保持一致
- 支持一键复制为 PNG 图片，便于投递与社交分享

### 模板与样式定制
- 内置 4 套简历模板（`T1` ~ `T4`）
- 可视化调整主题色、字体、字号、行高、段间距、页边距
- 支持头像上传、尺寸与圆角调节

### 分享协作
- 生成分享链接，对方打开后可自动导入简历内容
- 分享来源会标记为 `fromShare: true`

## 架构亮点

- **Zustand 持久化状态管理**：核心数据持久化到 `localStorage`，并通过 `currentResume` 维护当前简历缓存，保证编辑体验与数据一致性
- **双层主题系统**：编辑器 UI 主题与简历样式主题解耦，便于统一 UI 风格与模板个性化定制
- **双 DOM 预览策略**：可见预览用于交互，隐藏原尺寸副本用于截图，避免 `zoom` 带来的截图失真
- **分页布局算法**：按 section 高度进行分页分配，保持分页预览稳定性
- **分享压缩链路**：简历数据经紧凑编码 + zlib 压缩 + Base64 写入 URL hash，实现免后端分享

## 快速开始

**环境要求**：Node.js 18+、pnpm（`pnpm@8.15.4`）

```bash
pnpm install
pnpm dev
```

默认开发地址：`http://localhost:5173`

## 开发与测试命令

```bash
pnpm dev            # 启动开发服务器
pnpm build          # 生产构建（tsc -b + vite build）
pnpm preview        # 预览生产构建
pnpm lint           # TypeScript + ESLint 检查
pnpm lint:fix       # 自动修复可修复问题
pnpm format         # Prettier 格式化
pnpm format:check   # Prettier 格式检查
pnpm test           # 运行 Vitest
pnpm test:watch     # Vitest 监听模式
pnpm test:coverage  # 生成测试覆盖率报告
```

## 技术栈

| 分类 | 技术 |
| --- | --- |
| 框架 | React 19 + TypeScript + Vite |
| 样式 | Tailwind CSS v4 + shadcn/ui |
| 编辑器 | CodeMirror 6 |
| Markdown 渲染 | react-markdown + remark-gfm |
| 状态管理 | Zustand（含 localStorage 持久化） |
| 导出能力 | react-to-print、modern-screenshot |
| 分享压缩 | fflate（zlib） |
| 测试 | Vitest + Testing Library |

## 项目结构

```text
src/
├── components/      # 编辑器、预览、设置面板与通用 UI 组件
├── services/        # PDF 导出、图片复制、分享能力
├── store/           # Zustand 状态管理
├── templates/       # T1/T2/T3/T4 模板及工具
├── themes/          # 主题配置与 CSS 变量
├── types/           # 类型定义
└── utils/           # 常量与通用工具
```

## 模板与定制说明

| 模板 | 风格定位 | 适用场景 |
| --- | --- | --- |
| `T1` | 经典简约 | 传统行业 |
| `T2` | 现代专业 | 互联网 / 科技 |
| `T3` | 创意设计 | 设计 / 创意岗位 |
| `T4` | 活力新颖 | 新兴业务 / 综合岗位 |

可调参数包括：主题色、字体族、H1/H2/H3/正文大小、行高、标题间距、页面边距、头像样式。

## 测试与质量

- 测试框架：Vitest
- 测试目录：`tests/`
- 代码规范：TypeScript 严格模式 + ESLint + Prettier

提交前建议至少执行：

```bash
pnpm lint
pnpm test
pnpm build
```

## FAQ / 已知限制

### 数据存在哪里？
简历数据保存在浏览器 `localStorage`。清理浏览器站点数据后，本地简历会被清空。

### 分享链接是否依赖服务端？
不依赖。分享数据编码在 URL hash 中，对方打开后在本地解码导入。

### 为什么大头像可能影响体验？
头像以 base64 data URL 存储在本地，过大图片会增加 `localStorage` 占用与读写开销。

### 分页模式为什么更耗性能？
分页模式会按页面进行内容分段渲染，复杂内容下渲染成本会高于平铺模式。

## 贡献方式

欢迎通过 Issue 和 PR 参与改进。

1. Fork 本仓库并创建功能分支
2. 完成功能后运行 `pnpm lint`、`pnpm test`、`pnpm build`
3. 提交 PR 并说明改动背景与验证方式

- Issues: https://github.com/showlotus/showcv/issues
- Repository: https://github.com/showlotus/showcv

## 许可证

[MIT](LICENSE) © showlotus
