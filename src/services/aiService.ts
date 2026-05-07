/**
 * 调用 AI 优化接口，返回 3 个优化版本
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
