# Example Usage

Complete examples showing how to use WebSocket hooks in your components.

## Chat Component Example

```jsx
"use client";

import { useState, useEffect, useRef } from 'react';
import { useChat } from '@/hooks/useChat';
import { useTyping } from '@/hooks/useTyping';
import { usePresence } from '@/hooks/usePresence';

export default function ChatView({ chatId, receiverId, receiverName }) {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef(null);
  
  const { messages, sendMessage, markAsRead, loading, sending } = useChat(chatId, receiverId);
  const { isTyping, startTyping, stopTyping } = useTyping(null, receiverId);
  const { isOnline } = usePresence();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark messages as read when viewing chat
  useEffect(() => {
    if (messages.length > 0) {
      markAsRead();
    }
  }, [messages, markAsRead]);

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    if (e.target.value.trim()) {
      startTyping();
    } else {
      stopTyping();
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    
    if (!inputValue.trim() || sending) return;

    try {
      await sendMessage(inputValue);
      setInputValue('');
      stopTyping();
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Failed to send message. Please try again.');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full">
      <p>Loading messages...</p>
    </div>;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b p-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">{receiverName}</h2>
          <p className="text-sm text-gray-500">
            {isOnline(receiverId) ? (
              <span className="text-green-500">● Online</span>
            ) : (
              <span className="text-gray-400">○ Offline</span>
            )}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble 
              key={message._id} 
              message={message}
              isOwn={message.sender === localStorage.getItem('userId')}
            />
          ))
        )}
        
        {/* Typing indicator */}
        {isTyping && (
          <div className="text-sm text-gray-500 italic">
            {receiverName} is typing...
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="border-t p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || sending}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg disabled:bg-gray-300"
          >
            {sending ? 'Sending...' : 'Send'}
          </button>
        </div>
      </form>
    </div>
  );
}

function MessageBubble({ message, isOwn }) {
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[70%] rounded-lg p-3 ${
        isOwn ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-900'
      }`}>
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
        <div className={`text-xs mt-1 ${isOwn ? 'text-blue-100' : 'text-gray-500'}`}>
          {new Date(message.createdAt).toLocaleTimeString()}
          {isOwn && message.read && ' · Read'}
        </div>
      </div>
    </div>
  );
}
```

## Room Component Example

```jsx
"use client";

import { useState, useEffect, useRef } from 'react';
import { useRoom } from '@/hooks/useRoom';
import { useTyping } from '@/hooks/useTyping';

export default function RoomView({ roomId, roomName }) {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef(null);
  
  const { messages, sendMessage, joined, loading, sending } = useRoom(roomId);
  const { isTyping, typingUsers, startTyping, stopTyping } = useTyping(roomId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    if (e.target.value.trim()) {
      startTyping();
    } else {
      stopTyping();
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    
    if (!inputValue.trim() || sending) return;

    try {
      await sendMessage(inputValue);
      setInputValue('');
      stopTyping();
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  if (loading || !joined) {
    return <div>Loading room...</div>;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b p-4">
        <h2 className="text-xl font-bold">{roomName}</h2>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <RoomMessage key={message._id} message={message} />
        ))}
        
        {/* Typing indicators */}
        {isTyping && (
          <div className="text-sm text-gray-500">
            {typingUsers.length === 1 
              ? 'Someone is typing...'
              : `${typingUsers.length} people are typing...`
            }
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="border-t p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border rounded-lg"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || sending}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg disabled:bg-gray-300"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}

function RoomMessage({ message }) {
  return (
    <div className="flex gap-3">
      {/* Avatar */}
      <div className="w-10 h-10 rounded-full bg-gray-300 flex-shrink-0">
        {message.sender.profilePicture ? (
          <img 
            src={message.sender.profilePicture} 
            alt={message.sender.username}
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white font-bold">
            {message.sender.username[0].toUpperCase()}
          </div>
        )}
      </div>

      {/* Message */}
      <div className="flex-1">
        <div className="flex items-baseline gap-2">
          <span className="font-semibold">{message.sender.username}</span>
          <span className="text-xs text-gray-500">
            {new Date(message.createdAt).toLocaleTimeString()}
          </span>
        </div>
        <p className="text-gray-900 whitespace-pre-wrap break-words">
          {message.content}
        </p>
      </div>
    </div>
  );
}
```

## Audio Room Component Example

```jsx
"use client";

import { useState, useEffect } from 'react';
import { useAudioRoom } from '@/hooks/useAudioRoom';

export default function AudioRoomView({ roomId, roomName }) {
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  const { 
    roomState, 
    joined, 
    participants, 
    audioRef,
    playTrack, 
    pauseTrack, 
    resumeTrack,
    seekTrack 
  } = useAudioRoom(roomId);

  const handlePlayTrack = (track) => {
    playTrack(track.id, {
      id: track.id,
      title: track.title,
      artist: track.artist,
      albumArt: track.albumArt,
      duration: track.duration,
    });
  };

  const handlePause = () => {
    pauseTrack();
  };

  const handleResume = () => {
    resumeTrack();
  };

  const handleSeek = (e) => {
    const position = parseFloat(e.target.value);
    seekTrack(position);
  };

  const searchTracks = async () => {
    // Call your music API
    const response = await fetch(`/api/search?q=${searchQuery}`);
    const data = await response.json();
    setSearchResults(data.results);
  };

  if (!joined) {
    return <div>Joining audio room...</div>;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b p-4">
        <h2 className="text-xl font-bold">{roomName}</h2>
        <p className="text-sm text-gray-500">
          {participants.length} {participants.length === 1 ? 'listener' : 'listeners'}
        </p>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Current Track */}
        {roomState?.currentTrack ? (
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg p-6 text-white mb-6">
            <div className="flex items-center gap-4">
              <img 
                src={roomState.currentTrack.albumArt} 
                alt={roomState.currentTrack.title}
                className="w-24 h-24 rounded-lg shadow-lg"
              />
              <div className="flex-1">
                <h3 className="text-2xl font-bold">{roomState.currentTrack.title}</h3>
                <p className="text-lg opacity-90">{roomState.currentTrack.artist}</p>
                
                {/* Playback Control */}
                <div className="mt-4 flex items-center gap-4">
                  {roomState.isPlaying ? (
                    <button 
                      onClick={handlePause}
                      className="bg-white text-purple-500 px-6 py-2 rounded-full font-semibold"
                    >
                      Pause
                    </button>
                  ) : (
                    <button 
                      onClick={handleResume}
                      className="bg-white text-purple-500 px-6 py-2 rounded-full font-semibold"
                    >
                      Resume
                    </button>
                  )}

                  {/* Progress Bar */}
                  <input
                    type="range"
                    min="0"
                    max={roomState.currentTrack.duration}
                    value={roomState.playbackPosition}
                    onChange={handleSeek}
                    className="flex-1"
                  />
                  
                  <span className="text-sm">
                    {formatTime(roomState.playbackPosition)} / {formatTime(roomState.currentTrack.duration)}
                  </span>
                </div>
              </div>
            </div>

            {/* Hidden audio element */}
            <audio 
              ref={audioRef} 
              src={`/api/stream/${roomState.currentTrack.id}`}
            />
          </div>
        ) : (
          <div className="bg-gray-100 rounded-lg p-8 text-center mb-6">
            <p className="text-gray-500">No track playing. Select a track below to start.</p>
          </div>
        )}

        {/* Track Search */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">Add Songs</h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchTracks()}
              placeholder="Search for songs..."
              className="flex-1 px-4 py-2 border rounded-lg"
            />
            <button 
              onClick={searchTracks}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg"
            >
              Search
            </button>
          </div>
        </div>

        {/* Search Results */}
        <div className="space-y-2">
          {searchResults.map((track) => (
            <div 
              key={track.id}
              className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
              onClick={() => handlePlayTrack(track)}
            >
              <img 
                src={track.albumArt} 
                alt={track.title}
                className="w-12 h-12 rounded"
              />
              <div className="flex-1">
                <p className="font-semibold">{track.title}</p>
                <p className="text-sm text-gray-500">{track.artist}</p>
              </div>
              <button className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm">
                Play
              </button>
            </div>
          ))}
        </div>

        {/* Participants */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Listeners</h3>
          <div className="flex flex-wrap gap-2">
            {participants.map((user) => (
              <div 
                key={user._id}
                className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full"
              >
                {user.profilePicture && (
                  <img 
                    src={user.profilePicture} 
                    alt={user.username}
                    className="w-6 h-6 rounded-full"
                  />
                )}
                <span className="text-sm">{user.username}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
```

## Friends List with Presence

```jsx
"use client";

import { usePresence } from '@/hooks/usePresence';
import { useEffect, useState } from 'react';

export default function FriendsList() {
  const [friends, setFriends] = useState([]);
  const { isOnline, loading } = usePresence();

  useEffect(() => {
    // Fetch friends list from API
    const fetchFriends = async () => {
      const response = await fetch('/api/friends');
      const data = await response.json();
      setFriends(data.friends);
    };

    fetchFriends();
  }, []);

  const onlineFriends = friends.filter(f => isOnline(f._id));
  const offlineFriends = friends.filter(f => !isOnline(f._id));

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Friends</h2>

      {/* Online Friends */}
      {onlineFriends.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
            Online — {onlineFriends.length}
          </h3>
          <div className="space-y-2">
            {onlineFriends.map(friend => (
              <FriendItem key={friend._id} friend={friend} online={true} />
            ))}
          </div>
        </div>
      )}

      {/* Offline Friends */}
      {offlineFriends.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
            Offline — {offlineFriends.length}
          </h3>
          <div className="space-y-2">
            {offlineFriends.map(friend => (
              <FriendItem key={friend._id} friend={friend} online={false} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function FriendItem({ friend, online }) {
  return (
    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 cursor-pointer">
      <div className="relative">
        <img 
          src={friend.profilePicture || '/default-avatar.png'} 
          alt={friend.username}
          className="w-10 h-10 rounded-full"
        />
        <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
          online ? 'bg-green-500' : 'bg-gray-400'
        }`} />
      </div>
      
      <div>
        <p className="font-semibold">{friend.username}</p>
        <p className="text-sm text-gray-500">
          {online ? 'Online' : 'Offline'}
        </p>
      </div>
    </div>
  );
}
```

## Connection Status Indicator

```jsx
"use client";

import { useSocket } from '@/context/SocketContext';

export default function ConnectionStatus() {
  const { isConnected, reconnecting } = useSocket();

  if (isConnected && !reconnecting) {
    return null; // Don't show anything when connected
  }

  return (
    <div className="fixed bottom-4 left-4 z-50">
      {reconnecting && (
        <div className="bg-yellow-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
          <span>Reconnecting...</span>
        </div>
      )}
      
      {!isConnected && !reconnecting && (
        <div className="bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <span>● Disconnected</span>
        </div>
      )}
    </div>
  );
}
```

## Usage in Layout

Add to your main layout:

```jsx
// src/app/layout.js
import { SocketProvider } from '@/context/SocketContext';
import ConnectionStatus from '@/components/ConnectionStatus';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <SocketProvider>
          {children}
          <ConnectionStatus />
        </SocketProvider>
      </body>
    </html>
  );
}
```
