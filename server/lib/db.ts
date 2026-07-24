import Database from 'better-sqlite3'
import fs from 'node:fs'
import path from 'node:path'

const dbPath = process.env.DB_PATH || 'data/showcv.db'
const dbDir = path.dirname(dbPath)

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true })
}

const db = new Database(dbPath)
db.pragma('journal_mode = WAL')

db.exec(`
  CREATE TABLE IF NOT EXISTS kv (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    expires_at INTEGER NOT NULL
  )
`)

function cleanupExpired(): void {
  db.prepare('DELETE FROM kv WHERE expires_at <= ?').run(Date.now())
}

cleanupExpired()
setInterval(cleanupExpired, 60 * 60 * 1000).unref()

/**
 * 关闭数据库连接，用于优雅关闭
 */
export function closeDb(): void {
  db.close()
}

/**
 * 键值存储接口，兼容 Redis 用法（setex / eval）
 * 底层使用 SQLite 实现，非真正的 Redis
 */
export const kv = {
  async setex(key: string, seconds: number, value: string): Promise<void> {
    const expiresAt = Date.now() + seconds * 1000
    db.prepare(
      'INSERT OR REPLACE INTO kv (key, value, expires_at) VALUES (?, ?, ?)'
    ).run(key, value, expiresAt)
  },

  async eval(
    _script: string,
    keys: string[],
    _args: string[]
  ): Promise<string | null> {
    const getAndDelete = db.transaction(() => {
      const row = db
        .prepare('SELECT value FROM kv WHERE key = ? AND expires_at > ?')
        .get(keys[0], Date.now()) as { value: string } | undefined
      if (row) {
        db.prepare('DELETE FROM kv WHERE key = ?').run(keys[0])
      }
      return row?.value ?? null
    })
    return getAndDelete()
  },
}
