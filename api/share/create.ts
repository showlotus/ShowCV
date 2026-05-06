import type { VercelRequest, VercelResponse } from '@vercel/node'
import { redis } from '../_lib/redis'
import { encrypt } from '../_lib/crypto'
import { nanoid } from 'nanoid'

const SHARE_TTL_SECONDS = 24 * 60 * 60 // 1 天
const SHARE_ID_LENGTH = 12

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { data } = req.body

    if (typeof data !== 'string' || data.length === 0) {
      return res.status(400).json({ error: 'Missing or invalid data field' })
    }

    if (data.length > 100_000) {
      return res.status(413).json({ error: 'Data too large' })
    }

    const shareId = nanoid(SHARE_ID_LENGTH)
    const encrypted = encrypt(data)

    await redis.setex(`share:${shareId}`, SHARE_TTL_SECONDS, encrypted)

    return res.status(201).json({ shareId })
  } catch (error) {
    console.error('[Share Create Error]', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
