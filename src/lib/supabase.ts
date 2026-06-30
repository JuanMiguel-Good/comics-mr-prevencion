import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Faltan variables de entorno de Supabase.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'mr-prevencion-auth', // ← mismo key en todas las apps = sesión compartida
    flowType: 'implicit',
  },
});

export type UserRole = 'superadmin' | 'prevencionista' | 'trabajador';

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string;
  dni: string | null;
  phone: string | null;
  company_id: string | null;
  subscription_status: 'active' | 'trial' | 'expired' | 'cancelled' | null;
  subscription_end: string | null;
  avatar_url: string | null;
  created_at: string;
}

// Tipos de tablas propias de comics (sin cambios)
export interface Database {
  public: {
    Tables: {
      categories: {
        Row: { id: string; name: string; color: string; description?: string; created_at: string; };
        Insert: { id?: string; name: string; color?: string; description?: string; };
        Update: { id?: string; name?: string; color?: string; description?: string; };
      };
      comics: {
        Row: { id: string; title: string; description: string; cover_image?: string; file_url?: string; file_type: string; upload_date: string; downloads: number; created_by?: string; created_at: string; winning_topic_id?: string; };
        Insert: { id?: string; title: string; description: string; cover_image?: string; file_url?: string; file_type?: string; downloads?: number; created_by?: string; winning_topic_id?: string; };
        Update: { id?: string; title?: string; description?: string; cover_image?: string; file_url?: string; file_type?: string; downloads?: number; winning_topic_id?: string; };
      };
    };
  };
}
