import { createClient } from '@supabase/supabase-js'
import { Database } from './database.types'

// 获取环境变量，如果是占位符则使用假的本地URL
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

// 检查是否是占位符配置
const isPlaceholder =
  !supabaseUrl ||
  !supabaseAnonKey ||
  supabaseUrl.includes('你的') ||
  supabaseAnonKey.includes('你的') ||
  supabaseUrl === 'http://localhost:54321'

// 如果是占位符配置，在控制台警告
if (isPlaceholder && typeof window !== 'undefined') {
  console.warn('⚠️ Supabase not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

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
