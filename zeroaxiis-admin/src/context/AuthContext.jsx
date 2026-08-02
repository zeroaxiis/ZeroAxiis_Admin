'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      await api.post('/auth/login', { email, password });
      setIsAuthenticated(true);
      router.push('/admin');
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message || 'Login failed' };
    } finally {
      setLoading(false);
    }
  }, [router]);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout', {});
    } catch (err) {
    } finally {
      setIsAuthenticated(false);
      router.push('/admin/login');
    }
  }, [router]);

  const handleUnauthorized = useCallback(() => {
    setIsAuthenticated(false);
    router.push('/admin/login');
  }, [router]);

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, setIsAuthenticated, loading, login, logout, handleUnauthorized }}
    >
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
