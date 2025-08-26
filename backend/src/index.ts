import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

import { logger } from './config/logger';
import { prisma } from './config/database';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { generalLimiter } from './middleware/rateLimiting';

// Import routes
import authRoutes from './routes/auth';
import friendsRoutes from './routes/friends';
import usersRoutes from './routes/users';
import conversationsRoutes from './routes/conversations';
import uploadRoutes from './routes/upload';

const app = express();
const server = createServer(app);

// Socket.io setup
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
app.use(morgan('combined', { 
  stream: { 
    write: (message: string) => logger.info(message.trim()) 
  } 
}));

// Rate limiting
app.use(generalLimiter);

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'TOff API is running',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/friends', friendsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/conversations', conversationsRoutes);
app.use('/api/upload', uploadRoutes);

// Import socket handlers
import { authenticateSocket, AuthenticatedSocket } from './middleware/socketAuth';
import { setupMessageHandlers } from './socket/messageHandlers';
import { setupActivityHandlers, cleanupTypingActivities } from './socket/activityHandlers';

// Socket.io connection handling
io.use(authenticateSocket);

io.on('connection', (socket: AuthenticatedSocket) => {
  logger.info('User connected:', { 
    socketId: socket.id, 
    userId: socket.userId,
    username: socket.user?.username 
  });

  // Setup event handlers
  setupMessageHandlers(io, socket);
  setupActivityHandlers(io, socket);

  // Handle user coming online
  socket.emit('connected', {
    message: 'Connected successfully',
    user: socket.user,
  });

  socket.on('disconnect', () => {
    logger.info('User disconnected:', { 
      socketId: socket.id, 
      userId: socket.userId 
    });
  });
});

// Cleanup old typing activities every 5 minutes
setInterval(cleanupTypingActivities, 5 * 60 * 1000);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Graceful shutdown
const gracefulShutdown = (signal: string) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  
  server.close(async (err) => {
    if (err) {
      logger.error('Error during server shutdown:', err);
      process.exit(1);
    }

    try {
      await prisma.$disconnect();
      logger.info('Database connection closed.');
      process.exit(0);
    } catch (error) {
      logger.error('Error disconnecting from database:', error);
      process.exit(1);
    }
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

export { app, server, io };
