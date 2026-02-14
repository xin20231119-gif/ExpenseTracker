import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../utils/supabase';
import { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  phoneAuthenticated: boolean;
  setPhoneAuthenticated: (value: boolean, phoneUserId?: string) => void;
  phoneUserId: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [phoneAuthenticated, setPhoneAuthenticated] = useState(false);
  const [phoneUserId, setPhoneUserId] = useState<string | null>(null);

  useEffect(() => {
    // 检查当前用户
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });

    // 监听认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setPhoneAuthenticated(false);
    setPhoneUserId(null);
    // 清除 localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('phone_authenticated');
      localStorage.removeItem('phone_user_id');
    }
  };

  const handleSetPhoneAuthenticated = (value: boolean, phoneUserId?: string) => {
    setPhoneAuthenticated(value);
    if (phoneUserId) {
      setPhoneUserId(phoneUserId);
      if (typeof window !== 'undefined') {
        localStorage.setItem('phone_user_id', phoneUserId);
      }
    }
  };

  const refreshUser = async () => {
    const { data } = await supabase.auth.getUser();
    setUser(data.user);
    setLoading(false);
  };

  // 从 localStorage 恢复 phoneUserId
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedPhoneUserId = localStorage.getItem('phone_user_id');
      if (storedPhoneUserId) {
        setPhoneUserId(storedPhoneUserId);
      }
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signOut, refreshUser, phoneAuthenticated, setPhoneAuthenticated: handleSetPhoneAuthenticated, phoneUserId }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
