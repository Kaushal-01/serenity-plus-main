/**
 * Chat Event Handlers
 * Handles 1-1 direct messaging
 */

import { Server, Socket } from 'socket.io';
import { ObjectId } from 'mongodb';
import { getDB } from '../services/mongodb';
import { SocketData, Message } from '../types/events';
import { logger } from '../utils/logger';
import { validateString, validateObjectId, sanitizeMessage, ValidationError } from '../utils/validation';

export const registerChatHandlers = (io: Server, socket: Socket<any, any, any, SocketData>) => {
  const userId = socket.data.userId;

  // Join personal room for receiving messages
  socket.join(`user:${userId}`);
  logger.debug(`User ${userId} joined personal room`);

  /**
   * Send direct message
   */
  socket.on('send_message', async (data, callback) => {
    try {
      // Validate input
      const receiverId = validateObjectId(data.receiverId, 'receiverId');
      const content = sanitizeMessage(validateString(data.content, 'content', 5000));

      const db = getDB();
      
      // Check if receiver exists
      const receiver = await db.collection('users').findOne({ _id: new ObjectId(receiverId) });
      
      if (!receiver) {
        return callback({ success: false, error: 'Receiver not found' });
      }

      // Find or create chat between users
      const participants = [userId, receiverId].sort();
      
      let chat = await db.collection('chats').findOne({
        participants: { $all: participants },
      });

      if (!chat) {
        // Create new chat
        const newChat = {
          participants,
          createdAt: new Date(),
          lastMessageAt: new Date(),
        };
        
        const result = await db.collection('chats').insertOne(newChat);
        chat = { _id: result.insertedId, ...newChat };
      } else {
        // Update last message timestamp
        await db.collection('chats').updateOne(
          { _id: chat._id },
          { $set: { lastMessageAt: new Date() } }
        );
      }

      // Create message document
      const message = {
        chatId: chat._id.toString(),
        sender: userId,
        receiver: receiverId,
        content,
        createdAt: new Date(),
        read: false,
      };

      const messageResult = await db.collection('messages').insertOne(message);

      const savedMessage: Message = {
        _id: messageResult.insertedId.toString(),
        ...message,
      };

      // Emit to receiver if online
      io.to(`user:${receiverId}`).emit('new_message', savedMessage);

      // Send acknowledgement to sender
      callback({ success: true, message: savedMessage });

      logger.debug(`Message sent from ${userId} to ${receiverId}`);
    } catch (error) {
      if (error instanceof ValidationError) {
        logger.warn('Validation error in send_message', { error: error.message });
        return callback({ success: false, error: error.message });
      }
      
      logger.error('Error in send_message handler', error);
      callback({ success: false, error: 'Failed to send message' });
    }
  });

  /**
   * Mark messages as read
   */
  socket.on('mark_messages_read', async (data) => {
    try {
      const { chatId } = data;
      
      if (!chatId) {
        return;
      }

      const db = getDB();

      // Update all unread messages in this chat from other user
      await db.collection('messages').updateMany(
        {
          chatId,
          receiver: userId,
          read: false,
        },
        {
          $set: { read: true },
        }
      );

      // Notify the other user
      const chat = await db.collection('chats').findOne({ _id: new ObjectId(chatId) });
      
      if (chat) {
        const otherUserId = chat.participants.find((id: string) => id !== userId);
        
        if (otherUserId) {
          io.to(`user:${otherUserId}`).emit('messages_read', { chatId, userId });
        }
      }

      logger.debug(`Messages marked as read in chat ${chatId} by user ${userId}`);
    } catch (error) {
      logger.error('Error in mark_messages_read handler', error);
    }
  });
};
