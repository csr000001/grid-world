# Vercel 环境变量设置指南

## 📝 必需的环境变量清单

在 Vercel Dashboard 中设置以下环境变量：

### 1. Supabase 配置

| 变量名 | 示例值 | 获取方式 |
|--------|--------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://abcdefgh.supabase.co` | Supabase Dashboard → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Supabase Dashboard → Settings → API → anon public |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Supabase Dashboard → Settings → API → service_role |

### 2. PayPal 配置

| 变量名 | 示例值 | 获取方式 |
|--------|--------|----------|
| `NEXT_PUBLIC_PAYPAL_CLIENT_ID` | `AYSq3RDGsmBLJE-otTkBtM-jBRd1TCQwFf9RGfwddNXWz0uFU9ztymylOhRS` | PayPal Developer → My Apps & Credentials → Live → Client ID |
| `PAYPAL_CLIENT_SECRET` | `ELLtMMkcKxbjSFhFW-64FKhs2nEM_N_AOvBd0cKQHQtS4aYqp_3xVsgeH8m6` | PayPal Developer → My Apps & Credentials → Live → Secret |
| `PAYPAL_WEBHOOK_ID` | `WH-2WR32451HC0233532-67976317FL4543714` | PayPal Developer → Webhooks → Webhook ID |

### 3. 应用配置

| 变量名 | 示例值 | 说明 |
|--------|--------|------|
| `NEXT_PUBLIC_APP_URL` | `https://yourdomain.com` | 你的网站域名（不要包含尾部斜杠） |
| `NEXT_PUBLIC_SITE_NAME` | `Grid World` | 网站名称 |
| `NODE_ENV` | `production` | 环境类型 |

## 🚀 在 Vercel 中设置环境变量

### 方法 1: 通过 Dashboard（推荐）

1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择你的项目
3. 点击 **Settings** 标签
4. 在左侧菜单选择 **Environment Variables**
5. 对于每个变量：
   - 在 **Key** 输入变量名（例如：`NEXT_PUBLIC_SUPABASE_URL`）
   - 在 **Value** 输入变量值
   - 选择环境：勾选 **Production**（也可以勾选 Preview 和 Development）
   - 点击 **Save**
6. 重复步骤 5，直到添加完所有变量

### 方法 2: 通过 Vercel CLI

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 设置环境变量
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add NEXT_PUBLIC_PAYPAL_CLIENT_ID production
vercel env add PAYPAL_CLIENT_SECRET production
vercel env add PAYPAL_WEBHOOK_ID production
vercel env add NEXT_PUBLIC_APP_URL production
vercel env add NEXT_PUBLIC_SITE_NAME production
vercel env add NODE_ENV production
```

### 方法 3: 批量导入（最快）

1. 创建一个临时文件 `.env.production`：

```bash
NEXT_PUBLIC_SUPABASE_URL=https://abcdefgh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_PAYPAL_CLIENT_ID=AYSq3RDGsmBLJE...
PAYPAL_CLIENT_SECRET=ELLtMMkcKxbjSFhFW...
PAYPAL_WEBHOOK_ID=WH-2WR32451HC0233532...
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_SITE_NAME=Grid World
NODE_ENV=production
```

2. 在 Vercel Dashboard 中：
   - Settings → Environment Variables
   - 点击右上角的 **⋯** (三个点)
   - 选择 **Import from .env**
   - 上传 `.env.production` 文件
   - 选择 **Production** 环境
   - 点击 **Import**

3. **重要**：导入后立即删除 `.env.production` 文件（包含敏感信息）

## ✅ 验证环境变量

设置完成后，在 Vercel Dashboard 中：

1. Settings → Environment Variables
2. 确认所有 9 个变量都已列出
3. 确认每个变量的 **Environment** 列显示 **Production**
4. 点击变量名旁边的 **👁️** 图标查看值（确保没有占位符）

## 🔄 重新部署

设置环境变量后，必须重新部署：

### 方法 1: 通过 Dashboard

1. 点击顶部的 **Deployments** 标签
2. 找到最新的部署
3. 点击右侧的 **⋯** (三个点)
4. 选择 **Redeploy**
5. 确认 **Use existing Build Cache** 不勾选
6. 点击 **Redeploy**

### 方法 2: 通过 Git Push

```bash
# 提交一个小改动触发重新部署
git commit --allow-empty -m "Trigger redeploy with env vars"
git push
```

### 方法 3: 通过 CLI

```bash
vercel --prod
```

## 🔍 检查部署状态

1. 在 Deployments 页面，等待部署完成（状态变为 **Ready**）
2. 点击部署查看详细信息
3. 检查 **Build Logs**，确保没有环境变量相关的错误
4. 点击 **Visit** 访问网站

## 🐛 故障排除

### 问题 1: 部署成功但网站仍然报错

**解决方案**：
- 清除浏览器缓存（Ctrl+Shift+Delete）
- 使用无痕模式访问
- 检查浏览器控制台的错误信息

### 问题 2: 环境变量设置后不生效

**解决方案**：
- 确认选择了 **Production** 环境
- 确认已重新部署（不是只保存变量）
- 检查变量名是否完全匹配（区分大小写）

### 问题 3: 构建失败

**解决方案**：
- 查看 Build Logs 中的具体错误
- 确认所有必需的环境变量都已设置
- 运行 `npm run check:deployment` 本地检查

### 问题 4: PayPal 支付不工作

**解决方案**：
- 确认使用的是 **Live** 环境（不是 Sandbox）
- 确认 Webhook URL 配置为：`https://yourdomain.com/api/paypal/webhook`
- 确认 Webhook 订阅了正确的事件

## 📋 快速检查清单

在重新部署前，确认：

- [ ] 所有 9 个环境变量都已设置
- [ ] 变量值不包含占位符（your-、你的、xxx）
- [ ] `NEXT_PUBLIC_APP_URL` 使用实际域名（不是 localhost）
- [ ] `NEXT_PUBLIC_APP_URL` 不包含尾部斜杠
- [ ] Supabase URL 以 `https://` 开头
- [ ] PayPal 使用 Live 环境（Client ID 不以 `sb-` 开头）
- [ ] 所有变量选择了 **Production** 环境
- [ ] 已点击 **Save** 保存每个变量

## 🔐 安全提示

1. **永远不要**将环境变量提交到 Git
2. **永远不要**在公开的地方分享环境变量
3. 定期轮换敏感密钥（Service Role Key、Client Secret）
4. 使用 Vercel 的环境变量加密存储
5. 为不同环境（Development、Preview、Production）使用不同的密钥

## 📞 需要帮助？

如果遇到问题：

1. 查看 [DEPLOYMENT_ERROR_FIX.md](./DEPLOYMENT_ERROR_FIX.md) 获取详细故障排除
2. 运行 `npm run check:deployment` 诊断配置问题
3. 检查 Vercel 部署日志中的具体错误信息
4. 确认 Supabase 和 PayPal 服务状态正常
