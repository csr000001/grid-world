# Grid World

一个基于格子的照片展示平台，用户可以购买格子并上传照片展示。

## 功能特性

### 核心功能
- ✅ **动态格子系统**: 初始10000个格子，填充率达50%自动扩展10000个，最大支持1亿格子
- ✅ **照片上传**: 用户可上传照片并自定义格子颜色（窗帘效果）
- ✅ **支付系统**: 支持 PayPal 支付
- ✅ **点赞延期**: 每个点赞延长1天存储时间，最多9999天
- ✅ **照片导航**: 放大浏览时可通过上下左右按钮切换相邻格子
- ✅ **探索模式**: 随机聚焦到任意格子
- ✅ **广告格子**: 支持YouTube广告播放，播放完成后恢复为空白格

### 定价策略
- 首次购买: $1 USD（包含30天存储）
- 修改内容: $99 USD（需在有效期内）
- 点赞延期: 免费（每个点赞+1天）

### 技术栈
- **前端**: Next.js 16 (App Router) + React 19 + TypeScript
- **数据库**: Supabase (PostgreSQL)
- **认证**: Supabase Auth (Google OAuth)
- **存储**: Supabase Storage
- **支付**: PayPal
- **部署**: Vercel

## 快速开始

### 🚀 快速启动（推荐）

**Windows 用户**：双击运行 `start-dev.bat` 脚本，自动启动所有服务。

**详细指南**：查看 [`QUICK_START.md`](./QUICK_START.md)

### 📋 手动启动

### 1. 安装依赖
```bash
npm install
```

### 2. 配置环境变量

**完整配置指南**：查看 [`CONFIGURATION.md`](./CONFIGURATION.md)

复制 `.env.example` 文件并填写配置：

```bash
# Supabase配置
NEXT_PUBLIC_SUPABASE_URL=你的Supabase项目URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的Supabase匿名密钥
SUPABASE_SERVICE_ROLE_KEY=你的Supabase服务端密钥

# PayPal配置
NEXT_PUBLIC_PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
PAYPAL_WEBHOOK_ID=
```

**验证配置**：
```bash
node scripts/check-config.js
```

### 3. 初始化数据库
在 Supabase Dashboard 的 SQL Editor 中执行 `supabase-schema.sql` 文件。

### 4. 配置存储桶
在 Supabase Storage 中创建名为 `grid-photos` 的公开存储桶。

### 5. 运行开发服务器

**方式一：使用启动脚本（Windows）**
```bash
start-dev.bat
```

**方式二：手动启动**
```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)

### 6. 配置本地 Webhook（用于测试支付）

**详细指南**：查看 [`LOCAL_WEBHOOK_SETUP.md`](./LOCAL_WEBHOOK_SETUP.md)

**快速步骤**：
1. 安装 ngrok: `npm install -g ngrok`
2. 启动 ngrok: `ngrok http 3000`
3. 复制 ngrok URL（如 `https://abc123.ngrok-free.app`）
4. 在 PayPal Developer Dashboard 配置 Webhook
5. Webhook URL: `https://abc123.ngrok-free.app/api/paypal/webhook`
6. 更新 `.env.local` 中的 `PAYPAL_WEBHOOK_ID`
7. 重启应用

## 项目结构

```
grid-world/
├── app/
│   ├── api/
│   │   ├── paypal/
│   │   │   ├── create-order/route.ts    # PayPal订单创建
│   │   │   └── webhook/route.ts         # PayPal webhook处理
│   ├── components/
│   │   ├── Navbar.tsx                   # 导航栏
│   │   └── Footer.tsx                   # 页脚
│   ├── upload/page.tsx                  # 主格子页面
│   ├── payment-success/page.tsx         # 支付成功页面
│   ├── page.tsx                         # 首页
│   ├── layout.tsx                       # 根布局
│   └── globals.css                      # 全局样式
├── src/
│   └── lib/
│       └── paypal.ts                    # PayPal集成
├── supabase-schema.sql                  # 数据库架构
├── DEPLOYMENT.md                        # 部署指南
└── package.json
```

## 数据库架构

### grids 表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGSERIAL | 格子ID（主键）|
| user_id | UUID | 所有者ID |
| ad_grid | BOOLEAN | 是否为广告格 |
| storage_days | INTEGER | 剩余存储天数 |
| like_count | INTEGER | 点赞数 |
| curtain_color | VARCHAR(20) | 格子颜色（窗帘） |
| photo_url | TEXT | 照片URL |
| created_at | TIMESTAMP | 创建时间 |
| modified_at | TIMESTAMP | 修改时间 |

### grid_likes 表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGSERIAL | 主键 |
| grid_id | BIGINT | 格子ID |
| user_id | UUID | 点赞用户ID |
| created_at | TIMESTAMP | 点赞时间 |

## 部署

详细部署步骤请参考 [DEPLOYMENT.md](./DEPLOYMENT.md)

### Vercel 部署
1. 推送代码到 GitHub
2. 在 Vercel 导入项目
3. 配置环境变量
4. 部署

### Supabase 配置
1. 创建项目
2. 执行 SQL 脚本
3. 配置存储桶
4. 启用 Google OAuth

## 支付集成

### PayPal
- 支持全球支付
- Webhook 自动处理支付结果
- 配置 Webhook 接收支付通知

## 注意事项

1. **存储天数递减**: 需配置定时任务每天减少 `storage_days`
2. **内容审核**: 建议接入 AI 或人工审核系统
3. **性能优化**: 使用虚拟滚动处理大量格子
4. **备份策略**: 定期备份 Supabase 数据库

## 开发计划

- [ ] 内容审核系统（AI + 人工）
- [ ] 用户个人中心
- [ ] 格子搜索功能
- [ ] 格子转让功能
- [ ] 移动端优化
- [ ] 多语言支持

## 许可证

MIT License

## 联系方式

如有问题或建议，请提交 Issue。
