'use client';

import { apiClient } from '@/lib/api';

/**
 * Token management utilities for debugging and development
 */
export class TokenManager {
  static clearAllTokens() {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('auth-storage');
    
    console.log('All tokens and auth data cleared');
  }

  static getTokenInfo() {
    if (typeof window === 'undefined') return null;
    
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (!accessToken) {
      return { hasTokens: false };
    }

    try {
      // Decode JWT payload (without verification)
      const payload = JSON.parse(atob(accessToken.split('.')[1]));
      const now = Date.now() / 1000;
      
      return {
        hasTokens: true,
        hasRefreshToken: !!refreshToken,
        isExpired: payload.exp < now,
        expiresAt: new Date(payload.exp * 1000),
        userId: payload.userId,
        email: payload.email,
        username: payload.username,
        timeUntilExpiry: payload.exp - now,
      };
    } catch (error) {
      return {
        hasTokens: true,
        isValid: false,
        error: 'Invalid token format',
      };
    }
  }

  static async refreshTokens() {
    try {
      const result = await apiClient.refreshAccessToken();
      console.log('Tokens refreshed successfully');
      return result;
    } catch (error) {
      console.error('Token refresh failed:', error);
      throw error;
    }
  }

  static logTokenStatus() {
    const info = TokenManager.getTokenInfo();
    
    if (!info?.hasTokens) {
      console.log('🔴 No tokens found');
      return;
    }

    if (!info.isValid) {
      console.log('🔴 Invalid token format:', info.error);
      return;
    }

    if (info.isExpired) {
      console.log('🟡 Token expired at:', info.expiresAt);
    } else {
      const minutes = Math.floor(info.timeUntilExpiry / 60);
      console.log(`🟢 Token valid for ${minutes} more minutes (expires at ${info.expiresAt?.toLocaleTimeString()})`);
    }

    console.log('Token info:', {
      userId: info.userId,
      email: info.email,
      username: info.username,
      hasRefreshToken: info.hasRefreshToken,
    });
  }

  static async ensureValidToken() {
    const info = TokenManager.getTokenInfo();
    
    if (!info?.hasTokens) {
      throw new Error('No tokens available');
    }

    if (info.isExpired) {
      console.log('Token expired, attempting refresh...');
      await TokenManager.refreshTokens();
      console.log('Token refreshed successfully');
    }

    return true;
  }
}

// Make it available globally for debugging in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).TokenManager = TokenManager;
  console.log('TokenManager available globally. Try: TokenManager.logTokenStatus()');
}
