import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { logger } from '../config/logger';

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'fallback-access-secret';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret';

export interface TokenPayload {
  userId: string;
  email: string;
  username: string;
}

export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const generateTokens = (payload: TokenPayload) => {
  const accessToken = jwt.sign(payload, JWT_ACCESS_SECRET, {
    expiresIn: '15m',
    issuer: 'toff-api',
    audience: 'toff-client',
  });

  const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: '7d',
    issuer: 'toff-api',
    audience: 'toff-client',
  });

  return { accessToken, refreshToken };
};

export const verifyAccessToken = (token: string): TokenPayload => {
  try {
    return jwt.verify(token, JWT_ACCESS_SECRET, {
      issuer: 'toff-api',
      audience: 'toff-client',
    }) as TokenPayload;
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      logger.debug('Access token expired:', { expiredAt: error.expiredAt });
      throw new Error('Token expired');
    } else if (error.name === 'JsonWebTokenError') {
      logger.warn('Invalid JWT token format:', { message: error.message });
      throw new Error('Invalid token format');
    } else if (error.name === 'NotBeforeError') {
      logger.warn('Token not active yet:', { date: error.date });
      throw new Error('Token not active');
    } else {
      logger.error('Access token verification failed:', error);
      throw new Error('Invalid access token');
    }
  }
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET, {
      issuer: 'toff-api',
      audience: 'toff-client',
    }) as TokenPayload;
  } catch (error) {
    logger.error('Refresh token verification failed:', error instanceof Error ? error.message : 'Unknown error');
    throw new Error('Invalid refresh token');
  }
};

export const generateSecureToken = (): string => {
  return randomBytes(32).toString('hex');
};
