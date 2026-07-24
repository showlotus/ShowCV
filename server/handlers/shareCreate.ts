import type { Request, Response } from 'express'
import { kv } from '../lib/db.js'
import { encrypt } from '../../api/_lib/crypto.js'
import { nanoid } from 'nanoid'

const SHARE_TTL_SECONDS = 24 * 60 * 60
const SHARE_ID_LENGTH = 12

export default async function handler(req: Request, res: Response) {
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

    await kv.setex(`share:${shareId}`, SHARE_TTL_SECONDS, encrypted)

    return res.status(201).json({ shareId })
  } catch (error) {
    console.error(
      '[Share Create Error]',
      error instanceof Error ? error.message : String(error)
    )
    return res.status(500).json({ error: 'Internal server error' })
  }
}
