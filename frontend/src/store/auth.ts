import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserProfile } from '@toff/shared';
import { apiClient } from '@/lib/api';

interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    username: string;
    displayName: string;
    password: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUser: (data: Partial<UserProfile>) => void;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        try {
          set({ isLoading: true, error: null });
          
          const authResponse = await apiClient.login({ email, password });
          
          set({
            user: authResponse.user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
          
          // Store user data in API client for consistency
          apiClient.setCurrentUser(authResponse.user);
        } catch (error: any) {
          const errorMessage = error.response?.data?.error || 'Login failed';
          set({
            error: errorMessage,
            isLoading: false,
            isAuthenticated: false,
            user: null,
          });
          throw error;
        }
      },

      register: async (data) => {
        try {
          set({ isLoading: true, error: null });
          
          const authResponse = await apiClient.register(data);
          
          set({
            user: authResponse.user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
          
          // Store user data in API client for consistency
          apiClient.setCurrentUser(authResponse.user);
        } catch (error: any) {
          const errorMessage = error.response?.data?.error || 'Registration failed';
          set({
            error: errorMessage,
            isLoading: false,
            isAuthenticated: false,
            user: null,
          });
          throw error;
        }
      },

      logout: async () => {
        try {
          set({ isLoading: true });
          await apiClient.logout();
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      },

      refreshUser: async () => {
        try {
          // Only refresh if we think we're authenticated
          if (!get().isAuthenticated || !apiClient.isAuthenticated()) {
            return;
          }

          set({ isLoading: true });
          
          // Try to get user profile, this will trigger token refresh if needed
          const user = await apiClient.getProfile();
          
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
          
          apiClient.setCurrentUser(user);
        } catch (error: any) {
          console.error('Failed to refresh user:', error);
          
          // Check if it's a token-related error
          if (error.response?.status === 401 || error.message?.includes('token')) {
            console.log('Token-related error, attempting silent logout...');
            // Try to refresh the token silently
            try {
              await apiClient.refreshAccessToken();
              // Retry getting user profile with new token
              const user = await apiClient.getProfile();
              set({
                user,
                isAuthenticated: true,
                isLoading: false,
                error: null,
              });
              apiClient.setCurrentUser(user);
              return;
            } catch (refreshError) {
              console.error('Token refresh failed, logging out:', refreshError);
            }
          }
          
          // If all else fails, logout
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      },

      updateUser: (userData) => {
        const currentUser = get().user;
        if (currentUser) {
          const updatedUser = { ...currentUser, ...userData };
          set({ user: updatedUser });
          apiClient.setCurrentUser(updatedUser);
        }
      },

      clearError: () => {
        set({ error: null });
      },

      setLoading: (loading) => {
        set({ isLoading: loading });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        // After rehydration, refresh user data if authenticated
        if (state?.isAuthenticated && apiClient.isAuthenticated()) {
          state.refreshUser();
        } else if (!apiClient.isAuthenticated()) {
          // Clear state if no valid token
          state?.logout();
        }
      },
    }
  )
);
