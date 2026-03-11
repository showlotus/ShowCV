/** 应用主题类型 */
export type AppTheme = 'dark' | 'light' | 'ocean' | 'forest'

/** 主题 CSS 变量值 */
export interface ThemeVariables {
  bgPrimary: string
  bgSecondary: string
  bgTertiary: string
  fgPrimary: string
  fgSecondary: string
  fgMuted: string
  accent: string
  accentSoft: string
  border: string
  card: string
  glow: string
  danger: string
  dangerSoft: string
  success: string
  successSoft: string
}

/** 主题信息 */
export interface ThemeInfo {
  id: AppTheme
  name: string
  gradient: string
  variables: ThemeVariables
}

/** 深色主题 */
const darkTheme: ThemeInfo = {
  id: 'dark',
  name: '深色',
  gradient: 'linear-gradient(135deg, #09090b 50%, #f59e0b 50%)',
  variables: {
    bgPrimary: '#09090b',
    bgSecondary: '#18181b',
    bgTertiary: '#27272a',
    fgPrimary: '#fafafa',
    fgSecondary: '#a1a1aa',
    fgMuted: '#71717a',
    accent: '#f59e0b',
    accentSoft: 'rgba(245, 158, 11, 0.15)',
    border: '#3f3f46',
    card: '#1c1c1f',
    glow: 'rgba(245, 158, 11, 0.4)',
    danger: '#ef4444',
    dangerSoft: 'rgba(239, 68, 68, 0.15)',
    success: '#22c55e',
    successSoft: 'rgba(34, 197, 94, 0.15)',
  },
}

/** 浅色主题 */
const lightTheme: ThemeInfo = {
  id: 'light',
  name: '浅色',
  gradient: 'linear-gradient(135deg, #f8f7f4 50%, #d97706 50%)',
  variables: {
    bgPrimary: '#f8f7f4',
    bgSecondary: '#ffffff',
    bgTertiary: '#e8e6e1',
    fgPrimary: '#18181b',
    fgSecondary: '#52525b',
    fgMuted: '#a1a1aa',
    accent: '#d97706',
    accentSoft: 'rgba(217, 119, 6, 0.1)',
    border: '#d4d4d8',
    card: '#ffffff',
    glow: 'rgba(217, 119, 6, 0.3)',
    danger: '#dc2626',
    dangerSoft: 'rgba(220, 38, 38, 0.1)',
    success: '#16a34a',
    successSoft: 'rgba(22, 163, 74, 0.1)',
  },
}

/** 海洋主题 */
const oceanTheme: ThemeInfo = {
  id: 'ocean',
  name: '海洋',
  gradient: 'linear-gradient(135deg, #0c1222 50%, #06b6d4 50%)',
  variables: {
    bgPrimary: '#0c1222',
    bgSecondary: '#131c31',
    bgTertiary: '#1a2744',
    fgPrimary: '#e2e8f0',
    fgSecondary: '#94a3b8',
    fgMuted: '#64748b',
    accent: '#06b6d4',
    accentSoft: 'rgba(6, 182, 212, 0.15)',
    border: '#334155',
    card: '#1a2744',
    glow: 'rgba(6, 182, 212, 0.4)',
    danger: '#f43f5e',
    dangerSoft: 'rgba(244, 63, 94, 0.15)',
    success: '#10b981',
    successSoft: 'rgba(16, 185, 129, 0.15)',
  },
}

/** 森林主题 */
const forestTheme: ThemeInfo = {
  id: 'forest',
  name: '森林',
  gradient: 'linear-gradient(135deg, #0f1410 50%, #10b981 50%)',
  variables: {
    bgPrimary: '#0f1410',
    bgSecondary: '#171f1a',
    bgTertiary: '#1f2b23',
    fgPrimary: '#ecfdf5',
    fgSecondary: '#a7f3d0',
    fgMuted: '#6ee7b7',
    accent: '#10b981',
    accentSoft: 'rgba(16, 185, 129, 0.15)',
    border: '#2d4a3a',
    card: '#1a2720',
    glow: 'rgba(16, 185, 129, 0.4)',
    danger: '#f87171',
    dangerSoft: 'rgba(248, 113, 113, 0.15)',
    success: '#34d399',
    successSoft: 'rgba(52, 211, 153, 0.15)',
  },
}

/** 主题列表 */
export const THEME_LIST: ThemeInfo[] = [darkTheme, lightTheme, oceanTheme, forestTheme]

/** 根据 ID 获取主题信息 */
export function getThemeById(id: AppTheme): ThemeInfo | undefined {
  return THEME_LIST.find((theme) => theme.id === id)
}

/** 应用主题到 DOM */
export function applyTheme(theme: AppTheme): void {
  document.documentElement.setAttribute('data-theme', theme)
}
