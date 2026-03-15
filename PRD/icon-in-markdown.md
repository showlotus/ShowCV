# Markdown 内嵌 lucide-react 图标功能设计

## 需求背景

在简历模板（`SimpleLayout.tsx`）中，支持通过特殊语法在 Markdown 内容里渲染 `lucide-react` 图标，提升简历的视觉表现力（如联系方式前的图标）。

## 语法设计

采用 `[icon:IconName]` 的行内语法，复用 Markdown 链接语法的方括号形式，语义清晰：

```markdown
[icon:Github] github.com/xxx
[icon:Mail] foo@bar.com
[icon:Phone] 138-0000-0000
```

### 语法规则

- 格式：`[icon:IconName]`
- `IconName` 与 `lucide-react` 导出名一致（PascalCase，如 `Github`、`Mail`、`Phone`）
- 为行内元素，可与文字混排

## 实现方案

### 技术路径

编写一个轻量 **remark 插件**，遍历 AST 中所有 `text` 节点，用正则匹配 `[icon:IconName]` 模式，将其拆分为普通文本节点和自定义 `icon` 节点（hast element），然后在 `ReactMarkdown` 的 `components` 里注册对应渲染器。

**无需引入额外依赖**（不使用 `remark-directive`）。

### 实现步骤

1. 写 remark 插件 `remarkIcon`：正则扫描 `text` 节点，分割出 `[icon:XxxYyy]` 片段，替换为自定义 hast 节点（`type: 'icon'`，携带 `name` 属性）
2. 在 `markdownComponents` 里注册 `icon` 渲染器：动态从 `lucide-react` 取对应图标组件并渲染
3. 注册插件到 `ReactMarkdown` 的 `remarkPlugins`

### 待确认细节

| 项目 | 待定 |
|------|------|
| 默认图标大小 | 跟随 `font.bodySize` 还是固定值（如 `14px`）？ |
| 图标颜色 | `var(--text-color)` 还是 `var(--primary-color)`？ |
| 是否支持 size 参数 | `[icon:Github:16]` 扩展语法是否需要？ |

## 影响范围

- `src/layouts/SimpleLayout.tsx`：新增 remark 插件 + components 渲染器
- 其他模板（`ModernLayout`、`CreativeLayout`）如需同样功能，可复用该插件
