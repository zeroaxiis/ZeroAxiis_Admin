'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function AdminAuthGuard({ children }) {
  const { isAuthenticated, setIsAuthenticated, handleUnauthorized } = useAuth();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    
    async function checkAuth() {
      if (isAuthenticated) {
        setChecking(false);
        return;
      }

      try {
        
        
        await api.get('/team');
        setIsAuthenticated(true);
      } catch (err) {
        if (err.status === 401) {
          handleUnauthorized();
          return;
        }
        
        setIsAuthenticated(true);
      } finally {
        setChecking(false);
      }
    }

    checkAuth();
  }, [isAuthenticated, setIsAuthenticated, handleUnauthorized]);

  if (checking) {
    return (
      <div className="flex justify-center items-center" style={{ minHeight: '100vh' }}>
        <LoadingSpinner size={32} />
      </div>
    );
  }

  return <>{children}</>;
}
