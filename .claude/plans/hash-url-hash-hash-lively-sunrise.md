# 兼容旧版 Hash 分享链接

## Context

项目已从客户端 hash 分享切换为服务端分享（`/s/{shareId}`），但 `encodeShareData` / `decodeShareData` 编解码函数仍保留。旧版分享链接格式为 `http://domain.com/#<base64_encoded_data>`，现在需要恢复对这种格式的兼容：用户在当前 URL 后添加 hash 值时，自动解析并加载简历内容。

## 实现方案

### 1. 添加 URL Hash 工具函数

**文件**: [shareService.ts](src/services/shareService.ts)

在文件末尾新增两个函数：

- `getShareHashFromUrl()` — 读取 `window.location.hash`，去掉 `#` 后返回编码字符串。hash 为空或仅为 `#` 时返回 `null`
- `clearShareHash()` — 使用 `history.replaceState` 清除 hash

### 2. 导出新函数

**文件**: [index.ts](src/services/index.ts)

在 `shareService` 导出列表中添加 `getShareHashFromUrl` 和 `clearShareHash`。

### 3. App.tsx 添加 Hash 分享检测

**文件**: [App.tsx](src/App.tsx)

在现有的服务端分享 useEffect 之后，新增一个独立的 useEffect：

- 调用 `getShareHashFromUrl()` 获取 hash 数据
- 调用 `decodeShareData(hash)` 解码
- 成功时调用 `createResume({ ...data, fromShare: true })`
- 失败时 toast 提示 "无法解析分享链接"
- finally 中调用 `clearShareHash()` 清除 URL

## 修改文件清单

1. `src/services/shareService.ts` — 新增 2 个函数（~15 行）
2. `src/services/index.ts` — 导出新函数
3. `src/App.tsx` — 新增 hash 检测 useEffect + import（~20 行）

## 验证方式

1. 启动 `pnpm dev`
2. 在编辑器中输入简历内容，用 `encodeShareData` 生成一段编码数据
3. 在浏览器地址栏输入 `http://localhost:5173/#<encoded_data>`，验证是否自动加载简历
4. 验证加载后 URL hash 被清除
5. 输入无效 hash 数据，验证是否显示错误提示且不崩溃
