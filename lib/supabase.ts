import { createClient } from '@supabase/supabase-js'
import { Database } from './database.types'

// 安全获取环境变量，避免在生产环境中访问 undefined
function getEnvVar(key: string, fallback: string): string {
  try {
    if (typeof process === 'undefined' || !process.env) {
      return fallback
    }
    const value = process.env[key]
    return (value && typeof value === 'string') ? value : fallback
  } catch (error) {
    console.warn(`Failed to get env var ${key}:`, error)
    return fallback
  }
}

// 获取环境变量，如果是占位符则使用假的本地URL
const supabaseUrl = getEnvVar('NEXT_PUBLIC_SUPABASE_URL', 'https://placeholder.supabase.co')
const supabaseAnonKey = getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDUxOTI4MDAsImV4cCI6MTk2MDc2ODgwMH0.placeholder')

// 检查是否是占位符配置
const isPlaceholder =
  supabaseUrl === 'https://placeholder.supabase.co' ||
  supabaseUrl.includes('你的') ||
  supabaseUrl.includes('your-') ||
  supabaseAnonKey.includes('placeholder')

// 如果是占位符配置，在控制台警告
if (isPlaceholder && typeof console !== 'undefined') {
  const errorMessage = '⚠️ Supabase not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY'

  try {
    if (typeof window !== 'undefined') {
      // Client-side: show warning in console
      console.error(errorMessage)
    } else {
      // Server-side: log warning
      console.warn(errorMessage)
    }

    // In production, log additional help
    const nodeEnv = getEnvVar('NODE_ENV', 'development')
    if (nodeEnv === 'production') {
      console.error('Production deployment detected with missing Supabase configuration.')
      console.error('Please set environment variables in your deployment platform (Vercel/Netlify).')
      console.error('See VERCEL_ENV_SETUP.md for detailed instructions.')
    }
  } catch (error) {
    // Silently fail if console is not available
  }
}

// 创建 Supabase 客户端，使用占位符值以避免错误
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // 禁用会话持久化以避免存储错误
    autoRefreshToken: false, // 禁用自动刷新
  },
  global: {
    headers: {
      'X-Client-Info': 'grid-world-client',
    },
  },
})

// Helper function to get current user
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  return user
}

// Helper function to check if user is authenticated
export async function isAuthenticated() {
  const { data: { session } } = await supabase.auth.getSession()
  return !!session
}
