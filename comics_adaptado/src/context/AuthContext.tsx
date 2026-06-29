import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { Profile, UserRole } from '../lib/supabase';

interface AuthContextType {
  user: any | null;
  profile: Profile | null;
  role: UserRole | null;
  loading: boolean;
  isSuperadmin: boolean;
  isPrevencionista: boolean;
  isTrabajador: boolean;
  isAdmin: boolean; // compatibilidad con código existente de comics
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    whatsapp: string;
    countryCode: string;
  }) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (!error && data) setProfile(data as Profile);
    else setProfile(null);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        await loadProfile(session.user.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { console.error('Login error:', error.message); return false; }
    return !!data.user;
  };

  const register = async (userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    whatsapp: string;
    countryCode: string;
  }): Promise<boolean> => {
    const { data, error } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          full_name: `${userData.firstName} ${userData.lastName}`,
          phone: `${userData.countryCode}${userData.whatsapp}`,
          role: 'prevencionista', // registro público = prevencionista por defecto
        }
      }
    });
    if (error) { console.error('Register error:', error.message); return false; }
    return !!data.user;
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Logout warning:', err);
    } finally {
      setUser(null);
      setProfile(null);
    }
  };

  const role = profile?.role ?? null;
  const isSuperadmin = role === 'superadmin';
  const isPrevencionista = role === 'prevencionista';
  const isTrabajador = role === 'trabajador';
  // isAdmin mantiene compatibilidad con el código existente de comics
  const isAdmin = isSuperadmin;

  return (
    <AuthContext.Provider value={{
      user, profile, role, loading,
      isSuperadmin, isPrevencionista, isTrabajador, isAdmin,
      login, register, logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return context;
}
