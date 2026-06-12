import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi, notifyApi } from '../api/client';

interface AuthUser { access_token: string; refresh_token: string; user_id: string; email: string; name: string; }
interface AuthContextValue {
  user: AuthUser | null; isLoading: boolean; isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
}
const AuthContext = createContext<AuthContextValue | null>(null);

async function registerPushToken(token: string) {
  try {
    await notifyApi.post('/api/v1/notify/token', { token, platform: 'expo' });
  } catch { /* silent */ }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem('solen:user').then(raw => {
      if (raw) setUser(JSON.parse(raw));
    }).finally(() => setIsLoading(false));
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { data } = await authApi.post<AuthUser>('/api/v1/auth/login', { email, password });
    await AsyncStorage.setItem('solen:user', JSON.stringify(data));
    setUser(data);
    // Registrar push token si existe
    const expoPushToken = await AsyncStorage.getItem('solen:expo_push_token');
    if (expoPushToken) registerPushToken(expoPushToken);
  }, []);

  const signUp = useCallback(async (email: string, password: string, name: string) => {
    const { data } = await authApi.post<AuthUser>('/api/v1/auth/register', { email, password, name });
    await AsyncStorage.setItem('solen:user', JSON.stringify(data));
    setUser(data);
  }, []);

  const signOut = useCallback(async () => {
    await AsyncStorage.multiRemove(['solen:user']);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated: !!user, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
