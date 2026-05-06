# Vercel Functions 分享功能 — 实施计划

## Context

当前 ShowCV 的分享功能是纯前端实现：简历数据压缩编码到 URL hash 中，任何人拿到链接就能反复查看，数据也完全暴露在 URL 里。需要接入 Vercel Functions 后端实现：1) 服务端加密存储简历数据；2) 阅后即焚（链接只能查看一次）；3) 1 天自动过期。使用 Upstash Redis 作为存储（原生 TTL + 原子操作）。

## 架构概览

### 创建分享
```
Header.tsx → shareService.ts: encodeShareData()（复用现有压缩）
  → POST /api/share/create { data: string }
  → 服务端: nanoid 生成 shareId → AES-256-GCM 加密 → Redis SETEX 1天
  → 返回 { shareId } → 前端拼接 {origin}/s/{shareId} → 复制到剪贴板
```

### 读取分享（阅后即焚）
```
用户打开 /s/{shareId}
  → App.tsx: useEffect 检测 pathname
  → GET /api/share/{id}
  → 服务端: Lua 脚本原子 GET + DEL → 解密 → 返回 { data }
  → 前端: decodeShareData()（复用现有解压）→ createResume(fromShare: true)
  → 如果 key 不存在 → 410 Gone → toast 提示"链接已失效"
```

## 实施步骤

### Phase 1: 基础设施

#### 1. 安装依赖
```bash
pnpm add @upstash/redis nanoid
```
- `@upstash/redis`: Upstash Redis 客户端
- `nanoid`: 生成短随机 shareId（12 位，64^12 种组合，防暴力枚举）

#### 2. 创建 API 文件结构
```
api/
  _lib/
    redis.ts          # Upstash Redis 客户端单例
    crypto.ts         # AES-256-GCM 加密/解密
  share/
    create.ts         # POST /api/share/create
    [id].ts           # GET /api/share/:id
```

#### 3. `api/_lib/redis.ts`
- 从 `@upstash/redis` 导出 Redis 客户端
- 读取 `UPSTASH_REDIS_REST_URL` 和 `UPSTASH_REDIS_REST_TOKEN` 环境变量

#### 4. `api/_lib/crypto.ts`
- 使用 Node.js 内置 `crypto` 模块，AES-256-GCM
- `encrypt(plaintext) → base64`：随机 12 字节 IV + 16 字节 authTag + 密文
- `decrypt(base64) → plaintext`：解析 IV/authTag/密文并解密
- 密钥从 `ENCRYPTION_KEY` 环境变量读取（32 字节 hex）

#### 5. `api/share/create.ts`
- 验证 POST 方法、请求体 `{ data: string }`
- 限制 data 长度 ≤ 100KB
- 生成 12 位 nanoid 作为 shareId
- 加密 data → `redis.setex("share:{id}", 86400, encrypted)`（1 天 TTL）
- 返回 201 `{ shareId }`

#### 6. `api/share/[id].ts`
- 验证 GET 方法、shareId 格式（正则 `/^[A-Za-z0-9_-]{12}$/`）
- Lua 脚本原子 GET + DEL（保证并发安全）
- key 不存在 → 410 `{ error: "链接已过期或已被查看" }`
- 解密成功 → 200 `{ data }`

### Phase 2: 配置变更

#### 7. 更新 `vercel.json`
添加 rewrites 确保 API 路由不被 SPA 回退拦截：
```json
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/$1" },
    { "source": "/s/(.*)", "destination": "/index.html" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

#### 8. 环境变量
创建 `.env.example`（不提交 `.env.local`）：
```
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
ENCRYPTION_KEY=
```
在 Vercel Dashboard > Settings > Environment Variables 中配置。

#### 9. TypeScript 配置
创建 `tsconfig.api.json`（不加入根 tsconfig.json 的 references，Vercel 自行编译 API 文件）：
- `include: ["api"]`, `strict: true`, `verbatimModuleSyntax: true`

### Phase 3: 前端改造

#### 10. 改造 `src/services/shareService.ts`
**移除**旧的纯前端函数：`generateShareUrl`, `getShareDataFromUrl`, `clearShareHash`
**保留**压缩/解压工具：`encodeShareData`, `decodeShareData`
**新增**：
- `createServerShare(params) → Promise<string>`：压缩 → POST /api/share/create → 返回完整 URL
- `fetchShareData(shareId) → Promise<ShareData | null>`：GET /api/share/{id} → 解压 → 返回数据（null 表示已失效）
- `detectShareSource()`：检测 URL 是否为 `/s/{id}` 格式
- `clearSharePath()`：用 replaceState 清除 URL 中的 shareId

#### 11. 更新 `src/services/index.ts`
导出变更：移除旧函数，新增 `createServerShare`, `fetchShareData`, `detectShareSource`, `clearSharePath`

#### 12. 改造 `src/components/layout/Header.tsx`
- 新增 `shareLoading` state
- `handleShare` 改为 async：调用 `createServerShare` → 复制链接
- 分享按钮增加 loading 状态（复用 `Loader2` 图标）
- toast 提示改为"链接已复制（1天有效，阅后即焚）"

#### 13. 改造 `src/App.tsx`
- 替换分享检测逻辑：使用 `detectShareSource()` 检测 `/s/{id}` 路径
- 异步调用 `fetchShareData(shareId)` → `createResume(fromShare: true)`
- 410/失败时 toast 提示"链接已失效"
- 导入 `toast`（从 `sonner`）用于错误提示

### Phase 4: 验证

#### 14. 测试清单
- [ ] 本地使用 `vercel dev` 测试 API 端点
- [ ] 创建分享 → 验证链接格式为 `/s/{12位id}`
- [ ] 打开分享链接 → 验证简历正确加载
- [ ] 再次打开同一链接 → 验证提示"链接已失效"
- [ ] 等 1 天后验证自动过期（或临时调低 TTL 测试）
- [ ] `pnpm build` 构建通过，不受 api/ 目录影响
- [ ] `pnpm lint` 无新增告警
