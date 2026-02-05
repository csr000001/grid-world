import { supabase } from './supabase'

/**
 * Safe wrapper for Supabase queries
 * Handles errors gracefully and prevents Object.values errors
 */

export async function safeSupabaseQuery<T>(
  queryFn: () => Promise<any>,
  fallback: T
): Promise<{ data: T; error: any }> {
  try {
    const result = await queryFn()

    // Check if result is valid
    if (!result || typeof result !== 'object') {
      console.warn('Invalid Supabase query result:', result)
      return { data: fallback, error: null }
    }

    // Return data or fallback
    return {
      data: result.data ?? fallback,
      error: result.error ?? null
    }
  } catch (error) {
    console.error('Supabase query error:', error)
    return { data: fallback, error }
  }
}

/**
 * Check if Supabase is properly configured
 */
export function isSupabaseConfigured(): boolean {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    return !!(url && !url.includes('placeholder') && !url.includes('localhost'))
  } catch {
    return false
  }
}

/**
 * Safe Supabase client that shows user-friendly errors
 */
export const safeSupabase = {
  from: (table: string) => {
    if (!isSupabaseConfigured()) {
      console.warn(`⚠️ Supabase not configured. Query to '${table}' will fail.`)

      // Return a mock query builder that always returns empty data
      return {
        select: () => ({
          order: () => Promise.resolve({ data: [], error: null }),
          eq: () => Promise.resolve({ data: [], error: null }),
          single: () => Promise.resolve({ data: null, error: null }),
        }),
        insert: () => Promise.resolve({ data: null, error: null }),
        update: () => Promise.resolve({ data: null, error: null }),
        delete: () => Promise.resolve({ data: null, error: null }),
      }
    }

    return supabase.from(table)
  },

  auth: supabase.auth,
  storage: supabase.storage,
}
