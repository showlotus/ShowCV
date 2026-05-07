import type { VercelRequest, VercelResponse } from '@vercel/node'
import { SOCIAL_SYSTEM_PROMPT, CAMPUS_SYSTEM_PROMPT } from './prompts.js'

const SYSTEM_PROMPTS = {
  social: SOCIAL_SYSTEM_PROMPT,
  campus: CAMPUS_SYSTEM_PROMPT,
} as const

type JobType = keyof typeof SYSTEM_PROMPTS

/**
 * 从 AI 返回的纯文本中解析 3 个版本
 * 匹配格式：版本A/B/C的内容：\n[内容]
 */
function parseVersions(content: string): string[] {
  const regex = /版本([ABC])的内容：\n([\s\S]*?)(?=版本[ABC]的内容：|$)/g
  const versions: string[] = []

  let match: RegExpExecArray | null
  while ((match = regex.exec(content)) !== null) {
    versions.push(match[2].trim())
  }

  return versions
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
    const userMessage = prompt?.trim()
      ? `用户指令：${prompt.trim()}\n\n需要优化的内容：\n${text}`
      : `需要优化的内容：\n${text}`

    const apiKey = process.env.AI_API_KEY
    const baseUrl = process.env.AI_BASE_URL
    const model = process.env.AI_MODEL

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
        // thinking: { type: 'enabled' },
        // reasoning_effort: 'high',
        stream: false,
      }),
    })

    if (!response.ok) {
      const errBody = await response.text()
      console.error('[AI API Error]', response.status, errBody)
      return res.status(502).json({ error: 'AI service request failed' })
    }

    const data = (await response.json()) as {
      choices: Array<{ message: { content: string } }>
    }
    const aiContent = data.choices?.[0]?.message?.content ?? ''

    const versions = parseVersions(aiContent)
    if (versions.length !== 3 || versions.some(v => v.length === 0)) {
      console.error('[AI Parse Error] Unexpected format:', aiContent.slice(0, 500))
      return res.status(502).json({ error: 'AI returned unexpected format' })
    }

    return res.status(200).json({ versions })
  } catch (error) {
    console.error('[AI Optimize Error]', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
