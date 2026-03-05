/**
 * MongoDB Client Setup
 * Handles MongoDB connection
 */

import { MongoClient, Db } from 'mongodb';
import { logger } from '../utils/logger';

let client: MongoClient | null = null;
let db: Db | null = null;

export const connectMongoDB = async (): Promise<Db> => {
  if (db) {
    return db;
  }

  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/serenity';

  try {
    client = new MongoClient(uri, {
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
    });

    await client.connect();
    
    const dbName = uri.split('/').pop()?.split('?')[0] || 'serenity';
    db = client.db(dbName);

    logger.info('MongoDB connected successfully');

    // Create indexes
    await createIndexes(db);

    return db;
  } catch (error) {
    logger.error('MongoDB connection error', error);
    throw error;
  }
};

export const getDB = (): Db => {
  if (!db) {
    throw new Error('MongoDB not initialized. Call connectMongoDB first.');
  }
  return db;
};

export const disconnectMongoDB = async (): Promise<void> => {
  if (client) {
    await client.close();
    client = null;
    db = null;
    logger.info('MongoDB disconnected');
  }
};

/**
 * Create necessary indexes for optimal query performance
 */
const createIndexes = async (database: Db): Promise<void> => {
  try {
    // Chat messages indexes
    await database.collection('messages').createIndex({ chatId: 1, createdAt: -1 });
    await database.collection('messages').createIndex({ sender: 1, receiver: 1 });
    
    // Room messages indexes
    await database.collection('roommessages').createIndex({ roomId: 1, createdAt: -1 });
    
    // Chats indexes
    await database.collection('chats').createIndex({ participants: 1 });
    await database.collection('chats').createIndex({ lastMessageAt: -1 });
    
    // Rooms indexes
    await database.collection('rooms').createIndex({ type: 1, isPublic: 1 });
    await database.collection('rooms').createIndex({ members: 1 });
    
    // Audio rooms indexes
    await database.collection('audiorooms').createIndex({ roomId: 1 }, { unique: true });
    await database.collection('audiorooms').createIndex({ participants: 1 });
    
    // Users indexes (for friends lookup)
    await database.collection('users').createIndex({ friends: 1 });

    logger.info('MongoDB indexes created successfully');
  } catch (error) {
    logger.error('Error creating indexes', error);
  }
};
