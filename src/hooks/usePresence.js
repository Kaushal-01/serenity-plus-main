"use client";

/**
 * Presence Hook
 * Manages friend online/offline status
 */

import { useState, useEffect, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';

export const usePresence = () => {
  const { socket, isConnected } = useSocket();
  const [onlineFriends, setOnlineFriends] = useState(new Set());
  const [loading, setLoading] = useState(false);

  // Fetch online friends
  const fetchOnlineFriends = useCallback(() => {
    if (!socket || !isConnected) return;

    setLoading(true);
    socket.emit('get_online_friends', (friendIds) => {
      setOnlineFriends(new Set(friendIds));
      setLoading(false);
    });
  }, [socket, isConnected]);

  // Initial fetch
  useEffect(() => {
    if (isConnected) {
      fetchOnlineFriends();
    }
  }, [isConnected, fetchOnlineFriends]);

  // Listen for presence updates
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleFriendOnline = (data) => {
      setOnlineFriends(prev => new Set([...prev, data.userId]));
      console.log(`${data.username} is now online`);
    };

    const handleFriendOffline = (data) => {
      setOnlineFriends(prev => {
        const next = new Set(prev);
        next.delete(data.userId);
        return next;
      });
      console.log(`${data.username} is now offline`);
    };

    socket.on('friend_online', handleFriendOnline);
    socket.on('friend_offline', handleFriendOffline);

    return () => {
      socket.off('friend_online', handleFriendOnline);
      socket.off('friend_offline', handleFriendOffline);
    };
  }, [socket, isConnected]);

  const isOnline = useCallback((userId) => {
    return onlineFriends.has(userId);
  }, [onlineFriends]);

  return {
    onlineFriends: Array.from(onlineFriends),
    isOnline,
    loading,
    refresh: fetchOnlineFriends,
  };
};
