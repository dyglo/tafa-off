import { Server as SocketIOServer } from 'socket.io';
import { prisma } from '../config/database';
import { logger } from '../config/logger';
import type { AuthenticatedSocket } from '../middleware/socketAuth';

export const setupActivityHandlers = (io: SocketIOServer, socket: AuthenticatedSocket) => {
  // User starts typing
  socket.on('typing_start', async (conversationId: string) => {
    try {
      // Verify user is participant in conversation
      const conversation = await prisma.conversation.findFirst({
        where: {
          id: conversationId,
          OR: [
            { participantOne: socket.userId! },
            { participantTwo: socket.userId! },
          ],
        },
      });

      if (!conversation) {
        return;
      }

      // Update or create typing activity
      await prisma.userActivity.upsert({
        where: {
          userId_conversationId_activityType: {
            userId: socket.userId!,
            conversationId,
            activityType: 'TYPING',
          },
        },
        update: {
          activityType: 'TYPING',
          lastActivity: new Date(),
        },
        create: {
          userId: socket.userId!,
          conversationId,
          activityType: 'TYPING',
          lastActivity: new Date(),
        },
      });

      // Emit typing event to other participants
      socket.to(conversationId).emit('user_typing', {
        userId: socket.userId,
        conversationId,
        user: socket.user,
      });

      logger.debug('User started typing:', {
        userId: socket.userId,
        conversationId,
      });
    } catch (error) {
      logger.error('Error handling typing start:', error);
    }
  });

  // User stops typing
  socket.on('typing_stop', async (conversationId: string) => {
    try {
      // Remove typing activity
      await prisma.userActivity.deleteMany({
        where: {
          userId: socket.userId!,
          conversationId,
          activityType: 'TYPING',
        },
      });

      // Emit stop typing event to other participants
      socket.to(conversationId).emit('user_stopped_typing', {
        userId: socket.userId,
        conversationId,
      });

      logger.debug('User stopped typing:', {
        userId: socket.userId,
        conversationId,
      });
    } catch (error) {
      logger.error('Error handling typing stop:', error);
    }
  });

  // User comes online
  socket.on('user_online', async () => {
    try {
      // Update user online status
      await prisma.user.update({
        where: { id: socket.userId! },
        data: {
          isOnline: true,
          lastSeen: new Date(),
        },
      });

      // Get user's friends to notify them
      const friendships = await prisma.friendship.findMany({
        where: {
          OR: [
            { requesterId: socket.userId!, status: 'ACCEPTED' },
            { addresseeId: socket.userId!, status: 'ACCEPTED' },
          ],
        },
        include: {
          requester: { select: { id: true } },
          addressee: { select: { id: true } },
        },
      });

      // Get friend user IDs
      const friendIds = friendships.map(f => 
        f.requesterId === socket.userId! ? f.addressee.id : f.requester.id
      );

      // Emit online status to friends
      friendIds.forEach(friendId => {
        socket.to(`user:${friendId}`).emit('friend_online', {
          userId: socket.userId,
          user: socket.user,
          timestamp: new Date(),
        });
      });

      // Join user's personal room for friend notifications
      socket.join(`user:${socket.userId}`);

      logger.info('User came online:', {
        userId: socket.userId,
        friendsNotified: friendIds.length,
      });
    } catch (error) {
      logger.error('Error handling user online:', error);
    }
  });

  // User goes offline (handled on disconnect)
  socket.on('user_offline', async () => {
    await handleUserOffline(io, socket);
  });

  // Handle disconnect
  socket.on('disconnect', async () => {
    await handleUserOffline(io, socket);
  });
};

async function handleUserOffline(io: SocketIOServer, socket: AuthenticatedSocket) {
  try {
    if (!socket.userId) return;

    // Update user offline status
    await prisma.user.update({
      where: { id: socket.userId },
      data: {
        isOnline: false,
        lastSeen: new Date(),
      },
    });

    // Remove all typing activities for this user
    await prisma.userActivity.deleteMany({
      where: {
        userId: socket.userId,
        activityType: 'TYPING',
      },
    });

    // Get user's friends to notify them
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { requesterId: socket.userId, status: 'ACCEPTED' },
          { addresseeId: socket.userId, status: 'ACCEPTED' },
        ],
      },
      include: {
        requester: { select: { id: true } },
        addressee: { select: { id: true } },
      },
    });

    // Get friend user IDs
    const friendIds = friendships.map(f => 
      f.requesterId === socket.userId ? f.addressee.id : f.requester.id
    );

    const lastSeen = new Date();

    // Emit offline status to friends
    friendIds.forEach(friendId => {
      socket.to(`user:${friendId}`).emit('friend_offline', {
        userId: socket.userId,
        lastSeen,
      });
    });

    // Emit typing stop for any conversations where user was typing
    const conversationRooms = Array.from(socket.rooms).filter(room => 
      room !== socket.id && room.startsWith('conversation:')
    );

    conversationRooms.forEach(room => {
      socket.to(room).emit('user_stopped_typing', {
        userId: socket.userId,
        conversationId: room.replace('conversation:', ''),
      });
    });

    logger.info('User went offline:', {
      userId: socket.userId,
      friendsNotified: friendIds.length,
    });
  } catch (error) {
    logger.error('Error handling user offline:', error);
  }
}

// Cleanup old typing activities (run periodically)
export const cleanupTypingActivities = async () => {
  try {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    const deleted = await prisma.userActivity.deleteMany({
      where: {
        activityType: 'TYPING',
        lastActivity: {
          lt: fiveMinutesAgo,
        },
      },
    });

    if (deleted.count > 0) {
      logger.info('Cleaned up old typing activities:', { count: deleted.count });
    }
  } catch (error) {
    logger.error('Error cleaning up typing activities:', error);
  }
};
