// Database types generated from Supabase schema

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      grids: {
        Row: {
          id: number
          user_id: string | null
          ad_grid: boolean
          storage_days: number
          like_count: number
          curtain_color: string
          photo_url: string | null
          created_at: string
          modified_at: string | null
        }
        Insert: {
          id?: number
          user_id?: string | null
          ad_grid?: boolean
          storage_days?: number
          like_count?: number
          curtain_color?: string
          photo_url?: string | null
          created_at?: string
          modified_at?: string | null
        }
        Update: {
          id?: number
          user_id?: string | null
          ad_grid?: boolean
          storage_days?: number
          like_count?: number
          curtain_color?: string
          photo_url?: string | null
          created_at?: string
          modified_at?: string | null
        }
      }
      grid_likes: {
        Row: {
          id: number
          grid_id: number
          user_id: string
          created_at: string
        }
        Insert: {
          id?: number
          grid_id: number
          user_id: string
          created_at?: string
        }
        Update: {
          id?: number
          grid_id?: number
          user_id?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
