"use client";

/**
 * Chat Hook
 * Manages 1-1 chat messages and real-time updates
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from '../context/SocketContext';

export const useChat = (chatId, receiverId) => {
  const { socket, isConnected } = useSocket();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messageIdsRef = useRef(new Set());

  // Fetch initial messages from REST API
  const fetchMessages = useCallback(async () => {
    if (!chatId) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/chat/${chatId}/messages`, {
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
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  }, [chatId]);

  // Load messages on mount or when chatId changes
  useEffect(() => {
    if (chatId) {
      fetchMessages();
    } else {
      setMessages([]);
      messageIdsRef.current.clear();
    }
  }, [chatId, fetchMessages]);

  // Send message
  const sendMessage = useCallback((content) => {
    if (!socket || !isConnected || !receiverId || !content.trim()) {
      return Promise.reject(new Error('Cannot send message'));
    }

    setSending(true);

    return new Promise((resolve, reject) => {
      socket.emit('send_message', {
        receiverId,
        content: content.trim(),
      }, (response) => {
        setSending(false);

        if (response.success && response.message) {
          // Add message to local state if not already present
          if (!messageIdsRef.current.has(response.message._id)) {
            setMessages(prev => [...prev, response.message]);
            messageIdsRef.current.add(response.message._id);
          }
          resolve(response.message);
        } else {
          reject(new Error(response.error || 'Failed to send message'));
        }
      });
    });
  }, [socket, isConnected, receiverId]);

  // Mark messages as read
  const markAsRead = useCallback(() => {
    if (!socket || !isConnected || !chatId) return;

    socket.emit('mark_messages_read', { chatId });

    // Update local state
    setMessages(prev => prev.map(msg => ({ ...msg, read: true })));
  }, [socket, isConnected, chatId]);

  // Listen for new messages
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleNewMessage = (message) => {
      // Only add if belongs to current chat and not duplicate
      if (message.chatId === chatId && !messageIdsRef.current.has(message._id)) {
        setMessages(prev => [...prev, message]);
        messageIdsRef.current.add(message._id);
      }
    };

    const handleMessagesRead = (data) => {
      if (data.chatId === chatId) {
        setMessages(prev => prev.map(msg => ({ ...msg, read: true })));
      }
    };

    socket.on('new_message', handleNewMessage);
    socket.on('messages_read', handleMessagesRead);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('messages_read', handleMessagesRead);
    };
  }, [socket, isConnected, chatId]);

  return {
    messages,
    loading,
    sending,
    sendMessage,
    markAsRead,
    refreshMessages: fetchMessages,
  };
};
