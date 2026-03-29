import type { Root, RootContent } from 'mdast'
import type { Plugin } from 'unified'

/** 从 mdast 节点递归提取纯文本 */
function extractText(node: RootContent): string {
  if (node.type === 'text') return node.value
  if ('children' in node && Array.isArray(node.children)) {
    return (node.children as RootContent[]).map(extractText).join('')
  }
  return ''
}

/**
 * remark 插件：三阶段分组
 *
 * 第一阶段：h3 分组
 *   每个 h3 及其后续非标题内容包成一个 section
 *
 * 第二阶段：h2 分组
 *   每个 h2 收集其后续节点
 *   - 若收集到的节点中含有 section（即有 h3 子项），展开输出，不整体包裹
 *   - 否则整体包成一个 section
 *
 * 第三阶段：h1 分组
 *   h1 之后、下一个 h1 或文档末尾之前的所有节点包成一个 header
 *   同时将 h1 文本注入 data-name 属性
 */
export const remarkGroupSection: Plugin<[], Root> = () => tree => {
  const makeElement = (
    nodes: RootContent[],
    tagName: string,
    className?: string,
    extraProps?: Record<string, string>
  ): RootContent =>
    ({
      type: 'blockquote',
      children: nodes,
      data: {
        hName: tagName,
        hProperties: { ...(className ? { className } : {}), ...extraProps },
      },
    }) as unknown as RootContent

  const getDepth = (node: RootContent) =>
    node.type === 'heading' ? (node as { depth: number }).depth : 0

  const isSection = (node: RootContent) =>
    node.type === 'blockquote' && (node as { data?: { hName?: string } }).data?.hName === 'section'

  // 第一阶段：h3 分组
  const pass1: RootContent[] = []
  let buf: RootContent[] | null = null

  const flush1 = () => {
    if (buf) {
      pass1.push(makeElement(buf, 'section'))
      buf = null
    }
  }

  for (const node of tree.children) {
    const depth = getDepth(node)
    if (depth === 3) {
      flush1()
      buf = [node]
    } else if (depth === 1 || depth === 2) {
      flush1()
      pass1.push(node)
    } else if (buf) {
      buf.push(node)
    } else {
      pass1.push(node)
    }
  }
  flush1()

  // 第二阶段：h2 分组
  const pass2: RootContent[] = []
  let h2Buf: RootContent[] | null = null

  const flush2 = () => {
    if (!h2Buf) return
    // 含有 h3-section 子节点：展开输出，h2 不整体包裹
    if (h2Buf.some(isSection)) {
      pass2.push(...h2Buf)
    } else {
      pass2.push(makeElement(h2Buf, 'section'))
    }
    h2Buf = null
  }

  for (const node of pass1) {
    const depth = getDepth(node)
    if (depth === 2) {
      flush2()
      h2Buf = [node]
    } else if (depth === 1) {
      flush2()
      pass2.push(node)
    } else if (h2Buf) {
      h2Buf.push(node)
    } else {
      pass2.push(node)
    }
  }
  flush2()

  // 第三阶段：h1 与 h2 之间的内容包成 header，注入 data-name
  const result: RootContent[] = []
  let h1Buf: RootContent[] | null = null

  const flush3 = () => {
    if (!h1Buf) return
    const h1Node = h1Buf.find(n => getDepth(n) === 1)
    const name = h1Node ? extractText(h1Node) : ''
    result.push(makeElement(h1Buf, 'header', 'resume-header', { 'data-name': name }))
    h1Buf = null
  }

  for (const node of pass2) {
    const depth = getDepth(node)
    if (depth === 1) {
      flush3()
      // h1 也包进 resume-header section，确保分页测量能覆盖 h1 高度（含头像等）
      h1Buf = [node]
    } else if (depth === 2 || isSection(node)) {
      flush3()
      result.push(node)
    } else if (h1Buf) {
      h1Buf.push(node)
    } else {
      result.push(node)
    }
  }
  flush3()

  tree.children = result
}
