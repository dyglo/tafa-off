import express from 'express';
import { body } from 'express-validator';
import { prisma } from '../config/database';
import { hashPassword, comparePassword, generateTokens, verifyRefreshToken, generateSecureToken } from '../utils/auth';
import { validate, handleValidationErrors } from '../middleware/validation';
import { authenticateToken } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiting';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../config/logger';
import type { RegisterRequest, LoginRequest, RefreshTokenRequest, UserProfile } from '@toff/shared';

const router = express.Router();

// Validation rules
const registerValidation = [
  body('email').isEmail().normalizeEmail(),
  body('username').matches(/^[a-zA-Z0-9_]{3,20}$/).withMessage('Username must be 3-20 characters, alphanumeric and underscores only'),
  body('displayName').isLength({ min: 1, max: 50 }).trim(),
  body('password').isLength({ min: 8 }).matches(/^(?=.*[a-zA-Z])(?=.*\d)/).withMessage('Password must be at least 8 characters with letters and numbers'),
];

const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
];

const refreshValidation = [
  body('refreshToken').notEmpty(),
];

// Register new user
router.post('/register', 
  authLimiter,
  validate(registerValidation),
  handleValidationErrors,
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const { email, username, displayName, password }: RegisterRequest = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username },
        ],
      },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: existingUser.email === email ? 'Email already registered' : 'Username already taken',
      });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        username,
        displayName,
        passwordHash,
      },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatarUrl: true,
      },
    });

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens({
      userId: user.id,
      email: user.email,
      username: user.username,
    });

    // Store refresh token
    const tokenExpiry = new Date();
    tokenExpiry.setDate(tokenExpiry.getDate() + 7); // 7 days

    await prisma.refreshToken.create({
      data: {
        token: generateSecureToken(),
        userId: user.id,
        expiresAt: tokenExpiry,
      },
    });

    logger.info('User registered:', { userId: user.id, email: user.email });

    res.status(201).json({
      success: true,
      data: {
        user,
        accessToken,
        refreshToken,
      },
    });
  })
);

// Login user
router.post('/login',
  authLimiter,
  validate(loginValidation),
  handleValidationErrors,
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const { email, password }: LoginRequest = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        passwordHash: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password',
      });
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password',
      });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens({
      userId: user.id,
      email: user.email,
      username: user.username,
    });

    // Store refresh token
    const tokenExpiry = new Date();
    tokenExpiry.setDate(tokenExpiry.getDate() + 7); // 7 days

    await prisma.refreshToken.create({
      data: {
        token: generateSecureToken(),
        userId: user.id,
        expiresAt: tokenExpiry,
      },
    });

    // Update user online status
    await prisma.user.update({
      where: { id: user.id },
      data: {
        isOnline: true,
        lastSeen: new Date(),
      },
    });

    logger.info('User logged in:', { userId: user.id, email: user.email });

    const userProfile: UserProfile = {
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl || undefined,
    };

    res.json({
      success: true,
      data: {
        user: userProfile,
        accessToken,
        refreshToken,
      },
    });
  })
);

// Refresh access token
router.post('/refresh',
  validate(refreshValidation),
  handleValidationErrors,
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const { refreshToken }: RefreshTokenRequest = req.body;

    try {
      // Verify refresh token
      const decoded = verifyRefreshToken(refreshToken);

      // Check if refresh token exists in database
      const storedToken = await prisma.refreshToken.findFirst({
        where: {
          userId: decoded.userId,
          expiresAt: {
            gt: new Date(),
          },
        },
        include: {
          user: {
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

      if (!storedToken) {
        return res.status(401).json({
          success: false,
          error: 'Invalid refresh token',
        });
      }

      // Generate new tokens
      const { accessToken, refreshToken: newRefreshToken } = generateTokens({
        userId: storedToken.user.id,
        email: storedToken.user.email,
        username: storedToken.user.username,
      });

      // Delete old refresh token and create new one
      await prisma.refreshToken.delete({
        where: { id: storedToken.id },
      });

      const tokenExpiry = new Date();
      tokenExpiry.setDate(tokenExpiry.getDate() + 7); // 7 days

      await prisma.refreshToken.create({
        data: {
          token: generateSecureToken(),
          userId: storedToken.user.id,
          expiresAt: tokenExpiry,
        },
      });

      res.json({
        success: true,
        data: {
          user: storedToken.user,
          accessToken,
          refreshToken: newRefreshToken,
        },
      });
    } catch (error) {
      logger.error('Refresh token error:', error);
      res.status(401).json({
        success: false,
        error: 'Invalid refresh token',
      });
    }
  })
);

// Logout user
router.post('/logout',
  authenticateToken,
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const userId = req.user!.userId;

    // Delete all refresh tokens for this user
    await prisma.refreshToken.deleteMany({
      where: { userId },
    });

    // Update user offline status
    await prisma.user.update({
      where: { id: userId },
      data: {
        isOnline: false,
        lastSeen: new Date(),
      },
    });

    logger.info('User logged out:', { userId });

    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  })
);

// Get current user profile
router.get('/profile',
  authenticateToken,
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const userId = req.user!.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        isOnline: true,
        lastSeen: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    res.json({
      success: true,
      data: user,
    });
  })
);

// Update user profile
router.put('/profile',
  authenticateToken,
  validate([
    body('displayName').optional().isLength({ min: 1, max: 50 }).trim(),
    body('avatarUrl').optional().isURL(),
  ]),
  handleValidationErrors,
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const userId = req.user!.userId;
    const { displayName, avatarUrl } = req.body;

    const updateData: any = {};
    if (displayName !== undefined) updateData.displayName = displayName;
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatarUrl: true,
      },
    });

    res.json({
      success: true,
      data: user,
    });
  })
);

export default router;
