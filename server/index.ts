import dotenv from 'dotenv'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'
import rateLimit from 'express-rate-limit'
import { closeDb } from './lib/db.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// 加载环境变量（必须在加载 handler 之前，crypto 模块依赖 ENCRYPTION_KEY）
// tsx 开发模式下 __dirname 为 server/，编译模式下为 dist/server/，需兼容两种路径
const envPath = (() => {
  const candidates = [
    path.resolve(__dirname, '..', '..', '.env'),
    path.resolve(__dirname, '..', '.env'),
  ]
  const found = candidates.find(p => fs.existsSync(p))
  if (!found) {
    console.warn('[WARN] .env not found. Ensure ENCRYPTION_KEY is set via environment.')
  }
  return found || candidates[0]
})()
dotenv.config({ path: envPath })

// 启动前校验必需环境变量
// 必须在动态 import handler 之前执行，否则 crypto 模块加载时会因 KEY 为空而抛出 TypeError
const REQUIRED_ENV = ['ENCRYPTION_KEY'] as const
for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    console.error(`[FATAL] Missing required env: ${key}`)
    process.exit(1)
  }
}

// handler 依赖 crypto 模块在顶层读取 ENCRYPTION_KEY，必须用动态 import 在 dotenv 之后加载
const [shareCreateMod, shareGetMod, aiOptimizeMod] = await Promise.all([
  import('./handlers/shareCreate.js'),
  import('./handlers/shareGet.js'),
  import('../api/ai/optimize.js'),
])
const shareCreate = shareCreateMod.default
const shareGet = shareGetMod.default
const aiOptimize = aiOptimizeMod.default

const app = express()
const PORT = Number(process.env.PORT) || 3070

// 信任反向代理（nginx），使 req.ip 正确反映客户端 IP，rate limiter 基于 IP 生效
app.set('trust proxy', 1)

// 分享创建速率限制：防止存储 DoS（每条 ~100KB，30 次/分钟足够正常使用）
const shareCreateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: '请求过于频繁，请稍后再试' },
})

// AI 优化速率限制：防止财务 DoS（AI API 按量计费，10 次/分钟足够正常使用）
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'AI 优化请求过于频繁，请稍后再试' },
})

// 分享获取速率限制：防止暴力枚举
const shareGetLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: '请求过于频繁，请稍后再试' },
})

// 提升至 500KB 以兼容中文内容（100K 中文字符 UTF-8 编码约 300KB）
app.use(express.json({ limit: '500kb' }))

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: Date.now() })
})

// share handler 使用 Express 类型，可直接挂载（2 参数函数兼容 RequestHandler 的 3 参数类型）
app.post('/api/share/create', shareCreateLimiter, shareCreate)

// aiOptimize 使用 VercelRequest/VercelResponse 类型，运行时与 Express 兼容
// （均继承自 Node.js http.IncomingMessage/ServerResponse），用 unknown 桥接类型差异
app.post('/api/ai/optimize', aiLimiter, aiOptimize as unknown as express.RequestHandler)

// 动态路由适配：[id].ts 用 req.query.id，Express 路由参数是 req.params.id，用中间件注入让 handler 零改动
app.get(
  '/api/share/:id',
  shareGetLimiter,
  (req, _res, next) => {
    req.query.id = req.params.id
    next()
  },
  shareGet
)

const distPath = (() => {
  const candidates = [
    path.resolve(__dirname, '..', '..', 'dist'), // 编译: dist/server → 项目根
    path.resolve(__dirname, '..', 'dist'), // tsx: server → 项目根
  ]
  const found = candidates.find(p => fs.existsSync(p))
  if (!found) {
    console.warn('[WARN] dist/ not found. Run "pnpm build" first. SPA will not be served.')
  }
  return found || candidates[0]
})()

if (fs.existsSync(distPath)) {
  // 防止服务端源码泄露：拦截 /api/（非 API 路由）和 /server/ 的静态文件请求
  // API 路由已在前面注册，优先匹配不受影响
  app.use('/api', (_req, res) => res.sendStatus(404))
  app.use('/server', (_req, res) => res.sendStatus(404))
  app.use(express.static(distPath))
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'))
  })
}

// 错误处理中间件（Express 通过参数数量 = 4 识别为 error handler）
app.use(
  (err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if (err instanceof SyntaxError && 'body' in err) {
      return res.status(400).json({ error: 'Invalid JSON body' })
    }
    if (err instanceof Error && 'type' in err && err.type === 'entity.too.large') {
      return res.status(413).json({ error: 'Request body too large' })
    }
    console.error(
      '[Unhandled Error]',
      err instanceof Error ? err.message : String(err)
    )
    res.status(500).json({ error: 'Internal server error' })
  }
)

const server = app.listen(PORT, () => {
  console.log(`[ShowCV Server] running on http://localhost:${PORT}`)
})

// 优雅关闭：关闭 HTTP listener + SQLite 连接（WAL 模式需正常关闭以避免 -wal/-shm 残留）
function gracefulShutdown(signal: string): void {
  console.log(`[ShowCV Server] ${signal} received, shutting down...`)
  server.close(() => {
    closeDb()
    process.exit(0)
  })
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))
