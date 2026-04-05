// @vitest-environment jsdom
import { encodeShareData, decodeShareData, generateShareUrl, getShareDataFromUrl, clearShareHash } from '@/services/shareService'
import { normalizeResumeSettings } from '@/utils/constants'
import type { ResumeSettings, TemplateId } from '@/types'

function makeSettings(overrides?: Partial<{ font: Partial<ResumeSettings['font']>; color: Partial<ResumeSettings['color']>; spacing: Partial<ResumeSettings['spacing']>; layout: Partial<ResumeSettings['layout']> }>): ResumeSettings {
  return normalizeResumeSettings(
    overrides ?? {},
    {
      font: { h1TitleSize: 24, h2TitleSize: 16, h3TitleSize: 12, bodySize: 12, smallSize: 12, lineHeight: 12, fontFamily: 'sans-serif' },
      color: { primary: '#d97706' },
      spacing: { padding: 40, h2TitleTopGap: 10, h2TitleBottomGap: 10, h3TitleTopGap: 4, h3TitleBottomGap: 4 },
      layout: { headerAlign: 'left' },
    }
  )
}

describe('encodeShareData / decodeShareData roundtrip', () => {
  const params = {
    content: '# Hello World\n\nThis is a test resume.',
    templateId: 'T1' as TemplateId,
    settings: makeSettings(),
    name: 'Test Resume',
  }

  it('roundtrip preserves content', () => {
    const encoded = encodeShareData(params)
    const decoded = decodeShareData(encoded)
    expect(decoded).not.toBeNull()
    expect(decoded!.content).toBe(params.content)
  })

  it('roundtrip preserves templateId', () => {
    const encoded = encodeShareData(params)
    const decoded = decodeShareData(encoded)
    expect(decoded!.templateId).toBe(params.templateId)
  })

  it('roundtrip preserves name', () => {
    const encoded = encodeShareData(params)
    const decoded = decodeShareData(encoded)
    expect(decoded!.name).toBe(params.name)
  })

  it('roundtrip preserves font settings', () => {
    const customSettings = makeSettings({ font: { h1TitleSize: 30, fontFamily: 'serif' } })
    const encoded = encodeShareData({ ...params, settings: customSettings })
    const decoded = decodeShareData(encoded)
    expect(decoded!.settings.font.h1TitleSize).toBe(30)
    expect(decoded!.settings.font.fontFamily).toBe('serif')
  })

  it('roundtrip preserves color settings', () => {
    const customSettings = makeSettings({ color: { primary: '#ff0000', text: '#333' } })
    const encoded = encodeShareData({ ...params, settings: customSettings })
    const decoded = decodeShareData(encoded)
    expect(decoded!.settings.color.primary).toBe('#ff0000')
    expect(decoded!.settings.color.text).toBe('#333')
  })

  it('roundtrip preserves spacing settings', () => {
    const customSettings = makeSettings({ spacing: { padding: 60, h2TitleTopGap: 20 } })
    const encoded = encodeShareData({ ...params, settings: customSettings })
    const decoded = decodeShareData(encoded)
    expect(decoded!.settings.spacing.padding).toBe(60)
    expect(decoded!.settings.spacing.h2TitleTopGap).toBe(20)
  })

  it('roundtrip preserves layout settings', () => {
    const customSettings = makeSettings({ layout: { headerAlign: 'center' } })
    const encoded = encodeShareData({ ...params, settings: customSettings })
    const decoded = decodeShareData(encoded)
    expect(decoded!.settings.layout.headerAlign).toBe('center')
  })

  it('returns null for invalid string', () => {
    expect(decodeShareData('invalid')).toBeNull()
  })

  it('returns null for empty string', () => {
    expect(decodeShareData('')).toBeNull()
  })

  it('returns null for non-base64 string', () => {
    expect(decodeShareData('!!!not-base64!!!')).toBeNull()
  })

  it('roundtrip works for all template IDs', () => {
    const templateIds: TemplateId[] = ['T1', 'T2', 'T3', 'T4']
    for (const tid of templateIds) {
      const encoded = encodeShareData({ ...params, templateId: tid })
      const decoded = decodeShareData(encoded)
      expect(decoded).not.toBeNull()
      expect(decoded!.templateId).toBe(tid)
    }
  })
})

describe('generateShareUrl', () => {
  beforeEach(() => {
    vi.stubGlobal('location', {
      origin: 'https://example.com',
      pathname: '/app',
      hash: '',
      href: 'https://example.com/app',
    })
  })

  it('generates URL with origin, pathname, and hash', () => {
    const url = generateShareUrl({
      content: '# Test',
      templateId: 'T1',
      settings: makeSettings(),
      name: 'Test',
    })
    expect(url).toMatch(/^https:\/\/example\.com\/app#[A-Za-z0-9+/=]+$/)
  })
})

describe('getShareDataFromUrl', () => {
  beforeEach(() => {
    vi.stubGlobal('location', {
      origin: 'https://example.com',
      pathname: '/app',
      hash: '',
      href: 'https://example.com/app',
    })
  })

  it('decodes data from URL hash', () => {
    const params = {
      content: '# Test',
      templateId: 'T1' as TemplateId,
      settings: makeSettings(),
      name: 'My CV',
    }
    const hash = encodeShareData(params)
    window.location.hash = `#${hash}`
    const result = getShareDataFromUrl()
    expect(result).not.toBeNull()
    expect(result!.content).toBe('# Test')
    expect(result!.name).toBe('My CV')
  })

  it('returns null when hash is empty', () => {
    expect(getShareDataFromUrl()).toBeNull()
  })

  it('returns null for invalid hash', () => {
    window.location.hash = '#invalid'
    expect(getShareDataFromUrl()).toBeNull()
  })
})

describe('clearShareHash', () => {
  it('calls history.replaceState to clear hash', () => {
    vi.stubGlobal('location', {
      origin: 'https://example.com',
      pathname: '/app',
      hash: '#somedata',
      href: 'https://example.com/app#somedata',
    })
    const replaceStateSpy = vi.spyOn(history, 'replaceState').mockImplementation(() => {})
    clearShareHash()
    expect(replaceStateSpy).toHaveBeenCalledWith({}, '', 'https://example.com/app')
    replaceStateSpy.mockRestore()
  })
})
