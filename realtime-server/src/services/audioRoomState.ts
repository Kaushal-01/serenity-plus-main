/**
 * Audio Room State Service
 * Manages synchronized playback state for audio rooms
 */

import { getRedisClient } from './redis';
import { AudioRoomState } from '../types/events';
import { logger } from '../utils/logger';

const AUDIO_ROOM_PREFIX = 'audio_room:';
const AUDIO_ROOM_TTL = 3600; // 1 hour

export class AudioRoomStateService {
  /**
   * Get current state of an audio room
   */
  async getRoomState(roomId: string): Promise<AudioRoomState | null> {
    try {
      const redis = getRedisClient();
      const key = `${AUDIO_ROOM_PREFIX}${roomId}`;
      
      const data = await redis.get(key);
      
      if (!data) {
        // Return default empty state
        return {
          roomId,
          currentTrackId: null,
          playbackPosition: 0,
          isPlaying: false,
          playedBy: null,
          timestamp: Date.now(),
        };
      }
      
      return JSON.parse(data);
    } catch (error) {
      logger.error('Error getting audio room state', error);
      return null;
    }
  }

  /**
   * Update audio room state
   */
  async updateRoomState(state: AudioRoomState): Promise<void> {
    try {
      const redis = getRedisClient();
      const key = `${AUDIO_ROOM_PREFIX}${state.roomId}`;
      
      // Add server timestamp
      state.timestamp = Date.now();
      
      await redis.set(key, JSON.stringify(state), 'EX', AUDIO_ROOM_TTL);
      
      logger.debug(`Updated audio room state for ${state.roomId}`);
    } catch (error) {
      logger.error('Error updating audio room state', error);
      throw error;
    }
  }

  /**
   * Play track in audio room
   */
  async playTrack(
    roomId: string,
    trackId: string,
    playedBy: string,
    track: any
  ): Promise<AudioRoomState> {
    try {
      const state: AudioRoomState = {
        roomId,
        currentTrackId: trackId,
        playbackPosition: 0,
        isPlaying: true,
        playedBy,
        timestamp: Date.now(),
        currentTrack: track,
      };
      
      await this.updateRoomState(state);
      return state;
    } catch (error) {
      logger.error('Error playing track', error);
      throw error;
    }
  }

  /**
   * Pause track in audio room
   */
  async pauseTrack(roomId: string, position: number, pausedBy: string): Promise<AudioRoomState> {
    try {
      const currentState = await this.getRoomState(roomId);
      
      if (!currentState) {
        throw new Error('Room state not found');
      }
      
      const state: AudioRoomState = {
        ...currentState,
        playbackPosition: position,
        isPlaying: false,
        playedBy: pausedBy,
        timestamp: Date.now(),
      };
      
      await this.updateRoomState(state);
      return state;
    } catch (error) {
      logger.error('Error pausing track', error);
      throw error;
    }
  }

  /**
   * Resume track in audio room
   */
  async resumeTrack(roomId: string, resumedBy: string): Promise<AudioRoomState> {
    try {
      const currentState = await this.getRoomState(roomId);
      
      if (!currentState) {
        throw new Error('Room state not found');
      }
      
      const state: AudioRoomState = {
        ...currentState,
        isPlaying: true,
        playedBy: resumedBy,
        timestamp: Date.now(),
      };
      
      await this.updateRoomState(state);
      return state;
    } catch (error) {
      logger.error('Error resuming track', error);
      throw error;
    }
  }

  /**
   * Seek to position in audio room
   */
  async seekTrack(roomId: string, position: number, seekedBy: string): Promise<AudioRoomState> {
    try {
      const currentState = await this.getRoomState(roomId);
      
      if (!currentState) {
        throw new Error('Room state not found');
      }
      
      const state: AudioRoomState = {
        ...currentState,
        playbackPosition: position,
        playedBy: seekedBy,
        timestamp: Date.now(),
      };
      
      await this.updateRoomState(state);
      return state;
    } catch (error) {
      logger.error('Error seeking track', error);
      throw error;
    }
  }

  /**
   * Change track in audio room
   */
  async changeTrack(
    roomId: string,
    trackId: string,
    changedBy: string,
    track: any
  ): Promise<AudioRoomState> {
    try {
      const state: AudioRoomState = {
        roomId,
        currentTrackId: trackId,
        playbackPosition: 0,
        isPlaying: true,
        playedBy: changedBy,
        timestamp: Date.now(),
        currentTrack: track,
      };
      
      await this.updateRoomState(state);
      return state;
    } catch (error) {
      logger.error('Error changing track', error);
      throw error;
    }
  }

  /**
   * Delete audio room state
   */
  async deleteRoomState(roomId: string): Promise<void> {
    try {
      const redis = getRedisClient();
      const key = `${AUDIO_ROOM_PREFIX}${roomId}`;
      
      await redis.del(key);
      logger.debug(`Deleted audio room state for ${roomId}`);
    } catch (error) {
      logger.error('Error deleting audio room state', error);
    }
  }
}

export const audioRoomStateService = new AudioRoomStateService();
