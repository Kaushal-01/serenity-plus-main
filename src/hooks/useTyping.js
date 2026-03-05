"use client";

/**
 * Typing Indicator Hook
 * Manages typing indicators for rooms and DMs
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from '../context/SocketContext';

const TYPING_TIMEOUT = 3000; // Stop typing after 3 seconds of inactivity

export const useTyping = (roomId = null, receiverId = null) => {
  const { socket, isConnected } = useSocket();
  const [typingUsers, setTypingUsers] = useState(new Set());
  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);

  // Start typing
  const startTyping = useCallback(() => {
    if (!socket || !isConnected) return;

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Send typing start only if not already typing
    if (!isTypingRef.current) {
      if (roomId) {
        socket.emit('typing_start', { roomId });
      } else if (receiverId) {
        socket.emit('typing_start_dm', { receiverId });
      }
      isTypingRef.current = true;
    }

    // Auto-stop typing after timeout
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, TYPING_TIMEOUT);
  }, [socket, isConnected, roomId, receiverId]);

  // Stop typing
  const stopTyping = useCallback(() => {
    if (!socket || !isConnected || !isTypingRef.current) return;

    if (roomId) {
      socket.emit('typing_stop', { roomId });
    } else if (receiverId) {
      socket.emit('typing_stop_dm', { receiverId });
    }

    isTypingRef.current = false;

    // Clear timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, [socket, isConnected, roomId, receiverId]);

  // Listen for typing events
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleTyping = (data) => {
      // For room typing
      if (roomId && data.roomId === roomId) {
        if (data.isTyping) {
          setTypingUsers(prev => new Set([...prev, data.userId]));
        } else {
          setTypingUsers(prev => {
            const next = new Set(prev);
            next.delete(data.userId);
            return next;
          });
        }
      }
    };

    const handleTypingDM = (data) => {
      // For DM typing
      if (receiverId && data.userId === receiverId) {
        if (data.isTyping) {
          setTypingUsers(prev => new Set([...prev, data.userId]));
        } else {
          setTypingUsers(prev => {
            const next = new Set(prev);
            next.delete(data.userId);
            return next;
          });
        }
      }
    };

    socket.on('typing', handleTyping);
    socket.on('typing_dm', handleTypingDM);

    return () => {
      socket.off('typing', handleTyping);
      socket.off('typing_dm', handleTypingDM);
    };
  }, [socket, isConnected, roomId, receiverId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTyping();
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [stopTyping]);

  const isTyping = typingUsers.size > 0;
  const typingUsersList = Array.from(typingUsers);

  return {
    isTyping,
    typingUsers: typingUsersList,
    startTyping,
    stopTyping,
  };
};
