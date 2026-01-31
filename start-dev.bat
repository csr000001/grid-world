@echo off
REM Grid World 本地开发启动脚本
REM 此脚本会启动 Next.js 应用和 ngrok

echo ========================================
echo Grid World 本地开发环境启动
echo ========================================
echo.

REM 检查 Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [错误] 未找到 Node.js，请先安装 Node.js
    pause
    exit /b 1
)

REM 检查 ngrok
where ngrok >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [警告] 未找到 ngrok
    echo.
    echo 请选择安装方式:
    echo 1. 使用 npm 安装 (推荐)
    echo 2. 手动安装
    echo.
    set /p choice="请输入选择 (1 或 2): "

    if "%choice%"=="1" (
        echo.
        echo 正在安装 ngrok...
        call npm install -g ngrok
        if %ERRORLEVEL% NEQ 0 (
            echo [错误] ngrok 安装失败
            pause
            exit /b 1
        )
        echo [成功] ngrok 安装完成
    ) else (
        echo.
        echo 请访问 https://ngrok.com/download 下载并安装 ngrok
        echo 安装完成后重新运行此脚本
        pause
        exit /b 1
    )
)

REM 检查 .env.local
if not exist ".env.local" (
    echo [错误] 未找到 .env.local 文件
    echo.
    echo 请先配置环境变量:
    echo 1. 复制 .env.example 为 .env.local
    echo 2. 填写 Supabase 和 PayPal 配置
    echo.
    pause
    exit /b 1
)

REM 运行配置检查
echo [1/4] 检查配置...
call node scripts/check-config.js
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [错误] 配置检查失败，请修复后重试
    pause
    exit /b 1
)

echo.
echo [2/4] 启动 Next.js 应用...
echo.
echo 正在新窗口中启动 Next.js...
start "Grid World - Next.js" cmd /k "npm run dev"

REM 等待应用启动
echo 等待应用启动 (10秒)...
timeout /t 10 /nobreak >nul

echo.
echo [3/4] 启动 ngrok...
echo.
echo 正在新窗口中启动 ngrok...
start "Grid World - ngrok" cmd /k "ngrok http 3000"

REM 等待 ngrok 启动
echo 等待 ngrok 启动 (5秒)...
timeout /t 5 /nobreak >nul

echo.
echo [4/4] 启动完成！
echo.
echo ========================================
echo 服务已启动
echo ========================================
echo.
echo 1. Next.js 应用: http://localhost:3000
echo 2. ngrok 监控界面: http://127.0.0.1:4040
echo.
echo ========================================
echo 下一步操作
echo ========================================
echo.
echo 1. 打开 ngrok 监控界面: http://127.0.0.1:4040
echo 2. 复制 "Forwarding" 中的 HTTPS URL
echo    (类似 https://abc123.ngrok-free.app)
echo.
echo 3. 配置 PayPal Webhook:
echo    - 访问 https://developer.paypal.com/dashboard/
echo    - 进入您的应用 ^> Webhooks
echo    - Webhook URL: https://你的ngrok地址/api/paypal/webhook
echo    - 事件: CHECKOUT.ORDER.APPROVED, PAYMENT.CAPTURE.COMPLETED
echo    - 复制 Webhook ID
echo.
echo 4. 更新 .env.local 中的 PAYPAL_WEBHOOK_ID
echo.
echo 5. 重启 Next.js 应用 (在 Next.js 窗口按 Ctrl+C 然后重新运行)
echo.
echo 详细说明请查看: LOCAL_WEBHOOK_SETUP.md
echo.
echo ========================================
echo.
pause
