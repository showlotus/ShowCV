import type { ResumeSettings, TemplateInfo } from '../types';

// 字体预设
export const FONT_PRESETS = [
  {
    id: 'default',
    name: '默认',
    value: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  {
    id: 'pingfang',
    name: '苹方',
    value: '"PingFang SC", "PingFang TC", -apple-system, BlinkMacSystemFont, sans-serif',
  },
  {
    id: 'notosanssc',
    name: '思源黑体',
    value: '"Noto Sans SC", "Source Han Sans SC", sans-serif',
  },
];

// 默认字体设置
export const DEFAULT_FONT_SETTINGS = {
  titleSize: 28,
  headingSize: 18,
  bodySize: 14,
  smallSize: 12,
  lineHeight: 1.6,
  fontFamily: FONT_PRESETS[0].value,
};

// 默认颜色设置
export const DEFAULT_COLOR_SETTINGS = {
  primary: '#2563eb',
  text: '#1f2937',
  muted: '#6b7280',
  background: '#ffffff',
};

// 默认间距设置
export const DEFAULT_SPACING_SETTINGS = {
  sectionGap: 24,
  paragraphGap: 12,
  padding: 40,
};

// 默认完整设置
export const DEFAULT_SETTINGS: ResumeSettings = {
  font: DEFAULT_FONT_SETTINGS,
  color: DEFAULT_COLOR_SETTINGS,
  spacing: DEFAULT_SPACING_SETTINGS,
};

// 预设主题色
export const PRESET_COLORS = [
  { name: '蓝色', value: '#2563eb' },
  { name: '青色', value: '#0891b2' },
  { name: '绿色', value: '#059669' },
  { name: '紫色', value: '#7c3aed' },
  { name: '红色', value: '#dc2626' },
  { name: '橙色', value: '#ea580c' },
  { name: '灰色', value: '#4b5563' },
];

// 模板列表
export const TEMPLATE_LIST: TemplateInfo[] = [
  {
    id: 'simple',
    name: '简约',
    description: '经典简约风格，适合传统行业',
  },
  {
    id: 'modern',
    name: '现代',
    description: '现代专业风格，适合互联网/科技',
  },
  {
    id: 'creative',
    name: '创意',
    description: '创意设计风格，适合设计/创意岗位',
  },
];

// 默认简历内容
export const DEFAULT_CONTENT = `# 张三
软件工程师 | 北京 | 138-xxxx-xxxx | email@example.com

## 个人简介
5年前端开发经验，专注于 React 生态系统和前端工程化。热爱技术，追求代码质量和用户体验。

## 工作经历

### 高级前端工程师 - 某科技公司
*2021.03 - 至今*

- 负责核心产品前端架构设计，主导技术选型
- 主导微前端改造项目，将构建时间从 5 分钟优化到 1 分钟
- 建立前端监控体系，问题发现率提升 60%
- 指导团队成员进行代码审查和技术分享

### 前端工程师 - 某互联网公司
*2019.07 - 2021.02*

- 参与电商平台前端开发，负责商品详情页和购物车模块
- 使用 React + TypeScript 重构老旧项目，代码可维护性显著提升
- 优化首屏加载速度，LCP 从 3.2s 降至 1.8s

## 教育背景

### 计算机科学与技术学士 - 某大学
*2015.09 - 2019.06*

- GPA: 3.8/4.0
- 主修课程：数据结构、算法、计算机网络、操作系统

## 专业技能
- **前端框架**: React, Vue, Next.js
- **语言**: TypeScript, JavaScript, HTML, CSS
- **工程化**: Webpack, Vite, ESLint, Prettier
- **工具**: Git, Docker, CI/CD
- **其他**: Node.js, GraphQL, RESTful API
`;

// localStorage 键名
export const STORAGE_KEYS = {
  CURRENT_RESUME: 'showcv:current',
  RESUME_LIST: 'showcv:resumes',
  APP_SETTINGS: 'showcv:settings',
} as const;
