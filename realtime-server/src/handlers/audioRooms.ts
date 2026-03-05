/**
 * Audio Room Event Handlers
 * Manages synchronized audio playback across multiple clients
 * NOTE: Audio is NOT streamed - only playback state is synchronized
 */

import { Server, Socket } from 'socket.io';
import { ObjectId } from 'mongodb';
import { getDB } from '../services/mongodb';
import { audioRoomStateService } from '../services/audioRoomState';
import { SocketData, User } from '../types/events';
import { logger } from '../utils/logger';
import { validateObjectId, ValidationError } from '../utils/validation';

export const registerAudioRoomHandlers = (io: Server, socket: Socket<any, any, any, SocketData>) => {
  const userId = socket.data.userId;
  const username = socket.data.username;
  const profilePicture = socket.data.profilePicture;

  /**
   * Join an audio room
   */
  socket.on('join_audio_room', async (data, callback) => {
    try {
      const roomId = validateObjectId(data.roomId, 'roomId');

      const db = getDB();

      // Verify audio room exists
      const audioRoom = await db.collection('audiorooms').findOne({ _id: new ObjectId(roomId) });

      if (!audioRoom) {
        return callback({ success: false, error: 'Audio room not found' });
      }

      // Check if room is private and user has access
      if (audioRoom.isPrivate) {
        const isMember = audioRoom.members?.includes(userId);
        
        if (!isMember) {
          return callback({ success: false, error: 'Access denied' });
        }
      }

      // Join socket room
      socket.join(`audio:${roomId}`);

      // Add user to participants in database
      await db.collection('audiorooms').updateOne(
        { _id: new ObjectId(roomId) },
        { $addToSet: { participants: userId } }
      );

      // Get current room state
      const state = await audioRoomStateService.getRoomState(roomId);

      // Notify other users
      const user: User = {
        _id: userId,
        username,
        profilePicture,
      };

      socket.to(`audio:${roomId}`).emit('audio_user_joined', {
        roomId,
        user,
      });

      // Send current state to the new user
      callback({ success: true, state: state || undefined });

      logger.info(`User ${userId} joined audio room ${roomId}`);
    } catch (error) {
      if (error instanceof ValidationError) {
        logger.warn('Validation error in join_audio_room', { error: error.message });
        return callback({ success: false, error: error.message });
      }
      
      logger.error('Error in join_audio_room handler', error);
      callback({ success: false, error: 'Failed to join audio room' });
    }
  });

  /**
   * Leave an audio room
   */
  socket.on('leave_audio_room', async (data) => {
    try {
      const roomId = validateObjectId(data.roomId, 'roomId');

      const db = getDB();

      // Leave socket room
      socket.leave(`audio:${roomId}`);

      // Remove user from participants
      await db.collection('audiorooms').updateOne(
        { _id: new ObjectId(roomId) },
        { $pull: { participants: userId } }
      );

      // Notify other users
      socket.to(`audio:${roomId}`).emit('audio_user_left', {
        roomId,
        userId,
      });

      logger.info(`User ${userId} left audio room ${roomId}`);
    } catch (error) {
      logger.error('Error in leave_audio_room handler', error);
    }
  });

  /**
   * Play a track in an audio room
   */
  socket.on('play_track', async (data) => {
    try {
      const roomId = validateObjectId(data.roomId, 'roomId');
      const trackId = validateObjectId(data.trackId, 'trackId');

      if (!data.track || !data.track.title || !data.track.artist) {
        throw new ValidationError('Invalid track data');
      }

      // Update state in Redis
      const state = await audioRoomStateService.playTrack(
        roomId,
        trackId,
        userId,
        data.track
      );

      // Emit to all users in the room (including sender for confirmation)
      io.to(`audio:${roomId}`).emit('audio_play', {
        roomId,
        trackId,
        track: data.track,
        playedBy: userId,
        timestamp: state.timestamp,
      });

      logger.info(`User ${userId} played track ${trackId} in audio room ${roomId}`);
    } catch (error) {
      if (error instanceof ValidationError) {
        logger.warn('Validation error in play_track', { error: error.message });
        return;
      }
      logger.error('Error in play_track handler', error);
    }
  });

  /**
   * Pause track in an audio room
   */
  socket.on('pause_track', async (data) => {
    try {
      const roomId = validateObjectId(data.roomId, 'roomId');

      // Get current state to know playback position
      const currentState = await audioRoomStateService.getRoomState(roomId);
      
      if (!currentState) {
        return;
      }

      // Update state
      const state = await audioRoomStateService.pauseTrack(
        roomId,
        currentState.playbackPosition,
        userId
      );

      // Emit to all users
      io.to(`audio:${roomId}`).emit('audio_pause', {
        roomId,
        position: state.playbackPosition,
        pausedBy: userId,
        timestamp: state.timestamp,
      });

      logger.info(`User ${userId} paused track in audio room ${roomId}`);
    } catch (error) {
      logger.error('Error in pause_track handler', error);
    }
  });

  /**
   * Resume track in an audio room
   */
  socket.on('resume_track', async (data) => {
    try {
      const roomId = validateObjectId(data.roomId, 'roomId');

      // Update state
      const state = await audioRoomStateService.resumeTrack(roomId, userId);

      // Emit to all users
      io.to(`audio:${roomId}`).emit('audio_resume', {
        roomId,
        resumedBy: userId,
        timestamp: state.timestamp,
      });

      logger.info(`User ${userId} resumed track in audio room ${roomId}`);
    } catch (error) {
      logger.error('Error in resume_track handler', error);
    }
  });

  /**
   * Seek to position in an audio room
   */
  socket.on('seek_track', async (data) => {
    try {
      const roomId = validateObjectId(data.roomId, 'roomId');
      
      if (typeof data.position !== 'number' || data.position < 0) {
        throw new ValidationError('Invalid position');
      }

      // Update state
      const state = await audioRoomStateService.seekTrack(
        roomId,
        data.position,
        userId
      );

      // Emit to all users
      io.to(`audio:${roomId}`).emit('audio_seek', {
        roomId,
        position: data.position,
        seekedBy: userId,
        timestamp: state.timestamp,
      });

      logger.info(`User ${userId} seeked to ${data.position}s in audio room ${roomId}`);
    } catch (error) {
      if (error instanceof ValidationError) {
        logger.warn('Validation error in seek_track', { error: error.message });
        return;
      }
      logger.error('Error in seek_track handler', error);
    }
  });

  /**
   * Change track in an audio room
   */
  socket.on('change_track', async (data) => {
    try {
      const roomId = validateObjectId(data.roomId, 'roomId');
      const trackId = validateObjectId(data.trackId, 'trackId');

      if (!data.track || !data.track.title || !data.track.artist) {
        throw new ValidationError('Invalid track data');
      }

      // Update state
      const state = await audioRoomStateService.changeTrack(
        roomId,
        trackId,
        userId,
        data.track
      );

      // Emit to all users
      io.to(`audio:${roomId}`).emit('audio_track_changed', {
        roomId,
        trackId,
        track: data.track,
        changedBy: userId,
        timestamp: state.timestamp,
      });

      logger.info(`User ${userId} changed track to ${trackId} in audio room ${roomId}`);
    } catch (error) {
      if (error instanceof ValidationError) {
        logger.warn('Validation error in change_track', { error: error.message });
        return;
      }
      logger.error('Error in change_track handler', error);
    }
  });
};
