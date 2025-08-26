import { Socket } from 'socket.io';
import { verifyAccessToken } from '../utils/auth';
import { prisma } from '../config/database';
import { logger } from '../config/logger';

export interface AuthenticatedSocket extends Socket {
  userId?: string;
  user?: {
    id: string;
    email: string;
    username: string;
    displayName: string;
  };
}

export const authenticateSocket = async (socket: AuthenticatedSocket, next: (err?: Error) => void) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
    
    if (!token) {
      logger.warn('Socket connection attempted without token', { socketId: socket.id });
      return next(new Error('Authentication token required'));
    }

    // Verify JWT token
    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (tokenError) {
      logger.warn('Socket authentication failed - invalid or expired token', { 
        socketId: socket.id,
        error: tokenError instanceof Error ? tokenError.message : 'Unknown token error'
      });
      return next(new Error('Invalid access token'));
    }
    
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        isOnline: true,
      },
    });

    if (!user) {
      logger.warn('Socket authentication failed - user not found', { 
        socketId: socket.id,
        userId: decoded.userId 
      });
      return next(new Error('User not found'));
    }

    // Attach user info to socket
    socket.userId = user.id;
    socket.user = user;

    // Update user online status
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        isOnline: true,
        lastSeen: new Date(),
      },
    });

    logger.info('Socket authenticated successfully', { 
      userId: user.id, 
      username: user.username,
      socketId: socket.id 
    });
    next();
  } catch (error) {
    logger.error('Socket authentication failed with unexpected error:', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      socketId: socket.id 
    });
    next(new Error('Authentication failed'));
  }
};
