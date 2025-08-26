import express from 'express';
import { body, query } from 'express-validator';
import { prisma } from '../config/database';
import { validate, handleValidationErrors } from '../middleware/validation';
import { authenticateToken } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../config/logger';
import { generateInviteCode } from '@toff/shared';

const router = express.Router();

// Search users by username or email
router.get('/search',
  authenticateToken,
  validate([
    query('q').isLength({ min: 1 }).withMessage('Search query is required'),
    query('type').isIn(['username', 'email']).withMessage('Type must be username or email'),
  ]),
  handleValidationErrors,
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const userId = req.user!.userId;
    const { q: query, type } = req.query as { q: string; type: 'username' | 'email' };

    // Build search conditions
    const searchCondition = type === 'email' 
      ? { email: { contains: query, mode: 'insensitive' as const } }
      : { username: { contains: query, mode: 'insensitive' as const } };

    // Find users (excluding current user)
    const users = await prisma.user.findMany({
      where: {
        ...searchCondition,
        NOT: { id: userId },
      },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        isOnline: true,
        lastSeen: true,
      },
      take: 20, // Limit results
    });

    // Get friendship status for each user
    const userIds = users.map(user => user.id);
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { requesterId: userId, addresseeId: { in: userIds } },
          { requesterId: { in: userIds }, addresseeId: userId },
        ],
      },
    });

    // Map friendship status to users
    const usersWithFriendshipStatus = users.map(user => {
      const friendship = friendships.find(f => 
        (f.requesterId === userId && f.addresseeId === user.id) ||
        (f.requesterId === user.id && f.addresseeId === userId)
      );

      let friendshipStatus = 'none';
      if (friendship) {
        if (friendship.status === 'ACCEPTED') {
          friendshipStatus = 'friends';
        } else if (friendship.status === 'PENDING') {
          friendshipStatus = friendship.requesterId === userId ? 'request_sent' : 'request_received';
        } else if (friendship.status === 'BLOCKED') {
          friendshipStatus = 'blocked';
        }
      }

      return {
        ...user,
        friendshipStatus,
      };
    });

    res.json({
      success: true,
      data: {
        users: usersWithFriendshipStatus,
        total: usersWithFriendshipStatus.length,
      },
    });
  })
);

// Generate invite code
router.post('/invite-code',
  authenticateToken,
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const userId = req.user!.userId;

    // Check if user has any active invite codes
    const existingCode = await prisma.inviteCode.findFirst({
      where: {
        createdBy: userId,
        isUsed: false,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (existingCode) {
      return res.json({
        success: true,
        data: {
          code: existingCode.code,
          expiresAt: existingCode.expiresAt,
        },
        message: 'You already have an active invite code',
      });
    }

    // Generate new invite code
    let code: string;
    let isUnique = false;
    
    do {
      code = generateInviteCode();
      const existing = await prisma.inviteCode.findUnique({
        where: { code },
      });
      isUnique = !existing;
    } while (!isUnique);

    // Set expiration to 7 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const inviteCode = await prisma.inviteCode.create({
      data: {
        code,
        createdBy: userId,
        expiresAt,
      },
    });

    logger.info('Invite code generated:', { userId, code });

    res.status(201).json({
      success: true,
      data: {
        code: inviteCode.code,
        expiresAt: inviteCode.expiresAt,
      },
      message: 'Invite code generated successfully',
    });
  })
);

// Redeem invite code
router.post('/redeem-invite',
  authenticateToken,
  validate([
    body('code').isLength({ min: 8, max: 8 }).withMessage('Invalid invite code format'),
  ]),
  handleValidationErrors,
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const userId = req.user!.userId;
    const { code } = req.body;

    // Find invite code
    const inviteCode = await prisma.inviteCode.findUnique({
      where: { code },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!inviteCode) {
      return res.status(404).json({
        success: false,
        error: 'Invalid invite code',
      });
    }

    if (inviteCode.isUsed) {
      return res.status(400).json({
        success: false,
        error: 'Invite code has already been used',
      });
    }

    if (inviteCode.expiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        error: 'Invite code has expired',
      });
    }

    if (inviteCode.createdBy === userId) {
      return res.status(400).json({
        success: false,
        error: 'Cannot redeem your own invite code',
      });
    }

    // Check if friendship already exists
    const existingFriendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: userId, addresseeId: inviteCode.createdBy },
          { requesterId: inviteCode.createdBy, addresseeId: userId },
        ],
      },
    });

    if (existingFriendship) {
      if (existingFriendship.status === 'ACCEPTED') {
        return res.status(400).json({
          success: false,
          error: 'You are already friends with this user',
        });
      } else if (existingFriendship.status === 'BLOCKED') {
        return res.status(400).json({
          success: false,
          error: 'Cannot redeem invite code',
        });
      }
    }

    // Use transaction to mark code as used and create friendship
    const result = await prisma.$transaction(async (tx) => {
      // Mark invite code as used
      await tx.inviteCode.update({
        where: { id: inviteCode.id },
        data: {
          isUsed: true,
          usedBy: userId,
        },
      });

      // Create or update friendship
      if (existingFriendship && existingFriendship.status === 'PENDING') {
        // Accept existing pending request
        const friendship = await tx.friendship.update({
          where: { id: existingFriendship.id },
          data: { status: 'ACCEPTED' },
          include: {
            requester: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
              },
            },
            addressee: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        });
        return { friendship, action: 'accepted_existing' };
      } else {
        // Create new friendship (auto-accepted via invite)
        const friendship = await tx.friendship.create({
          data: {
            requesterId: inviteCode.createdBy,
            addresseeId: userId,
            status: 'ACCEPTED',
          },
          include: {
            requester: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
              },
            },
            addressee: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        });
        return { friendship, action: 'created_new' };
      }
    });

    logger.info('Invite code redeemed:', { 
      code, 
      redeemer: userId, 
      creator: inviteCode.createdBy,
      action: result.action 
    });

    res.json({
      success: true,
      data: result.friendship,
      message: `You are now friends with ${inviteCode.creator.displayName}!`,
    });
  })
);

// Get user's invite codes
router.get('/invite-codes',
  authenticateToken,
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const userId = req.user!.userId;

    const inviteCodes = await prisma.inviteCode.findMany({
      where: { createdBy: userId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: inviteCodes,
    });
  })
);

export default router;
