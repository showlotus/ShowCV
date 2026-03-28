import type { ResumeSettings } from '@/types'

// 主题相关 - 从 themes 模块重新导出
export { THEME_LIST, getThemeById, applyTheme } from '@/themes'
export type { AppTheme, ThemeInfo, ThemeVariables } from '@/themes'

// 字体预设
export const FONT_PRESETS = [
  {
    id: 'default',
    name: '默认',
    value:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  {
    id: 'pingfang',
    name: '苹方',
    value: '"PingFang SC", -apple-system, BlinkMacSystemFont, sans-serif',
  },
  {
    id: 'notosanssc',
    name: '思源黑体',
    value: '"Noto Sans SC", sans-serif',
  },
  {
    id: 'weiruanyahei',
    name: '微软雅黑',
    value: '"Microsoft YaHei", "WeiRuanYaHei", sans-serif',
  },
  {
    id: 'timesnewroman',
    name: 'Times New Roman',
    value: '"Times New Roman", Times, serif',
  },
]

// 默认字体设置
export const DEFAULT_FONT_SETTINGS = {
  h1TitleSize: 24,
  h2TitleSize: 16,
  h3TitleSize: 12,
  bodySize: 12,
  smallSize: 12,
  lineHeight: 14,
  fontFamily: FONT_PRESETS[0].value,
}

// 默认颜色设置
export const DEFAULT_COLOR_SETTINGS = {
  primary: '#d97706',
  text: '#1f2937',
  muted: '#6b7280',
  background: '#ffffff',
}

// 默认间距设置
export const DEFAULT_SPACING_SETTINGS = {
  padding: 30,
  h2TitleTopGap: 24,
  h2TitleBottomGap: 12,
  h3TitleTopGap: 12,
  h3TitleBottomGap: 6,
}

// 默认头像设置
export const DEFAULT_AVATAR_SETTINGS = {
  src: '',
  visible: true,
  size: 80,
  naturalWidth: 0,
  naturalHeight: 0,
  borderRadius: 10,
}

// 默认完整设置
export const DEFAULT_SETTINGS: ResumeSettings = {
  font: DEFAULT_FONT_SETTINGS,
  color: DEFAULT_COLOR_SETTINGS,
  spacing: DEFAULT_SPACING_SETTINGS,
}

type PartialResumeSettings = {
  font?: Partial<ResumeSettings['font']>
  color?: Partial<ResumeSettings['color']>
  spacing?: Partial<ResumeSettings['spacing']>
  avatar?: Partial<ResumeSettings['avatar']> | null
}

/**
 * 归一化字体设置
 * @param font 原始字体设置
 */
export function normalizeFontSettings(
  font?: Partial<ResumeSettings['font']> | null
): ResumeSettings['font'] {
  return {
    h1TitleSize: font?.h1TitleSize ?? DEFAULT_FONT_SETTINGS.h1TitleSize,
    h2TitleSize: font?.h2TitleSize ?? DEFAULT_FONT_SETTINGS.h2TitleSize,
    h3TitleSize: font?.h3TitleSize ?? DEFAULT_FONT_SETTINGS.h3TitleSize,
    bodySize: font?.bodySize ?? DEFAULT_FONT_SETTINGS.bodySize,
    smallSize: font?.smallSize ?? DEFAULT_FONT_SETTINGS.smallSize,
    lineHeight: font?.lineHeight ?? DEFAULT_FONT_SETTINGS.lineHeight,
    fontFamily: font?.fontFamily ?? DEFAULT_FONT_SETTINGS.fontFamily,
  }
}

/**
 * 归一化间距设置
 * @param spacing 原始间距设置
 */
export function normalizeSpacingSettings(
  spacing?: Partial<ResumeSettings['spacing']> | null
): ResumeSettings['spacing'] {
  return {
    padding: spacing?.padding ?? DEFAULT_SPACING_SETTINGS.padding,
    h2TitleTopGap: spacing?.h2TitleTopGap ?? DEFAULT_SPACING_SETTINGS.h2TitleTopGap,
    h2TitleBottomGap: spacing?.h2TitleBottomGap ?? DEFAULT_SPACING_SETTINGS.h2TitleBottomGap,
    h3TitleTopGap: spacing?.h3TitleTopGap ?? DEFAULT_SPACING_SETTINGS.h3TitleTopGap,
    h3TitleBottomGap: spacing?.h3TitleBottomGap ?? DEFAULT_SPACING_SETTINGS.h3TitleBottomGap,
  }
}

/**
 * 归一化完整简历设置
 * @param settings 原始简历设置
 */
export function normalizeResumeSettings(settings?: PartialResumeSettings | null): ResumeSettings {
  const base: ResumeSettings = {
    font: normalizeFontSettings(settings?.font),
    color: {
      ...DEFAULT_COLOR_SETTINGS,
      ...(settings?.color ?? {}),
    },
    spacing: normalizeSpacingSettings(settings?.spacing),
  }

  if (settings?.avatar?.src) {
    return {
      ...base,
      avatar: {
        src: settings.avatar.src,
        visible: settings.avatar.visible ?? DEFAULT_AVATAR_SETTINGS.visible,
        size: settings.avatar.size ?? DEFAULT_AVATAR_SETTINGS.size,
        naturalWidth: settings.avatar.naturalWidth ?? DEFAULT_AVATAR_SETTINGS.naturalWidth,
        naturalHeight: settings.avatar.naturalHeight ?? DEFAULT_AVATAR_SETTINGS.naturalHeight,
        borderRadius: settings.avatar.borderRadius ?? DEFAULT_AVATAR_SETTINGS.borderRadius,
      },
    }
  }
  return base
}

// 预设主题色
export const PRESET_COLORS = [
  { name: '橘黄', value: '#d97706' },
  { name: '烟蓝', value: '#2d5fa0' },
  { name: '深青', value: '#0e7490' },
  { name: '墨绿', value: '#166534' },
  { name: '藏蓝', value: '#1e3a5f' },
  { name: '暗紫', value: '#5b21b6' },
  { name: '深红', value: '#991b1b' },
  { name: '黑色', value: '#000000' },
]

// 默认简历内容
export const DEFAULT_CONTENT = `# 张三

**前端开发工程师**

所在地：杭州 | 电话: 138-xxxx-1111 | 邮箱: zhangsan@email.com  

年龄：26 | 性别：男

---

## 个人简介

- 具备较强的问题分析与解决能力，能够快速定位问题根因并提供有效解决方案。
- 热爱开源，持续关注前沿前端技术动态，积极参与开源社区，保持技术敏感度。
- 保持技术输出习惯，在个人网站分享技术博客、阅读笔记及实践心得，沉淀技术经验。

---

## 技能

- **基础**：HTML5, CSS3, JavaScript (ES6+), TypeScript。
- **框架/库**：React (Redux, React Router, Next.js), Vue (Vuex, Vue Router, Nuxt.js)。
- **工程化**：Webpack, Vite, Babel, ESLint, Prettier, Gulp。
- **样式/UI**：Ant Design, Element UI, Tailwind CSS, SCSS, Styled Components。
- **测试**：Jest, React Testing Library, Cypress。
- **网络/协议**：HTTP/HTTPS, WebSocket, RESTful API, GraphQL (基础)。
- **后端/运维**：Node.js (Express), Nginx, Docker, Git, CI/CD (GitHub Actions)。
- **其他**：性能优化 (Lighthouse, 首屏加载), 浏览器原理, 前端安全 (XSS, CSRF), 移动端适配, 小程序开发。

---

## 工作经历

### XX信息技术有限公司 · 前端开发工程师  ||  2021.07 – 至今

- 参与公司主要产品“电商X”商家后台和H5商城的开发，基于 **Vue + Element UI**，实现商品管理、订单处理等核心模块。
- 重构旧项目，使用 **Webpack** 优化打包配置，引入 **ESLint + Prettier** 规范代码，提高可维护性。
- 开发可复用的组件库，包括图片上传、富文本编辑器等，提升开发效率 **40%**。
- 配合产品优化页面交互，通过懒加载、虚拟滚动等技术优化长列表渲染，页面流畅度显著提升。

---

## 项目经验

### XX云管理后台  ||  2023.01 – 至今

- 技术栈：React 18, TypeScript, Ant Design, Redux Toolkit, ECharts。
- 负责整体架构设计，采用模块化组织路由和状态管理，使用 **RTK Query** 处理API请求，简化数据同步逻辑。
- 实现动态权限控制（RBAC），根据用户角色动态生成菜单和路由，保证系统安全性。
- 开发数据可视化大屏，使用 **ECharts** 展示实时监控数据，通过 **WebSocket** 实现数据更新。
- 优化打包配置，启用gzip压缩、Tree Shaking，将构建产物减少 **40%**。

### XX商家后台  ||  2021.07 – 2022.12

- 技术栈：Vue 2, Vuex, Element UI, Webpack, Axios。
- 独立完成商品管理模块，包括商品列表、编辑、分类选择等复杂交互，封装通用表格和表单组件，复用率提高 **60%**。
- 基于 **ECharts** 实现销售数据统计图表，支持多维度切换，数据加载性能提升 **25%**。
- 优化首屏加载，使用路由懒加载和CDN加速，使首屏时间从 **2.5s降至1.5s**。
- 编写单元测试（Jest）和端到端测试（Cypress），代码覆盖率从50%提升至 **85%**。

---

## 教育背景
**XX大学** · 计算机科学与技术 · 本科  ||  2017.09 – 2021.06

- 主修课程：数据结构、操作系统、计算机网络、Web开发基础。
- 毕业设计：《基于Vue的在线考试系统》获优秀毕设。

---

## 自我评价

- 热爱技术，持续学习，关注前端前沿动态，定期输出技术博客。
- 良好的沟通能力和团队合作精神，善于推动跨部门协作。
- 有责任心和执行力，能独立承担复杂模块的开发与维护。
`

// localStorage 键名
export const STORAGE_KEYS = {
  CURRENT_RESUME: 'showcv:current',
  RESUME_LIST: 'showcv:resumes',
  APP_SETTINGS: 'showcv:settings',
} as const
