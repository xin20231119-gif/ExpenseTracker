import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../utils/supabase';
import { User } from '@supabase/supabase-js';

const PHONE_USER_ID_KEY = 'phone_user_id';

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
    // 清除 AsyncStorage
    await AsyncStorage.removeItem(PHONE_USER_ID_KEY);
  };

  const handleSetPhoneAuthenticated = (value: boolean, phoneUserId?: string) => {
    setPhoneAuthenticated(value);
    if (phoneUserId) {
      setPhoneUserId(phoneUserId);
      AsyncStorage.setItem(PHONE_USER_ID_KEY, phoneUserId);
    }
  };

  const refreshUser = async () => {
    const { data } = await supabase.auth.getUser();
    setUser(data.user);
    setLoading(false);
  };

  // 从 AsyncStorage 恢复 phoneUserId
  useEffect(() => {
    const restorePhoneUserId = async () => {
      const storedPhoneUserId = await AsyncStorage.getItem(PHONE_USER_ID_KEY);
      if (storedPhoneUserId) {
        setPhoneUserId(storedPhoneUserId);
      }
    };
    restorePhoneUserId();
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
