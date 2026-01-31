# Grid World - 部署指南

## 项目概述

Grid World 是一个基于格子的照片展示平台，用户可以购买格子并上传照片。项目使用 Next.js + Supabase + PayPal 构建。

## 技术栈

- **前端框架**: Next.js 16 (App Router)
- **数据库**: Supabase (PostgreSQL)
- **认证**: Supabase Auth (Google OAuth)
- **存储**: Supabase Storage
- **支付**: PayPal
- **部署**: Vercel

## 部署步骤

### 1. Supabase 配置

#### 1.1 创建项目
1. 访问 [Supabase Dashboard](https://app.supabase.com)
2. 创建新项目
3. 记录项目URL和API密钥

#### 1.2 执行数据库脚本
1. 在 Supabase Dashboard 中打开 SQL Editor
2. 执行 `supabase-schema.sql` 文件中的所有SQL语句
3. 确认 `grids` 和 `grid_likes` 表已创建

#### 1.3 配置存储桶
1. 进入 Storage 页面
2. 创建名为 `grid-photos` 的公开存储桶
3. 配置存储桶策略：
   ```sql
   -- 允许登录用户上传
   CREATE POLICY "Allow authenticated uploads"
   ON storage.objects FOR INSERT
   TO authenticated
   WITH CHECK (bucket_id = 'grid-photos');

   -- 允许所有人读取
   CREATE POLICY "Allow public reads"
   ON storage.objects FOR SELECT
   TO public
   USING (bucket_id = 'grid-photos');
   ```

#### 1.4 配置认证
1. 进入 Authentication > Providers
2. 启用 Google OAuth
3. 配置 Google OAuth 回调URL: `https://你的域名/auth/callback`

### 2. 支付配置

#### 2.1 PayPal 配置
1. 注册 [PayPal Developer](https://developer.paypal.com) 账号
2. 创建应用并获取：
   - Client ID
   - Client Secret
3. 配置 Webhook URL: `https://你的域名/api/paypal/webhook`
4. 订阅以下事件：
   - `CHECKOUT.ORDER.APPROVED`
   - `PAYMENT.CAPTURE.COMPLETED`

### 3. Vercel 部署

#### 3.1 连接 GitHub
1. 将代码推送到 GitHub
2. 访问 [Vercel Dashboard](https://vercel.com)
3. 导入 GitHub 仓库

#### 3.2 配置环境变量
在 Vercel 项目设置中添加以下环境变量：

```bash
# 网站配置
NEXT_PUBLIC_APP_URL=https://你的域名.vercel.app
NEXT_PUBLIC_SITE_NAME=Grid World

# Supabase
NEXT_PUBLIC_SUPABASE_URL=你的Supabase项目URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的Supabase匿名密钥
SUPABASE_SERVICE_ROLE_KEY=你的Supabase服务端密钥

# PayPal
NEXT_PUBLIC_PAYPAL_CLIENT_ID=你的PayPal客户端ID
PAYPAL_CLIENT_SECRET=你的PayPal密钥
PAYPAL_WEBHOOK_ID=你的PayPal Webhook ID

# 环境
NODE_ENV=production
```

#### 3.3 部署
1. 点击 "Deploy" 按钮
2. 等待构建完成
3. 访问生成的域名测试功能

### 4. 上线后配置

#### 4.1 配置自定义域名
1. 在 Vercel 项目设置中添加自定义域名
2. 配置 DNS 记录指向 Vercel

#### 4.2 配置定时任务（可选）
使用 Vercel Cron Jobs 或 Supabase Edge Functions 创建定时任务，每天减少 `storage_days`：

```typescript
// vercel.json
{
  "crons": [{
    "path": "/api/cron/decrease-storage-days",
    "schedule": "0 0 * * *"
  }]
}
```

## 功能清单

- [x] 动态格子扩展（初始10000，填充50%后自动扩展，上限1亿）
- [x] 用户认证（Google OAuth）
- [x] 照片上传（Supabase Storage）
- [x] 格子购买（$1首次，$99修改）
- [x] 点赞系统（延长存储时间，上限9999天）
- [x] 照片浏览导航（上下左右切换）
- [x] 探索功能（随机聚焦格子）
- [x] 支付集成（PayPal）
- [x] 黑色背景 + 半透明灰色空白格
- [x] 广告格子系统（YouTube播放）
- [x] 先编辑后付款流程

## 注意事项

1. **存储天数**: 需要配置定时任务每天减少 `storage_days`，否则格子不会过期
2. **图片审核**: 建议接入内容审核服务（如 AWS Rekognition 或人工审核）
3. **性能优化**: 格子数量增加后，考虑使用虚拟滚动优化渲染性能
4. **备份**: 定期备份 Supabase 数据库

## 开发环境运行

```bash
# 安装依赖
npm install

# 配置环境变量
cp .env.local.example .env.local
# 编辑 .env.local 填写配置

# 运行开发服务器
npm run dev

# 访问 http://localhost:3000
```

## 支持

如有问题，请查看：
- [Next.js 文档](https://nextjs.org/docs)
- [Supabase 文档](https://supabase.com/docs)
- [Vercel 文档](https://vercel.com/docs)
