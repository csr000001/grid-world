import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { Database } from './database.types'

// 安全获取环境变量 - 支持客户端和服务端
function safeGetEnv(key: string, fallback: string = ''): string {
  // 在客户端，Next.js会将NEXT_PUBLIC_*变量注入到process.env
  // 但我们也检查window对象以防万一
  try {
    // 首先尝试从process.env获取（服务端和客户端都支持）
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return String(process.env[key])
    }

    // 在浏览器环境中，Next.js会将环境变量编译到代码中
    // 所以process.env[key]应该可以直接访问
    const envValue = process.env[key]
    if (envValue && typeof envValue === 'string') {
      return envValue
    }
  } catch (e) {
    console.warn(`Failed to get env var ${key}:`, e)
  }
  return fallback
}

// 获取配置
const supabaseUrl = safeGetEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://placeholder.supabase.co')
const supabaseAnonKey = safeGetEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDUxOTI4MDAsImV4cCI6MTk2MDc2ODgwMH0.placeholder')

// 调试日志
if (typeof window !== 'undefined') {
  console.log('Supabase URL:', supabaseUrl)
  console.log('Supabase Key (first 20 chars):', supabaseAnonKey.substring(0, 20))
}

// 检查是否配置
const isConfigured = supabaseUrl.includes('.supabase.co') &&
                     !supabaseUrl.includes('placeholder') &&
                     !supabaseAnonKey.includes('placeholder')

// 创建客户端 - 只在配置正确时创建
let client: SupabaseClient<Database> | null = null

if (isConfigured) {
  try {
    client = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    })
    if (typeof window !== 'undefined') {
      console.log('✅ Supabase client created successfully')
    }
  } catch (error) {
    console.error('Failed to create Supabase client:', error)
    client = null
  }
} else {
  if (typeof window !== 'undefined') {
    console.warn('⚠️ Supabase not configured. App will run in demo mode.')
  }
}

// 导出配置状态
export const SUPABASE_CONFIGURED = isConfigured

// 安全的查询包装器
async function safeQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  fallbackData: T
): Promise<{ data: T; error: any }> {
  if (!isConfigured) {
    return { data: fallbackData, error: null }
  }

  try {
    const result = await queryFn()
    return {
      data: result.data ?? fallbackData,
      error: result.error ?? null,
    }
  } catch (error) {
    return { data: fallbackData, error }
  }
}

// 导出安全的 Supabase 客户端
export const supabase = {
  // 查询方法
  from: (table: string) => {
    // Check configuration BEFORE creating any query chains
    if (!isConfigured || !client) {
      const emptyResult = Promise.resolve({ data: [], error: null })
      const emptyNullResult = Promise.resolve({ data: null, error: null })

      const mockChainableQuery: any = {
        order: () => emptyResult,
        eq: () => mockChainableQuery,
        gte: () => mockChainableQuery,
        gt: () => mockChainableQuery,
        lte: () => mockChainableQuery,
        lt: () => mockChainableQuery,
        single: () => emptyNullResult,
        limit: () => emptyResult,
        then: (resolve: any) => emptyResult.then(resolve),
      }

      return {
        select: () => mockChainableQuery,
        insert: () => emptyNullResult,
        update: () => ({
          eq: () => emptyNullResult,
        }),
        delete: () => ({
          eq: () => emptyNullResult,
        }),
      }
    }

    const originalFrom = client.from(table)

    return {
      select: (columns = '*') => {
        const query = originalFrom.select(columns)

        const buildChainableQuery = (currentQuery: any): any => ({
          order: (column: string, options?: any) => {
            const orderedQuery = currentQuery.order(column, options)
            return safeQuery(async () => {
              const result = await orderedQuery
              return result
            }, [])
          },
          eq: (column: string, value: any) => {
            const filteredQuery = currentQuery.eq(column, value)
            return buildChainableQuery(filteredQuery)
          },
          gte: (column: string, value: any) => {
            const filteredQuery = currentQuery.gte(column, value)
            return buildChainableQuery(filteredQuery)
          },
          gt: (column: string, value: any) => {
            const filteredQuery = currentQuery.gt(column, value)
            return buildChainableQuery(filteredQuery)
          },
          lte: (column: string, value: any) => {
            const filteredQuery = currentQuery.lte(column, value)
            return buildChainableQuery(filteredQuery)
          },
          lt: (column: string, value: any) => {
            const filteredQuery = currentQuery.lt(column, value)
            return buildChainableQuery(filteredQuery)
          },
          single: () => {
            const singleQuery = currentQuery.single()
            return safeQuery(async () => {
              const result = await singleQuery
              return result
            }, null)
          },
          limit: (count: number) => {
            const limitedQuery = currentQuery.limit(count)
            return safeQuery(async () => {
              const result = await limitedQuery
              return result
            }, [])
          },
          then: (resolve: any, reject: any) => {
            return safeQuery(async () => {
              const result = await currentQuery
              return result
            }, []).then(resolve, reject)
          },
        })

        return buildChainableQuery(query)
      },
      insert: (data: any) => {
        const insertQuery = (originalFrom as any).insert(data)
        return safeQuery(async () => {
          const result = await insertQuery
          return result
        }, null)
      },
      update: (data: any) => ({
        eq: (column: string, value: any) => {
          const updateQuery = (originalFrom as any).update(data).eq(column, value)
          return safeQuery(async () => {
            const result = await updateQuery
            return result
          }, null)
        },
      }),
      delete: () => ({
        eq: (column: string, value: any) => {
          const deleteQuery = (originalFrom as any).delete().eq(column, value)
          return safeQuery(async () => {
            const result = await deleteQuery
            return result
          }, null)
        },
      }),
    }
  },

  // Auth 方法
  auth: {
    getSession: async () => {
      if (!isConfigured || !client) {
        return { data: { session: null }, error: null }
      }
      try {
        return await client.auth.getSession()
      } catch (error) {
        return { data: { session: null }, error }
      }
    },
    getUser: async () => {
      if (!isConfigured || !client) {
        return { data: { user: null }, error: null }
      }
      try {
        return await client.auth.getUser()
      } catch (error) {
        return { data: { user: null }, error }
      }
    },
    signUp: async (credentials: any) => {
      if (!isConfigured || !client) {
        console.warn('Supabase not configured')
        return { data: { user: null, session: null }, error: { message: 'Supabase not configured' } }
      }
      try {
        return await client.auth.signUp(credentials)
      } catch (error) {
        return { data: { user: null, session: null }, error }
      }
    },
    signInWithPassword: async (credentials: any) => {
      if (!isConfigured || !client) {
        console.warn('Supabase not configured')
        return { data: { user: null, session: null }, error: { message: 'Supabase not configured' } }
      }
      try {
        return await client.auth.signInWithPassword(credentials)
      } catch (error) {
        return { data: { user: null, session: null }, error }
      }
    },
    signInWithOAuth: async (options: any) => {
      if (!isConfigured || !client) {
        console.warn('Supabase not configured')
        return { data: { provider: null, url: null }, error: null }
      }
      try {
        return await client.auth.signInWithOAuth(options)
      } catch (error) {
        return { data: { provider: null, url: null }, error }
      }
    },
    signOut: async () => {
      if (!isConfigured || !client) {
        return { error: null }
      }
      try {
        return await client.auth.signOut()
      } catch (error) {
        return { error }
      }
    },
    onAuthStateChange: (callback: any) => {
      if (!isConfigured || !client) {
        return { data: { subscription: { unsubscribe: () => {} } } }
      }
      try {
        return client.auth.onAuthStateChange(callback)
      } catch (error) {
        return { data: { subscription: { unsubscribe: () => {} } } }
      }
    },
  },

  // Storage 方法
  storage: {
    from: (bucket: string) => ({
      upload: async (path: string, file: any) => {
        if (!isConfigured || !client) {
          return { data: null, error: null }
        }
        try {
          return await client.storage.from(bucket).upload(path, file)
        } catch (error) {
          return { data: null, error }
        }
      },
      getPublicUrl: (path: string) => {
        if (!isConfigured || !client) {
          return { data: { publicUrl: '' } }
        }
        try {
          return client.storage.from(bucket).getPublicUrl(path)
        } catch (error) {
          return { data: { publicUrl: '' } }
        }
      },
    }),
  },
}

// 辅助函数
export async function getCurrentUser() {
  const { data } = await supabase.auth.getUser()
  return data.user
}

export async function isAuthenticated() {
  const { data } = await supabase.auth.getSession()
  return !!data.session
}
