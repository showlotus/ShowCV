import type { Request, Response } from 'express'
import { kv } from '../lib/db.js'
import { decrypt } from '../../api/_lib/crypto.js'

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const shareId = req.query.id as string

  if (!shareId || !/^[A-Za-z0-9_-]{12}$/.test(shareId)) {
    return res.status(400).json({ error: '该分享 ID 无效' })
  }

  try {
    const result = await kv.eval('', [`share:${shareId}`], [])

    if (!result) {
      return res.status(410).json({ error: '该分享链接已过期或已被查看' })
    }

    const decrypted = decrypt(result)
    return res.status(200).json({ data: decrypted })
  } catch (error) {
    console.error(
      '[Share Get Error]',
      error instanceof Error ? error.message : String(error)
    )
    return res.status(500).json({ error: 'Internal server error' })
  }
}
