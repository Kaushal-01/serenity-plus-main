/**
 * Presence Event Handlers
 * Manages online/offline status for friends
 */

import { Server, Socket } from 'socket.io';
import { ObjectId } from 'mongodb';
import { getDB } from '../services/mongodb';
import { presenceService } from '../services/presence';
import { SocketData } from '../types/events';
import { logger } from '../utils/logger';

export const registerPresenceHandlers = (io: Server, socket: Socket<any, any, any, SocketData>) => {
  const userId = socket.data.userId;
  const username = socket.data.username;

  /**
   * Handle user going online
   */
  const handleUserOnline = async () => {
    try {
      // Check if this is the first socket for this user
      const socketCountBefore = await presenceService.getSocketCount(userId);
      
      // Add socket to presence
      await presenceService.addSocket(userId, socket.id);

      // If this was the first socket, notify friends
      if (socketCountBefore === 0) {
        await notifyFriendsOnline();
      }

      logger.info(`User ${userId} online with socket ${socket.id}`);
    } catch (error) {
      logger.error('Error handling user online', error);
    }
  };

  /**
   * Handle user going offline
   */
  const handleUserOffline = async () => {
    try {
      // Remove socket from presence
      const isFullyOffline = await presenceService.removeSocket(userId, socket.id);

      // If user has no more sockets, notify friends
      if (isFullyOffline) {
        await notifyFriendsOffline();
      }

      logger.info(`User ${userId} offline, socket ${socket.id} removed`);
    } catch (error) {
      logger.error('Error handling user offline', error);
    }
  };

  /**
   * Notify friends that user came online
   */
  const notifyFriendsOnline = async () => {
    try {
      const db = getDB();
      
      // Get user's friends
      const user = await db.collection('users').findOne(
        { _id: new ObjectId(userId) },
        { projection: { friends: 1 } }
      );

      if (user && user.friends && user.friends.length > 0) {
        // Emit to each friend's personal room
        for (const friendId of user.friends) {
          io.to(`user:${friendId}`).emit('friend_online', {
            userId,
            username,
          });
        }

        logger.debug(`Notified ${user.friends.length} friends that ${userId} is online`);
      }
    } catch (error) {
      logger.error('Error notifying friends online', error);
    }
  };

  /**
   * Notify friends that user went offline
   */
  const notifyFriendsOffline = async () => {
    try {
      const db = getDB();
      
      // Get user's friends
      const user = await db.collection('users').findOne(
        { _id: new ObjectId(userId) },
        { projection: { friends: 1 } }
      );

      if (user && user.friends && user.friends.length > 0) {
        // Emit to each friend's personal room
        for (const friendId of user.friends) {
          io.to(`user:${friendId}`).emit('friend_offline', {
            userId,
            username,
          });
        }

        logger.debug(`Notified ${user.friends.length} friends that ${userId} is offline`);
      }
    } catch (error) {
      logger.error('Error notifying friends offline', error);
    }
  };

  /**
   * Get list of online friends
   */
  socket.on('get_online_friends', async (callback) => {
    try {
      const db = getDB();
      
      // Get user's friends
      const user = await db.collection('users').findOne(
        { _id: new ObjectId(userId) },
        { projection: { friends: 1 } }
      );

      if (!user || !user.friends || user.friends.length === 0) {
        return callback([]);
      }

      // Check which friends are online
      const onlineFriends = await presenceService.getOnlineUsers(user.friends);

      callback(onlineFriends);

      logger.debug(`User ${userId} fetched online friends: ${onlineFriends.length} online`);
    } catch (error) {
      logger.error('Error getting online friends', error);
      callback([]);
    }
  });

  // Register connection/disconnection handlers
  handleUserOnline();

  socket.on('disconnect', () => {
    handleUserOffline();
  });

  // Heartbeat to keep presence alive
  const heartbeatInterval = setInterval(() => {
    presenceService.refreshPresence(userId);
  }, 60000); // Every minute

  socket.on('disconnect', () => {
    clearInterval(heartbeatInterval);
  });
};
