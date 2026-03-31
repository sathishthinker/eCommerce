'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { useRouter } from 'next/navigation';
import { auth as authApi, setAccessToken, getAccessToken } from '@/lib/api';
import type { User } from '@/types';

interface AdminAuthContextValue {
  user: User | null;
  loading: boolean;
  accessToken: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  const refreshAuth = useCallback(async () => {
    try {
      const data = await authApi.refresh();
      const newToken = data.access_token;
      setAccessToken(newToken);
      setToken(newToken);
      const meData = await authApi.getMe();
      setUser(meData.user || meData);
    } catch {
      setAccessToken(null);
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshAuth();
  }, [refreshAuth]);

  const login = async (email: string, password: string) => {
    const data = await authApi.login(email, password);
    if (!data.user.is_admin) {
      throw new Error('Access denied. Admin privileges required.');
    }
    setAccessToken(data.access_token);
    setToken(data.access_token);
    setUser(data.user || data);
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore
    } finally {
      setAccessToken(null);
      setToken(null);
      setUser(null);
    }
  };

  return (
    <AdminAuthContext.Provider
      value={{
        user,
        loading,
        accessToken: token,
        login,
        logout,
        refreshAuth,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdmin(): AdminAuthContextValue {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) {
    throw new Error('useAdmin must be used within AdminAuthProvider');
  }
  return ctx;
}

// Aliases for convenience
export const AuthProvider = AdminAuthProvider;
export const useAuth = useAdmin;
