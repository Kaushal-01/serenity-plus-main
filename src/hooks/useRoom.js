"use client";

/**
 * Room Hook
 * Manages text room messages and real-time updates
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from '../context/SocketContext';

export const useRoom = (roomId) => {
  const { socket, isConnected } = useSocket();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [joined, setJoined] = useState(false);
  const messageIdsRef = useRef(new Set());

  // Fetch initial messages from REST API
  const fetchMessages = useCallback(async () => {
    if (!roomId) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/rooms/${roomId}/messages`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
        
        // Track message IDs to prevent duplicates
        messageIdsRef.current = new Set(
          (data.messages || []).map(msg => msg._id)
        );
      }
    } catch (error) {
      console.error('Error fetching room messages:', error);
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  // Join room
  const joinRoom = useCallback(() => {
    if (!socket || !isConnected || !roomId) {
      return Promise.reject(new Error('Cannot join room'));
    }

    return new Promise((resolve, reject) => {
      socket.emit('join_room', { roomId }, (response) => {
        if (response.success) {
          setJoined(true);
          resolve();
        } else {
          reject(new Error(response.error || 'Failed to join room'));
        }
      });
    });
  }, [socket, isConnected, roomId]);

  // Leave room
  const leaveRoom = useCallback(() => {
    if (!socket || !roomId) return;

    socket.emit('leave_room', { roomId });
    setJoined(false);
  }, [socket, roomId]);

  // Send message to room
  const sendMessage = useCallback((content) => {
    if (!socket || !isConnected || !joined || !content.trim()) {
      return Promise.reject(new Error('Cannot send message'));
    }

    setSending(true);

    return new Promise((resolve, reject) => {
      socket.emit('room_message', {
        roomId,
        content: content.trim(),
      }, (response) => {
        setSending(false);

        if (response.success && response.message) {
          // Message will come through room_message event
          resolve(response.message);
        } else {
          reject(new Error(response.error || 'Failed to send message'));
        }
      });
    });
  }, [socket, isConnected, joined, roomId]);

  // Listen for room events
  useEffect(() => {
    if (!socket || !isConnected || !joined) return;

    const handleRoomMessage = (message) => {
      // Only add if belongs to current room and not duplicate
      if (message.roomId === roomId && !messageIdsRef.current.has(message._id)) {
        setMessages(prev => [...prev, message]);
        messageIdsRef.current.add(message._id);
      }
    };

    const handleUserJoined = (data) => {
      if (data.roomId === roomId) {
        console.log(`${data.user.username} joined the room`);
      }
    };

    const handleUserLeft = (data) => {
      if (data.roomId === roomId) {
        console.log(`User ${data.userId} left the room`);
      }
    };

    socket.on('room_message', handleRoomMessage);
    socket.on('room_user_joined', handleUserJoined);
    socket.on('room_user_left', handleUserLeft);

    return () => {
      socket.off('room_message', handleRoomMessage);
      socket.off('room_user_joined', handleUserJoined);
      socket.off('room_user_left', handleUserLeft);
    };
  }, [socket, isConnected, joined, roomId]);

  // Auto-join and fetch messages on mount
  useEffect(() => {
    if (isConnected && roomId) {
      joinRoom()
        .then(() => fetchMessages())
        .catch(err => console.error('Error joining room:', err));
    }

    return () => {
      if (joined) {
        leaveRoom();
      }
    };
  }, [isConnected, roomId]);

  return {
    messages,
    loading,
    sending,
    joined,
    sendMessage,
    joinRoom,
    leaveRoom,
    refreshMessages: fetchMessages,
  };
};
