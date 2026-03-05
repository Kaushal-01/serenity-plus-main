"use client";

/**
 * Socket.IO Client Context
 * Provides a global socket instance to the entire app
 */

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

const SocketContext = createContext(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);

  const connect = useCallback(() => {
    // Get JWT token from localStorage
    const token = localStorage.getItem('token');

    if (!token) {
      console.warn('No token found, cannot connect to socket');
      return;
    }

    // Create socket instance
    const newSocket = io(SOCKET_URL, {
      auth: {
        token,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    // Connection events
    newSocket.on('connect', () => {
      console.log('✅ Socket connected:', newSocket.id);
      setIsConnected(true);
      setReconnecting(false);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
      setIsConnected(false);
    });

    newSocket.on('reconnect_attempt', (attempt) => {
      console.log('🔄 Reconnect attempt:', attempt);
      setReconnecting(true);
    });

    newSocket.on('reconnect', (attempt) => {
      console.log('✅ Socket reconnected after', attempt, 'attempts');
      setReconnecting(false);
    });

    newSocket.on('reconnect_failed', () => {
      console.error('❌ Reconnection failed');
      setReconnecting(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
      
      // If auth error, clear token and redirect to login
      if (error.message.includes('Authentication')) {
        localStorage.removeItem('token');
        // Optionally redirect to login
        // window.location.href = '/login';
      }
    });

    newSocket.on('reconnect_success', (data) => {
      console.log('🔄 Reconnect success:', data);
      // Trigger any necessary re-sync here
    });

    setSocket(newSocket);

    return newSocket;
  }, []);

  const disconnect = useCallback(() => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
      setIsConnected(false);
    }
  }, [socket]);

  useEffect(() => {
    // Connect when component mounts
    const newSocket = connect();

    // Cleanup on unmount
    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, []);

  // Reconnect when token changes (e.g., after login)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'token') {
        if (e.newValue) {
          // New token available, reconnect
          disconnect();
          setTimeout(connect, 100);
        } else {
          // Token removed, disconnect
          disconnect();
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [connect, disconnect]);

  // Handle page visibility for PWA
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && socket && !socket.connected) {
        console.log('Page visible, reconnecting socket...');
        socket.connect();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [socket]);

  const value = {
    socket,
    isConnected,
    reconnecting,
    connect,
    disconnect,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
