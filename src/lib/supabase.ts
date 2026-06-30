import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Faltan variables de entorno de Supabase.');
}

const cookieStorage = {
  getItem(key: string): string | null {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(new RegExp('(?:^|; )' + key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '=([^;]*)'));
    return match ? decodeURIComponent(match[1]) : null;
  },
  setItem(key: string, value: string): void {
    if (typeof document === 'undefined') return;
    const maxAge = 60 * 60 * 24 * 365;
    document.cookie = `${key}=${encodeURIComponent(value)}; max-age=${maxAge}; domain=.mrprevencion.app; path=/; Secure; SameSite=Lax`;
  },
  removeItem(key: string): void {
    if (typeof document === 'undefined') return;
    document.cookie = `${key}=; max-age=0; domain=.mrprevencion.app; path=/; Secure; SameSite=Lax`;
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: cookieStorage,
    storageKey: 'mr-prevencion-auth',
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
