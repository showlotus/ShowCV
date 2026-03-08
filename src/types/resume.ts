import type { ResumeSettings, TemplateId } from './settings';

// 简历数据
export interface ResumeData {
  id: string;
  title: string;
  content: string;           // Markdown 原文
  settings: ResumeSettings;
  templateId: TemplateId;
  createdAt: string;
  updatedAt: string;
}

// 简历元信息（列表用）
export interface ResumeMeta {
  id: string;
  title: string;
  updatedAt: string;
}
