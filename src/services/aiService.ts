/**
 * 调用 AI 优化接口（非流式），返回 3 个优化版本
 * @param text 需要优化的文本
 * @param prompt 用户自定义优化指令
 * @param jobType 求职类型
 */
export async function optimizeText(
  text: string,
  prompt: string,
  jobType: 'social' | 'campus'
): Promise<string[]> {
  const response = await fetch('/api/ai/optimize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, prompt, jobType }),
  })

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.error || `AI 优化请求失败: ${response.status}`)
  }

  const { versions } = (await response.json()) as { versions: string[] }
  return versions
}

/** 流式请求回调接口 */
export interface StreamCallbacks {
  /** 每收到一段增量文本时调用，参数为累计全文 */
  onChunk: (fullText: string) => void
  /** 流正常结束时调用 */
  onComplete: () => void
  /** 错误回调 */
  onError: (error: Error) => void
}

/**
 * 流式调用 AI 优化接口，逐字返回结果
 * @param text 需要优化的文本
 * @param prompt 用户自定义优化指令
 * @param jobType 求职类型
 * @param callbacks 回调函数
 * @returns AbortController 用于取消请求
 */
export function streamOptimizeText(
  text: string,
  prompt: string,
  jobType: 'social' | 'campus',
  callbacks: StreamCallbacks
): AbortController {
  const controller = new AbortController()

  fetch('/api/ai/optimize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, prompt, jobType }),
    signal: controller.signal,
  })
    .then(async (response) => {
      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body.error || `AI 优化请求失败: ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('无法读取响应流')

      const decoder = new TextDecoder()
      let fullText = ''
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed || trimmed.startsWith(':')) continue

          if (trimmed === 'data: [DONE]') continue

          if (trimmed.startsWith('data: ')) {
            try {
              const data = JSON.parse(trimmed.slice(6)) as { content?: string }
              if (data.content) {
                fullText += data.content
                callbacks.onChunk(fullText)
              }
            } catch {
              // 忽略解析错误
            }
          }
        }
      }

      callbacks.onComplete()
    })
    .catch((err) => {
      if (err instanceof DOMException && err.name === 'AbortError') return
      callbacks.onError(err instanceof Error ? err : new Error(String(err)))
    })

  return controller
}
