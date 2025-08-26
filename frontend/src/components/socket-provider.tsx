'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/auth';
import { apiClient } from '@/lib/api';
import { TokenManager } from '@/utils/tokenManager';
import type { SocketEvents } from '@toff/shared';

interface SocketContextType {
  socket: Socket<SocketEvents> | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

interface SocketProviderProps {
  children: ReactNode;
}

export function SocketProvider({ children }: SocketProviderProps) {
  const [socket, setSocket] = useState<Socket<SocketEvents> | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { isAuthenticated, user, logout } = useAuthStore();

  const connectSocket = async () => {
    try {
      // Ensure we have a valid token before connecting
      try {
        await TokenManager.ensureValidToken();
      } catch (tokenError) {
        console.error('Cannot establish socket connection - no valid token:', tokenError);
        logout();
        return;
      }

      const token = apiClient.getAccessToken();
      if (!token) {
        console.error('No access token available for socket connection');
        return;
      }

      // Log token status for debugging
      if (process.env.NODE_ENV === 'development') {
        TokenManager.logTokenStatus();
      }

      // Create socket connection
      const socketInstance = io(
        process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000',
        {
          auth: {
            token: token,
          },
          transports: ['websocket', 'polling'],
          forceNew: true, // Force new connection to avoid cached auth
        }
      );

      socketInstance.on('connect', () => {
        console.log('Socket connected:', socketInstance.id);
        setIsConnected(true);
      });

      socketInstance.on('disconnect', () => {
        console.log('Socket disconnected');
        setIsConnected(false);
      });

      socketInstance.on('connect_error', async (error) => {
        console.error('Socket connection error:', error);
        setIsConnected(false);
        
        // If authentication error, try to refresh token and reconnect
        if (error.message?.includes('Authentication') || error.message?.includes('Invalid access token')) {
          console.log('Authentication error, attempting token refresh...');
          try {
            await apiClient.refreshAccessToken();
            // Disconnect current socket and reconnect with new token
            socketInstance.disconnect();
            setTimeout(() => connectSocket(), 1000); // Retry after 1 second
          } catch (refreshError) {
            console.error('Token refresh failed after socket auth error:', refreshError);
            logout();
          }
        }
      });

      setSocket(socketInstance);

      return () => {
        socketInstance.disconnect();
        setSocket(null);
        setIsConnected(false);
      };
    } catch (error) {
      console.error('Failed to connect socket:', error);
      setIsConnected(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user) {
      connectSocket();
    } else {
      // Disconnect socket if not authenticated
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
    }
    
    return () => {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
    };
  }, [isAuthenticated, user]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}
