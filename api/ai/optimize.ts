import type { VercelRequest, VercelResponse } from '@vercel/node'
import { SOCIAL_SYSTEM_PROMPT, CAMPUS_SYSTEM_PROMPT } from './prompts.js'

const SYSTEM_PROMPTS = {
  social: SOCIAL_SYSTEM_PROMPT,
  campus: CAMPUS_SYSTEM_PROMPT,
} as const

type JobType = keyof typeof SYSTEM_PROMPTS

/** 检测文本中的内联 Markdown 格式，返回格式描述列表 */
function detectInlineMarkdown(text: string): string[] {
  const formats: string[] = []

  // 加粗 **...**
  const boldMatches = text.match(/\*\*(.+?)\*\*/g)
  if (boldMatches) {
    formats.push(`- 加粗: ${boldMatches.join(', ')}`)
  }

  // 分隔符 ||
  if (text.includes('||')) {
    const parts = text.split('||')
    if (parts.length >= 2) {
      formats.push(
        `- 分隔符 ||: 左侧="${parts[0].trim()}", 右侧="${parts.slice(1).join('||').trim()}"`
      )
    }
  }

  // 行内代码 `...`
  const codeMatches = text.match(/`([^`]+)`/g)
  if (codeMatches) {
    formats.push(`- 行内代码: ${codeMatches.join(', ')}`)
  }

  // 链接 [text](url)
  const linkMatches = text.match(/\[([^\]]+)\]\(([^)]+)\)/g)
  if (linkMatches) {
    formats.push(`- 链接: ${linkMatches.join(', ')}`)
  }

  return formats
}

/** 从 SSE 流中解析 AI 返回的文本增量 */
function extractDelta(data: string): string {
  if (data === '[DONE]') return ''
  try {
    const parsed = JSON.parse(data) as {
      choices?: Array<{ delta?: { content?: string } }>
    }
    return parsed.choices?.[0]?.delta?.content ?? ''
  } catch {
    return ''
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { text, prompt, jobType } = req.body

    if (typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({ error: 'Missing or invalid text field' })
    }

    if (text.length > 5000) {
      return res.status(413).json({ error: 'Text too long (max 5000 characters)' })
    }

    const systemPrompt = SYSTEM_PROMPTS[jobType as JobType] ?? SYSTEM_PROMPTS.social

    const inlineFormats = detectInlineMarkdown(text)
    const formatContext =
      inlineFormats.length > 0
        ? `\n\n检测到的内联格式（必须在输出中保留）：\n${inlineFormats.join('\n')}`
        : ''

    const userMessage = prompt?.trim()
      ? `用户指令：${prompt.trim()}\n\n需要优化的内容：\n${text}${formatContext}`
      : `需要优化的内容：\n${text}${formatContext}`

    const apiKey = process.env.AI_API_KEY
    const baseUrl = process.env.AI_BASE_URL
    const model = process.env.AI_MODEL
    const thinking = process.env.AI_THINKING

    if (!apiKey || !baseUrl || !model) {
      return res.status(500).json({ error: 'AI service not configured' })
    }

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        stream: true,
        thinking: { type: thinking ? 'enabled' : 'disabled' },
      }),
    })

    if (!response.ok) {
      const errBody = await response.text()
      console.error('[AI API Error]', response.status, errBody)
      return res.status(502).json({ error: 'AI service request failed' })
    }

    // 设置 SSE 响应头，流式转发 AI 响应
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    })

    const reader = response.body?.getReader()
    if (!reader) {
      res.end()
      return
    }

    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      // 保留最后一行（可能不完整）
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith(':')) continue

        if (trimmed.startsWith('data: ')) {
          const data = trimmed.slice(6)
          if (data === '[DONE]') {
            res.write('data: [DONE]\n\n')
            continue
          }
          const content = extractDelta(data)
          if (content) {
            res.write(`data: ${JSON.stringify({ content })}\n\n`)
          }
        }
      }
    }

    // 处理 buffer 中剩余的数据
    if (buffer.trim().startsWith('data: ')) {
      const data = buffer.trim().slice(6)
      if (data === '[DONE]') {
        res.write('data: [DONE]\n\n')
      } else {
        const content = extractDelta(data)
        if (content) {
          res.write(`data: ${JSON.stringify({ content })}\n\n`)
        }
      }
    }

    res.end()
  } catch (error) {
    console.error('[AI Optimize Error]', error)
    // 如果已经发送了头部，无法再发 JSON，直接结束
    if (!res.headersSent) {
      return res.status(500).json({ error: 'Internal server error' })
    }
    res.end()
  }
}
