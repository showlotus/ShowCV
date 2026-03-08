import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ResumeSettings, TemplateId, ResumeData } from '../types';
import { DEFAULT_SETTINGS, DEFAULT_CONTENT } from '../utils/constants';
import { generateId } from '../utils';

interface ResumeStore {
  // 状态
  content: string;
  templateId: TemplateId;
  settings: ResumeSettings;
  resumeTitle: string;

  // Actions
  setContent: (content: string) => void;
  setTemplate: (id: TemplateId) => void;
  updateFontSettings: (font: Partial<ResumeSettings['font']>) => void;
  updateColorSettings: (color: Partial<ResumeSettings['color']>) => void;
  updateSpacingSettings: (spacing: Partial<ResumeSettings['spacing']>) => void;
  resetSettings: () => void;
  exportData: () => ResumeData;
  importData: (data: ResumeData) => void;
}

export const useResumeStore = create<ResumeStore>()(
  persist(
    (set, get) => ({
      // 初始状态
      content: DEFAULT_CONTENT,
      templateId: 'simple',
      settings: DEFAULT_SETTINGS,
      resumeTitle: '我的简历',

      // 设置内容
      setContent: (content) => set({ content }),

      // 设置模板
      setTemplate: (templateId) => set({ templateId }),

      // 更新字体设置
      updateFontSettings: (font) =>
        set((state) => ({
          settings: {
            ...state.settings,
            font: { ...state.settings.font, ...font },
          },
        })),

      // 更新颜色设置
      updateColorSettings: (color) =>
        set((state) => ({
          settings: {
            ...state.settings,
            color: { ...state.settings.color, ...color },
          },
        })),

      // 更新间距设置
      updateSpacingSettings: (spacing) =>
        set((state) => ({
          settings: {
            ...state.settings,
            spacing: { ...state.settings.spacing, ...spacing },
          },
        })),

      // 重置设置
      resetSettings: () => set({ settings: DEFAULT_SETTINGS }),

      // 导出数据
      exportData: () => {
        const state = get();
        return {
          id: generateId(),
          title: state.resumeTitle,
          content: state.content,
          settings: state.settings,
          templateId: state.templateId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      },

      // 导入数据
      importData: (data) =>
        set({
          content: data.content,
          settings: data.settings,
          templateId: data.templateId,
          resumeTitle: data.title,
        }),
    }),
    {
      name: 'showcv-resume',
    }
  )
);
