import type { VercelRequest, VercelResponse } from '@vercel/node'
import { redis } from '../_lib/redis.js'
import { decrypt } from '../_lib/crypto.js'

/** Lua 脚本：原子性 GET + DEL，保证阅后即焚的并发安全 */
const GET_AND_DELETE_SCRIPT = `
  local val = redis.call('GET', KEYS[1])
  if val then
    redis.call('DEL', KEYS[1])
  end
  return val
`

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const shareId = req.query.id as string

  if (!shareId || !/^[A-Za-z0-9_-]{12}$/.test(shareId)) {
    return res.status(400).json({ error: 'Invalid share ID' })
  }

  try {
    const result = (await redis.eval(
      GET_AND_DELETE_SCRIPT,
      [`share:${shareId}`],
      []
    )) as string | null

    if (!result) {
      return res.status(410).json({ error: '该分享链接已过期或已被查看' })
    }

    const decrypted = decrypt(result)
    return res.status(200).json({ data: decrypted })
  } catch (error) {
    console.error('[Share Get Error]', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
