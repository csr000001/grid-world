/**
 * Environment variables validation
 * This file checks if all required environment variables are set
 */

export function validateEnv() {
  const requiredEnvVars = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_PAYPAL_CLIENT_ID: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_SITE_NAME: process.env.NEXT_PUBLIC_SITE_NAME,
  }

  const missing: string[] = []
  const invalid: string[] = []

  for (const [key, value] of Object.entries(requiredEnvVars)) {
    if (!value) {
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

    console.error('❌ Environment Configuration Error:')
    errors.forEach(err => console.error(`  - ${err}`))
    console.error('\nPlease check your .env.local file or deployment environment variables.')

    return false
  }

  return true
}

// Safe getter for environment variables with fallback
export function getEnvVar(key: string, fallback: string = ''): string {
  const value = process.env[key]
  if (!value || value.includes('your-') || value.includes('你的')) {
    return fallback
  }
  return value
}
