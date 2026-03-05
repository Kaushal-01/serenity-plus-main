/**
 * Room Event Handlers
 * Handles public and private text rooms
 */

import { Server, Socket } from 'socket.io';
import { ObjectId } from 'mongodb';
import { getDB } from '../services/mongodb';
import { SocketData, RoomMessage, User } from '../types/events';
import { logger } from '../utils/logger';
import { validateString, validateObjectId, sanitizeMessage, ValidationError } from '../utils/validation';

export const registerRoomHandlers = (io: Server, socket: Socket<any, any, any, SocketData>) => {
  const userId = socket.data.userId;
  const username = socket.data.username;
  const profilePicture = socket.data.profilePicture;

  /**
   * Join a text room
   */
  socket.on('join_room', async (data, callback) => {
    try {
      const roomId = validateObjectId(data.roomId, 'roomId');

      const db = getDB();
      
      // Fetch room from database
      const room = await db.collection('rooms').findOne({ _id: new ObjectId(roomId) });

      if (!room) {
        return callback({ success: false, error: 'Room not found' });
      }

      // Check access permissions
      if (!room.isPublic) {
        // Private room - check if user is a member
        const isMember = room.members?.includes(userId);
        
        if (!isMember) {
          return callback({ success: false, error: 'Access denied' });
        }
      }

      // Join socket room
      socket.join(`room:${roomId}`);

      // Notify other users in the room
      const user: User = {
        _id: userId,
        username,
        profilePicture,
      };

      socket.to(`room:${roomId}`).emit('room_user_joined', {
        roomId,
        user,
      });

      callback({ success: true });

      logger.debug(`User ${userId} joined room ${roomId}`);
    } catch (error) {
      if (error instanceof ValidationError) {
        logger.warn('Validation error in join_room', { error: error.message });
        return callback({ success: false, error: error.message });
      }
      
      logger.error('Error in join_room handler', error);
      callback({ success: false, error: 'Failed to join room' });
    }
  });

  /**
   * Leave a text room
   */
  socket.on('leave_room', async (data) => {
    try {
      const roomId = validateObjectId(data.roomId, 'roomId');

      // Leave socket room
      socket.leave(`room:${roomId}`);

      // Notify other users
      socket.to(`room:${roomId}`).emit('room_user_left', {
        roomId,
        userId,
      });

      logger.debug(`User ${userId} left room ${roomId}`);
    } catch (error) {
      logger.error('Error in leave_room handler', error);
    }
  });

  /**
   * Send message to a room
   */
  socket.on('room_message', async (data, callback) => {
    try {
      const roomId = validateObjectId(data.roomId, 'roomId');
      const content = sanitizeMessage(validateString(data.content, 'content', 5000));

      const db = getDB();

      // Verify room exists and user has access
      const room = await db.collection('rooms').findOne({ _id: new ObjectId(roomId) });

      if (!room) {
        return callback({ success: false, error: 'Room not found' });
      }

      if (!room.isPublic && !room.members?.includes(userId)) {
        return callback({ success: false, error: 'Access denied' });
      }

      // Create message document
      const message = {
        roomId,
        sender: {
          _id: userId,
          username,
          profilePicture,
        },
        content,
        createdAt: new Date(),
      };

      const result = await db.collection('roommessages').insertOne(message);

      const savedMessage: RoomMessage = {
        _id: result.insertedId.toString(),
        roomId,
        sender: {
          _id: userId,
          username,
          profilePicture,
        },
        content,
        createdAt: message.createdAt,
      };

      // Emit to all users in the room (including sender)
      io.to(`room:${roomId}`).emit('room_message', savedMessage);

      callback({ success: true, message: savedMessage });

      logger.debug(`Message sent to room ${roomId} by user ${userId}`);
    } catch (error) {
      if (error instanceof ValidationError) {
        logger.warn('Validation error in room_message', { error: error.message });
        return callback({ success: false, error: error.message });
      }
      
      logger.error('Error in room_message handler', error);
      callback({ success: false, error: 'Failed to send message' });
    }
  });
};
