# 🚨 部署错误快速修复

## 错误信息
```
Uncaught TypeError: Cannot convert undefined or null to object at Object.values
```

## 🔧 快速修复步骤

### 1️⃣ 检查环境变量（最常见原因）

在你的部署平台（Vercel/Netlify）上，确保设置了以下环境变量：

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
NEXT_PUBLIC_PAYPAL_CLIENT_ID=AYxxx...
PAYPAL_CLIENT_SECRET=ELxxx...
PAYPAL_WEBHOOK_ID=WH-xxx...
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_SITE_NAME=Grid World
NODE_ENV=production
```

### 2️⃣ Vercel 部署步骤

1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择你的项目
3. 点击 **Settings** → **Environment Variables**
4. 添加上述所有变量
5. 选择 **Production** 环境
6. 点击 **Save**
7. 返回 **Deployments** → 点击最新部署的 **⋯** → **Redeploy**

### 3️⃣ 获取 Supabase 配置

1. 访问 [Supabase Dashboard](https://app.supabase.com)
2. 选择你的项目
3. 进入 **Settings** → **API**
4. 复制：
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** → `SUPABASE_SERVICE_ROLE_KEY`

### 4️⃣ 获取 PayPal 配置

1. 访问 [PayPal Developer](https://developer.paypal.com)
2. 进入 **My Apps & Credentials**
3. 选择 **Live** 环境
4. 复制 Client ID 和 Secret
5. 配置 Webhook：
   - URL: `https://yourdomain.com/api/paypal/webhook`
   - 事件: `CHECKOUT.ORDER.APPROVED`, `PAYMENT.CAPTURE.COMPLETED`

### 5️⃣ 本地测试

```bash
# 运行部署检查
npm run check:deployment

# 构建生产版本
npm run build

# 启动生产服务器
npm run start
```

## ✅ 验证修复

1. 清除浏览器缓存（Ctrl+Shift+Delete）
2. 访问你的网站
3. 打开开发者工具（F12）
4. 检查 Console 是否还有错误

## 📚 详细文档

查看 [DEPLOYMENT_ERROR_FIX.md](./DEPLOYMENT_ERROR_FIX.md) 获取完整的故障排除指南。

## 🆘 仍然有问题？

检查以下内容：

- [ ] 所有环境变量都已设置（无占位符）
- [ ] Supabase 项目状态为 Active
- [ ] PayPal 应用状态为 Live（生产环境）
- [ ] 已重新部署项目
- [ ] 浏览器缓存已清除

如果问题仍然存在，请检查浏览器控制台的完整错误堆栈。
