# 部署错误修复指南

## 错误信息
```
Uncaught TypeError: Cannot convert undefined or null to object
at Object.values (<anonymous>)
```

## 问题原因

这个错误通常由以下原因引起：

1. **环境变量未配置** - 生产环境中缺少必需的环境变量
2. **Next.js 配置不完整** - 缺少图片域名配置
3. **Supabase 配置错误** - 数据库连接失败

## 解决方案

### 1. 检查部署平台的环境变量

确保在你的部署平台（Vercel/Netlify/其他）上设置了以下环境变量：

#### 必需的环境变量：

```bash
# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# PayPal 配置
NEXT_PUBLIC_PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_CLIENT_SECRET=your-paypal-secret
PAYPAL_WEBHOOK_ID=your-webhook-id

# 应用配置
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXT_PUBLIC_SITE_NAME=Grid World

# 环境
NODE_ENV=production
```

### 2. Vercel 部署步骤

如果你使用 Vercel 部署：

1. 登录 Vercel Dashboard
2. 选择你的项目
3. 进入 **Settings** > **Environment Variables**
4. 添加上述所有环境变量
5. 确保选择 **Production** 环境
6. 点击 **Save**
7. 重新部署项目：**Deployments** > **Redeploy**

### 3. 验证环境变量

在部署后，检查构建日志：

```bash
# 查找这些警告信息
⚠️ Supabase not configured
❌ Environment Configuration Error
```

如果看到这些警告，说明环境变量未正确设置。

### 4. 本地测试

在本地测试生产构建：

```bash
# 构建生产版本
npm run build

# 启动生产服务器
npm run start
```

如果本地构建失败，检查 `.env.local` 文件。

### 5. 常见错误

#### 错误 1: 环境变量包含占位符

```bash
# ❌ 错误
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co

# ✅ 正确
NEXT_PUBLIC_SUPABASE_URL=https://abcdefgh.supabase.co
```

#### 错误 2: 缺少 NEXT_PUBLIC_ 前缀

客户端使用的环境变量必须以 `NEXT_PUBLIC_` 开头：

```bash
# ❌ 错误（客户端无法访问）
SUPABASE_URL=https://abcdefgh.supabase.co

# ✅ 正确
NEXT_PUBLIC_SUPABASE_URL=https://abcdefgh.supabase.co
```

#### 错误 3: 环境变量未重新部署

修改环境变量后，必须重新部署项目才能生效。

### 6. 调试步骤

1. **检查浏览器控制台**
   - 打开开发者工具 (F12)
   - 查看 Console 标签页
   - 查找错误堆栈和警告信息

2. **检查网络请求**
   - 打开 Network 标签页
   - 查看 API 请求是否失败
   - 检查 Supabase 请求状态

3. **验证 Supabase 连接**
   - 访问 https://app.supabase.com
   - 确认项目状态为 Active
   - 检查 API 设置中的 URL 和 Key

4. **检查 PayPal 配置**
   - 访问 https://developer.paypal.com
   - 确认应用状态为 Live（生产环境）
   - 验证 Webhook URL 配置正确

### 7. 快速修复检查清单

- [ ] 所有环境变量已在部署平台设置
- [ ] 环境变量不包含占位符（your-、你的）
- [ ] NEXT_PUBLIC_ 前缀正确使用
- [ ] Supabase 项目状态为 Active
- [ ] PayPal 应用状态为 Live
- [ ] 已重新部署项目
- [ ] 浏览器缓存已清除
- [ ] 本地构建测试通过

### 8. 获取 Supabase 配置

1. 访问 https://app.supabase.com
2. 选择你的项目
3. 进入 **Settings** > **API**
4. 复制以下信息：
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** → `SUPABASE_SERVICE_ROLE_KEY`

### 9. 获取 PayPal 配置

1. 访问 https://developer.paypal.com
2. 进入 **Dashboard** > **My Apps & Credentials**
3. 选择 **Live** 环境（生产）
4. 选择你的应用
5. 复制以下信息：
   - **Client ID** → `NEXT_PUBLIC_PAYPAL_CLIENT_ID`
   - **Secret** → `PAYPAL_CLIENT_SECRET`
6. 配置 Webhook：
   - URL: `https://your-domain.com/api/paypal/webhook`
   - 事件: `CHECKOUT.ORDER.APPROVED`, `PAYMENT.CAPTURE.COMPLETED`
   - 复制 **Webhook ID** → `PAYPAL_WEBHOOK_ID`

## 更新内容

本次修复包含以下更新：

1. **next.config.ts** - 添加图片域名配置和环境变量
2. **lib/supabase.ts** - 改进错误处理，生产环境抛出错误
3. **lib/env-check.ts** - 新增环境变量验证工具

## 联系支持

如果问题仍然存在，请提供以下信息：

1. 部署平台（Vercel/Netlify/其他）
2. 完整的错误堆栈
3. 浏览器控制台截图
4. 构建日志（隐藏敏感信息）
