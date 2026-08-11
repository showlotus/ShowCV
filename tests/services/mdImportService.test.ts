// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import {
  isMarkdownFile,
  resumeNameFromFileName,
  dedupeResumeNames,
  readMarkdownFiles,
  estimateImportBytes,
  MAX_MD_FILE_SIZE,
} from '@/services/mdImportService'

/** 构造指定大小的假文件，避免真的分配 1MB 字符串 */
function makeFile(name: string, content = '# hi', size?: number): File {
  const file = new File([content], name, { type: 'text/markdown' })
  if (size !== undefined) Object.defineProperty(file, 'size', { value: size })
  return file
}

describe('isMarkdownFile', () => {
  it('识别 .md 与 .markdown，忽略大小写', () => {
    expect(isMarkdownFile(makeFile('a.md'))).toBe(true)
    expect(isMarkdownFile(makeFile('a.MD'))).toBe(true)
    expect(isMarkdownFile(makeFile('a.Markdown'))).toBe(true)
  })

  it('拒绝其他扩展名与无扩展名', () => {
    expect(isMarkdownFile(makeFile('a.txt'))).toBe(false)
    expect(isMarkdownFile(makeFile('a.mdx'))).toBe(false)
    expect(isMarkdownFile(makeFile('README'))).toBe(false)
  })
})

describe('resumeNameFromFileName', () => {
  it('去掉扩展名', () => {
    expect(resumeNameFromFileName('前端-张三.md')).toBe('前端-张三')
    expect(resumeNameFromFileName('cv.markdown')).toBe('cv')
  })

  it('保留文件名中间的点', () => {
    expect(resumeNameFromFileName('张三.v2.md')).toBe('张三.v2')
  })

  it('去掉目录前缀', () => {
    expect(resumeNameFromFileName('resumes/2026/张三.md')).toBe('张三')
    expect(resumeNameFromFileName('C:\\cv\\李四.md')).toBe('李四')
  })

  it('只有扩展名或空白时回落到默认名', () => {
    expect(resumeNameFromFileName('.md')).toBe('.md')
    expect(resumeNameFromFileName('   .md')).toBe('未命名简历')
    expect(resumeNameFromFileName('')).toBe('未命名简历')
  })

  it('去掉首尾空白', () => {
    expect(resumeNameFromFileName('  张三 .md')).toBe('张三')
  })
})

describe('dedupeResumeNames', () => {
  it('无冲突时原样返回', () => {
    expect(dedupeResumeNames(['a', 'b'], ['c'])).toEqual(['a', 'b'])
  })

  it('与已有简历冲突时追加序号', () => {
    expect(dedupeResumeNames(['张三'], ['张三'])).toEqual(['张三 (2)'])
    expect(dedupeResumeNames(['张三'], ['张三', '张三 (2)'])).toEqual(['张三 (3)'])
  })

  it('同批次内重名也要区分', () => {
    expect(dedupeResumeNames(['张三', '张三', '张三'], [])).toEqual([
      '张三',
      '张三 (2)',
      '张三 (3)',
    ])
  })

  it('同批次与已有名称叠加', () => {
    expect(dedupeResumeNames(['张三', '张三'], ['张三'])).toEqual(['张三 (2)', '张三 (3)'])
  })
})

describe('readMarkdownFiles', () => {
  it('读取内容并用文件名作为简历名', async () => {
    const result = await readMarkdownFiles([
      makeFile('张三.md', '# 张三'),
      makeFile('李四.md', '# 李四'),
    ])
    expect(result.skipped).toEqual([])
    expect(result.ok).toEqual([
      { name: '张三', content: '# 张三' },
      { name: '李四', content: '# 李四' },
    ])
  })

  it('跳过非 md 文件并给出原因', async () => {
    const result = await readMarkdownFiles([makeFile('a.txt'), makeFile('b.md', '# b')])
    expect(result.ok).toEqual([{ name: 'b', content: '# b' }])
    expect(result.skipped).toEqual([{ fileName: 'a.txt', reason: '不是 .md 文件' }])
  })

  it('跳过超过 1MB 的文件', async () => {
    const result = await readMarkdownFiles([
      makeFile('big.md', '# big', MAX_MD_FILE_SIZE + 1),
      makeFile('ok.md', '# ok'),
    ])
    expect(result.ok).toEqual([{ name: 'ok', content: '# ok' }])
    expect(result.skipped).toEqual([{ fileName: 'big.md', reason: '超过 1MB' }])
  })

  it('保持传入顺序', async () => {
    const result = await readMarkdownFiles([
      makeFile('3.md', 'c'),
      makeFile('1.md', 'a'),
      makeFile('2.md', 'b'),
    ])
    expect(result.ok.map(item => item.name)).toEqual(['3', '1', '2'])
  })

  it('空数组返回空结果', async () => {
    expect(await readMarkdownFiles([])).toEqual({ ok: [], skipped: [] })
  })
})

describe('estimateImportBytes', () => {
  it('按 UTF-8 字节累加名称与内容', () => {
    // 中文 3 字节：'张' + 'ab' = 5
    expect(estimateImportBytes([{ name: '张', content: 'ab' }])).toBe(5)
    expect(estimateImportBytes([])).toBe(0)
  })
})
