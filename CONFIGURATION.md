# Grid World 配置指南

本指南将帮助您快速配置 Grid World 项目的所有必需服务。

## 📋 配置清单

- [ ] Supabase 数据库配置
- [ ] Supabase 存储桶配置
- [ ] PayPal 支付配置
- [ ] 环境变量配置

---

## 1️⃣ Supabase 配置

### 1.1 创建项目

1. 访问 [Supabase Dashboard](https://app.supabase.com)
2. 点击 "New Project"
3. 填写项目信息：
   - Name: `grid-world`
   - Database Password: 设置一个强密码（请保存好）
   - Region: 选择离您最近的区域
4. 等待项目创建完成（约2分钟）

### 1.2 获取 API 密钥

1. 进入项目后，点击左侧 "Settings" > "API"
2. 复制以下信息：
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public**: 匿名公钥
   - **service_role**: 服务端密钥（⚠️ 保密，不要泄露）

### 1.3 执行数据库脚本

1. 点击左侧 "SQL Editor"
2. 点击 "New Query"
3. 复制 `supabase-schema.sql` 文件的全部内容
4. 粘贴到编辑器中
5. 点击 "Run" 执行
6. 确认执行成功，应该看到：
   - ✅ `grids` 表已创建（10000条记录）
   - ✅ `grid_likes` 表已创建
   - ✅ 触发器和函数已创建

### 1.4 配置存储桶

1. 点击左侧 "Storage"
2. 点击 "Create a new bucket"
3. 填写信息：
   - Name: `grid-photos`
   - Public bucket: ✅ 勾选（允许公开访问）
4. 点击 "Create bucket"

### 1.5 配置存储桶策略

1. 点击刚创建的 `grid-photos` 存储桶
2. 点击 "Policies" 标签
3. 点击 "New Policy"
4. 添加以下两个策略：

**策略1: 允许认证用户上传**
```sql
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'grid-photos');
```

**策略2: 允许所有人读取**
```sql
CREATE POLICY "Allow public reads"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'grid-photos');
```

---

## 2️⃣ PayPal 配置

### 2.1 创建 PayPal 应用

1. 访问 [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/)
2. 登录您的 PayPal 账号
3. 点击 "Apps & Credentials"
4. 选择 "Sandbox" 标签（测试环境）或 "Live" 标签（生产环境）
5. 点击 "Create App"
6. 填写应用名称: `Grid World`
7. 点击 "Create App"

### 2.2 获取 API 密钥

1. 在应用详情页面，复制：
   - **Client ID**: 客户端ID
   - **Secret**: 点击 "Show" 查看并复制

### 2.3 配置 Webhook

#### 本地测试环境

本地开发时，PayPal 无法直接访问 `http://localhost:3000`，需要使用工具将本地端口暴露到公网。

**推荐使用 ngrok**：

1. **安装 ngrok**
   ```bash
   # 使用 npm 安装（最简单）
   npm install -g ngrok
   ```

2. **启动 Next.js 应用**
   ```bash
   npm run dev
   ```
   应用运行在 `http://localhost:3000`

3. **启动 ngrok（新开命令行窗口）**
   ```bash
   ngrok http 3000
   ```

4. **获取公网 URL**

   ngrok 启动后会显示：
   ```
   Forwarding  https://abc123def456.ngrok-free.app -> http://localhost:3000
   ```

   复制这个 HTTPS URL（每次启动都会变化）

5. **配置 PayPal Webhook**
   - 在 PayPal Developer Dashboard 中
   - 点击 "Add Webhook"
   - **Webhook URL**: `https://abc123def456.ngrok-free.app/api/paypal/webhook`
     - ⚠️ 替换为您的实际 ngrok URL
     - ⚠️ 必须包含 `/api/paypal/webhook` 路径
   - **Event types**: 选择以下事件
     - ✅ `CHECKOUT.ORDER.APPROVED`
     - ✅ `PAYMENT.CAPTURE.COMPLETED`
   - 点击 "Save"
   - **复制生成的 Webhook ID**

6. **监控请求（可选）**

   访问 `http://127.0.0.1:4040` 查看 ngrok Web 界面，可以实时查看所有 webhook 请求。

**详细的本地 Webhook 配置指南，请查看**: [`LOCAL_WEBHOOK_SETUP.md`](./LOCAL_WEBHOOK_SETUP.md)

#### 生产环境

1. 部署应用到 Vercel 后，使用真实域名
2. 在 PayPal Developer Dashboard 中
3. 切换到 "Live" 标签（生产环境）
4. 配置 Webhook URL: `https://your-domain.vercel.app/api/paypal/webhook`
5. 订阅相同的事件
6. 复制生产环境的 Webhook ID

---

## 3️⃣ 环境变量配置

### 3.1 创建配置文件

```bash
# 复制示例文件
cp .env.example .env.local
```

### 3.2 填写配置

编辑 `.env.local` 文件，填写以下信息：

```bash
# Supabase配置
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的anon密钥
SUPABASE_SERVICE_ROLE_KEY=你的service_role密钥

# PayPal配置
NEXT_PUBLIC_PAYPAL_CLIENT_ID=你的PayPal客户端ID
PAYPAL_CLIENT_SECRET=你的PayPal密钥
PAYPAL_WEBHOOK_ID=你的Webhook ID
```

### 3.3 验证配置

运行配置检查脚本：

```bash
node scripts/check-config.js
```

如果看到 ✅ 表示配置正确。

---

## 4️⃣ 启动项目

### 4.1 安装依赖

```bash
npm install
```

### 4.2 运行开发服务器

```bash
npm run dev
```

### 4.3 访问应用

打开浏览器访问: [http://localhost:3000](http://localhost:3000)

---

## 🔧 常见问题

### Q1: Supabase 连接失败
- 检查 URL 和密钥是否正确
- 确认网络可以访问 Supabase
- 检查是否有防火墙阻止

### Q2: 图片上传失败
- 确认存储桶 `grid-photos` 已创建
- 确认存储桶策略已正确配置
- 检查用户是否已登录

### Q3: PayPal 支付失败
- 确认所有 PayPal 环境变量已配置
- 检查 Webhook URL 是否可访问
- 查看浏览器控制台和服务器日志

### Q4: Webhook 验证失败
- 确认 `PAYPAL_WEBHOOK_ID` 已配置
- 确认 Webhook URL 与配置的一致
- 生产环境必须使用 HTTPS

---

## 📚 相关文档

- [Supabase 文档](https://supabase.com/docs)
- [PayPal Developer 文档](https://developer.paypal.com/docs/)
- [Next.js 文档](https://nextjs.org/docs)

---

## 🆘 需要帮助？

如果遇到问题，请：
1. 查看项目 README.md
2. 查看 DEPLOYMENT.md
3. 提交 GitHub Issue
