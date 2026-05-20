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
      faculties: {
        Row: {
          id: string
          name: string
          slug: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          created_at?: string
        }
      }
      users: {
        Row: {
          id: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
        }
      }
      user_faculties: {
        Row: {
          user_id: string
          faculty_id: string
          role: 'ADMIN' | 'COORDINATOR' | 'STUDENT'
          created_at: string
        }
        Insert: {
          user_id: string
          faculty_id: string
          role?: 'ADMIN' | 'COORDINATOR' | 'STUDENT'
          created_at?: string
        }
        Update: {
          user_id?: string
          faculty_id?: string
          role?: 'ADMIN' | 'COORDINATOR' | 'STUDENT'
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
      user_role: 'ADMIN' | 'COORDINATOR' | 'STUDENT'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
