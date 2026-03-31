'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { auth as authApi, setAccessToken, getAccessToken } from '@/lib/api';
import type { User } from '@/types';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  accessToken: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: {
    name: string;
    email: string;
    phone: string;
    password: string;
  }) => Promise<void>;
  refreshAuth: () => Promise<void>;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  const refreshAuth = useCallback(async () => {
    try {
      const data = await authApi.refreshToken();
      const newToken = data.access_token;
      setAccessToken(newToken);
      setToken(newToken);

      // Now fetch current user
      const meData = await authApi.getMe();
      setUser(meData.user);
    } catch {
      setAccessToken(null);
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Attempt to restore session on mount via refresh cookie
  useEffect(() => {
    refreshAuth();
  }, [refreshAuth]);

  const login = async (email: string, password: string) => {
    const data = await authApi.login(email, password);
    setAccessToken(data.access_token);
    setToken(data.access_token);
    setUser(data.user);
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore logout errors
    } finally {
      setAccessToken(null);
      setToken(null);
      setUser(null);
    }
  };

  const register = async (data: {
    name: string;
    email: string;
    phone: string;
    password: string;
  }) => {
    const res = await authApi.register(data);
    setAccessToken(res.access_token);
    setToken(res.access_token);
    setUser(res.user);
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        accessToken: token,
        login,
        logout,
        register,
        refreshAuth,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
