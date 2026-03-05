"use client";

/**
 * Audio Room Hook
 * Manages synchronized audio playback in audio rooms
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from '../context/SocketContext';

export const useAudioRoom = (roomId) => {
  const { socket, isConnected } = useSocket();
  const [roomState, setRoomState] = useState(null);
  const [joined, setJoined] = useState(false);
  const [participants, setParticipants] = useState([]);
  const audioRef = useRef(null); // Reference to audio element

  // Join audio room
  const joinRoom = useCallback(() => {
    if (!socket || !isConnected || !roomId) {
      return Promise.reject(new Error('Cannot join room'));
    }

    return new Promise((resolve, reject) => {
      socket.emit('join_audio_room', { roomId }, (response) => {
        if (response.success) {
          setJoined(true);
          if (response.state) {
            setRoomState(response.state);
          }
          resolve(response.state);
        } else {
          reject(new Error(response.error || 'Failed to join room'));
        }
      });
    });
  }, [socket, isConnected, roomId]);

  // Leave audio room
  const leaveRoom = useCallback(() => {
    if (!socket || !roomId) return;

    socket.emit('leave_audio_room', { roomId });
    setJoined(false);
    setRoomState(null);
  }, [socket, roomId]);

  // Play track
  const playTrack = useCallback((trackId, track) => {
    if (!socket || !isConnected || !joined) return;

    socket.emit('play_track', {
      roomId,
      trackId,
      track,
    });
  }, [socket, isConnected, joined, roomId]);

  // Pause track
  const pauseTrack = useCallback(() => {
    if (!socket || !isConnected || !joined) return;

    socket.emit('pause_track', { roomId });
  }, [socket, isConnected, joined, roomId]);

  // Resume track
  const resumeTrack = useCallback(() => {
    if (!socket || !isConnected || !joined) return;

    socket.emit('resume_track', { roomId });
  }, [socket, isConnected, joined, roomId]);

  // Seek track
  const seekTrack = useCallback((position) => {
    if (!socket || !isConnected || !joined) return;

    socket.emit('seek_track', {
      roomId,
      position,
    });
  }, [socket, isConnected, joined, roomId]);

  // Change track
  const changeTrack = useCallback((trackId, track) => {
    if (!socket || !isConnected || !joined) return;

    socket.emit('change_track', {
      roomId,
      trackId,
      track,
    });
  }, [socket, isConnected, joined, roomId]);

  // Sync audio element with room state
  const syncAudio = useCallback((state, serverTimestamp) => {
    if (!audioRef.current) return;

    const audio = audioRef.current;
    const now = Date.now();
    const latency = now - serverTimestamp;

    if (state.isPlaying) {
      // Calculate current position accounting for latency
      const calculatedPosition = state.playbackPosition + (latency / 1000);
      
      // Only sync if difference is significant (>2 seconds)
      if (Math.abs(audio.currentTime - calculatedPosition) > 2) {
        audio.currentTime = calculatedPosition;
      }

      if (audio.paused) {
        audio.play().catch(err => console.error('Error playing audio:', err));
      }
    } else {
      audio.currentTime = state.playbackPosition;
      if (!audio.paused) {
        audio.pause();
      }
    }
  }, []);

  // Listen for audio room events
  useEffect(() => {
    if (!socket || !isConnected || !joined) return;

    const handleAudioPlay = (data) => {
      if (data.roomId !== roomId) return;

      const newState = {
        roomId: data.roomId,
        currentTrackId: data.trackId,
        playbackPosition: 0,
        isPlaying: true,
        playedBy: data.playedBy,
        timestamp: data.timestamp,
        currentTrack: data.track,
      };

      setRoomState(newState);
      syncAudio(newState, data.timestamp);
    };

    const handleAudioPause = (data) => {
      if (data.roomId !== roomId) return;

      setRoomState(prev => ({
        ...prev,
        playbackPosition: data.position,
        isPlaying: false,
        playedBy: data.pausedBy,
        timestamp: data.timestamp,
      }));

      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = data.position;
      }
    };

    const handleAudioResume = (data) => {
      if (data.roomId !== roomId) return;

      setRoomState(prev => ({
        ...prev,
        isPlaying: true,
        playedBy: data.resumedBy,
        timestamp: data.timestamp,
      }));

      if (audioRef.current && audioRef.current.paused) {
        audioRef.current.play().catch(err => console.error('Error playing audio:', err));
      }
    };

    const handleAudioSeek = (data) => {
      if (data.roomId !== roomId) return;

      setRoomState(prev => ({
        ...prev,
        playbackPosition: data.position,
        playedBy: data.seekedBy,
        timestamp: data.timestamp,
      }));

      if (audioRef.current) {
        audioRef.current.currentTime = data.position;
      }
    };

    const handleAudioTrackChanged = (data) => {
      if (data.roomId !== roomId) return;

      const newState = {
        roomId: data.roomId,
        currentTrackId: data.trackId,
        playbackPosition: 0,
        isPlaying: true,
        playedBy: data.changedBy,
        timestamp: data.timestamp,
        currentTrack: data.track,
      };

      setRoomState(newState);
      syncAudio(newState, data.timestamp);
    };

    const handleUserJoined = (data) => {
      if (data.roomId !== roomId) return;
      setParticipants(prev => [...prev, data.user]);
    };

    const handleUserLeft = (data) => {
      if (data.roomId !== roomId) return;
      setParticipants(prev => prev.filter(p => p._id !== data.userId));
    };

    socket.on('audio_play', handleAudioPlay);
    socket.on('audio_pause', handleAudioPause);
    socket.on('audio_resume', handleAudioResume);
    socket.on('audio_seek', handleAudioSeek);
    socket.on('audio_track_changed', handleAudioTrackChanged);
    socket.on('audio_user_joined', handleUserJoined);
    socket.on('audio_user_left', handleUserLeft);

    return () => {
      socket.off('audio_play', handleAudioPlay);
      socket.off('audio_pause', handleAudioPause);
      socket.off('audio_resume', handleAudioResume);
      socket.off('audio_seek', handleAudioSeek);
      socket.off('audio_track_changed', handleAudioTrackChanged);
      socket.off('audio_user_joined', handleUserJoined);
      socket.off('audio_user_left', handleUserLeft);
    };
  }, [socket, isConnected, joined, roomId, syncAudio]);

  // Auto-join on mount
  useEffect(() => {
    if (isConnected && roomId && !joined) {
      joinRoom().catch(err => console.error('Error joining audio room:', err));
    }

    return () => {
      if (joined) {
        leaveRoom();
      }
    };
  }, [isConnected, roomId]);

  return {
    roomState,
    joined,
    participants,
    audioRef,
    joinRoom,
    leaveRoom,
    playTrack,
    pauseTrack,
    resumeTrack,
    seekTrack,
    changeTrack,
  };
};
