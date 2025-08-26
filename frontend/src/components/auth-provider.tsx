'use client';

import { useEffect, ReactNode } from 'react';
import { useAuthStore } from '@/store/auth';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { refreshUser, isAuthenticated } = useAuthStore();

  useEffect(() => {
    // Refresh user data on app start if authenticated
    if (isAuthenticated) {
      refreshUser();
    }
  }, [refreshUser, isAuthenticated]);

  return <>{children}</>;
}
