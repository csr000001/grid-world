#!/usr/bin/env node

/**
 * Grid World 配置检查脚本
 * 运行: node scripts/check-config.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 检查 Grid World 配置...\n');

// 检查 .env.local 文件是否存在
const envPath = path.join(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('❌ 错误: .env.local 文件不存在');
  console.log('💡 提示: 复制 .env.example 为 .env.local 并填写配置\n');
  process.exit(1);
}

// 读取并解析 .env.local 文件
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  line = line.trim();
  if (line && !line.startsWith('#')) {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      envVars[key.trim()] = valueParts.join('=').trim();
    }
  }
});

let hasErrors = false;
let hasWarnings = false;

// 必需的环境变量
const requiredVars = {
  'NEXT_PUBLIC_SUPABASE_URL': 'Supabase 项目 URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY': 'Supabase 匿名密钥',
  'SUPABASE_SERVICE_ROLE_KEY': 'Supabase 服务端密钥',
};

// 可选但推荐的环境变量
const optionalVars = {
  'NEXT_PUBLIC_PAYPAL_CLIENT_ID': 'PayPal 客户端 ID',
  'PAYPAL_CLIENT_SECRET': 'PayPal 密钥',
  'PAYPAL_WEBHOOK_ID': 'PayPal Webhook ID',
};

console.log('📋 必需配置检查:\n');

// 检查必需变量
for (const [key, description] of Object.entries(requiredVars)) {
  const value = envVars[key];

  if (!value) {
    console.error(`❌ ${key} (${description}): 未配置`);
    hasErrors = true;
  } else if (value.includes('placeholder') || value.includes('your-')) {
    console.error(`❌ ${key} (${description}): 仍是占位符，需要替换为真实值`);
    hasErrors = true;
  } else {
    console.log(`✅ ${key}: 已配置`);
  }
}

console.log('\n📋 可选配置检查 (PayPal支付):\n');

// 检查可选变量
let paypalConfigured = 0;
for (const [key, description] of Object.entries(optionalVars)) {
  const value = envVars[key];

  if (!value || value.trim() === '') {
    console.warn(`⚠️  ${key} (${description}): 未配置`);
    hasWarnings = true;
  } else {
    console.log(`✅ ${key}: 已配置`);
    paypalConfigured++;
  }
}

// PayPal 配置完整性检查
if (paypalConfigured > 0 && paypalConfigured < 3) {
  console.error('\n❌ PayPal 配置不完整: 必须配置所有3个PayPal变量或全部留空');
  hasErrors = true;
}

// 环境检查
console.log('\n📋 环境配置:\n');
const nodeEnv = envVars.NODE_ENV || 'development';
console.log(`📍 NODE_ENV: ${nodeEnv}`);

if (nodeEnv === 'production' && paypalConfigured < 3) {
  console.error('❌ 生产环境必须配置所有 PayPal 变量');
  hasErrors = true;
}

// 总结
console.log('\n' + '='.repeat(50));
if (hasErrors) {
  console.error('\n❌ 配置检查失败: 发现错误，请修复后再运行\n');
  process.exit(1);
} else if (hasWarnings) {
  console.warn('\n⚠️  配置检查通过，但有警告');
  console.log('💡 提示: PayPal 未配置，支付功能将不可用\n');
  process.exit(0);
} else {
  console.log('\n✅ 配置检查通过，所有必需配置已就绪！\n');
  process.exit(0);
}
