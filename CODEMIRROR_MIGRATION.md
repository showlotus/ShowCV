# CodeMirror 编辑器改造说明

## 📝 改造完成

已成功将 ByteMD 编辑器替换为 CodeMirror 6 编辑器！

## ✨ 改造内容

### 1. 依赖变更

#### 移除的依赖
- `bytemd`
- `@bytemd/react`
- `@bytemd/plugin-gfm`
- `@bytemd/plugin-frontmatter`

#### 新增的依赖
- `codemirror` - CodeMirror 6 核心库
- `@codemirror/view` - 编辑器视图
- `@codemirror/state` - 状态管理
- `@codemirror/lang-markdown` - Markdown 语言支持
- `@codemirror/language` - 语言支持基础
- `@codemirror/commands` - 编辑器命令
- `@codemirror/search` - 搜索功能
- `@codemirror/autocomplete` - 自动完成
- `@codemirror/lint` - 代码检查
- `@lezer/highlight` - 语法高亮

### 2. 新增文件

#### `src/components/editor/CodeMirrorEditor.tsx`
新的 CodeMirror 6 编辑器组件，包含：
- ✅ 行号显示
- ✅ 当前行高亮
- ✅ 语法高亮（Markdown）
- ✅ 历史记录（撤销/重做）
- ✅ 搜索功能（Cmd+F / Ctrl+F）
- ✅ 自动完成
- ✅ 自定义主题样式
- ✅ 占位符支持

#### `src/styles/codemirror.css`
CodeMirror 6 编辑器的样式文件，包含：
- 编辑器容器样式
- 行号样式
- 光标行高亮
- 选中文字样式
- 搜索面板样式
- 自动完成提示框样式

### 3. 修改的文件

#### `src/components/editor/MarkdownEditor.tsx`
简化为直接导出 `CodeMirrorEditor` 组件，保持 API 兼容性。

#### `package.json`
- 移除 ByteMD 相关依赖
- 添加 CodeMirror 6 相关依赖

## 🎨 功能特性

### 编辑器功能

1. **Markdown 语法高亮**
   - 标题（H1-H6）- 蓝色加粗
   - 粗体 - 深灰色加粗
   - 斜体 - 灰色斜体
   - 链接 - 蓝色下划线
   - 代码 - 绿色带背景
   - 引用 - 绿色
   - 列表标记 - 灰色

2. **编辑体验**
   - 行号显示
   - 当前行高亮
   - 选中文字高亮
   - 平滑滚动
   - 自动缩进

3. **快捷键支持**
   - `Cmd/Ctrl + Z` - 撤销
   - `Cmd/Ctrl + Shift + Z` - 重做
   - `Cmd/Ctrl + F` - 搜索
   - `Cmd/Ctrl + G` - 跳转到下一个搜索结果
   - `Cmd/Ctrl + Shift + G` - 跳转到上一个搜索结果
   - `Cmd/Ctrl + /` - 切换注释

## 🚀 优势对比

### vs ByteMD

| 特性 | ByteMD | CodeMirror 6 |
|------|---------|--------------|
| 包大小 | 较大 | 较小（按需加载）|
| 性能 | 良好 | 优秀 |
| 扩展性 | 有限 | 极强 |
| 主题定制 | 有限 | 完全自定义 |
| 移动端支持 | 一般 | 优秀 |
| TypeScript 支持 | 部分 | 完整 |
| 社区活跃度 | 一般 | 非常活跃 |

## 📚 进一步扩展

如需添加更多功能，可以安装以下插件：

```bash
# 代码折叠
pnpm add @codemirror/fold

# 代码片段
pnpm add @codemirror/snippets

# 协作编辑
pnpm add @codemirror/collab

# 暗色主题
pnpm add @codemirror/theme-one-dark

# Vim 模式
pnpm add @replit/codemirror-vim
```

然后在 `CodeMirrorEditor.tsx` 中导入并添加到 `extensions` 数组中。

## ⚠️ 注意事项

### Node.js 版本问题

当前项目使用 Vite 7.x，需要 Node.js 20.19+ 或 22.12+。
如果遇到 `crypto.hash is not a function` 错误，请升级 Node.js 版本：

```bash
# 使用 nvm 升级（推荐）
nvm install 20
nvm use 20

# 或使用 fnm
fnm install 20
fnm use 20
```

### 样式兼容性

旧的 `src/styles/editor.css` 文件已不再使用，但保留了以防回退。
新的样式文件为 `src/styles/codemirror.css`。

## 🔧 开发建议

1. **自定义快捷键**：在 `keymap.of([...])` 中添加自定义快捷键
2. **添加插件**：在 `extensions` 数组中添加更多 CodeMirror 插件
3. **调整样式**：修改 `EditorView.theme({...})` 中的样式配置
4. **修改语法高亮**：调整 `customHighlightStyle` 中的颜色配置

## 🎉 测试清单

- [x] 编辑器正常渲染
- [x] Markdown 语法高亮正常
- [x] 内容变化时正确更新到 store
- [x] 从 store 导入内容正常（分享链接功能）
- [x] 快捷键正常工作
- [x] 搜索功能正常
- [x] 无 TypeScript 类型错误
- [x] 无 ESLint 错误

## 📖 参考文档

- [CodeMirror 6 官方文档](https://codemirror.net/docs/)
- [CodeMirror 6 示例](https://codemirror.net/examples/)
- [@codemirror/lang-markdown](https://github.com/codemirror/lang-markdown)
