// @vitest-environment jsdom

// 头像资源在 store 中以 ?url 导入，jsdom 下需要 mock
vi.mock('@/assets/avatar.png?url', () => ({ default: 'data:image/png;base64,mock-avatar' }))

// 截图依赖 canvas，jsdom 无法真实渲染，只验证调用与打包流程
const domToBlob = vi.fn(async () => new Blob([new Uint8Array([1, 2, 3])], { type: 'image/png' }))
vi.mock('modern-screenshot', () => ({ domToBlob }))

import { exportResumeImages } from '@/services/imageExportService'
import { T1_DEFAULT_SETTINGS } from '@/templates/T1'
import type { ResumeItem } from '@/store/resumeStore'

vi.stubGlobal(
  'requestAnimationFrame',
  (cb: FrameRequestCallback) => setTimeout(() => cb(0), 0) as unknown as number
)

// jsdom 不实现 createObjectURL，直接补上而不是替换整个 URL 构造器
const createObjectURL = vi.fn(() => 'blob:mock')
const revokeObjectURL = vi.fn()
URL.createObjectURL = createObjectURL as unknown as typeof URL.createObjectURL
URL.revokeObjectURL = revokeObjectURL

/** 捕获 downloadBlob 触发的下载，避免 jsdom 真正导航 */
const downloads: string[] = []
vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
  this: HTMLAnchorElement
) {
  downloads.push(this.download)
})

function makeResume(name: string, id = name): ResumeItem {
  return {
    id,
    name,
    content: `# ${name}\n\n## 工作经历\n\n- 做了一些事情\n`,
    templateId: 'T1',
    settings: T1_DEFAULT_SETTINGS,
    createdAt: 0,
    updatedAt: 0,
  }
}

describe('exportResumeImages', () => {
  beforeEach(() => {
    downloads.length = 0
    domToBlob.mockClear()
  })

  it('rejects an empty selection', async () => {
    await expect(exportResumeImages([])).rejects.toThrow('请至少选择一份简历')
  })

  it('downloads a single page directly as PNG', async () => {
    const result = await exportResumeImages([makeResume('张三')], { scale: 1 })

    expect(result).toEqual({ fileCount: 1, fileName: '张三.png' })
    expect(downloads).toEqual(['张三.png'])
    expect(domToBlob).toHaveBeenCalledTimes(1)
  })

  it('packs multiple resumes into a zip and reports progress', async () => {
    const onProgress = vi.fn()
    const result = await exportResumeImages([makeResume('张三'), makeResume('李四')], {
      scale: 1,
      onProgress,
    })

    expect(result.fileCount).toBe(2)
    expect(result.fileName).toMatch(/^showcv-images-\d{8}\.zip$/)
    expect(downloads).toEqual([result.fileName])
    expect(onProgress.mock.calls).toEqual([
      [0, 2],
      [1, 2],
      [2, 2],
    ])
  })

  it('dedupes identical resume names inside the zip', async () => {
    const result = await exportResumeImages([makeResume('张三', 'a'), makeResume('张三', 'b')], {
      scale: 1,
    })

    expect(result.fileCount).toBe(2)
    expect(result.fileName).toMatch(/\.zip$/)
  })

  it('passes the requested scale through to the screenshot call', async () => {
    await exportResumeImages([makeResume('张三')], { scale: 3 })

    expect(domToBlob).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ scale: 3, backgroundColor: '#ffffff' })
    )
  })

  it('cleans up the offscreen container', async () => {
    const before = document.body.childElementCount
    await exportResumeImages([makeResume('张三')], { scale: 1 })

    expect(document.body.childElementCount).toBe(before)
  })

  it('honours an aborted signal', async () => {
    const controller = new AbortController()
    controller.abort()

    await expect(
      exportResumeImages([makeResume('张三')], { signal: controller.signal })
    ).rejects.toThrow(/取消/)
    expect(domToBlob).not.toHaveBeenCalled()
  })
})
