// @vitest-environment jsdom

// Mock the avatar asset import
vi.mock('@/assets/avatar.png?url', () => ({ default: 'data:image/png;base64,mock-avatar' }))

import { useResumeStore } from '@/store/resumeStore'
import type { ResumeData } from '@/types'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    }),
    get length() {
      return Object.keys(store).length
    },
    key: vi.fn((i: number) => Object.keys(store)[i] ?? null),
  }
})()

vi.stubGlobal('localStorage', localStorageMock)

// Mock document.documentElement.setAttribute
const setAttributeSpy = vi.spyOn(document.documentElement, 'setAttribute').mockImplementation(() => '')

// Helper: get a valid resume ID from current state
function currentId(): string {
  const state = useResumeStore.getState()
  if (!state.currentResumeId && state.resumes.length > 0) {
    useResumeStore.getState().selectResume(state.resumes[0].id)
  }
  return useResumeStore.getState().currentResumeId!
}

beforeEach(() => {
  localStorageMock.clear()
  setAttributeSpy.mockClear()
})

describe('useResumeStore - initial state', () => {
  it('has one default resume', () => {
    const { resumes } = useResumeStore.getState()
    expect(resumes).toHaveLength(1)
    expect(resumes[0].name).toBe('我的简历')
    expect(resumes[0].templateId).toBe('T1')
  })

  it('theme defaults to light when matchMedia returns false', () => {
    expect(useResumeStore.getState().theme).toBe('light')
  })

  it('previewMode defaults to flat', () => {
    expect(useResumeStore.getState().previewMode).toBe('flat')
  })
})

describe('createResume', () => {
  it('adds a new resume to the list', () => {
    const before = useResumeStore.getState().resumes.length
    const id = useResumeStore.getState().createResume()
    const { resumes, currentResumeId } = useResumeStore.getState()
    expect(resumes).toHaveLength(before + 1)
    expect(currentResumeId).toBe(id)
  })

  it('creates with initial values', () => {
    const id = useResumeStore.getState().createResume({
      name: 'Test CV',
      content: '# Hello',
      templateId: 'T2',
    })
    const resume = useResumeStore.getState().resumes.find(r => r.id === id)
    expect(resume!.name).toBe('Test CV')
    expect(resume!.content).toBe('# Hello')
    expect(resume!.templateId).toBe('T2')
  })
})

describe('deleteResume', () => {
  it('removes the resume from the list', () => {
    useResumeStore.getState().createResume()
    const id = currentId()
    useResumeStore.getState().deleteResume(id)
    expect(useResumeStore.getState().resumes.find(r => r.id === id)).toBeUndefined()
  })

  it('selects another resume when current is deleted', () => {
    const newId = useResumeStore.getState().createResume()
    expect(useResumeStore.getState().currentResumeId).toBe(newId)
    useResumeStore.getState().deleteResume(newId)
    expect(useResumeStore.getState().currentResumeId).not.toBe(newId)
  })

  it('creates a default resume when last one is deleted', () => {
    // Keep deleting until only 1 remains, then delete that one
    while (useResumeStore.getState().resumes.length > 1) {
      useResumeStore.getState().deleteResume(useResumeStore.getState().resumes[0].id)
    }
    const lastId = useResumeStore.getState().resumes[0].id
    useResumeStore.getState().deleteResume(lastId)
    expect(useResumeStore.getState().resumes).toHaveLength(1)
  })
})

describe('renameResume', () => {
  it('updates the resume name', () => {
    const id = currentId()
    useResumeStore.getState().renameResume(id, 'New Name')
    const resume = useResumeStore.getState().resumes.find(r => r.id === id)
    expect(resume!.name).toBe('New Name')
  })

  it('updates currentResume if renamed', () => {
    const id = currentId()
    useResumeStore.getState().renameResume(id, 'Renamed')
    expect(useResumeStore.getState().currentResume!.name).toBe('Renamed')
  })
})

describe('selectResume', () => {
  it('switches currentResumeId and currentResume', () => {
    const newId = useResumeStore.getState().createResume({ name: 'Second' })
    // Select the first resume
    const firstId = useResumeStore.getState().resumes.find(r => r.id !== newId)!.id
    const firstName = useResumeStore.getState().resumes.find(r => r.id === firstId)!.name
    useResumeStore.getState().selectResume(firstId)
    expect(useResumeStore.getState().currentResumeId).toBe(firstId)
    expect(useResumeStore.getState().currentResume!.name).toBe(firstName)
  })
})

describe('setContent', () => {
  it('updates current resume content', () => {
    useResumeStore.getState().setContent('# New Content')
    expect(useResumeStore.getState().currentResume!.content).toBe('# New Content')
  })
})

describe('setTemplate', () => {
  it('switches template and resets settings to new defaults', () => {
    // Set a custom font size
    useResumeStore.getState().updateFontSettings({ h1TitleSize: 50 })
    expect(useResumeStore.getState().currentResume!.settings.font.h1TitleSize).toBe(50)

    // Switch to T2
    useResumeStore.getState().setTemplate('T2')
    const { currentResume } = useResumeStore.getState()
    expect(currentResume!.templateId).toBe('T2')
    // h1TitleSize should be reset to T2 defaults (not 50)
    expect(currentResume!.settings.font.h1TitleSize).not.toBe(50)
  })

  it('preserves primary color and fontFamily', () => {
    useResumeStore.getState().updateColorSettings({ primary: '#ff0000' })
    useResumeStore.getState().updateFontSettings({ fontFamily: 'serif' })
    const prevColor = useResumeStore.getState().currentResume!.settings.color.primary
    const prevFont = useResumeStore.getState().currentResume!.settings.font.fontFamily

    useResumeStore.getState().setTemplate('T3')
    const { currentResume } = useResumeStore.getState()
    expect(currentResume!.settings.color.primary).toBe(prevColor)
    expect(currentResume!.settings.font.fontFamily).toBe(prevFont)
  })
})

describe('updateFontSettings', () => {
  it('partially updates font settings', () => {
    useResumeStore.getState().updateFontSettings({ h1TitleSize: 30 })
    const { font } = useResumeStore.getState().currentResume!.settings
    expect(font.h1TitleSize).toBe(30)
    // Other fields preserved
    expect(font.fontFamily).toBeDefined()
  })
})

describe('updateColorSettings', () => {
  it('updates color settings', () => {
    useResumeStore.getState().updateColorSettings({ primary: '#000' })
    expect(useResumeStore.getState().currentResume!.settings.color.primary).toBe('#000')
  })
})

describe('updateSpacingSettings', () => {
  it('updates spacing settings', () => {
    useResumeStore.getState().updateSpacingSettings({ padding: 60 })
    expect(useResumeStore.getState().currentResume!.settings.spacing.padding).toBe(60)
  })
})

describe('updateLayoutSettings', () => {
  it('updates layout settings', () => {
    useResumeStore.getState().updateLayoutSettings({ headerAlign: 'center' })
    expect(useResumeStore.getState().currentResume!.settings.layout.headerAlign).toBe('center')
  })
})

describe('removeAvatar', () => {
  it('removes avatar from settings', () => {
    // Default resume has avatar
    expect(useResumeStore.getState().currentResume!.settings.avatar).toBeDefined()
    useResumeStore.getState().removeAvatar()
    expect(useResumeStore.getState().currentResume!.settings.avatar).toBeUndefined()
  })
})

describe('resetSettings', () => {
  it('resets settings to template defaults', () => {
    useResumeStore.getState().updateFontSettings({ h1TitleSize: 99 })
    useResumeStore.getState().updateColorSettings({ primary: '#ff0' })
    useResumeStore.getState().resetSettings()
    const { currentResume } = useResumeStore.getState()
    // Should be back to T1 defaults
    expect(currentResume!.settings.font.h1TitleSize).not.toBe(99)
    expect(currentResume!.settings.color.primary).not.toBe('#ff0')
  })
})

describe('setTheme', () => {
  it('updates theme and calls setAttribute on document', () => {
    useResumeStore.getState().setTheme('dark')
    expect(useResumeStore.getState().theme).toBe('dark')
    expect(setAttributeSpy).toHaveBeenCalledWith('data-theme', 'dark')
  })
})

describe('setPreviewMode', () => {
  it('updates preview mode', () => {
    useResumeStore.getState().setPreviewMode('paginated')
    expect(useResumeStore.getState().previewMode).toBe('paginated')
  })
})

describe('exportData / importData', () => {
  it('exports current resume data', () => {
    const { templateId, name } = useResumeStore.getState().currentResume!
    useResumeStore.getState().setContent('# Export Test')
    const data = useResumeStore.getState().exportData()
    expect(data.content).toBe('# Export Test')
    expect(data.templateId).toBe(templateId)
    expect(data.title).toBe(name)
    expect(data.createdAt).toBeTruthy()
    expect(data.updatedAt).toBeTruthy()
  })

  it('importData creates a new resume', () => {
    const before = useResumeStore.getState().resumes.length
    const importData: ResumeData = {
      id: 'import-id',
      title: 'Imported CV',
      content: '# Imported',
      settings: useResumeStore.getState().currentResume!.settings,
      templateId: 'T2',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    useResumeStore.getState().importData(importData)
    const { resumes, currentResume } = useResumeStore.getState()
    expect(resumes).toHaveLength(before + 1)
    expect(currentResume!.name).toBe('Imported CV')
    expect(currentResume!.content).toBe('# Imported')
    expect(currentResume!.templateId).toBe('T2')
  })
})
