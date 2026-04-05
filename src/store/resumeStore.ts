import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ResumeSettings, TemplateId, ResumeData, AppTheme } from '@/types'
import { DEFAULT_CONTENT, normalizeResumeSettings } from '@/utils/constants'
import defaultAvatarSrc from '@/assets/avatar.png?url'
import { generateId } from '@/utils'
import { T1_DEFAULT_SETTINGS } from '@/templates/T1'
import { T2_DEFAULT_SETTINGS } from '@/templates/T2'
import { T3_DEFAULT_SETTINGS } from '@/templates/T3'
import { T4_DEFAULT_SETTINGS } from '@/templates/T4'

// 获取模板专属默认配置
function getTemplateDefaults(templateId: TemplateId): ResumeSettings | null {
  switch (templateId) {
    case 'T1':
      return T1_DEFAULT_SETTINGS
    case 'T2':
      return T2_DEFAULT_SETTINGS
    case 'T3':
      return T3_DEFAULT_SETTINGS
    case 'T4':
      return T4_DEFAULT_SETTINGS
    default:
      return null
  }
}

// 单个简历的数据结构
export interface ResumeItem {
  id: string
  name: string
  content: string
  templateId: TemplateId
  settings: ResumeSettings
  createdAt: number
  updatedAt: number
  fromShare?: boolean // 是否来自分享链接
}

interface ResumeStore {
  // 主题
  theme: AppTheme

  // 预览模式：平铺 | 分页
  previewMode: 'flat' | 'paginated'

  // 简历列表
  resumes: ResumeItem[]
  currentResumeId: string | null

  // 当前简历的快捷访问（计算属性）
  currentResume: ResumeItem | null

  // Theme Actions
  setTheme: (theme: AppTheme) => void

  // Preview Mode Actions
  setPreviewMode: (mode: 'flat' | 'paginated') => void

  // Resume List Actions
  createResume: (initial?: Partial<Omit<ResumeItem, 'id' | 'createdAt' | 'updatedAt'>>) => string
  deleteResume: (id: string) => void
  renameResume: (id: string, name: string) => void
  selectResume: (id: string) => void

  // Current Resume Actions
  setContent: (content: string) => void
  setTemplate: (id: TemplateId) => void
  updateFontSettings: (font: Partial<ResumeSettings['font']>) => void
  updateColorSettings: (color: Partial<ResumeSettings['color']>) => void
  updateSpacingSettings: (spacing: Partial<ResumeSettings['spacing']>) => void
  updateLayoutSettings: (layout: Partial<ResumeSettings['layout']>) => void
  updateAvatarSettings: (avatar: Partial<ResumeSettings['avatar']>) => void
  removeAvatar: () => void
  resetSettings: () => void

  // Export/Import
  exportData: () => ResumeData
  importData: (data: ResumeData) => void
}

// 创建默认简历
const createDefaultResume = (): ResumeItem => {
  const settings = normalizeResumeSettings(null, getTemplateDefaults('T1'))
  return {
    id: generateId(),
    name: '我的简历',
    content: DEFAULT_CONTENT,
    templateId: 'T1',
    settings: {
      ...settings,
      avatar: {
        src: defaultAvatarSrc,
        visible: true,
        size: 80,
        naturalWidth: 200,
        naturalHeight: 200,
        borderRadius: 10,
      },
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}

export const useResumeStore = create<ResumeStore>()(
  persist(
    (set, get) => ({
      // 初始状态：读取系统主题偏好
      theme: (window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light') as AppTheme,
      // 预览模式默认为平铺
      previewMode: 'flat',
      resumes: [createDefaultResume()],
      currentResumeId: null,
      currentResume: null,

      // 设置主题
      setTheme: theme => {
        set({ theme })
        document.documentElement.setAttribute('data-theme', theme)
      },

      // 设置预览模式
      setPreviewMode: mode => {
        set({ previewMode: mode })
      },

      // 创建新简历
      createResume: initial => {
        const newResume: ResumeItem = {
          id: generateId(),
          name: initial?.name || `简历 ${(get().resumes.length || 0) + 1}`,
          content: initial?.content ?? '',
          templateId: initial?.templateId ?? 'T1',
          settings: normalizeResumeSettings(
            initial?.settings,
            getTemplateDefaults(initial?.templateId ?? 'T1')
          ),
          fromShare: initial?.fromShare,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }
        set(state => ({
          resumes: [newResume, ...state.resumes],
          currentResumeId: newResume.id,
          currentResume: newResume,
        }))
        return newResume.id
      },

      // 删除简历
      deleteResume: id => {
        set(state => {
          const newResumes = state.resumes.filter(r => r.id !== id)
          // 如果删除的是当前选中的，选择第一个
          const newCurrentId =
            state.currentResumeId === id ? newResumes[0]?.id || null : state.currentResumeId
          return {
            resumes: newResumes.length > 0 ? newResumes : [createDefaultResume()],
            currentResumeId: newCurrentId,
            currentResume: newResumes.find(r => r.id === newCurrentId) || null,
          }
        })
      },

      // 重命名简历
      renameResume: (id, name) => {
        set(state => ({
          resumes: state.resumes.map(r =>
            r.id === id ? { ...r, name, updatedAt: Date.now() } : r
          ),
          currentResume:
            state.currentResumeId === id
              ? { ...state.currentResume!, name, updatedAt: Date.now() }
              : state.currentResume,
        }))
      },

      // 选择简历
      selectResume: id => {
        set(state => ({
          currentResumeId: id,
          currentResume: state.resumes.find(r => r.id === id) || null,
        }))
      },

      // 更新当前简历内容
      setContent: content => {
        set(state => {
          if (!state.currentResumeId) return state
          const updatedResume = {
            ...state.currentResume!,
            content,
            updatedAt: Date.now(),
          }
          return {
            currentResume: updatedResume,
            resumes: state.resumes.map(r => (r.id === state.currentResumeId ? updatedResume : r)),
          }
        })
      },

      // 设置模板
      setTemplate: templateId => {
        set(state => {
          if (!state.currentResumeId) return state
          const current = state.currentResume!.settings
          const newSettings = normalizeResumeSettings(
            { font: {}, color: {}, spacing: {}, avatar: current.avatar, layout: current.layout },
            getTemplateDefaults(templateId)
          )
          // 切换模板时只保留用户主题色、字体、头像和布局
          newSettings.color.primary = current.color.primary
          newSettings.font.fontFamily = current.font.fontFamily
          const updatedResume = {
            ...state.currentResume!,
            templateId,
            settings: newSettings,
            updatedAt: Date.now(),
          }
          return {
            currentResume: updatedResume,
            resumes: state.resumes.map(r => (r.id === state.currentResumeId ? updatedResume : r)),
          }
        })
      },

      // 更新字体设置
      updateFontSettings: font => {
        set(state => {
          if (!state.currentResumeId) return state
          const updatedResume = {
            ...state.currentResume!,
            settings: {
              ...state.currentResume!.settings,
              font: { ...state.currentResume!.settings.font, ...font },
            },
            updatedAt: Date.now(),
          }
          return {
            currentResume: updatedResume,
            resumes: state.resumes.map(r => (r.id === state.currentResumeId ? updatedResume : r)),
          }
        })
      },

      // 更新颜色设置
      updateColorSettings: color => {
        set(state => {
          if (!state.currentResumeId) return state
          const updatedResume = {
            ...state.currentResume!,
            settings: {
              ...state.currentResume!.settings,
              color: { ...state.currentResume!.settings.color, ...color },
            },
            updatedAt: Date.now(),
          }
          return {
            currentResume: updatedResume,
            resumes: state.resumes.map(r => (r.id === state.currentResumeId ? updatedResume : r)),
          }
        })
      },

      // 更新间距设置
      updateSpacingSettings: spacing => {
        set(state => {
          if (!state.currentResumeId) return state
          const updatedResume = {
            ...state.currentResume!,
            settings: {
              ...state.currentResume!.settings,
              spacing: { ...state.currentResume!.settings.spacing, ...spacing },
            },
            updatedAt: Date.now(),
          }
          return {
            currentResume: updatedResume,
            resumes: state.resumes.map(r => (r.id === state.currentResumeId ? updatedResume : r)),
          }
        })
      },

      // 更新布局设置
      updateLayoutSettings: layout => {
        set(state => {
          if (!state.currentResumeId) return state
          const updatedResume = {
            ...state.currentResume!,
            settings: {
              ...state.currentResume!.settings,
              layout: { ...state.currentResume!.settings.layout, ...layout },
            },
            updatedAt: Date.now(),
          }
          return {
            currentResume: updatedResume,
            resumes: state.resumes.map(r => (r.id === state.currentResumeId ? updatedResume : r)),
          }
        })
      },

      // 更新头像设置
      updateAvatarSettings: avatar => {
        set(state => {
          if (!state.currentResumeId) return state
          const current = state.currentResume!
          const updatedResume = {
            ...current,
            settings: {
              ...current.settings,
              avatar: {
                ...current.settings.avatar,
                src: current.settings.avatar?.src ?? '',
                visible: current.settings.avatar?.visible ?? true,
                size: current.settings.avatar?.size ?? 72,
                naturalWidth: current.settings.avatar?.naturalWidth ?? 0,
                naturalHeight: current.settings.avatar?.naturalHeight ?? 0,
                borderRadius: current.settings.avatar?.borderRadius ?? 50,
                ...avatar,
              },
            },
            updatedAt: Date.now(),
          }
          return {
            currentResume: updatedResume,
            resumes: state.resumes.map(r => (r.id === state.currentResumeId ? updatedResume : r)),
          }
        })
      },

      // 移除头像
      removeAvatar: () => {
        set(state => {
          if (!state.currentResumeId) return state
          const current = state.currentResume!
          const restSettings = { ...current.settings, avatar: undefined }
          const updatedResume = {
            ...current,
            settings: restSettings as ResumeSettings,
            updatedAt: Date.now(),
          }
          return {
            currentResume: updatedResume,
            resumes: state.resumes.map(r => (r.id === state.currentResumeId ? updatedResume : r)),
          }
        })
      },

      // 重置设置
      resetSettings: () => {
        set(state => {
          if (!state.currentResumeId) return state
          const updatedResume = {
            ...state.currentResume!,
            settings: normalizeResumeSettings(
              null,
              getTemplateDefaults(state.currentResume!.templateId)
            ),
            updatedAt: Date.now(),
          }
          return {
            currentResume: updatedResume,
            resumes: state.resumes.map(r => (r.id === state.currentResumeId ? updatedResume : r)),
          }
        })
      },

      // 导出数据
      exportData: () => {
        const state = get()
        const resume = state.currentResume
        if (!resume) {
          return {
            id: generateId(),
            title: '未命名简历',
            content: '',
            settings: normalizeResumeSettings(null, getTemplateDefaults('T1')),
            templateId: 'T1' as TemplateId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        }
        return {
          id: resume.id,
          title: resume.name,
          content: resume.content,
          settings: resume.settings,
          templateId: resume.templateId,
          createdAt: new Date(resume.createdAt).toISOString(),
          updatedAt: new Date(resume.updatedAt).toISOString(),
        }
      },

      // 导入数据
      importData: data => {
        set(state => {
          const newResume: ResumeItem = {
            id: generateId(),
            name: data.title,
            content: data.content,
            templateId: data.templateId,
            settings: normalizeResumeSettings(data.settings, getTemplateDefaults(data.templateId)),
            createdAt: Date.now(),
            updatedAt: Date.now(),
          }
          return {
            resumes: [newResume, ...state.resumes],
            currentResumeId: newResume.id,
            currentResume: newResume,
          }
        })
      },
    }),
    {
      name: 'showcv-resume',
      partialize: state => ({
        theme: state.theme,
        previewMode: state.previewMode,
        resumes: state.resumes,
        currentResumeId: state.currentResumeId,
      }),
      onRehydrateStorage: () => state => {
        if (state) {
          state.resumes = state.resumes.map(resume => ({
            ...resume,
            settings: normalizeResumeSettings(resume.settings, getTemplateDefaults(resume.templateId)),
          }))
          // 恢复主题
          document.documentElement.setAttribute('data-theme', state.theme)
          // 恢复当前简历
          if (state.currentResumeId) {
            state.currentResume = state.resumes.find(r => r.id === state.currentResumeId) || null
          } else if (state.resumes.length > 0) {
            state.currentResumeId = state.resumes[0].id
            state.currentResume = state.resumes[0]
          }
        }
      },
    }
  )
)
