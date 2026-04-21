'use client';

import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { csrfPost } from '@/lib/csrfClient';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

interface UserProfile {
  avatar_url?: string | null;
  display_name?: string | null;
  username?: string | null;
  is_admin?: boolean;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signOut: async () => { },
  refreshProfile: async () => { },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const router = useRouter();
  
  // Add a ref to track if profile was recently fetched
  const lastFetchRef = useRef<number>(0);
  const CACHE_DURATION = 30000; // 30 seconds

  const fetchProfile = async (force = false) => {
    const now = Date.now();
    if (!force && now - lastFetchRef.current < CACHE_DURATION) {
      return; // Use cached data
    }
    lastFetchRef.current = now;
    
    try {
      const response = await fetch('/api/users/me');
      if (response.ok) {
        const data = await response.json();
        setProfile({
          avatar_url: data.avatar_url,
          display_name: data.display_name,
          username: data.username,
          is_admin: data.is_admin,
        });
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  };

  useEffect(() => {
    // Get initial user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) {
        fetchProfile();
      }
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile();
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const signOut = async () => {
    let success = true;
    try {
      await csrfPost('/api/auth/logout', {});
    } catch (err) {
      console.warn('API logout failed:', err);
      success = false;
    }
    
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Supabase logout failed:', err);
      success = false;
    }
    
    if (!success) {
      toast.error('ログアウトに失敗しました。再試行してください。');
      return;
    }
    
    setUser(null);
    setProfile(null);
    router.push('/');
    router.refresh();
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(true);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
