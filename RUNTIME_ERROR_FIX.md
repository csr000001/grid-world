# 🔥 运行时错误修复指南

## 错误信息
```
Uncaught TypeError: Cannot convert undefined or null to object
at Object.values (<anonymous>)
```

## ✅ 问题已修复

### 根本原因
`next.config.ts` 中的 `env` 配置在环境变量未设置时会传递 `undefined` 值给客户端，导致 `Object.values()` 调用失败。

### 修复内容
- ✅ 移除了 `next.config.ts` 中的 `env` 配置
- ✅ Next.js 会自动处理 `NEXT_PUBLIC_*` 环境变量
- ✅ 添加了环境变量检查页面 `/env-check`

## 🚀 立即行动

### 1️⃣ 推送修复代码

```bash
git push origin main
```

### 2️⃣ 在 Vercel 设置环境变量

**必须设置这些变量**（否则应用无法正常工作）：

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_PAYPAL_CLIENT_ID=AYxxx...
PAYPAL_CLIENT_SECRET=ELxxx...
PAYPAL_WEBHOOK_ID=WH-xxx...
NEXT_PUBLIC_APP_URL=https://your-project.vercel.app
NEXT_PUBLIC_SITE_NAME=Grid World
NODE_ENV=production
```

**设置步骤**：
1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择你的项目
3. **Settings** → **Environment Variables**
4. 逐个添加上述变量
5. 每个都选择 **Production** 环境
6. 点击 **Save**

### 3️⃣ 重新部署

**Deployments** → 最新部署的 **⋯** → **Redeploy**

### 4️⃣ 验证配置

部署完成后，访问：

```
https://your-domain.vercel.app/env-check
```

这个页面会显示所有环境变量的状态，帮助你诊断配置问题。

## 📋 获取配置值

### Supabase 配置（3 个变量）

1. 访问 [Supabase Dashboard](https://app.supabase.com)
2. 选择你的项目（如果没有，创建一个新项目）
3. 进入 **Settings** → **API**
4. 复制以下内容：

| 变量名 | 位置 |
|--------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Project API keys → anon public |
| `SUPABASE_SERVICE_ROLE_KEY` | Project API keys → service_role |

### PayPal 配置（3 个变量）

1. 访问 [PayPal Developer](https://developer.paypal.com)
2. 登录你的 PayPal 账户
3. 进入 **My Apps & Credentials**
4. 选择 **Live** 标签（生产环境）

| 变量名 | 位置 |
|--------|------|
| `NEXT_PUBLIC_PAYPAL_CLIENT_ID` | Client ID |
| `PAYPAL_CLIENT_SECRET` | Secret（点击 Show 查看）|

5. 配置 Webhook：
   - 进入 **Webhooks** → **Add Webhook**
   - URL: `https://your-domain.vercel.app/api/paypal/webhook`
   - 事件: `CHECKOUT.ORDER.APPROVED`, `PAYMENT.CAPTURE.COMPLETED`
   - 保存后复制 **Webhook ID** → `PAYPAL_WEBHOOK_ID`

### 应用配置（3 个变量）

| 变量名 | 值 |
|--------|-----|
| `NEXT_PUBLIC_APP_URL` | 你的 Vercel 域名（如 `https://your-project.vercel.app`）|
| `NEXT_PUBLIC_SITE_NAME` | `Grid World` |
| `NODE_ENV` | `production` |

## 🔍 诊断工具

### 环境变量检查页面

访问 `/env-check` 查看所有环境变量的状态：

- ✅ 绿色 = 配置正确
- ❌ 红色 = 未设置或配置错误

### 浏览器控制台

1. 打开开发者工具（F12）
2. 查看 Console 标签
3. 查找警告信息：
   - `⚠️ Supabase not configured` = Supabase 环境变量未设置
   - 其他错误信息

### 网络请求

1. 打开 Network 标签
2. 刷新页面
3. 查看失败的请求：
   - 如果看到 401/403 错误 = 认证配置问题
   - 如果看到 404 错误 = API 路由问题
   - 如果看到 500 错误 = 服务器配置问题

## ⚠️ 常见问题

### Q1: 我已经设置了环境变量，为什么还是报错？

**A**: 确保：
- ✅ 变量名完全匹配（区分大小写）
- ✅ 选择了 **Production** 环境
- ✅ 已重新部署（不是只保存变量）
- ✅ 清除了浏览器缓存

### Q2: 环境变量在 Vercel 显示已设置，但 /env-check 显示未设置

**A**: 这说明部署时环境变量还没有设置。解决方案：
1. 确认环境变量已保存
2. 重新部署项目
3. 等待部署完成
4. 清除浏览器缓存后访问

### Q3: Supabase URL 应该是什么格式？

**A**: 正确格式：
- ✅ `https://abcdefgh.supabase.co`
- ❌ `https://your-project.supabase.co`（占位符）
- ❌ `http://localhost:54321`（本地地址）

### Q4: PayPal Client ID 以 "sb-" 开头，这正常吗？

**A**: 不正常！
- `sb-` 开头 = Sandbox（测试环境）
- 生产环境应该使用 **Live** 环境的 Client ID
- 在 PayPal Developer Dashboard 切换到 **Live** 标签

### Q5: 我没有 Supabase/PayPal 账户怎么办？

**A**: 你需要创建账户：

**Supabase**（免费）：
1. 访问 [supabase.com](https://supabase.com)
2. 点击 "Start your project"
3. 创建账户并新建项目
4. 等待项目初始化（约 2 分钟）
5. 运行数据库迁移脚本（见 `supabase-schema.sql`）

**PayPal**（需要商业账户）：
1. 访问 [paypal.com](https://www.paypal.com)
2. 注册商业账户
3. 访问 [developer.paypal.com](https://developer.paypal.com)
4. 创建应用

## 📋 快速检查清单

部署前确认：

- [ ] 代码已推送到 Git
- [ ] 所有 9 个环境变量已在 Vercel 设置
- [ ] 变量值不包含占位符（your-、你的、xxx）
- [ ] Supabase 项目已创建且状态为 Active
- [ ] PayPal 应用已创建（Live 环境）
- [ ] PayPal Webhook 已配置
- [ ] 已重新部署
- [ ] 访问 `/env-check` 显示全部绿色 ✅

## 🎯 验证步骤

部署成功后，按顺序测试：

1. **访问首页** - 应该能正常加载
2. **访问 /env-check** - 应该显示全部 ✅
3. **打开浏览器控制台** - 不应该有错误
4. **测试注册/登录** - 应该能正常工作
5. **查看格子列表** - 应该能加载数据
6. **测试上传照片** - 应该能上传成功
7. **测试支付流程** - 应该能跳转到 PayPal

## 📚 相关文档

- [VERCEL_DEPLOYMENT_GUIDE.md](./VERCEL_DEPLOYMENT_GUIDE.md) - 完整部署指南
- [VERCEL_ENV_SETUP.md](./VERCEL_ENV_SETUP.md) - 环境变量详细设置
- [BUILD_FIX.md](./BUILD_FIX.md) - 构建错误修复

## 🆘 仍然有问题？

如果按照上述步骤操作后仍然有问题，请提供：

1. `/env-check` 页面的截图
2. 浏览器控制台的完整错误信息
3. Vercel 部署日志
4. 环境变量列表（隐藏敏感值）

---

**最新提交**: 修复 next.config.ts 导致的运行时错误
**诊断页面**: `/env-check`
