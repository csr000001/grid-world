import { supabase } from './supabase'

/**
 * Check if Supabase is properly configured
 */
export function isSupabaseConfigured(): boolean {
  try {
    if (typeof process === 'undefined' || !process.env) {
      return false
    }
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    return !!(url && typeof url === 'string' && !url.includes('placeholder') && !url.includes('localhost'))
  } catch {
    return false
  }
}

/**
 * Safe Supabase client that prevents errors when not configured
 */
export const safeSupabase = {
  from: (table: string) => {
    // If not configured, return mock that never makes network requests
    if (!isSupabaseConfigured()) {
      const emptyResult = { data: [], error: null }
      const emptyPromise = Promise.resolve(emptyResult)

      return {
        select: () => ({
          order: () => emptyPromise,
          eq: () => emptyPromise,
          single: () => Promise.resolve({ data: null, error: null }),
          limit: () => emptyPromise,
        }),
        insert: () => emptyPromise,
        update: () => ({
          eq: () => emptyPromise,
        }),
        delete: () => ({
          eq: () => emptyPromise,
        }),
        upsert: () => emptyPromise,
      }
    }

    // If configured, use real Supabase client
    return supabase.from(table)
  },

  auth: supabase.auth,
  storage: supabase.storage,
}
