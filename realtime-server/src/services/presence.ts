/**
 * Presence Service
 * Manages user online/offline status using Redis
 * Supports multiple sockets per user
 */

import { getRedisClient } from './redis';
import { logger } from '../utils/logger';

const PRESENCE_PREFIX = 'presence:';
const PRESENCE_TTL = 300; // 5 minutes

export class PresenceService {
  /**
   * Add a socket to a user's presence set
   * User is considered online if they have at least one socket
   */
  async addSocket(userId: string, socketId: string): Promise<void> {
    try {
      const redis = getRedisClient();
      const key = `${PRESENCE_PREFIX}${userId}`;
      
      await redis.sadd(key, socketId);
      await redis.expire(key, PRESENCE_TTL);
      
      logger.debug(`Added socket ${socketId} for user ${userId}`);
    } catch (error) {
      logger.error('Error adding socket to presence', error);
      throw error;
    }
  }

  /**
   * Remove a socket from a user's presence set
   * Returns true if user is now offline (no more sockets)
   */
  async removeSocket(userId: string, socketId: string): Promise<boolean> {
    try {
      const redis = getRedisClient();
      const key = `${PRESENCE_PREFIX}${userId}`;
      
      await redis.srem(key, socketId);
      
      // Check if user still has active sockets
      const count = await redis.scard(key);
      
      if (count === 0) {
        await redis.del(key);
        logger.debug(`User ${userId} is now offline`);
        return true; // User is offline
      }
      
      logger.debug(`Removed socket ${socketId} for user ${userId}, ${count} sockets remaining`);
      return false; // User still has other sockets
    } catch (error) {
      logger.error('Error removing socket from presence', error);
      throw error;
    }
  }

  /**
   * Check if a user is online
   */
  async isOnline(userId: string): Promise<boolean> {
    try {
      const redis = getRedisClient();
      const key = `${PRESENCE_PREFIX}${userId}`;
      
      const count = await redis.scard(key);
      return count > 0;
    } catch (error) {
      logger.error('Error checking user presence', error);
      return false;
    }
  }

  /**
   * Get all online users from a list of user IDs
   */
  async getOnlineUsers(userIds: string[]): Promise<string[]> {
    try {
      const redis = getRedisClient();
      const online: string[] = [];
      
      for (const userId of userIds) {
        const key = `${PRESENCE_PREFIX}${userId}`;
        const count = await redis.scard(key);
        
        if (count > 0) {
          online.push(userId);
        }
      }
      
      return online;
    } catch (error) {
      logger.error('Error getting online users', error);
      return [];
    }
  }

  /**
   * Refresh TTL for user's presence
   * Called periodically to keep user online
   */
  async refreshPresence(userId: string): Promise<void> {
    try {
      const redis = getRedisClient();
      const key = `${PRESENCE_PREFIX}${userId}`;
      
      const exists = await redis.exists(key);
      if (exists) {
        await redis.expire(key, PRESENCE_TTL);
      }
    } catch (error) {
      logger.error('Error refreshing presence', error);
    }
  }

  /**
   * Get socket count for a user
   */
  async getSocketCount(userId: string): Promise<number> {
    try {
      const redis = getRedisClient();
      const key = `${PRESENCE_PREFIX}${userId}`;
      
      return await redis.scard(key);
    } catch (error) {
      logger.error('Error getting socket count', error);
      return 0;
    }
  }
}

export const presenceService = new PresenceService();
