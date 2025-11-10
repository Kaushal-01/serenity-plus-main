'use client';

import { useState, useEffect, useRef } from 'react';

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasContext, setHasContext] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Fix hydration mismatch by only rendering on client
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load context when opening chat
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      loadContext();
    }
  }, [isOpen]);

  // Focus input when opening
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  // Listen for toggle event from Navbar
  useEffect(() => {
    const handleToggle = () => {
      setIsOpen(prev => !prev);
    };

    window.addEventListener('toggle-harmony-chat', handleToggle);
    return () => {
      window.removeEventListener('toggle-harmony-chat', handleToggle);
    };
  }, []);

  const loadContext = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        // User not logged in
        setMessages([{
          role: 'assistant',
          content: "Hi! 🎵 I'm SerenityAI. Please log in to start our conversation and begin your wellness journey.",
          timestamp: new Date()
        }]);
        return;
      }

      const response = await fetch('/api/chat/context', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      if (data.hasContext) {
        setHasContext(true);
        
        // Show welcome back message with context
        const welcomeMessage = {
          role: 'assistant',
          content: `Welcome back! 🎵 It's great to see you again. ${
            data.emotionalContext?.emotionalState 
              ? `Last time we talked, ${data.emotionalContext.emotionalState.toLowerCase()}. How are you feeling today?`
              : "How are you feeling today?"
          }`,
          timestamp: new Date()
        };
        
        setMessages([welcomeMessage]);
      } else {
        // First time user
        setMessages([{
          role: 'assistant',
          content: "Hi there! 🎵 I'm SerenityAI, your musical companion. I'm here to chat, listen, and help you discover how music can support your wellbeing. How are you feeling today?",
          timestamp: new Date()
        }]);
      }
    } catch (error) {
      console.error('Failed to load context:', error);
      setMessages([{
        role: 'assistant',
        content: "Hi! 🎵 I'm SerenityAI. How can I support you today?",
        timestamp: new Date()
      }]);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please log in to chat with SerenityAI');
      return;
    }

    const userMessage = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setIsTyping(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: inputMessage })
      });

      const data = await response.json();

      if (response.ok) {
        const assistantMessage = {
          role: 'assistant',
          content: data.response,
          timestamp: new Date()
        };
        
        // Simulate typing delay
        setTimeout(() => {
          setMessages(prev => [...prev, assistantMessage]);
          setIsTyping(false);
        }, 800);
      } else {
        throw new Error(data.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = {
        role: 'assistant',
        content: "I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      setIsTyping(false);
    } finally {
      setIsLoading(false);
    }
  };

  const requestTrivia = async () => {
    if (isLoading) return;
    
    const token = localStorage.getItem('token');
    if (!token) return;

    setIsLoading(true);
    setIsTyping(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ requestTrivia: true })
      });

      const data = await response.json();

      if (response.ok) {
        const triviaMessage = {
          role: 'assistant',
          content: data.response,
          timestamp: new Date()
        };
        
        setTimeout(() => {
          setMessages(prev => [...prev, triviaMessage]);
          setIsTyping(false);
        }, 500);
      }
    } catch (error) {
      console.error('Trivia error:', error);
      setIsTyping(false);
    } finally {
      setIsLoading(false);
    }
  };

  const requestQuote = async () => {
    if (isLoading) return;
    
    const token = localStorage.getItem('token');
    if (!token) return;

    setIsLoading(true);
    setIsTyping(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ requestQuote: true })
      });

      const data = await response.json();

      if (response.ok) {
        const quoteMessage = {
          role: 'assistant',
          content: data.response,
          timestamp: new Date()
        };
        
        setTimeout(() => {
          setMessages(prev => [...prev, quoteMessage]);
          setIsTyping(false);
        }, 500);
      }
    } catch (error) {
      console.error('Quote error:', error);
      setIsTyping(false);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = async () => {
    if (confirm('Clear this conversation? (Your emotional context will be preserved)')) {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        await fetch('/api/chat/context', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ action: 'clear' })
        });
        
        setMessages([{
          role: 'assistant',
          content: "Fresh start! How can I support you today? 🎵",
          timestamp: new Date()
        }]);
      } catch (error) {
        console.error('Clear error:', error);
      }
    }
  };

  // Don't render until mounted (prevents hydration mismatch)
  if (!isMounted) {
    return null;
  }

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 bg-black text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 group"
          aria-label="Open chat"
        >
          <svg 
            className="w-6 h-6" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" 
            />
          </svg>
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center group-hover:animate-pulse">
            🎵
          </span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-96 h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col border border-gray-200 animate-slideUp">
          {/* Header */}
          <div className="bg-black text-white px-6 py-4 rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-xl">
                🎵
              </div>
              <div>
                <h3 className="font-semibold text-lg">SerenityAI</h3>
                <p className="text-xs text-gray-300">Your musical companion</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-gray-800 rounded-full p-2 transition-colors"
              aria-label="Close chat"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 bg-white">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                    msg.role === 'user'
                      ? 'bg-black text-white rounded-br-sm'
                      : 'bg-gray-100 text-black rounded-bl-sm'
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            
            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-black px-4 py-3 rounded-2xl rounded-bl-sm">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          <div className="px-6 py-2 bg-gray-50 border-t border-gray-200 flex gap-2">
            <button
              onClick={requestTrivia}
              disabled={isLoading}
              className="text-xs px-3 py-1.5 bg-white border border-gray-300 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Get a fun music fact"
            >
              🎵 Trivia
            </button>
            <button
              onClick={requestQuote}
              disabled={isLoading}
              className="text-xs px-3 py-1.5 bg-white border border-gray-300 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Get an inspirational quote"
            >
              💭 Quote
            </button>
            <button
              onClick={clearChat}
              disabled={isLoading}
              className="text-xs px-3 py-1.5 bg-white border border-gray-300 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
              title="Clear conversation"
            >
              🗑️
            </button>
          </div>

          {/* Input Area */}
          <form onSubmit={sendMessage} className="p-4 bg-white border-t border-gray-200 rounded-b-2xl">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Share how you're feeling..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-black transition-colors text-black placeholder-gray-400"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !inputMessage.trim()}
                className="bg-black text-white rounded-full px-5 hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Send message"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </form>
        </div>
      )}

      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </>
  );
}
