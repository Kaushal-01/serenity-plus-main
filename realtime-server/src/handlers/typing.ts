/**
 * Typing Indicator Event Handlers
 * Manages typing indicators for rooms and DMs
 */

import { Server, Socket } from 'socket.io';
import { SocketData } from '../types/events';
import { logger } from '../utils/logger';
import { validateObjectId, ValidationError } from '../utils/validation';

// Throttle typing events - don't emit more frequently than this
const TYPING_THROTTLE_MS = 1000;

// Map to track last typing event per user per room/chat
const typingTimestamps = new Map<string, number>();

export const registerTypingHandlers = (io: Server, socket: Socket<any, any, any, SocketData>) => {
  const userId = socket.data.userId;
  const username = socket.data.username;

  /**
   * User started typing in a room
   */
  socket.on('typing_start', (data) => {
    try {
      const roomId = validateObjectId(data.roomId, 'roomId');
      
      // Throttle typing events
      const key = `room:${roomId}:${userId}`;
      const now = Date.now();
      const lastEvent = typingTimestamps.get(key) || 0;

      if (now - lastEvent < TYPING_THROTTLE_MS) {
        return; // Throttled
      }

      typingTimestamps.set(key, now);

      // Emit to other users in the room
      socket.to(`room:${roomId}`).emit('typing', {
        roomId,
        userId,
        username,
        isTyping: true,
      });

      logger.debug(`User ${userId} started typing in room ${roomId}`);
    } catch (error) {
      if (error instanceof ValidationError) {
        logger.warn('Validation error in typing_start', { error: error.message });
        return;
      }
      logger.error('Error in typing_start handler', error);
    }
  });

  /**
   * User stopped typing in a room
   */
  socket.on('typing_stop', (data) => {
    try {
      const roomId = validateObjectId(data.roomId, 'roomId');

      // Clear timestamp
      const key = `room:${roomId}:${userId}`;
      typingTimestamps.delete(key);

      // Emit to other users in the room
      socket.to(`room:${roomId}`).emit('typing', {
        roomId,
        userId,
        username,
        isTyping: false,
      });

      logger.debug(`User ${userId} stopped typing in room ${roomId}`);
    } catch (error) {
      if (error instanceof ValidationError) {
        logger.warn('Validation error in typing_stop', { error: error.message });
        return;
      }
      logger.error('Error in typing_stop handler', error);
    }
  });

  /**
   * User started typing in a DM
   */
  socket.on('typing_start_dm', (data) => {
    try {
      const receiverId = validateObjectId(data.receiverId, 'receiverId');

      // Throttle typing events
      const key = `dm:${receiverId}:${userId}`;
      const now = Date.now();
      const lastEvent = typingTimestamps.get(key) || 0;

      if (now - lastEvent < TYPING_THROTTLE_MS) {
        return; // Throttled
      }

      typingTimestamps.set(key, now);

      // Emit to the receiver
      io.to(`user:${receiverId}`).emit('typing_dm', {
        userId,
        username,
        isTyping: true,
      });

      logger.debug(`User ${userId} started typing to ${receiverId}`);
    } catch (error) {
      if (error instanceof ValidationError) {
        logger.warn('Validation error in typing_start_dm', { error: error.message });
        return;
      }
      logger.error('Error in typing_start_dm handler', error);
    }
  });

  /**
   * User stopped typing in a DM
   */
  socket.on('typing_stop_dm', (data) => {
    try {
      const receiverId = validateObjectId(data.receiverId, 'receiverId');

      // Clear timestamp
      const key = `dm:${receiverId}:${userId}`;
      typingTimestamps.delete(key);

      // Emit to the receiver
      io.to(`user:${receiverId}`).emit('typing_dm', {
        userId,
        username,
        isTyping: false,
      });

      logger.debug(`User ${userId} stopped typing to ${receiverId}`);
    } catch (error) {
      if (error instanceof ValidationError) {
        logger.warn('Validation error in typing_stop_dm', { error: error.message });
        return;
      }
      logger.error('Error in typing_stop_dm handler', error);
    }
  });

  // Clean up typing timestamps on disconnect
  socket.on('disconnect', () => {
    // Remove all typing timestamps for this user
    for (const key of typingTimestamps.keys()) {
      if (key.includes(userId)) {
        typingTimestamps.delete(key);
      }
    }
  });
};
