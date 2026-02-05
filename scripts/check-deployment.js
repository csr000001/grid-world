#!/usr/bin/env node

/**
 * Deployment Environment Check Script
 * Run this before deploying to verify all configurations
 */

const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'NEXT_PUBLIC_PAYPAL_CLIENT_ID',
  'PAYPAL_CLIENT_SECRET',
  'PAYPAL_WEBHOOK_ID',
  'NEXT_PUBLIC_APP_URL',
  'NEXT_PUBLIC_SITE_NAME',
]

const optionalEnvVars = [
  'NEXT_PUBLIC_CONTACT_EMAIL',
]

console.log('🔍 Checking deployment environment...\n')

let hasErrors = false
let hasWarnings = false

// Check required variables
console.log('📋 Required Environment Variables:')
requiredEnvVars.forEach(varName => {
  const value = process.env[varName]

  if (!value) {
    console.log(`  ❌ ${varName}: MISSING`)
    hasErrors = true
  } else if (value.includes('your-') || value.includes('你的')) {
    console.log(`  ⚠️  ${varName}: PLACEHOLDER (${value.substring(0, 30)}...)`)
    hasErrors = true
  } else if (value.length < 10) {
    console.log(`  ⚠️  ${varName}: TOO SHORT (might be invalid)`)
    hasWarnings = true
  } else {
    console.log(`  ✅ ${varName}: OK (${value.substring(0, 20)}...)`)
  }
})

console.log('\n📋 Optional Environment Variables:')
optionalEnvVars.forEach(varName => {
  const value = process.env[varName]

  if (!value) {
    console.log(`  ⚠️  ${varName}: NOT SET`)
    hasWarnings = true
  } else {
    console.log(`  ✅ ${varName}: OK`)
  }
})

// Check specific configurations
console.log('\n🔧 Configuration Checks:')

// Check Supabase URL format
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
if (supabaseUrl && !supabaseUrl.startsWith('https://')) {
  console.log('  ❌ NEXT_PUBLIC_SUPABASE_URL must start with https://')
  hasErrors = true
} else if (supabaseUrl && !supabaseUrl.includes('.supabase.co')) {
  console.log('  ⚠️  NEXT_PUBLIC_SUPABASE_URL should contain .supabase.co')
  hasWarnings = true
} else if (supabaseUrl) {
  console.log('  ✅ Supabase URL format: OK')
}

// Check APP URL format
const appUrl = process.env.NEXT_PUBLIC_APP_URL
if (appUrl && process.env.NODE_ENV === 'production' && appUrl.includes('localhost')) {
  console.log('  ❌ NEXT_PUBLIC_APP_URL should not be localhost in production')
  hasErrors = true
} else if (appUrl && process.env.NODE_ENV === 'production' && !appUrl.startsWith('https://')) {
  console.log('  ⚠️  NEXT_PUBLIC_APP_URL should use HTTPS in production')
  hasWarnings = true
} else if (appUrl) {
  console.log('  ✅ App URL format: OK')
}

// Check PayPal configuration
const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID
if (paypalClientId && paypalClientId.startsWith('sb-')) {
  console.log('  ⚠️  PayPal Client ID appears to be Sandbox (starts with sb-)')
  console.log('     Make sure this is intentional for production')
  hasWarnings = true
} else if (paypalClientId) {
  console.log('  ✅ PayPal Client ID: OK')
}

// Summary
console.log('\n' + '='.repeat(50))
if (hasErrors) {
  console.log('❌ DEPLOYMENT CHECK FAILED')
  console.log('Please fix the errors above before deploying.')
  process.exit(1)
} else if (hasWarnings) {
  console.log('⚠️  DEPLOYMENT CHECK PASSED WITH WARNINGS')
  console.log('Review the warnings above before deploying.')
  process.exit(0)
} else {
  console.log('✅ DEPLOYMENT CHECK PASSED')
  console.log('All configurations look good!')
  process.exit(0)
}
