// PM2 进程配置
// 使用 fork 模式（非 cluster）：简历 AI 优化的 SSE 长连接在 cluster worker
// 重启时会被静默终止，且客户端 fetch+ReadableStream 不会自动重连。
// fork 模式下单进程更可预测，简历工具流量低，单核足够。
module.exports = {
  apps: [
    {
      name: 'showcv',
      script: 'dist/server/index.js',
      cwd: __dirname,
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      max_restarts: 10,
      env: {
        NODE_ENV: 'production',
        PORT: 3070,
      },
      // 敏感环境变量从 .env 加载（server/index.ts 顶部的 dotenv/config）
    },
  ],
}
