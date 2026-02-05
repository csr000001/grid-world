/**
 * Environment variables validation
 * This file checks if all required environment variables are set
 */

// 安全获取环境变量
function safeGetEnv(key: string): string | undefined {
  if (typeof process === 'undefined' || !process.env) {
    return undefined
  }
  return process.env[key]
}

export function validateEnv() {
  const requiredEnvVars = {
    NEXT_PUBLIC_SUPABASE_URL: safeGetEnv('NEXT_PUBLIC_SUPABASE_URL'),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: safeGetEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    NEXT_PUBLIC_PAYPAL_CLIENT_ID: safeGetEnv('NEXT_PUBLIC_PAYPAL_CLIENT_ID'),
    NEXT_PUBLIC_APP_URL: safeGetEnv('NEXT_PUBLIC_APP_URL'),
    NEXT_PUBLIC_SITE_NAME: safeGetEnv('NEXT_PUBLIC_SITE_NAME'),
  }

  const missing: string[] = []
  const invalid: string[] = []

  for (const [key, value] of Object.entries(requiredEnvVars)) {
    if (!value || typeof value !== 'string') {
      missing.push(key)
    } else if (value.includes('your-') || value.includes('你的')) {
      invalid.push(key)
    }
  }

  if (missing.length > 0 || invalid.length > 0) {
    const errors: string[] = []

    if (missing.length > 0) {
      errors.push(`Missing environment variables: ${missing.join(', ')}`)
    }

    if (invalid.length > 0) {
      errors.push(`Invalid placeholder values in: ${invalid.join(', ')}`)
    }

    if (typeof console !== 'undefined') {
      console.error('❌ Environment Configuration Error:')
      errors.forEach(err => console.error(`  - ${err}`))
      console.error('\nPlease check your .env.local file or deployment environment variables.')
    }

    return false
  }

  return true
}

// Safe getter for environment variables with fallback
export function getEnvVar(key: string, fallback: string = ''): string {
  const value = safeGetEnv(key)
  if (!value || typeof value !== 'string' || value.includes('your-') || value.includes('你的')) {
    return fallback
  }
  return value
}
