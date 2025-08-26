import express from 'express';
import { body, param, query } from 'express-validator';
import { prisma } from '../config/database';
import { validate, handleValidationErrors } from '../middleware/validation';
import { authenticateToken } from '../middleware/auth';
import { messageLimiter } from '../middleware/rateLimiting';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../config/logger';
import type { Message, Conversation, SendMessageRequest } from '@toff/shared';

const router = express.Router();

// Get user's conversations
router.get('/',
  authenticateToken,
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const userId = req.user!.userId;

    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [
          { participantOne: userId },
          { participantTwo: userId },
        ],
      },
      include: {
        participantOneUser: {
          select: {
            id: true,
            email: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            isOnline: true,
            lastSeen: true,
          },
        },
        participantTwoUser: {
          select: {
            id: true,
            email: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            isOnline: true,
            lastSeen: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            sender: {
              select: {
                id: true,
                displayName: true,
              },
            },
          },
        },
        _count: {
          select: {
            messages: {
              where: {
                senderId: { not: userId },
                isRead: false,
              },
            },
          },
        },
      },
      orderBy: {
        lastMessageAt: 'desc',
      },
    });

    // Format conversations with other participant info
    const formattedConversations = conversations.map(conv => {
      const otherParticipant = conv.participantOne === userId 
        ? conv.participantTwoUser 
        : conv.participantOneUser;
      
      return {
        id: conv.id,
        participantOne: conv.participantOne,
        participantTwo: conv.participantTwo,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
        lastMessageAt: conv.lastMessageAt,
        otherParticipant,
        lastMessage: conv.messages[0] || null,
        unreadCount: conv._count.messages,
      };
    });

    res.json({
      success: true,
      data: formattedConversations,
    });
  })
);

// Create or get existing conversation
router.post('/',
  authenticateToken,
  validate([
    body('participantId').isUUID().withMessage('Invalid participant ID'),
  ]),
  handleValidationErrors,
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const userId = req.user!.userId;
    const { participantId } = req.body;

    if (userId === participantId) {
      return res.status(400).json({
        success: false,
        error: 'Cannot create conversation with yourself',
      });
    }

    // Check if participant exists
    const participant = await prisma.user.findUnique({
      where: { id: participantId },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        isOnline: true,
        lastSeen: true,
      },
    });

    if (!participant) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Check if conversation already exists
    let conversation = await prisma.conversation.findFirst({
      where: {
        OR: [
          { participantOne: userId, participantTwo: participantId },
          { participantOne: participantId, participantTwo: userId },
        ],
      },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!conversation) {
      // Create new conversation
      conversation = await prisma.conversation.create({
        data: {
          participantOne: userId,
          participantTwo: participantId,
        },
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      });

      logger.info('New conversation created:', {
        conversationId: conversation.id,
        participants: [userId, participantId],
      });
    }

    res.json({
      success: true,
      data: {
        ...conversation,
        otherParticipant: participant,
        lastMessage: conversation.messages[0] || null,
        unreadCount: 0,
      },
    });
  })
);

// Get conversation messages
router.get('/:id/messages',
  authenticateToken,
  validate([
    param('id').isUUID().withMessage('Invalid conversation ID'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  ]),
  handleValidationErrors,
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const userId = req.user!.userId;
    const { id } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;

    // Verify user is participant in conversation
    const conversation = await prisma.conversation.findFirst({
      where: {
        id,
        OR: [
          { participantOne: userId },
          { participantTwo: userId },
        ],
      },
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found',
      });
    }

    // Get messages with pagination
    const messages = await prisma.message.findMany({
      where: { conversationId: id },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        readReceipts: {
          include: {
            user: {
              select: {
                id: true,
                displayName: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Get total count for pagination
    const totalMessages = await prisma.message.count({
      where: { conversationId: id },
    });

    const hasMore = page * limit < totalMessages;

    res.json({
      success: true,
      data: {
        messages: messages.reverse(), // Return in chronological order
        pagination: {
          page,
          limit,
          total: totalMessages,
          hasMore,
        },
      },
    });
  })
);

// Send message
router.post('/:id/messages',
  messageLimiter,
  authenticateToken,
  validate([
    param('id').isUUID().withMessage('Invalid conversation ID'),
    body('content').optional().isString().isLength({ max: 2000 }).withMessage('Message content too long'),
    body('messageType').isIn(['text', 'image', 'pdf', 'txt', 'other_file']).withMessage('Invalid message type'),
    body('fileUrl').optional().isURL().withMessage('Invalid file URL'),
    body('fileName').optional().isString().isLength({ max: 255 }).withMessage('File name too long'),
    body('fileSize').optional().isInt({ min: 0 }).withMessage('Invalid file size'),
    body('fileMimeType').optional().isString().withMessage('Invalid file MIME type'),
  ]),
  handleValidationErrors,
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const userId = req.user!.userId;
    const { id } = req.params;
    const messageData: SendMessageRequest = req.body;

    // Verify user is participant in conversation
    const conversation = await prisma.conversation.findFirst({
      where: {
        id,
        OR: [
          { participantOne: userId },
          { participantTwo: userId },
        ],
      },
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found',
      });
    }

    // Validate message content
    if (messageData.messageType === 'text' && !messageData.content) {
      return res.status(400).json({
        success: false,
        error: 'Text messages must have content',
      });
    }

    if (messageData.messageType !== 'text' && !messageData.fileUrl) {
      return res.status(400).json({
        success: false,
        error: 'File messages must have a file URL',
      });
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        conversationId: id,
        senderId: userId,
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
      where: { id },
      data: { lastMessageAt: new Date() },
    });

    logger.info('Message sent:', {
      messageId: message.id,
      conversationId: id,
      senderId: userId,
      messageType: message.messageType,
    });

    res.status(201).json({
      success: true,
      data: message,
    });
  })
);

// Mark message as read
router.put('/messages/:messageId/read',
  authenticateToken,
  validate([
    param('messageId').isUUID().withMessage('Invalid message ID'),
  ]),
  handleValidationErrors,
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const userId = req.user!.userId;
    const { messageId } = req.params;

    // Find message and verify user is participant
    const message = await prisma.message.findFirst({
      where: { id: messageId },
      include: {
        conversation: true,
      },
    });

    if (!message) {
      return res.status(404).json({
        success: false,
        error: 'Message not found',
      });
    }

    // Verify user is participant and not the sender
    const isParticipant = message.conversation.participantOne === userId || 
                         message.conversation.participantTwo === userId;
    
    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to read this message',
      });
    }

    if (message.senderId === userId) {
      return res.status(400).json({
        success: false,
        error: 'Cannot mark your own message as read',
      });
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
    await prisma.messageReadReceipt.upsert({
      where: {
        messageId_userId: {
          messageId,
          userId,
        },
      },
      update: {
        readAt: new Date(),
      },
      create: {
        messageId,
        userId,
        readAt: new Date(),
      },
    });

    logger.info('Message marked as read:', {
      messageId,
      readerId: userId,
    });

    res.json({
      success: true,
      message: 'Message marked as read',
    });
  })
);

export default router;
