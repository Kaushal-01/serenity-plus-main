/**
 * Redis Client Setup
 * Handles Redis connection for pub/sub and presence
 */

import Redis from 'ioredis';
import { logger } from '../utils/logger';

let redisClient: Redis | null = null;
let redisPubClient: Redis | null = null;
let redisSubClient: Redis | null = null;

export const connectRedis = async (): Promise<Redis> => {
  if (redisClient) {
    return redisClient;
  }

  const redisConfig = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || undefined,
    retryStrategy: (times: number) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    maxRetriesPerRequest: 3,
  };

  redisClient = new Redis(redisConfig);

  redisClient.on('connect', () => {
    logger.info('Redis client connected');
  });

  redisClient.on('error', (err: Error) => {
    logger.error('Redis client error', err);
  });

  redisClient.on('ready', () => {
    logger.info('Redis client ready');
  });

  return redisClient;
};

export const getRedisClient = (): Redis => {
  if (!redisClient) {
    throw new Error('Redis client not initialized. Call connectRedis first.');
  }
  return redisClient;
};

export const createRedisPubSubClients = async (): Promise<{ pubClient: Redis; subClient: Redis }> => {
  const redisConfig = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || undefined,
  };

  redisPubClient = new Redis(redisConfig);
  redisSubClient = new Redis(redisConfig);

  redisPubClient.on('error', (err: Error) => {
    logger.error('Redis Pub client error', err);
  });

  redisSubClient.on('error', (err: Error) => {
    logger.error('Redis Sub client error', err);
  });

  logger.info('Redis Pub/Sub clients created');

  return { pubClient: redisPubClient, subClient: redisSubClient };
};

export const disconnectRedis = async (): Promise<void> => {
  const clients = [redisClient, redisPubClient, redisSubClient].filter(Boolean);
  
  await Promise.all(
    clients.map(async (client) => {
      if (client) {
        await client.quit();
      }
    })
  );

  redisClient = null;
  redisPubClient = null;
  redisSubClient = null;

  logger.info('Redis clients disconnected');
};
