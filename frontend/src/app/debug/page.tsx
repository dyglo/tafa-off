'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth';
import { useSocket } from '@/components/socket-provider';
import { TokenManager } from '@/utils/tokenManager';
import { Button } from '@/components/ui/button';

export default function DebugPage() {
  const [tokenInfo, setTokenInfo] = useState<any>(null);
  const { user, isAuthenticated, logout } = useAuthStore();
  const { isConnected } = useSocket();

  const refreshTokenInfo = () => {
    setTokenInfo(TokenManager.getTokenInfo());
  };

  useEffect(() => {
    refreshTokenInfo();
    const interval = setInterval(refreshTokenInfo, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleClearTokens = () => {
    TokenManager.clearAllTokens();
    refreshTokenInfo();
  };

  const handleRefreshTokens = async () => {
    try {
      await TokenManager.refreshTokens();
      refreshTokenInfo();
    } catch (error) {
      console.error('Failed to refresh tokens:', error);
    }
  };

  const handleLogTokenStatus = () => {
    TokenManager.logTokenStatus();
  };

  if (process.env.NODE_ENV !== 'development') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Debug Page</h1>
          <p className="text-secondary">Only available in development mode</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">TOff Debug Console</h1>
        
        {/* Auth Status */}
        <div className="bg-secondary/10 rounded-lg p-6 mb-6 border border-border">
          <h2 className="text-xl font-semibold text-white mb-4">Authentication Status</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-secondary">Authenticated</p>
              <p className={`font-medium ${isAuthenticated ? 'text-green-400' : 'text-red-400'}`}>
                {isAuthenticated ? 'Yes' : 'No'}
              </p>
            </div>
            <div>
              <p className="text-sm text-secondary">Socket Connected</p>
              <p className={`font-medium ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
                {isConnected ? 'Yes' : 'No'}
              </p>
            </div>
            {user && (
              <>
                <div>
                  <p className="text-sm text-secondary">User</p>
                  <p className="font-medium text-white">{user.displayName}</p>
                </div>
                <div>
                  <p className="text-sm text-secondary">Username</p>
                  <p className="font-medium text-white">@{user.username}</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Token Information */}
        <div className="bg-secondary/10 rounded-lg p-6 mb-6 border border-border">
          <h2 className="text-xl font-semibold text-white mb-4">Token Information</h2>
          {tokenInfo ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-secondary">Has Tokens</p>
                  <p className={`font-medium ${tokenInfo.hasTokens ? 'text-green-400' : 'text-red-400'}`}>
                    {tokenInfo.hasTokens ? 'Yes' : 'No'}
                  </p>
                </div>
                {tokenInfo.hasTokens && (
                  <>
                    <div>
                      <p className="text-sm text-secondary">Token Status</p>
                      <p className={`font-medium ${
                        tokenInfo.isExpired ? 'text-red-400' : 
                        tokenInfo.timeUntilExpiry < 300 ? 'text-yellow-400' : 'text-green-400'
                      }`}>
                        {tokenInfo.isExpired ? 'Expired' : 'Valid'}
                      </p>
                    </div>
                    {tokenInfo.expiresAt && (
                      <div>
                        <p className="text-sm text-secondary">Expires At</p>
                        <p className="font-medium text-white">
                          {tokenInfo.expiresAt.toLocaleString()}
                        </p>
                      </div>
                    )}
                    {!tokenInfo.isExpired && (
                      <div>
                        <p className="text-sm text-secondary">Time Until Expiry</p>
                        <p className="font-medium text-white">
                          {Math.floor(tokenInfo.timeUntilExpiry / 60)} minutes
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-secondary">Has Refresh Token</p>
                      <p className={`font-medium ${tokenInfo.hasRefreshToken ? 'text-green-400' : 'text-red-400'}`}>
                        {tokenInfo.hasRefreshToken ? 'Yes' : 'No'}
                      </p>
                    </div>
                    {tokenInfo.userId && (
                      <div>
                        <p className="text-sm text-secondary">User ID</p>
                        <p className="font-medium text-white font-mono text-sm">{tokenInfo.userId}</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ) : (
            <p className="text-secondary">Loading token information...</p>
          )}
        </div>

        {/* Actions */}
        <div className="bg-secondary/10 rounded-lg p-6 border border-border">
          <h2 className="text-xl font-semibold text-white mb-4">Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              onClick={refreshTokenInfo}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Refresh Info
            </Button>
            <Button
              onClick={handleLogTokenStatus}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Log to Console
            </Button>
            <Button
              onClick={handleRefreshTokens}
              className="bg-yellow-600 hover:bg-yellow-700 text-white"
              disabled={!tokenInfo?.hasRefreshToken}
            >
              Refresh Tokens
            </Button>
            <Button
              onClick={handleClearTokens}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Clear All Tokens
            </Button>
          </div>
          
          <div className="mt-4 pt-4 border-t border-border">
            <Button
              onClick={logout}
              variant="outline"
              className="w-full border-red-400 text-red-400 hover:bg-red-400/10"
            >
              Logout
            </Button>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-secondary/10 rounded-lg p-6 mt-6 border border-border">
          <h2 className="text-xl font-semibold text-white mb-4">Development Tips</h2>
          <div className="space-y-2 text-sm text-secondary">
            <p>• Open browser console to see detailed logging</p>
            <p>• Use `TokenManager.logTokenStatus()` in console for quick token check</p>
            <p>• Use `TokenManager.clearAllTokens()` to reset authentication state</p>
            <p>• Tokens expire every 15 minutes and auto-refresh when needed</p>
            <p>• Socket connection will auto-retry with fresh tokens on auth errors</p>
          </div>
        </div>
      </div>
    </div>
  );
}
