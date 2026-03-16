# 分页预览 paddingTop 实现方案讨论

## 背景

`PaginatedPreview.tsx` 中存在一套分页逻辑（目前已注释），用于将跨页的 `.resume-section` 块"推"到下一页内容区起始位置，通过设置 `paddingTop` 实现视觉上的分页效果。

## 现有实现（内联 style）

核心函数 `assignSectionPages`：

1. 先清除所有 `.resume-section` 的旧 `paddingTop` 和 `page-first` class
2. `void wrapper.offsetHeight` 强制回流，确保后续读取的 `offsetTop` 是干净的原始值
3. 遍历所有 section，计算其相对当前页顶部的偏移，判断是否超出当前页可用高度
4. 超出则翻页，对该页首个 section 计算并写入 `paddingTop`：

```
pageContentStart = (page - 1) * A4_HEIGHT_PX + padding
paddingTop = pageContentStart - section.offsetTop
```

用 `paddingTop` 而非 `marginTop` 的原因：避免 margin collapse 导致偏移计算不准。

## 备选方案：注入 style 标签

每次计算完成后，生成 CSS 字符串，整体覆盖一个动态 `<style>` 标签的 `textContent`，而不是逐个操作节点的内联 style。

### 优点

- **打印/导出时可一键关闭**：清空 `textContent` 或设置 `media="screen"`，分页偏移不影响打印输出，PDF 内容按自然流排版
- **批量写入**：N 个 section 只需 1 次 DOM 写操作（`textContent` 赋值），而非 N 次内联赋值
- **职责更单一**：计算逻辑只产出 CSS 字符串，不直接操作节点 style

### 缺点

- **需要唯一标识符**：要给每个需要换页的 section 分配稳定的唯一 ID（如 `data-page-first-id`），模板需要配合，增加耦合
- **选择器优先级需控制**：内联 style 天然最高优先级，注入 style 需要注意不被模板已有样式覆盖
- **不减少回流次数**：读取 `offsetTop`（强制回流）+ 写入样式（触发回流）两步本质不变，性能无收益
- **调试稍麻烦**：内联 style 在 DevTools 元素面板直接可见，注入的 style 需要找动态 `<style>` 标签

## 结论与建议

| | 内联 style | 注入 style 标签 |
|---|---|---|
| 实现复杂度 | 低 | 中 |
| 优先级可控性 | 高（最高） | 中 |
| 打印/导出控制 | 需逐个清除 | 一键清空 |
| 性能 | 相同 | 相同 |
| 调试体验 | 直观 | 稍差 |

**注入 style 方案的核心优势在打印场景**：

- 若打印方案**直接打印当前 DOM**（如 `window.print()`），注入 style 可在打印前清空、打印后恢复，更优雅
- 若打印方案**克隆 wrapper 单独处理**（如 `react-to-print`、`iframe` 方案），动态 style 标签不会自动跟随克隆节点，分页偏移自然不生效，两种方案差异不大

综合来看，如果后续打印方案采用直接打印当前 DOM 的方式，**注入 style 标签是更优的选择**；否则内联 style 更简单直接。
