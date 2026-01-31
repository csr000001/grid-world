# 🚀 Grid World 快速启动指南

## 📋 前置要求

- ✅ Node.js 已安装
- ✅ `.env.local` 已配置（Supabase + PayPal）
- ✅ ngrok 已安装（用于本地测试 webhook）

---

## ⚡ 快速启动（Windows）

### 方式一：使用启动脚本（推荐）

双击运行：
```
start-dev.bat
```

脚本会自动：
1. 检查配置
2. 启动 Next.js 应用
3. 启动 ngrok
4. 显示下一步操作提示

### 方式二：手动启动

**终端 1 - 启动应用**:
```bash
npm run dev
```

**终端 2 - 启动 ngrok**:
```bash
ngrok http 3000
```

---

## 🔧 配置 PayPal Webhook

### 1. 获取 ngrok URL

访问 ngrok 监控界面：
```
http://127.0.0.1:4040
```

复制 "Forwarding" 中的 HTTPS URL，例如：
```
https://abc123def456.ngrok-free.app
```

### 2. 配置 PayPal

1. 访问 [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/)
2. Apps & Credentials > Sandbox > 您的应用
3. 滚动到 "Webhooks" > Add Webhook
4. 填写：
   - **URL**: `https://abc123def456.ngrok-free.app/api/paypal/webhook`
   - **Events**:
     - ✅ CHECKOUT.ORDER.APPROVED
     - ✅ PAYMENT.CAPTURE.COMPLETED
5. 保存并复制 **Webhook ID**

### 3. 更新环境变量

编辑 `.env.local`：
```bash
PAYPAL_WEBHOOK_ID=你的webhook_id
```

### 4. 重启应用

在 Next.js 终端按 `Ctrl+C`，然后：
```bash
npm run dev
```

---

## 🧪 测试流程

1. 访问应用：`https://abc123def456.ngrok-free.app`
2. 登录（使用 Google OAuth）
3. 选择一个格子
4. 上传照片并选择颜色
5. 点击 "PayPal支付"
6. 使用 PayPal Sandbox 测试账号完成支付
7. 查看 ngrok 监控界面确认 webhook 请求
8. 确认格子已更新

---

## 📊 监控工具

### ngrok Web 界面
```
http://127.0.0.1:4040
```
- 查看所有 HTTP 请求
- 查看 webhook 请求详情
- 调试请求/响应

### Next.js 控制台
查看服务器日志：
- 支付创建日志
- Webhook 接收日志
- 数据库更新日志

---

## ⚠️ 常见问题

### Q: ngrok URL 每次都变化怎么办？

**免费版**：每次重启 ngrok，URL 都会变化
- 需要重新配置 PayPal Webhook URL

**解决方案**：
1. 升级 ngrok 付费版（$8/月，固定域名）
2. 或每次重启后更新 PayPal 配置

### Q: Webhook 验证失败

**检查清单**：
- ✅ `PAYPAL_WEBHOOK_ID` 已配置
- ✅ `.env.local` 已保存
- ✅ Next.js 应用已重启
- ✅ PayPal Webhook URL 正确

### Q: 支付成功但格子未更新

**可能原因**：
1. Webhook 未触发 - 检查 ngrok 监控界面
2. Webhook 验证失败 - 查看 Next.js 控制台日志
3. 数据库更新失败 - 检查 Supabase 配置

---

## 📚 详细文档

- **完整配置指南**: `CONFIGURATION.md`
- **本地 Webhook 设置**: `LOCAL_WEBHOOK_SETUP.md`
- **修复总结**: `FIXES_SUMMARY.md`
- **部署指南**: `DEPLOYMENT.md`

---

## 🎯 生产环境

部署到 Vercel 后：
1. 使用真实域名：`https://your-domain.vercel.app`
2. 不需要 ngrok
3. 在 PayPal 切换到 "Live" 环境
4. 配置生产环境 Webhook URL

---

## 💡 提示

- 开发时保持 ngrok 和 Next.js 同时运行
- 使用 ngrok 监控界面调试 webhook
- 测试完成后可以关闭 ngrok
- 生产环境不需要 ngrok

---

## 🆘 需要帮助？

1. 查看详细文档（上方列出）
2. 检查 Next.js 控制台日志
3. 检查 ngrok 监控界面
4. 提交 GitHub Issue
