import { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase';
import type { Profile } from './types';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  signUp: (phone: string, password: string, fullName: string) => Promise<{ error: string | null }>;
  signIn: (phone: string, password: string) => Promise<{ error: string | null }>;
  signInWithFacebook: () => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    setProfile(data);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) fetchProfile(s.user.id);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) fetchProfile(s.user.id);
      else setProfile(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (phone: string, password: string, fullName: string) => {
    const cleanPhone = phone.trim();
    const uniqueId = Date.now() + Math.random().toString(36).substring(7);
    const email = `user_${uniqueId}@jevoyage.app`;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, phone: cleanPhone } },
    });
    if (error) return { error: error.message };
    return { error: null };
  };

  const signIn = async (phone: string, password: string) => {
    const cleanPhone = phone.trim();

    // Récupère l'email via la fonction RPC sécurisée (pas de lecture directe de la table profiles)
    const { data: email, error: rpcError } = await supabase
      .rpc('get_email_by_phone', { p_phone: cleanPhone });

    if (rpcError || !email) {
      return { error: 'Utilisateur non trouvé' };
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) return { error: error.message };
    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  const signInWithFacebook = async () => {
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'facebook' });
    if (error) return { error: error.message };
    return { error: null };
  };

  const updateProfile = async (data: Partial<Profile>) => {
    if (!profile) return { error: 'Profil non trouvé' };

    const { error } = await supabase
      .from('profiles')
      .update(data)
      .eq('id', profile.id);

    if (error) return { error: error.message };

    setProfile({ ...profile, ...data });
    return { error: null };
  };

  return (
    <AuthContext.Provider value={{ user, profile, session, loading, signUp, signIn, signInWithFacebook, signOut, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}