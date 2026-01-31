# 本地 PayPal Webhook 配置指南

本指南将帮助您在本地开发环境中配置 PayPal Webhook，以便测试支付功能。

---

## 🎯 问题说明

PayPal 需要通过公网 URL 访问您的 webhook 端点，但本地开发环境（`http://localhost:3000`）无法被 PayPal 服务器访问。

**解决方案**: 使用 **ngrok** 等工具将本地端口暴露到公网。

---

## 📋 准备工作

### 确认本地端口

您的 Next.js 应用运行在：
- **端口**: `3000`
- **本地地址**: `http://localhost:3000`
- **Webhook 路径**: `/api/paypal/webhook`
- **完整本地地址**: `http://localhost:3000/api/paypal/webhook`

---

## 🚀 方法一：使用 ngrok（推荐）

### 1. 安装 ngrok

#### Windows 安装方式：

**方式 A: 使用 Chocolatey（推荐）**
```bash
# 如果已安装 Chocolatey
choco install ngrok
```

**方式 B: 手动下载**
1. 访问 [ngrok 官网](https://ngrok.com/download)
2. 下载 Windows 版本
3. 解压到任意目录（如 `C:\ngrok`）
4. 将 ngrok.exe 所在目录添加到系统 PATH

**方式 C: 使用 npm（最简单）**
```bash
npm install -g ngrok
```

### 2. 注册 ngrok 账号（可选但推荐）

1. 访问 [ngrok.com](https://ngrok.com)
2. 点击 "Sign up" 注册免费账号
3. 登录后，在 Dashboard 中找到 "Your Authtoken"
4. 复制 authtoken

### 3. 配置 authtoken（如果注册了账号）

```bash
ngrok config add-authtoken YOUR_AUTHTOKEN
```

### 4. 启动 Next.js 应用

```bash
# 在项目目录下
npm run dev
```

确认应用运行在 `http://localhost:3000`

### 5. 启动 ngrok

**打开新的命令行窗口**，运行：

```bash
ngrok http 3000
```

### 6. 获取公网 URL

ngrok 启动后，您会看到类似这样的输出：

```
ngrok

Session Status                online
Account                       your-email@example.com (Plan: Free)
Version                       3.x.x
Region                        United States (us)
Latency                       -
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://abc123def456.ngrok-free.app -> http://localhost:3000

Connections                   ttl     opn     rt1     rt5     p50     p90
                              0       0       0.00    0.00    0.00    0.00
```

**重要信息**：
- **公网 URL**: `https://abc123def456.ngrok-free.app`（每次启动都会变化）
- **Webhook URL**: `https://abc123def456.ngrok-free.app/api/paypal/webhook`

---

## 🔧 配置 PayPal Webhook

### 1. 登录 PayPal Developer

访问 [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/)

### 2. 进入应用设置

1. 点击 "Apps & Credentials"
2. 选择 "Sandbox" 标签（测试环境）
3. 点击您的应用名称（Grid World）

### 3. 配置 Webhook

1. 滚动到 "Webhooks" 部分
2. 如果已有 webhook，点击 "Edit"；否则点击 "Add Webhook"
3. 填写信息：

**Webhook URL**:
```
https://abc123def456.ngrok-free.app/api/paypal/webhook
```
⚠️ **注意**: 替换为您的实际 ngrok URL

**Event types** - 勾选以下事件:
- ✅ `CHECKOUT.ORDER.APPROVED`
- ✅ `PAYMENT.CAPTURE.COMPLETED`

4. 点击 "Save"
5. **复制生成的 Webhook ID**（类似 `4Y275473US4510840`）

### 4. 更新环境变量

编辑 `.env.local` 文件，确保 Webhook ID 正确：

```bash
PAYPAL_WEBHOOK_ID=4Y275473US4510840
```

保存后，**重启 Next.js 应用**：
```bash
# Ctrl+C 停止应用
npm run dev
```

---

## 🧪 测试 Webhook

### 1. 访问 ngrok Web 界面

打开浏览器访问: `http://127.0.0.1:4040`

这个界面可以实时查看所有通过 ngrok 的 HTTP 请求。

### 2. 测试支付流程

1. 访问您的应用: `https://abc123def456.ngrok-free.app`
2. 登录并选择一个格子
3. 上传照片并选择颜色
4. 点击 "PayPal支付"
5. 在 PayPal Sandbox 中完成支付

### 3. 查看 Webhook 请求

在 ngrok Web 界面（`http://127.0.0.1:4040`）中，您应该能看到：
- PayPal 发送的 webhook 请求
- 请求头（包含签名信息）
- 请求体（支付事件数据）
- 您的应用返回的响应

### 4. 查看服务器日志

在运行 `npm run dev` 的命令行窗口中，您应该能看到：
```
PayPal支付成功：initial grid 123 by user xxx-xxx-xxx
```

---

## ⚠️ 重要注意事项

### 1. ngrok URL 会变化

**免费版 ngrok**：每次重启 ngrok，URL 都会变化（如 `abc123.ngrok-free.app` → `xyz789.ngrok-free.app`）

**解决方案**：
- **方案 A**: 每次重启 ngrok 后，更新 PayPal Webhook URL
- **方案 B**: 升级到 ngrok 付费版（$8/月），获得固定域名
- **方案 C**: 使用其他工具（见下文）

### 2. 保持 ngrok 运行

测试期间，需要同时运行：
- ✅ Next.js 应用（`npm run dev`）
- ✅ ngrok（`ngrok http 3000`）

### 3. 开发环境 Webhook 验证

您的代码已配置为：
- 开发环境：如果没有配置 `PAYPAL_WEBHOOK_ID`，会跳过验证并显示警告
- 生产环境：必须配置 `PAYPAL_WEBHOOK_ID`，否则会报错

---

## 🔄 方法二：使用其他工具

### LocalTunnel（免费，无需注册）

```bash
# 安装
npm install -g localtunnel

# 启动
lt --port 3000

# 输出示例
your url is: https://random-name-123.loca.lt
```

**Webhook URL**: `https://random-name-123.loca.lt/api/paypal/webhook`

### Cloudflare Tunnel（免费，需要 Cloudflare 账号）

```bash
# 安装
npm install -g cloudflared

# 启动
cloudflared tunnel --url http://localhost:3000
```

---

## 📝 完整工作流程示例

### 终端 1: 启动 Next.js
```bash
cd E:\gameproject\grid-world
npm run dev
```

### 终端 2: 启动 ngrok
```bash
ngrok http 3000
```

### 浏览器 1: ngrok 监控
```
http://127.0.0.1:4040
```

### 浏览器 2: 应用访问
```
https://abc123def456.ngrok-free.app
```

### PayPal Dashboard: 配置 Webhook
```
Webhook URL: https://abc123def456.ngrok-free.app/api/paypal/webhook
Events: CHECKOUT.ORDER.APPROVED, PAYMENT.CAPTURE.COMPLETED
```

---

## 🐛 常见问题

### Q1: ngrok 启动后立即关闭
**原因**: 可能是端口被占用或 authtoken 无效

**解决**:
```bash
# 检查端口占用
netstat -ano | findstr :3000

# 重新配置 authtoken
ngrok config add-authtoken YOUR_AUTHTOKEN
```

### Q2: PayPal Webhook 返回 404
**原因**: URL 配置错误

**检查**:
- ✅ ngrok 是否正在运行
- ✅ Next.js 应用是否正在运行
- ✅ URL 是否包含 `/api/paypal/webhook`
- ✅ 手动访问 webhook URL 是否返回 405（Method Not Allowed）

### Q3: Webhook 验证失败
**原因**: Webhook ID 配置错误或未配置

**解决**:
1. 确认 `.env.local` 中的 `PAYPAL_WEBHOOK_ID` 正确
2. 重启 Next.js 应用
3. 检查 PayPal Dashboard 中的 Webhook ID

### Q4: ngrok 显示 "ERR_NGROK_108"
**原因**: 免费版限制或网络问题

**解决**:
- 注册 ngrok 账号并配置 authtoken
- 检查网络连接
- 尝试重启 ngrok

---

## 🎯 快速开始命令

```bash
# 1. 安装 ngrok（如果还没安装）
npm install -g ngrok

# 2. 启动应用（终端1）
cd E:\gameproject\grid-world
npm run dev

# 3. 启动 ngrok（终端2）
ngrok http 3000

# 4. 复制 ngrok URL（类似 https://abc123.ngrok-free.app）

# 5. 配置 PayPal Webhook
# URL: https://abc123.ngrok-free.app/api/paypal/webhook

# 6. 更新 .env.local
# PAYPAL_WEBHOOK_ID=你的webhook_id

# 7. 重启应用
# Ctrl+C 然后 npm run dev

# 8. 开始测试！
```

---

## 📚 相关资源

- [ngrok 官方文档](https://ngrok.com/docs)
- [PayPal Webhooks 文档](https://developer.paypal.com/docs/api-basics/notifications/webhooks/)
- [LocalTunnel 文档](https://theboroer.github.io/localtunnel-www/)

---

## 💡 生产环境

生产环境部署到 Vercel 后，使用真实域名：
```
https://your-domain.vercel.app/api/paypal/webhook
```

不需要 ngrok，直接在 PayPal Dashboard 中配置即可。
