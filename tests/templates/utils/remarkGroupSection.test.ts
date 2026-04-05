import { unified } from 'unified'
import remarkParse from 'remark-parse'
import { remarkGroupSection } from '@/templates/utils/remarkGroupSection'
import type { Root, RootContent } from 'mdast'

interface DataNode {
  data?: { hName?: string; hProperties?: Record<string, string> }
}

function isElement(node: RootContent, tagName: string): boolean {
  return node.type === 'blockquote' && (node as unknown as DataNode).data?.hName === tagName
}

function isSection(node: RootContent): boolean {
  return isElement(node, 'section')
}

function getDepth(node: RootContent): number {
  return node.type === 'heading' ? (node as { depth: number }).depth : 0
}

function isHeader(node: RootContent): boolean {
  return isElement(node, 'header')
}

async function process(markdown: string): Promise<Root> {
  const tree = unified().use(remarkParse).parse(markdown) as Root
  await unified().use(remarkGroupSection).run(tree)
  return tree
}

describe('remarkGroupSection', () => {
  it('groups h2 + content into a section', async () => {
    const tree = await process('## Skills\n- React\n- Vue')
    expect(tree.children).toHaveLength(1)
    expect(isSection(tree.children[0])).toBe(true)
  })

  it('groups h2 with h3 children — expands instead of wrapping', async () => {
    const tree = await process('## Work\n### Company A\n- Job 1\n### Company B\n- Job 2')
    // h2 itself + 2 sections (one per h3)
    expect(tree.children).toHaveLength(3)
    expect(isSection(tree.children[1])).toBe(true)
    expect(isSection(tree.children[2])).toBe(true)
  })

  it('wraps h1 + following content into a header', async () => {
    const tree = await process('# Zhang San\nContact info\n## Skills\n- React')
    // header + section (for h2)
    expect(tree.children).toHaveLength(2)
    expect(isHeader(tree.children[0])).toBe(true)
    expect(isSection(tree.children[1])).toBe(true)
  })

  it('extracts h1 text into data-name on header', async () => {
    const tree = await process('# Zhang San\n\nPhone: 123')
    const header = tree.children[0]
    expect(isHeader(header)).toBe(true)
    expect((header as unknown as DataNode).data?.hProperties?.['data-name']).toBe('Zhang San')
  })

  it('creates separate sections for multiple h2s', async () => {
    const tree = await process('## A\nContent A\n## B\nContent B')
    expect(tree.children).toHaveLength(2)
    expect(isSection(tree.children[0])).toBe(true)
    expect(isSection(tree.children[1])).toBe(true)
  })

  it('wraps standalone h3 into a section', async () => {
    const tree = await process('### Item 1\nSome content')
    expect(tree.children).toHaveLength(1)
    expect(isSection(tree.children[0])).toBe(true)
  })

  it('handles empty document', async () => {
    const tree = await process('')
    expect(tree.children).toHaveLength(0)
  })

  it('handles full resume structure', async () => {
    const tree = await process(
      '# 张三\n\n电话: 123\n\n## 个人简介\n- 简介1\n\n## 技能\n- React\n\n## 工作经历\n### 公司A || 2021-至今\n- 工作1\n### 公司B || 2019-2021\n- 工作2'
    )
    // First child should be header
    expect(isHeader(tree.children[0])).toBe(true)
    // header + 个人简介(section) + 技能(section) + 工作经历(h2 + section + section)
    expect(tree.children).toHaveLength(6)
    // 个人简介 and 技能 are wrapped sections (no h3 children)
    expect(isSection(tree.children[1])).toBe(true)
    expect(isSection(tree.children[2])).toBe(true)
    // 工作经历 expands: h2 node + 2 h3 sections
    expect(getDepth(tree.children[3])).toBe(2)
    expect(isSection(tree.children[4])).toBe(true)
    expect(isSection(tree.children[5])).toBe(true)
  })
})
