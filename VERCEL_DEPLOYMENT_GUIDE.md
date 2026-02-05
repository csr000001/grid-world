# 🚀 Vercel 部署完整指南

## 问题：构建失败 "npm run build exited with 1"

这个错误表示构建过程失败。最常见的原因是**环境变量未设置**。

## ✅ 解决方案（按顺序执行）

### 步骤 1: 设置环境变量

在 Vercel Dashboard 中设置以下环境变量：

1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择你的项目
3. 点击 **Settings** → **Environment Variables**
4. 添加以下变量（**必须全部添加**）：

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_PAYPAL_CLIENT_ID=AYxxx...
PAYPAL_CLIENT_SECRET=ELxxx...
PAYPAL_WEBHOOK_ID=WH-xxx...
NEXT_PUBLIC_APP_URL=https://yourdomain.vercel.app
NEXT_PUBLIC_SITE_NAME=Grid World
NODE_ENV=production
```

**重要提示**：
- 每个变量都要选择 **Production** 环境
- 确保没有拼写错误（区分大小写）
- 确保值不包含占位符（your-、你的、xxx）

### 步骤 2: 获取配置值

#### 获取 Supabase 配置

1. 访问 [Supabase Dashboard](https://app.supabase.com)
2. 选择你的项目（如果没有，点击 **New Project** 创建）
3. 进入 **Settings** → **API**
4. 复制以下内容：
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **Project API keys** → **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Project API keys** → **service_role** → `SUPABASE_SERVICE_ROLE_KEY`

#### 获取 PayPal 配置

1. 访问 [PayPal Developer](https://developer.paypal.com)
2. 登录你的 PayPal 账户
3. 进入 **Dashboard** → **My Apps & Credentials**
4. 选择 **Live** 标签（生产环境）
5. 如果没有应用，点击 **Create App**
6. 复制以下内容：
   - **Client ID** → `NEXT_PUBLIC_PAYPAL_CLIENT_ID`
   - 点击 **Show** 查看 **Secret** → `PAYPAL_CLIENT_SECRET`

#### 配置 PayPal Webhook

1. 在 PayPal Developer Dashboard
2. 进入 **Webhooks**
3. 点击 **Add Webhook**
4. 设置：
   - **Webhook URL**: `https://your-domain.vercel.app/api/paypal/webhook`
   - **Event types**: 选择以下事件
     - `CHECKOUT.ORDER.APPROVED`
     - `PAYMENT.CAPTURE.COMPLETED`
5. 点击 **Save**
6. 复制 **Webhook ID** → `PAYPAL_WEBHOOK_ID`

### 步骤 3: 设置应用 URL

`NEXT_PUBLIC_APP_URL` 应该是你的 Vercel 部署域名：

- 如果使用 Vercel 默认域名：`https://your-project.vercel.app`
- 如果使用自定义域名：`https://yourdomain.com`

**注意**：不要包含尾部斜杠 `/`

### 步骤 4: 验证环境变量

在 Vercel Dashboard 中：

1. Settings → Environment Variables
2. 确认所有 9 个变量都已列出
3. 确认每个变量的 **Environment** 列显示 **Production**
4. 点击变量名旁边的 **👁️** 图标查看值

### 步骤 5: 重新部署

**方法 1: 通过 Dashboard（推荐）**

1. 点击顶部的 **Deployments** 标签
2. 找到最新的部署
3. 点击右侧的 **⋯** (三个点)
4. 选择 **Redeploy**
5. **不要**勾选 "Use existing Build Cache"
6. 点击 **Redeploy**

**方法 2: 通过 Git Push**

```bash
# 推送代码触发重新部署
git push origin main
```

### 步骤 6: 检查构建日志

1. 在 Deployments 页面，等待部署完成
2. 如果失败，点击部署查看详细信息
3. 查看 **Build Logs** 标签
4. 查找错误信息

## 🔍 常见构建错误

### 错误 1: "NEXT_PUBLIC_SUPABASE_URL is not defined"

**原因**：环境变量未设置或名称错误

**解决方案**：
- 检查变量名是否完全匹配（区分大小写）
- 确认已选择 Production 环境
- 确认已重新部署

### 错误 2: "Module not found"

**原因**：依赖未安装

**解决方案**：
```bash
# 本地测试
npm install
npm run build
```

如果本地构建成功，在 Vercel 中：
- Settings → General → Node.js Version → 选择 20.x
- 重新部署

### 错误 3: "Type error" 或 TypeScript 错误

**原因**：类型检查失败

**解决方案**：
```bash
# 本地检查
npm run build
```

修复所有 TypeScript 错误后提交并推送。

### 错误 4: "Cannot convert undefined or null to object"

**原因**：环境变量在运行时未定义

**解决方案**：
- 确认所有环境变量都已设置
- 确认变量值不是占位符
- 清除构建缓存后重新部署

## 📋 部署前检查清单

在部署前，确认以下内容：

- [ ] 所有 9 个环境变量已在 Vercel 设置
- [ ] Supabase 项目已创建且状态为 Active
- [ ] PayPal 应用已创建（Live 环境）
- [ ] PayPal Webhook 已配置
- [ ] `NEXT_PUBLIC_APP_URL` 使用正确的域名
- [ ] 所有变量选择了 Production 环境
- [ ] 本地构建测试通过（`npm run build`）

## 🧪 本地测试

在推送到 Vercel 之前，先在本地测试：

```bash
# 1. 确保 .env.local 文件存在并包含所有变量
cp .env.example .env.local
# 编辑 .env.local 填入真实值

# 2. 安装依赖
npm install

# 3. 运行检查脚本（可选）
npm run check:deployment

# 4. 构建生产版本
npm run build

# 5. 启动生产服务器
npm run start

# 6. 访问 http://localhost:3000 测试
```

如果本地构建成功，说明代码没问题，问题在于 Vercel 的环境变量配置。

## 🆘 仍然失败？

### 查看完整的构建日志

1. Vercel Dashboard → Deployments → 点击失败的部署
2. 查看 **Build Logs** 标签
3. 滚动到底部查看错误信息
4. 复制完整的错误堆栈

### 常见日志错误及解决方案

**日志显示**: `Error: Missing environment variable`
- **解决方案**: 在 Vercel 设置环境变量

**日志显示**: `Error: Cannot find module`
- **解决方案**: 检查 package.json 依赖，运行 `npm install`

**日志显示**: `Type error: ...`
- **解决方案**: 修复 TypeScript 错误

**日志显示**: `Error: Command "npm run build" exited with 1`
- **解决方案**: 查看日志中的具体错误信息

### 清除构建缓存

有时缓存会导致问题：

1. Vercel Dashboard → Settings → General
2. 滚动到底部
3. 点击 **Clear Build Cache**
4. 重新部署

### 检查 Node.js 版本

1. Vercel Dashboard → Settings → General
2. **Node.js Version** → 选择 **20.x**
3. 保存并重新部署

## 📞 获取帮助

如果问题仍然存在，请提供以下信息：

1. 完整的构建日志（从 Vercel）
2. 环境变量列表（隐藏敏感值）
3. 本地构建是否成功
4. Node.js 版本（运行 `node -v`）

## 📚 相关文档

- [VERCEL_ENV_SETUP.md](./VERCEL_ENV_SETUP.md) - 环境变量设置详细指南
- [DEPLOYMENT_ERROR_FIX.md](./DEPLOYMENT_ERROR_FIX.md) - 部署错误故障排除
- [QUICK_FIX.md](./QUICK_FIX.md) - 快速修复步骤

## ✅ 成功部署后

部署成功后，验证以下功能：

1. 访问网站首页
2. 检查浏览器控制台无错误
3. 测试用户注册/登录
4. 测试查看格子列表
5. 测试上传照片功能
6. 测试支付流程

---

**重要提示**：每次修改环境变量后，都必须重新部署才能生效。仅保存变量不会自动触发部署。
