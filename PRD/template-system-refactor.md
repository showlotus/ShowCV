# 模板系统重构方案

## 文档信息

| 项目 | 内容 |
|------|------|
| 创建日期 | 2026-03-11 |
| 更新日期 | 2026-03-11 |
| 状态 | 待实施 |
| 优先级 | 高 |

---

## 1. 需求背景

### 1.1 当前问题

1. **代码分散**：模板相关代码分布在 4 个位置
   - `src/types/settings.ts` - 类型定义
   - `src/utils/constants.ts` - 常量配置
   - `src/styles/templates.css` - CSS 样式
   - `src/layouts/` - 布局组件

2. **重复代码**：存在两套几乎相同的模板实现
   - `src/layouts/` - SimpleLayout, ModernLayout, CreativeLayout
   - `src/components/templates/` - BaseTemplate, ModernTemplate, CreativeTemplate

3. **CSS 类名不一致**：
   - `ModernLayout` 使用 `modern-layout`，但 CSS 定义的是 `modern-template`
   - `CreativeLayout` 使用 `creative-layout`，但 CSS 定义的是 `creative-template`

4. **扩展性差**：当前架构不适合大规模模板扩展

### 1.2 业务需求

- 未来需要支持 **30+ 模板**
- 模板采用 **代号命名**（如 t01, t02, ... t30）
- 需要支持模板分类、搜索、缩略图
- 需要代码分割，按需加载

---

## 2. 目标

1. **内聚性**：每个模板的 TSX、CSS、资源文件聚合在同一目录
2. **可扩展**：添加新模板只需新增一个目录
3. **代码分割**：支持动态加载，首屏不加载所有模板
4. **类型安全**：TypeScript 保证模板实现规范
5. **可维护**：清晰的目录结构和命名规范

---

## 3. 技术方案

### 3.1 目录结构

```
src/templates/
├── index.ts                    # 统一导出 + 动态加载器
├── types.ts                    # 类型定义
├── registry.ts                 # 模板注册表（元数据）
│
├── shared/                     # 共享资源
│   ├── styles.css             # 基础样式变量
│   ├── components/            # 共享子组件
│   │   ├── SectionTitle.tsx
│   │   ├── MarkdownRenderer.tsx
│   │   └── index.ts
│   └── utils.ts               # 共享工具函数
│
├── t01/                        # 代号命名（简约模板）
│   ├── index.ts               # 导出 + 元数据
│   ├── Layout.tsx             # 主组件
│   └── styles.css             # 样式
│
├── t02/                        # 现代模板
│   ├── index.ts
│   ├── Layout.tsx
│   └── styles.css
│
├── t03/                        # 创意模板
│   └── ...
│
└── t30/                        # 更多模板...
    └── ...
```

### 3.2 类型定义 (`types.ts`)

```typescript
/** 模板代号（联合类型，严格约束） */
export type TemplateId = 't01' | 't02' | 't03' | 't04' | 't05' | 't06' | 't07' | 't08' | 't09' | 't10'

/** 模板分类 */
export type TemplateCategory = 'classic' | 'modern' | 'creative'

/** 模板元数据 */
export interface TemplateInfo {
  id: TemplateId
  name: string                    // 显示名称
  category: TemplateCategory      // 分类
  tags: string[]                  // 标签：['简约', '单栏', '适合IT']
  description: string
  // 注意：无 thumbnail，模板选择器使用用户 markdown 内容实时渲染预览
}

/** 模板组件 Props */
export interface TemplateProps {
  content: string
  settings: ResumeSettings
  className?: string
}

/** 模块导出规范 */
export interface TemplateModule {
  default: React.ComponentType<TemplateProps>
  info: TemplateInfo
}
```

### 3.3 模板注册表 (`registry.ts`)

```typescript
import type { TemplateId, TemplateInfo, TemplateModule, TemplateCategory } from './types'

/** 动态加载器映射（单一维护点） */
const templateLoaders: Record<TemplateId, () => Promise<TemplateModule>> = {
  t01: () => import('./t01'),
  t02: () => import('./t02'),
  t03: () => import('./t03'),
  // 新增模板只需在此处添加一行
}

/** 缓存已加载的模块 */
const moduleCache = new Map<TemplateId, TemplateModule>()

/** 获取模板模块（带缓存） */
async function getTemplateModule(id: TemplateId): Promise<TemplateModule> {
  if (moduleCache.has(id)) {
    return moduleCache.get(id)!
  }
  const loader = templateLoaders[id]
  if (!loader) throw new Error(`Template not found: ${id}`)
  const module = await loader()
  moduleCache.set(id, module)
  return module
}

/** 获取模板组件 */
export async function getTemplateComponent(id: TemplateId) {
  const module = await getTemplateModule(id)
  return module.default
}

/** 获取模板元数据（从模块中提取，避免双重维护） */
export async function getTemplateInfo(id: TemplateId): Promise<TemplateInfo> {
  const module = await getTemplateModule(id)
  return module.info
}

/** 获取所有模板元数据（用于列表展示，按需加载） */
export async function getAllTemplateInfo(): Promise<TemplateInfo[]> {
  const ids = Object.keys(templateLoaders) as TemplateId[]
  const infos = await Promise.all(ids.map(getTemplateInfo))
  return infos
}

/** 按分类筛选模板 */
export async function getTemplatesByCategory(category: TemplateCategory): Promise<TemplateInfo[]> {
  const all = await getAllTemplateInfo()
  return all.filter(t => t.category === category)
}

/** 搜索模板 */
export async function searchTemplates(query: string): Promise<TemplateInfo[]> {
  const all = await getAllTemplateInfo()
  const q = query.toLowerCase()
  return all.filter(t =>
    t.name.toLowerCase().includes(q) ||
    t.tags.some(tag => tag.includes(q))
  )
}

/** 获取所有模板 ID（同步，用于初始化） */
export function getTemplateIds(): TemplateId[] {
  return Object.keys(templateLoaders) as TemplateId[]
}

export { templateLoaders }
```

### 3.4 统一导出 (`index.ts`)

```typescript
import React from 'react'
import type { TemplateId, TemplateModule, TemplateProps } from './types'

// 重新导出所有注册表功能
export {
  getTemplateComponent,
  getTemplateInfo,
  getAllTemplateInfo,
  getTemplatesByCategory,
  searchTemplates,
  getTemplateIds,
  templateLoaders,
} from './registry'

// 重新导出类型
export type { TemplateId, TemplateInfo, TemplateProps, TemplateCategory, TemplateModule } from './types'

/** React Lazy 包装（带错误处理） */
export function createLazyTemplate(id: TemplateId) {
  return React.lazy(() =>
    import('./registry').then(({ getTemplateComponent }) =>
      getTemplateComponent(id).then(c => ({ default: c }))
    )
  )
}
```

### 3.5 单个模板结构

**t01/index.ts**
```typescript
import type { TemplateModule } from '../types'
import { Layout } from './Layout'

export default Layout

export const info: TemplateInfo = {
  id: 't01',
  name: '经典简约',
  category: 'classic',
  tags: ['简约', '单栏'],
  description: '经典简约风格，适合传统行业',
}
```

**t01/Layout.tsx**
```typescript
import { useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { TemplateProps } from '../types'
import { useMarkdownComponents } from '../shared/components'
import './styles.css'

export function Layout({ content, settings, className }: TemplateProps) {
  const { font, color, spacing } = settings
  const markdownComponents = useMarkdownComponents(color)

  const style = useMemo(() => ({
    '--primary-color': color.primary,
    '--text-color': color.text,
    '--title-size': `${font.titleSize}px`,
    // ...
  }), [font, color, spacing])

  return (
    <div className={`t01-layout ${className || ''}`} style={style}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {content}
      </ReactMarkdown>
    </div>
  )
}
```

### 3.6 使用示例

```tsx
// ==================== 错误边界组件 ====================
import { Component, ReactNode } from 'react'

interface ErrorBoundaryProps {
  fallback?: ReactNode
  children: ReactNode
}

class TemplateErrorBoundary extends Component<ErrorBoundaryProps, { hasError: boolean }> {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <div className="template-error">模板加载失败</div>
    }
    return this.props.children
  }
}

// ==================== 内容截断工具 ====================
/** 截断 Markdown 内容用于预览 */
function truncateMarkdown(content: string, maxLength = 500): string {
  if (content.length <= maxLength) return content

  // 尝试在段落边界截断
  const truncated = content.slice(0, maxLength)
  const lastParagraph = truncated.lastIndexOf('\n\n')

  if (lastParagraph > maxLength * 0.5) {
    return truncated.slice(0, lastParagraph) + '\n\n...'
  }
  return truncated + '...'
}

// ==================== 模板列表展示（优化版） ====================
import { getTemplateIds, createLazyTemplate } from '@/templates'
import { useVirtualizer } from '@tanstack/react-virtual'

function TemplateSelector({ content, settings }) {
  const templateIds = getTemplateIds()
  const parentRef = useRef<HTMLDivElement>(null)

  // 虚拟滚动：只渲染可见区域
  const rowVirtualizer = useVirtualizer({
    count: templateIds.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 200, // 预估卡片高度
    overscan: 3, // 预渲染上下 3 个
  })

  // 预览内容截断
  const previewContent = useMemo(() => truncateMarkdown(content), [content])

  // 预览设置（缩小版）
  const previewSettings = useMemo(() => ({
    ...settings,
    font: { ...settings.font, titleSize: 14, bodySize: 10 },
    spacing: { ...settings.spacing, padding: 12, sectionGap: 8 },
  }), [settings])

  return (
    <div ref={parentRef} className="template-list" style={{ height: '600px', overflow: 'auto' }}>
      <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative' }}>
        {rowVirtualizer.getVirtualItems().map(virtualRow => {
          const templateId = templateIds[virtualRow.index]
          return (
            <div
              key={templateId}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <TemplateErrorBoundary fallback={<TemplateSkeleton />}>
                <LazyTemplatePreview
                  templateId={templateId}
                  content={previewContent}
                  settings={previewSettings}
                />
              </TemplateErrorBoundary>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ==================== 懒加载预览组件（带并发控制） ====================
const MAX_CONCURRENT_RENDERS = 5
let currentRenders = 0
const renderQueue: (() => void)[] = []

function acquireRenderSlot(): Promise<void> {
  if (currentRenders < MAX_CONCURRENT_RENDERS) {
    currentRenders++
    return Promise.resolve()
  }
  return new Promise(resolve => renderQueue.push(resolve))
}

function releaseRenderSlot() {
  const next = renderQueue.shift()
  if (next) next()
  else currentRenders--
}

const LazyTemplatePreview = ({ templateId, content, settings }) => {
  const [isVisible, setIsVisible] = useState(false)
  const [canRender, setCanRender] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Intersection Observer：进入视口才加载
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: '200px' } // 提前 200px 开始加载
    )

    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  // 并发控制：限制同时渲染数量
  useEffect(() => {
    if (!isVisible) return

    acquireRenderSlot().then(() => {
      setCanRender(true)
    })

    return () => {
      if (canRender) releaseRenderSlot()
    }
  }, [isVisible])

  const LazyTemplate = useMemo(
    () => canRender ? createLazyTemplate(templateId) : null,
    [templateId, canRender]
  )

  return (
    <div ref={ref} className="preview-container">
      {LazyTemplate ? (
        <Suspense fallback={<PreviewSkeleton />}>
          <div className="template-preview-wrapper" style={{ transform: 'scale(0.4)', transformOrigin: 'top left' }}>
            <LazyTemplate content={content} settings={settings} />
          </div>
        </Suspense>
      ) : (
        <PreviewSkeleton />
      )}
    </div>
  )
}

// ==================== 主预览区域 ====================
import { getTemplateComponent } from '@/templates'

function Preview({ templateId, content, settings }) {
  const [Template, setTemplate] = useState<React.ComponentType<TemplateProps> | null>(null)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    setError(null)
    getTemplateComponent(templateId)
      .then(setTemplate)
      .catch(setError)
  }, [templateId])

  if (error) return <TemplateLoadError error={error} />
  if (!Template) return <Loading />

  return (
    <TemplateErrorBoundary>
      <Template content={content} settings={settings} />
    </TemplateErrorBoundary>
  )
}

// 或使用 React.lazy + Suspense
function LazyPreview({ templateId, ...props }) {
  const LazyTemplate = useMemo(
    () => createLazyTemplate(templateId),
    [templateId]
  )

  return (
    <TemplateErrorBoundary fallback={<TemplateLoadError />}>
      <Suspense fallback={<Loading />}>
        <LazyTemplate {...props} />
      </Suspense>
    </TemplateErrorBoundary>
  )
}
```

---

## 4. 实施步骤

### 4.1 阶段一：创建新目录结构

1. 创建 `src/templates/` 目录
2. 创建 `types.ts`、`registry.ts`、`index.ts`
3. 创建 `shared/` 目录及共享组件

### 4.2 阶段二：迁移现有模板

1. 创建 `t01/`（Simple → t01 经典简约）
2. 创建 `t02/`（Modern → t02 现代双栏）
3. 创建 `t03/`（Creative → t03 创意设计）
4. 每个目录包含 `index.ts`、`Layout.tsx`、`styles.css`

### 4.3 阶段三：更新引用

1. 更新 `App.tsx` 使用动态加载
2. 更新 `PaginatedPreview.tsx`
3. 更新 `Header.tsx` 模板选择器
4. 更新 `resumeStore.ts` 类型

### 4.4 阶段四：清理旧代码

1. 删除 `src/layouts/` 目录
2. 删除 `src/components/templates/` 目录
3. 清理 `src/styles/templates.css`
4. 更新 `src/types/settings.ts` 重导出
5. 更新 `src/utils/constants.ts` 重导出

---

## 5. 文件变更清单

| 操作 | 文件 |
|------|------|
| 新建 | `src/templates/index.ts` |
| 新建 | `src/templates/types.ts` |
| 新建 | `src/templates/registry.ts` |
| 新建 | `src/templates/shared/styles.css` |
| 新建 | `src/templates/shared/components/index.ts` |
| 新建 | `src/templates/shared/utils.ts` (含 truncateMarkdown) |
| 新建 | `src/templates/t01/index.ts` |
| 新建 | `src/templates/t01/Layout.tsx` |
| 新建 | `src/templates/t01/styles.css` |
| 新建 | `src/templates/t02/...` |
| 新建 | `src/templates/t03/...` |
| 新建 | `src/components/common/TemplateErrorBoundary.tsx` |
| 修改 | `src/App.tsx` |
| 修改 | `src/components/preview/PaginatedPreview.tsx` |
| 修改 | `src/components/layout/Header.tsx` |
| 修改 | `src/store/resumeStore.ts` |
| 修改 | `src/types/settings.ts` |
| 修改 | `src/utils/constants.ts` |
| 修改 | `src/index.css` |
| 删除 | `src/layouts/` |
| 删除 | `src/components/templates/` |
| 清理 | `src/styles/templates.css` |
| 新增依赖 | `@tanstack/react-virtual` |

---

## 6. 向后兼容方案

现有简历使用 `'simple' | 'modern' | 'creative'` 作为 templateId，需要映射到新代号：

```typescript
// 旧 ID 到新 ID 的映射
const LEGACY_TEMPLATE_MAP = {
  'simple': 't01',
  'modern': 't02',
  'creative': 't03',
} as const

function normalizeTemplateId(id: string): TemplateId {
  return LEGACY_TEMPLATE_MAP[id] ?? id
}
```

在 store 中读取时自动转换，确保旧数据兼容。

---

## 7. 风险与注意事项

| 风险 | 缓解措施 | 状态 |
|------|---------|------|
| 动态 import 兼容性 | Vite 原生支持，无需额外配置 | ✅ 已解决 |
| 类型推导 | 使用联合类型 `'t01' \| 't02' \| ...` 严格约束 | ✅ 已解决 |
| 旧数据兼容 | 添加映射层自动转换 | ✅ 已解决 |
| 首屏加载闪烁 | 使用 Suspense + Loading 骨架屏 | ✅ 已解决 |
| 30+ 模板实时预览性能 | 虚拟滚动 + 懒加载 + 并发控制 + 内容截断 | ✅ 已解决 |
| 注册表/加载器双重维护 | 元数据从模块提取，单一维护点 | ✅ 已解决 |
| 模板加载失败 | TemplateErrorBoundary 错误边界 | ✅ 已解决 |

### 7.1 实时预览性能优化

模板选择器展示 30+ 个实时预览卡片时，采用以下优化策略：

| 策略 | 实现 | 效果 |
|------|------|------|
| 虚拟滚动 | `@tanstack/react-virtual` | 仅渲染可见区域 ~5 个 |
| 懒加载 | Intersection Observer | 进入视口才加载模板 |
| 内容截断 | `truncateMarkdown()` | 限制预览内容长度 500 字符 |
| 并发控制 | 信号量限流 | 最多同时渲染 5 个 |
| 模块缓存 | `moduleCache` Map | 避免重复加载 |

**依赖安装**：
```bash
pnpm add @tanstack/react-virtual
```

> 详细实现见 [3.6 使用示例](#36-使用示例)

---

## 8. 测试策略

### 8.1 单元测试

```typescript
// src/templates/__tests__/registry.test.ts
import { describe, it, expect } from 'vitest'
import { getTemplateComponent, getTemplateIds, getTemplateInfo } from '../registry'

describe('Template Registry', () => {
  it('should return all template ids', () => {
    const ids = getTemplateIds()
    expect(ids.length).toBeGreaterThan(0)
    expect(ids).toContain('t01')
  })

  it('should load template component', async () => {
    const Component = await getTemplateComponent('t01')
    expect(Component).toBeDefined()
    expect(typeof Component).toBe('function')
  })

  it('should load template info', async () => {
    const info = await getTemplateInfo('t01')
    expect(info.id).toBe('t01')
    expect(info.name).toBe('经典简约')
    expect(info.category).toBe('classic')
  })

  it('should throw for invalid template id', async () => {
    await expect(getTemplateComponent('invalid' as any)).rejects.toThrow('Template not found')
  })
})
```

### 8.2 组件测试

```typescript
// src/templates/__tests__/Layout.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Layout } from '../t01/Layout'

describe('t01 Layout', () => {
  const mockSettings = {
    font: { titleSize: 24, bodySize: 14, fontFamily: 'sans-serif' },
    color: { primary: '#333', text: '#666', background: '#fff' },
    spacing: { padding: 20, sectionGap: 16 },
  }

  it('should render markdown content', () => {
    render(<Layout content="# Hello World" settings={mockSettings} />)
    expect(screen.getByText('Hello World')).toBeInTheDocument()
  })

  it('should apply custom className', () => {
    const { container } = render(
      <Layout content="test" settings={mockSettings} className="custom-class" />
    )
    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('should apply CSS variables from settings', () => {
    const { container } = render(<Layout content="test" settings={mockSettings} />)
    expect(container.firstChild).toHaveStyle('--primary-color: #333')
  })
})
```

### 8.3 集成测试

```typescript
// src/templates/__tests__/integration.test.tsx
import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Preview } from '@/components/preview/Preview'

describe('Template Integration', () => {
  it('should render template with user content', async () => {
    render(
      <Preview
        templateId="t01"
        content="# John Doe\n\nSoftware Engineer"
        settings={mockSettings}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('Software Engineer')).toBeInTheDocument()
    })
  })
})
```

### 8.4 E2E 测试

```typescript
// e2e/template.spec.ts
import { test, expect } from '@playwright/test'

test('template selector renders all templates', async ({ page }) => {
  await page.goto('/')

  // 打开模板选择器
  await page.click('[data-testid="template-selector-button"]')

  // 等待模板列表加载
  await expect(page.locator('.template-list')).toBeVisible()

  // 验证至少有一个模板预览
  const previews = page.locator('.preview-container')
  await expect(previews.first()).toBeVisible()
})

test('switching templates updates preview', async ({ page }) => {
  await page.goto('/')

  // 切换模板
  await page.click('[data-testid="template-selector-button"]')
  await page.click('[data-testid="template-card-t02"]')

  // 验证预览更新
  await expect(page.locator('.preview-area')).toContainText('现代双栏')
})
```

### 8.5 快照测试

```typescript
// src/templates/__tests__/snapshots.test.tsx
import { render } from '@testing-library/react'
import { describe, it } from 'vitest'
import { Layout as T01Layout } from '../t01/Layout'
import { Layout as T02Layout } from '../t02/Layout'
import { Layout as T03Layout } from '../t03/Layout'

const mockSettings = { /* ... */ }
const sampleContent = `
# 张三
软件工程师

## 工作经历
### ABC 公司 | 2020-2023
- 开发核心功能
`

describe('Template Snapshots', () => {
  it('t01 matches snapshot', () => {
    const { container } = render(<T01Layout content={sampleContent} settings={mockSettings} />)
    expect(container).toMatchSnapshot()
  })

  it('t02 matches snapshot', () => {
    const { container } = render(<T02Layout content={sampleContent} settings={mockSettings} />)
    expect(container).toMatchSnapshot()
  })

  it('t03 matches snapshot', () => {
    const { container } = render(<T03Layout content={sampleContent} settings={mockSettings} />)
    expect(container).toMatchSnapshot()
  })
})
```

---

## 9. 后续扩展

- [ ] 模板预览性能优化（虚拟滚动、懒加载）
- [ ] 模板收藏/推荐
- [ ] 自定义模板上传
- [ ] 模板版本管理
- [ ] 模板市场/商店
