import { Server as SocketIOServer } from 'socket.io';
import { prisma } from '../config/database';
import { logger } from '../config/logger';
import type { AuthenticatedSocket } from '../middleware/socketAuth';
import type { SendMessageRequest, Message } from '@toff/shared';

export const setupMessageHandlers = (io: SocketIOServer, socket: AuthenticatedSocket) => {
  // Join conversation room
  socket.on('join_conversation', async (conversationId: string) => {
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
        socket.emit('error', { message: 'Conversation not found' });
        return;
      }

      // Join the conversation room
      socket.join(conversationId);
      logger.info('User joined conversation:', {
        userId: socket.userId,
        conversationId,
        socketId: socket.id,
      });

      // Notify that user joined
      socket.to(conversationId).emit('user_joined_conversation', {
        userId: socket.userId,
        user: socket.user,
      });
    } catch (error) {
      logger.error('Error joining conversation:', error);
      socket.emit('error', { message: 'Failed to join conversation' });
    }
  });

  // Leave conversation room
  socket.on('leave_conversation', (conversationId: string) => {
    socket.leave(conversationId);
    socket.to(conversationId).emit('user_left_conversation', {
      userId: socket.userId,
    });
    logger.info('User left conversation:', {
      userId: socket.userId,
      conversationId,
    });
  });

  // Send message
  socket.on('send_message', async (data: SendMessageRequest & { conversationId: string }) => {
    try {
      const { conversationId, ...messageData } = data;

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
        socket.emit('error', { message: 'Conversation not found' });
        return;
      }

      // Validate message content
      if (messageData.messageType === 'text' && !messageData.content) {
        socket.emit('error', { message: 'Text messages must have content' });
        return;
      }

      if (messageData.messageType !== 'text' && !messageData.fileUrl) {
        socket.emit('error', { message: 'File messages must have a file URL' });
        return;
      }

      // Create message in database
      const message = await prisma.message.create({
        data: {
          conversationId,
          senderId: socket.userId!,
          content: messageData.content || null,
          messageType: messageData.messageType.toUpperCase() as any,
          fileUrl: messageData.fileUrl || null,
          fileName: messageData.fileName || null,
          fileSize: messageData.fileSize || null,
          fileMimeType: messageData.fileMimeType || null,
          deliveredAt: new Date(),
        },
        include: {
          sender: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
      });

      // Update conversation last message time
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: new Date() },
      });

      // Emit message to all participants
      io.to(conversationId).emit('message_received', message);

      // Emit delivery confirmation to sender
      socket.emit('message_delivered', {
        messageId: message.id,
        deliveredAt: message.deliveredAt,
      });

      logger.info('Real-time message sent:', {
        messageId: message.id,
        conversationId,
        senderId: socket.userId,
        messageType: message.messageType,
      });
    } catch (error) {
      logger.error('Error sending message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Mark message as read
  socket.on('mark_read', async (messageId: string) => {
    try {
      // Find message and verify user is participant
      const message = await prisma.message.findFirst({
        where: { id: messageId },
        include: {
          conversation: true,
        },
      });

      if (!message) {
        socket.emit('error', { message: 'Message not found' });
        return;
      }

      // Verify user is participant and not the sender
      const isParticipant = message.conversation.participantOne === socket.userId || 
                           message.conversation.participantTwo === socket.userId;
      
      if (!isParticipant || message.senderId === socket.userId) {
        return; // Silently ignore invalid requests
      }

      // Update message read status
      await prisma.message.update({
        where: { id: messageId },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      // Create read receipt
      const readReceipt = await prisma.messageReadReceipt.upsert({
        where: {
          messageId_userId: {
            messageId,
            userId: socket.userId!,
          },
        },
        update: {
          readAt: new Date(),
        },
        create: {
          messageId,
          userId: socket.userId!,
          readAt: new Date(),
        },
      });

      // Emit read receipt to conversation
      io.to(message.conversation.id).emit('message_read', {
        messageId,
        userId: socket.userId,
        readAt: readReceipt.readAt,
      });

      // Also emit read receipt update
      io.to(message.conversation.id).emit('read_receipt_updated', {
        messageId,
        userId: socket.userId,
        readAt: readReceipt.readAt,
      });

      logger.info('Message marked as read via socket:', {
        messageId,
        readerId: socket.userId,
      });
    } catch (error) {
      logger.error('Error marking message as read:', error);
      socket.emit('error', { message: 'Failed to mark message as read' });
    }
  });

  // Mark multiple messages as read
  socket.on('mark_conversation_read', async (conversationId: string) => {
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
        socket.emit('error', { message: 'Conversation not found' });
        return;
      }

      // Get all unread messages in conversation that user didn't send
      const unreadMessages = await prisma.message.findMany({
        where: {
          conversationId,
          senderId: { not: socket.userId! },
          isRead: false,
        },
      });

      if (unreadMessages.length > 0) {
        // Mark all messages as read
        await prisma.message.updateMany({
          where: {
            conversationId,
            senderId: { not: socket.userId! },
            isRead: false,
          },
          data: {
            isRead: true,
            readAt: new Date(),
          },
        });

        // Create read receipts for all messages
        const readReceiptData = unreadMessages.map(msg => ({
          messageId: msg.id,
          userId: socket.userId!,
          readAt: new Date(),
        }));

        await prisma.messageReadReceipt.createMany({
          data: readReceiptData,
          skipDuplicates: true,
        });

        // Emit read receipts for all messages
        const readAt = new Date();
        unreadMessages.forEach(msg => {
          io.to(conversationId).emit('message_read', {
            messageId: msg.id,
            userId: socket.userId,
            readAt,
          });
        });

        logger.info('Conversation marked as read:', {
          conversationId,
          userId: socket.userId,
          messageCount: unreadMessages.length,
        });
      }
    } catch (error) {
      logger.error('Error marking conversation as read:', error);
      socket.emit('error', { message: 'Failed to mark conversation as read' });
    }
  });
};
