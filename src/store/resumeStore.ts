import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ResumeSettings, TemplateId, ResumeData, AppTheme } from '@/types'
import { DEFAULT_SETTINGS, DEFAULT_CONTENT } from '@/utils/constants'
import { generateId } from '@/utils'

// 单个简历的数据结构
export interface ResumeItem {
  id: string
  name: string
  content: string
  templateId: TemplateId
  settings: ResumeSettings
  createdAt: number
  updatedAt: number
}

interface ResumeStore {
  // 主题
  theme: AppTheme

  // 简历列表
  resumes: ResumeItem[]
  currentResumeId: string | null

  // 当前简历的快捷访问（计算属性）
  currentResume: ResumeItem | null

  // Theme Actions
  setTheme: (theme: AppTheme) => void

  // Resume List Actions
  createResume: (name?: string) => string
  deleteResume: (id: string) => void
  renameResume: (id: string, name: string) => void
  selectResume: (id: string) => void

  // Current Resume Actions
  setContent: (content: string) => void
  setTemplate: (id: TemplateId) => void
  updateFontSettings: (font: Partial<ResumeSettings['font']>) => void
  updateColorSettings: (color: Partial<ResumeSettings['color']>) => void
  updateSpacingSettings: (spacing: Partial<ResumeSettings['spacing']>) => void
  resetSettings: () => void

  // Export/Import
  exportData: () => ResumeData
  importData: (data: ResumeData) => void
}

// 创建默认简历
const createDefaultResume = (): ResumeItem => ({
  id: generateId(),
  name: '我的简历',
  content: DEFAULT_CONTENT,
  templateId: 'simple',
  settings: DEFAULT_SETTINGS,
  createdAt: Date.now(),
  updatedAt: Date.now(),
})

export const useResumeStore = create<ResumeStore>()(
  persist(
    (set, get) => ({
      // 初始状态
      theme: 'dark' as AppTheme,
      resumes: [createDefaultResume()],
      currentResumeId: null,
      currentResume: null,

      // 设置主题
      setTheme: (theme) => {
        set({ theme })
        document.documentElement.setAttribute('data-theme', theme)
      },

      // 创建新简历
      createResume: (name) => {
        const newResume: ResumeItem = {
          id: generateId(),
          name: name || `简历 ${(get().resumes.length || 0) + 1}`,
          content: '',
          templateId: 'simple',
          settings: { ...DEFAULT_SETTINGS },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }
        set((state) => ({
          resumes: [newResume, ...state.resumes],
          currentResumeId: newResume.id,
          currentResume: newResume,
        }))
        return newResume.id
      },

      // 删除简历
      deleteResume: (id) => {
        set((state) => {
          const newResumes = state.resumes.filter((r) => r.id !== id)
          // 如果删除的是当前选中的，选择第一个
          const newCurrentId =
            state.currentResumeId === id
              ? newResumes[0]?.id || null
              : state.currentResumeId
          return {
            resumes: newResumes.length > 0 ? newResumes : [createDefaultResume()],
            currentResumeId: newCurrentId,
            currentResume: newResumes.find((r) => r.id === newCurrentId) || null,
          }
        })
      },

      // 重命名简历
      renameResume: (id, name) => {
        set((state) => ({
          resumes: state.resumes.map((r) =>
            r.id === id ? { ...r, name, updatedAt: Date.now() } : r
          ),
          currentResume:
            state.currentResumeId === id
              ? { ...state.currentResume!, name, updatedAt: Date.now() }
              : state.currentResume,
        }))
      },

      // 选择简历
      selectResume: (id) => {
        set((state) => ({
          currentResumeId: id,
          currentResume: state.resumes.find((r) => r.id === id) || null,
        }))
      },

      // 更新当前简历内容
      setContent: (content) => {
        set((state) => {
          if (!state.currentResumeId) return state
          const updatedResume = {
            ...state.currentResume!,
            content,
            updatedAt: Date.now(),
          }
          return {
            currentResume: updatedResume,
            resumes: state.resumes.map((r) =>
              r.id === state.currentResumeId ? updatedResume : r
            ),
          }
        })
      },

      // 设置模板
      setTemplate: (templateId) => {
        set((state) => {
          if (!state.currentResumeId) return state
          const updatedResume = {
            ...state.currentResume!,
            templateId,
            updatedAt: Date.now(),
          }
          return {
            currentResume: updatedResume,
            resumes: state.resumes.map((r) =>
              r.id === state.currentResumeId ? updatedResume : r
            ),
          }
        })
      },

      // 更新字体设置
      updateFontSettings: (font) => {
        set((state) => {
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
            resumes: state.resumes.map((r) =>
              r.id === state.currentResumeId ? updatedResume : r
            ),
          }
        })
      },

      // 更新颜色设置
      updateColorSettings: (color) => {
        set((state) => {
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
            resumes: state.resumes.map((r) =>
              r.id === state.currentResumeId ? updatedResume : r
            ),
          }
        })
      },

      // 更新间距设置
      updateSpacingSettings: (spacing) => {
        set((state) => {
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
            resumes: state.resumes.map((r) =>
              r.id === state.currentResumeId ? updatedResume : r
            ),
          }
        })
      },

      // 重置设置
      resetSettings: () => {
        set((state) => {
          if (!state.currentResumeId) return state
          const updatedResume = {
            ...state.currentResume!,
            settings: { ...DEFAULT_SETTINGS },
            updatedAt: Date.now(),
          }
          return {
            currentResume: updatedResume,
            resumes: state.resumes.map((r) =>
              r.id === state.currentResumeId ? updatedResume : r
            ),
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
            settings: DEFAULT_SETTINGS,
            templateId: 'simple' as TemplateId,
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
      importData: (data) => {
        set((state) => {
          const newResume: ResumeItem = {
            id: generateId(),
            name: data.title,
            content: data.content,
            templateId: data.templateId,
            settings: data.settings,
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
      partialize: (state) => ({
        theme: state.theme,
        resumes: state.resumes,
        currentResumeId: state.currentResumeId,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // 恢复主题
          document.documentElement.setAttribute('data-theme', state.theme)
          // 恢复当前简历
          if (state.currentResumeId) {
            state.currentResume =
              state.resumes.find((r) => r.id === state.currentResumeId) || null
          } else if (state.resumes.length > 0) {
            state.currentResumeId = state.resumes[0].id
            state.currentResume = state.resumes[0]
          }
        }
      },
    }
  )
)
