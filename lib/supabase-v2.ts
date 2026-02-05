import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { Database } from './database.types'

// 安全获取环境变量
function safeGetEnv(key: string, fallback: string = ''): string {
  try {
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return String(process.env[key])
    }
  } catch (e) {
    // Ignore
  }
  return fallback
}

// 获取配置
const supabaseUrl = safeGetEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://placeholder.supabase.co')
const supabaseAnonKey = safeGetEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDUxOTI4MDAsImV4cCI6MTk2MDc2ODgwMH0.placeholder')

// 检查是否配置
const isConfigured = supabaseUrl.includes('.supabase.co') &&
                     !supabaseUrl.includes('placeholder') &&
                     !supabaseAnonKey.includes('placeholder')

// 创建客户端
let client: SupabaseClient<Database>

try {
  client = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })
} catch (error) {
  console.error('Failed to create Supabase client:', error)
  // 创建一个假的客户端
  client = createClient<Database>('https://placeholder.supabase.co', 'placeholder-key')
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
    if (!isConfigured) {
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
      if (!isConfigured) {
        return { data: { session: null }, error: null }
      }
      try {
        return await client.auth.getSession()
      } catch (error) {
        return { data: { session: null }, error }
      }
    },
    getUser: async () => {
      if (!isConfigured) {
        return { data: { user: null }, error: null }
      }
      try {
        return await client.auth.getUser()
      } catch (error) {
        return { data: { user: null }, error }
      }
    },
    signUp: async (credentials: any) => {
      if (!isConfigured) {
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
      if (!isConfigured) {
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
      if (!isConfigured) {
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
      if (!isConfigured) {
        return { error: null }
      }
      try {
        return await client.auth.signOut()
      } catch (error) {
        return { error }
      }
    },
    onAuthStateChange: (callback: any) => {
      if (!isConfigured) {
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
        if (!isConfigured) {
          return { data: null, error: null }
        }
        try {
          return await client.storage.from(bucket).upload(path, file)
        } catch (error) {
          return { data: null, error }
        }
      },
      getPublicUrl: (path: string) => {
        if (!isConfigured) {
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
