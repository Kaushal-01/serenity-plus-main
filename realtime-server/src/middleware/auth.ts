/**
 * JWT Authentication Middleware for Socket.IO
 * Validates JWT token from handshake and attaches user data to socket
 */

import { Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { SocketData } from '../types/events';
import { logger } from '../utils/logger';

interface JWTPayload {
  userId: string;
  username: string;
  profilePicture?: string;
  iat?: number;
  exp?: number;
}

export const authMiddleware = async (
  socket: Socket<any, any, any, SocketData>,
  next: (err?: Error) => void
) => {
  try {
    // Get token from handshake auth or query
    const token = 
      socket.handshake.auth.token || 
      socket.handshake.headers.authorization?.replace('Bearer ', '') ||
      socket.handshake.query.token as string;

    if (!token) {
      logger.warn('Connection attempt without token', { socketId: socket.id });
      return next(new Error('Authentication token required'));
    }

    // Verify JWT token
    const jwtSecret = process.env.JWT_SECRET;
    
    if (!jwtSecret) {
      logger.error('JWT_SECRET not configured');
      return next(new Error('Server configuration error'));
    }

    const decoded = jwt.verify(token, jwtSecret) as JWTPayload;

    // Validate decoded payload
    if (!decoded.userId || !decoded.username) {
      logger.warn('Invalid token payload', { socketId: socket.id });
      return next(new Error('Invalid token payload'));
    }

    // Attach user data to socket
    socket.data = {
      userId: decoded.userId,
      username: decoded.username,
      profilePicture: decoded.profilePicture,
    };

    logger.info('User authenticated', {
      socketId: socket.id,
      userId: decoded.userId,
      username: decoded.username,
    });

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      logger.warn('Invalid JWT token', { 
        socketId: socket.id, 
        error: error.message 
      });
      return next(new Error('Invalid authentication token'));
    }
    
    if (error instanceof jwt.TokenExpiredError) {
      logger.warn('Expired JWT token', { socketId: socket.id });
      return next(new Error('Authentication token expired'));
    }

    logger.error('Authentication error', { 
      socketId: socket.id, 
      error 
    });
    return next(new Error('Authentication failed'));
  }
};
