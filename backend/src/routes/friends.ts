import express from 'express';
import { body, param, query } from 'express-validator';
import { prisma } from '../config/database';
import { validate, handleValidationErrors } from '../middleware/validation';
import { authenticateToken } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../config/logger';
import type { ApiResponse, UserProfile, Friendship } from '@toff/shared';

const router = express.Router();

// Get user's friends and friend requests
router.get('/',
  authenticateToken,
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const userId = req.user!.userId;

    // Get all friendships involving this user
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { requesterId: userId },
          { addresseeId: userId },
        ],
      },
      include: {
        requester: {
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
        addressee: {
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
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    // Separate into different categories
    const friends: any[] = [];
    const sentRequests: any[] = [];
    const receivedRequests: any[] = [];

    friendships.forEach((friendship) => {
      const isRequester = friendship.requesterId === userId;
      const otherUser = isRequester ? friendship.addressee : friendship.requester;

      const friendshipData = {
        id: friendship.id,
        status: friendship.status,
        createdAt: friendship.createdAt,
        updatedAt: friendship.updatedAt,
        user: otherUser,
      };

      if (friendship.status === 'ACCEPTED') {
        friends.push(friendshipData);
      } else if (friendship.status === 'PENDING') {
        if (isRequester) {
          sentRequests.push(friendshipData);
        } else {
          receivedRequests.push(friendshipData);
        }
      }
    });

    res.json({
      success: true,
      data: {
        friends,
        sentRequests,
        receivedRequests,
      },
    });
  })
);

// Send friend request
router.post('/request',
  authenticateToken,
  validate([
    body('addresseeId').isUUID().withMessage('Invalid user ID'),
  ]),
  handleValidationErrors,
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const userId = req.user!.userId;
    const { addresseeId } = req.body;

    if (userId === addresseeId) {
      return res.status(400).json({
        success: false,
        error: 'Cannot send friend request to yourself',
      });
    }

    // Check if addressee exists
    const addressee = await prisma.user.findUnique({
      where: { id: addresseeId },
      select: {
        id: true,
        username: true,
        displayName: true,
      },
    });

    if (!addressee) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Check if friendship already exists
    const existingFriendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: userId, addresseeId },
          { requesterId: addresseeId, addresseeId: userId },
        ],
      },
    });

    if (existingFriendship) {
      let message = 'Friend request already exists';
      if (existingFriendship.status === 'ACCEPTED') {
        message = 'You are already friends';
      } else if (existingFriendship.status === 'BLOCKED') {
        message = 'Cannot send friend request';
      }

      return res.status(400).json({
        success: false,
        error: message,
      });
    }

    // Create friend request
    const friendship = await prisma.friendship.create({
      data: {
        requesterId: userId,
        addresseeId,
        status: 'PENDING',
      },
      include: {
        addressee: {
          select: {
            id: true,
            email: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    logger.info('Friend request sent:', { from: userId, to: addresseeId });

    res.status(201).json({
      success: true,
      data: friendship,
      message: `Friend request sent to ${addressee.displayName}`,
    });
  })
);

// Respond to friend request (accept/decline)
router.put('/request/:id',
  authenticateToken,
  validate([
    param('id').isUUID().withMessage('Invalid request ID'),
    body('status').isIn(['accepted', 'declined']).withMessage('Status must be accepted or declined'),
  ]),
  handleValidationErrors,
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const userId = req.user!.userId;
    const { id } = req.params;
    const { status } = req.body;

    // Find the friend request
    const friendship = await prisma.friendship.findFirst({
      where: {
        id,
        addresseeId: userId, // Only the addressee can respond
        status: 'PENDING',
      },
      include: {
        requester: {
          select: {
            id: true,
            username: true,
            displayName: true,
          },
        },
      },
    });

    if (!friendship) {
      return res.status(404).json({
        success: false,
        error: 'Friend request not found',
      });
    }

    // Update friendship status
    const updatedFriendship = await prisma.friendship.update({
      where: { id },
      data: {
        status: status.toUpperCase() as 'ACCEPTED' | 'DECLINED',
      },
      include: {
        requester: {
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
      },
    });

    const action = status === 'accepted' ? 'accepted' : 'declined';
    logger.info('Friend request responded:', { 
      requestId: id, 
      action, 
      from: friendship.requester.id, 
      to: userId 
    });

    res.json({
      success: true,
      data: updatedFriendship,
      message: `Friend request ${action}`,
    });
  })
);

// Remove friend or cancel friend request
router.delete('/:id',
  authenticateToken,
  validate([
    param('id').isUUID().withMessage('Invalid friendship ID'),
  ]),
  handleValidationErrors,
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const userId = req.user!.userId;
    const { id } = req.params;

    // Find the friendship
    const friendship = await prisma.friendship.findFirst({
      where: {
        id,
        OR: [
          { requesterId: userId },
          { addresseeId: userId },
        ],
      },
    });

    if (!friendship) {
      return res.status(404).json({
        success: false,
        error: 'Friendship not found',
      });
    }

    // Delete the friendship
    await prisma.friendship.delete({
      where: { id },
    });

    const action = friendship.status === 'ACCEPTED' ? 'removed friend' : 'cancelled request';
    logger.info('Friendship deleted:', { friendshipId: id, userId, action });

    res.json({
      success: true,
      message: `Successfully ${action}`,
    });
  })
);

// Block user
router.post('/block',
  authenticateToken,
  validate([
    body('userId').isUUID().withMessage('Invalid user ID'),
  ]),
  handleValidationErrors,
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const currentUserId = req.user!.userId;
    const { userId } = req.body;

    if (currentUserId === userId) {
      return res.status(400).json({
        success: false,
        error: 'Cannot block yourself',
      });
    }

    // Check if user exists
    const userToBlock = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, displayName: true },
    });

    if (!userToBlock) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Delete any existing friendship
    await prisma.friendship.deleteMany({
      where: {
        OR: [
          { requesterId: currentUserId, addresseeId: userId },
          { requesterId: userId, addresseeId: currentUserId },
        ],
      },
    });

    // Create blocked relationship
    const blockRelation = await prisma.friendship.create({
      data: {
        requesterId: currentUserId,
        addresseeId: userId,
        status: 'BLOCKED',
      },
    });

    logger.info('User blocked:', { blocker: currentUserId, blocked: userId });

    res.json({
      success: true,
      data: blockRelation,
      message: `Blocked ${userToBlock.displayName}`,
    });
  })
);

// Unblock user
router.post('/unblock',
  authenticateToken,
  validate([
    body('userId').isUUID().withMessage('Invalid user ID'),
  ]),
  handleValidationErrors,
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const currentUserId = req.user!.userId;
    const { userId } = req.body;

    // Find and delete the block relationship
    const deleted = await prisma.friendship.deleteMany({
      where: {
        requesterId: currentUserId,
        addresseeId: userId,
        status: 'BLOCKED',
      },
    });

    if (deleted.count === 0) {
      return res.status(404).json({
        success: false,
        error: 'Block relationship not found',
      });
    }

    logger.info('User unblocked:', { unblocker: currentUserId, unblocked: userId });

    res.json({
      success: true,
      message: 'User unblocked successfully',
    });
  })
);

export default router;
