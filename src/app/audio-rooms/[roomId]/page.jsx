'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import MobileFooter from '@/components/MobileFooter';
import { usePlayer } from '@/context/PlayerContext';

export default function AudioRoomPage() {
  const router = useRouter();
  const params = useParams();
  const roomId = params.roomId;
  const { playSong, setIsPlaying, setIsRoomListeningMode } = usePlayer();

  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [activeTab, setActiveTab] = useState('chat'); // 'chat', 'queue', 'participants'
  const [searchSong, setSearchSong] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showSongSearch, setShowSongSearch] = useState(false);
  const [floatingEmojis, setFloatingEmojis] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  const messagesEndRef = useRef(null);
  const pollIntervalRef = useRef(null);
  const lastMessageIdRef = useRef(null);
  const currentPlayingSongIdRef = useRef(null);

  useEffect(() => {
    fetchRoomDetails();
    startPolling();

    return () => {
      stopPolling();
      setIsRoomListeningMode(false);
    };
  }, [roomId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  // Close emoji picker when changing tabs
  useEffect(() => {
    setShowEmojiPicker(false);
  }, [activeTab]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchRoomDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/audio-rooms/${roomId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRoom(data.room);
        setMessages(data.room.messages || []);
        setCurrentUserId(data.userId); // Store current user ID
        
        // Enable room listening mode for non-creators only
        const isCreator = data.room.creator._id === data.userId;
        setIsRoomListeningMode(!isCreator);
        
        if (data.room.messages.length > 0) {
          lastMessageIdRef.current = data.room.messages[data.room.messages.length - 1]._id;
        }
        
        // Auto-play current song if available and sync playback
        if (data.room.nowPlaying && data.room.nowPlaying.downloadUrl) {
          currentPlayingSongIdRef.current = data.room.nowPlaying.songId;
          syncPlayback(data.room.nowPlaying);
        }
      } else if (response.status === 401) {
        router.push('/login');
      } else if (response.status === 403) {
        alert('You need to join this room first');
        router.push('/audio-rooms/discover');
      } else {
        router.push('/audio-rooms');
      }
    } catch (error) {
      console.error('Error fetching room:', error);
    } finally {
      setLoading(false);
    }
  };

  const startPolling = () => {
    pollIntervalRef.current = setInterval(async () => {
      try {
        const token = localStorage.getItem('token');
        const params = new URLSearchParams();
        if (lastMessageIdRef.current) {
          params.append('lastMessageId', lastMessageIdRef.current);
        }

        const response = await fetch(`/api/audio-rooms/${roomId}/poll?${params}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          
          // Update room state and sync playback
          if (data.nowPlaying !== undefined) {
            setRoom(prev => prev ? { ...prev, nowPlaying: data.nowPlaying, queue: data.queue, participants: data.participants } : null);
            
            // Auto-sync playback when song changes
            if (data.nowPlaying && data.nowPlaying.songId !== currentPlayingSongIdRef.current) {
              currentPlayingSongIdRef.current = data.nowPlaying.songId;
              syncPlayback(data.nowPlaying);
            } else if (!data.nowPlaying && currentPlayingSongIdRef.current) {
              currentPlayingSongIdRef.current = null;
            }
          }
          
          // Add new messages
          if (data.messages && data.messages.length > 0) {
            setMessages(prev => [...prev, ...data.messages]);
            lastMessageIdRef.current = data.messages[data.messages.length - 1]._id;
            
            // Show floating emojis
            data.messages.forEach(msg => {
              if (msg.messageType === 'emoji') {
                addFloatingEmoji(msg.emoji);
              }
            });
          }
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 3000); // Poll every 3 seconds
  };

  const stopPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }
  };

  const leaveRoom = async () => {
    try {
      const token = localStorage.getItem('token');
      await fetch('/api/audio-rooms/leave', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ roomId })
      });
    } catch (error) {
      console.error('Error leaving room:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/audio-rooms/${roomId}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content: message.trim(),
          messageType: 'text'
        })
      });

      if (response.ok) {
        setMessage('');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleSendEmoji = async (emoji) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/audio-rooms/${roomId}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          messageType: 'emoji',
          emoji
        })
      });
      
      addFloatingEmoji(emoji);
    } catch (error) {
      console.error('Error sending emoji:', error);
    }
  };

  const addFloatingEmoji = (emoji) => {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setFloatingEmojis(prev => [...prev, { id, emoji }]);
    setTimeout(() => {
      setFloatingEmojis(prev => prev.filter(e => e.id !== id));
    }, 3000);
  };

  const handleSearchSong = async () => {
    if (!searchSong.trim()) return;
    
    setSearching(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/serenity/search?query=${encodeURIComponent(searchSong)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const results = data.data?.songs?.results || [];
        console.log('Search results:', results);
        console.log('Sample song format:', results[0]);
        setSearchResults(results);
      } else {
        console.error('Search failed:', response.status);
        alert('Failed to search songs. Please try again.');
      }
    } catch (error) {
      console.error('Error searching songs:', error);
      alert('Failed to search songs. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  const handleVoteSong = async (song) => {
    try {
      const token = localStorage.getItem('token');
      
      // Handle different song formats (Saavn API vs Artist uploads)
      // Ensure downloadUrl is in array format with url and quality properties
      let downloadUrl = song.downloadUrl;
      
      console.log('Original song data:', song);
      
      if (!downloadUrl) {
        alert('This song has no audio available');
        return;
      }
      
      // Convert downloadUrl to standard format [{url, quality}]
      if (typeof downloadUrl === 'string') {
        downloadUrl = [{ url: downloadUrl, quality: '320kbps' }];
      } else if (Array.isArray(downloadUrl) && downloadUrl.length > 0) {
        // If array has {link, quality}, convert to {url, quality}
        if (downloadUrl[0].link) {
          downloadUrl = downloadUrl.map(item => ({
            url: item.link,
            quality: item.quality || '320kbps'
          }));
        } else if (downloadUrl[0].url) {
          // Already in correct format
          downloadUrl = downloadUrl;
        } else if (typeof downloadUrl[0] === 'string') {
          // Array of strings, convert each
          downloadUrl = downloadUrl.map((url, i) => ({
            url: url,
            quality: i === 0 ? '320kbps' : '160kbps'
          }));
        }
      }
      
      console.log('Formatted downloadUrl:', downloadUrl);
      
      const songData = {
        songId: song.id,
        songName: song.name,
        artists: song.artists?.primary?.map(a => a.name).join(', ') || song.primaryArtists || song.artists || 'Unknown Artist',
        image: song.image?.[2]?.link || song.image?.[2]?.url || song.image?.[0]?.link || song.image?.[0]?.url || (typeof song.image === 'string' ? song.image : null),
        downloadUrl: downloadUrl,
        duration: song.duration
      };
      
      console.log('Sending song data to queue:', songData);
      
      const response = await fetch(`/api/audio-rooms/${roomId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(songData)
      });

      if (response.ok) {
        const data = await response.json();
        setRoom(prev => prev ? { ...prev, queue: data.queue } : null);
        setShowSongSearch(false);
        setSearchSong('');
        setSearchResults([]);
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to add song to queue');
      }
    } catch (error) {
      console.error('Error voting song:', error);
      alert('Failed to add song. Please try again.');
    }
  };

  const syncPlayback = (nowPlayingData) => {
    if (!nowPlayingData) {
      console.log('❌ Cannot sync: No song data');
      return;
    }
    
    if (!nowPlayingData.downloadUrl) {
      console.log('❌ Cannot sync: No download URL');
      console.log('Song data:', nowPlayingData);
      alert('This song has no audio available. Please try another song.');
      return;
    }
    
    console.log('🎵 Syncing playback for:', nowPlayingData.songName);
    console.log('Download URL:', nowPlayingData.downloadUrl);
    setIsSyncing(true);
    
    // Calculate seek position based on when song started
    let seekPosition = 0;
    if (nowPlayingData.startedAt) {
      const startTime = new Date(nowPlayingData.startedAt).getTime();
      const currentTime = Date.now();
      const elapsedSeconds = (currentTime - startTime) / 1000;
      
      console.log(`⏱️ Song started ${elapsedSeconds.toFixed(1)}s ago`);
      
      // Only seek if the song hasn't ended
      if (nowPlayingData.duration && elapsedSeconds < nowPlayingData.duration) {
        seekPosition = elapsedSeconds;
      } else if (nowPlayingData.duration && elapsedSeconds >= nowPlayingData.duration) {
        // Song has already ended, don't play
        console.log('⏭️ Song has already ended, skipping playback');
        setIsSyncing(false);
        return;
      }
    }
    
    console.log(`▶️ Playing song, will seek to ${seekPosition.toFixed(1)}s`);
    
    // Ensure downloadUrl is in correct format
    let downloadUrl = nowPlayingData.downloadUrl;
    if (!Array.isArray(downloadUrl) || downloadUrl.length === 0) {
      console.error('❌ Invalid downloadUrl format:', downloadUrl);
      alert('Audio format error. Please try another song.');
      setIsSyncing(false);
      return;
    }
    
    // Ensure image is in correct format for the player
    // Player expects: array with {url} or string
    let imageData = nowPlayingData.image;
    if (typeof imageData === 'string') {
      // Convert string URL to array format for player compatibility
      imageData = [
        { url: imageData },
        { url: imageData },
        { url: imageData }
      ];
    }
    
    console.log('🖼️ Image format:', imageData);
    
    // Load the song for everyone
    playSong({
      id: nowPlayingData.songId,
      name: nowPlayingData.songName,
      artists: nowPlayingData.artists,
      image: imageData,
      downloadUrl: downloadUrl
    });
    
    setIsSyncing(false);
    
    // Only auto-play if audio is enabled (user clicked Listen Song)
    if (!audioEnabled) {
      console.log('⚠️ Song loaded, waiting for user to click Listen Song');
      return;
    }
    
    // User has enabled audio, so sync playback position and play
    setTimeout(() => {
      const audioElement = document.querySelector('audio');
      if (!audioElement) return;
      
      // Seek to correct position if needed
      if (seekPosition > 0 && audioElement.readyState >= 2 && !isNaN(seekPosition)) {
        audioElement.currentTime = Math.min(seekPosition, audioElement.duration || seekPosition);
        console.log(`⏩ Seeking to ${seekPosition.toFixed(1)}s`);
      }
      
      // Play the audio
      audioElement.play()
        .then(() => console.log('✅ Audio synced and playing'))
        .catch(err => console.error('❌ Play error:', err));
    }, 500);
  };

  const handlePlayNext = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/audio-rooms/${roomId}/play-next`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.nowPlaying) {
          setRoom(prev => prev ? { ...prev, nowPlaying: data.nowPlaying, queue: data.queue } : null);
          currentPlayingSongIdRef.current = data.nowPlaying.songId;
          syncPlayback(data.nowPlaying);
        } else {
          alert('No songs in queue');
        }
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to play next song');
      }
    } catch (error) {
      console.error('Error playing next song:', error);
      alert('Failed to play next song. Please try again.');
    }
  };

  const handleUpvoteSong = async (song) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/audio-rooms/${roomId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          songId: song.songId,
          songName: song.songName,
          artists: song.artists,
          image: song.image,
          downloadUrl: song.downloadUrl,
          duration: song.duration
        })
      });

      if (response.ok) {
        const data = await response.json();
        setRoom(prev => prev ? { ...prev, queue: data.queue } : null);
      }
    } catch (error) {
      console.error('Error upvoting song:', error);
    }
  };

  const quickEmojis = ['👍', '❤️', '🔥', '🎵', '🎉', '😊', '👏', '🙌'];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#0097b2]"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading room...</p>
        </div>
      </div>
    );
  }

  if (!room) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 md:pt-24 py-4 pb-32 md:pb-32">
        {/* Sync Status Banner */}
        {room?.nowPlaying && currentUserId && room.creator && currentUserId !== room.creator._id && (
          <div className="mb-4 bg-gradient-to-r from-[#0097b2]/10 to-[#00b8d4]/10 dark:from-[#0097b2]/20 dark:to-[#00b8d4]/20 border border-[#0097b2]/30 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-[#0097b2] dark:text-[#00b8d4] animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  🎧 Listening together with the room
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {room.participants?.find(p => p._id === room.creator._id)?.name || 'Room creator'} is controlling the music
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3 sm:p-4 mb-4">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            {/* Song Card - Left on Desktop, Hidden on Mobile */}
            {room.nowPlaying && (
              <div className="hidden lg:flex order-2 lg:order-1 w-full lg:w-auto">
                <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  {room.nowPlaying.image && (
                    <img 
                      src={room.nowPlaying.image} 
                      alt={room.nowPlaying.songName}
                      className="w-16 h-16 rounded-lg object-cover shadow-md flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Now Playing</p>
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                      {room.nowPlaying.songName}
                    </h3>
                    {room.nowPlaying.artists && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        {room.nowPlaying.artists}
                      </p>
                    )}
                  </div>
                  
                  {/* Play Next Button for Creator */}
                  {currentUserId && room.creator && currentUserId === room.creator._id && (
                    <button
                      onClick={handlePlayNext}
                      className="px-4 py-2 bg-[#0097b2] text-white rounded-lg hover:bg-[#007a93] transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                      disabled={!room.queue || room.queue.length === 0 || isSyncing}
                    >
                      {isSyncing ? (
                        <>
                          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span className="hidden sm:inline">Loading...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                          </svg>
                          <span className="hidden sm:inline">Play Next</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )}
            
            {/* Room Info - Right on Desktop */}
            <div className="order-1 lg:order-2 flex-1 lg:flex-none lg:text-right">
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white truncate">
                {room.name}
              </h1>
              {room.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{room.description}</p>
              )}
              <div className="flex items-center gap-2 sm:gap-3 mt-1 flex-wrap lg:justify-end">
                <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                  </svg>
                  <code className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded font-mono">{room.roomCode}</code>
                </span>
                <span className="inline-flex items-center gap-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                  </svg>
                  {room.participantCount}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {/* Main Content */}
          <div className="space-y-4">
            {/* Now Playing - Hidden on Desktop (shown in header) */}
            <div className="lg:hidden bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Now Playing</h2>
                {isSyncing && (
                  <span className="text-xs text-[#0097b2] dark:text-[#00b8d4] flex items-center gap-1">
                    <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Syncing...
                  </span>
                )}
              </div>
              {room.nowPlaying ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-4">
                    {room.nowPlaying.image && (
                      <img 
                        src={room.nowPlaying.image} 
                        alt={room.nowPlaying.songName}
                        className="w-20 h-20 rounded-lg object-cover shadow-md"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                        {room.nowPlaying.songName}
                      </h3>
                      {room.nowPlaying.artists && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                          {room.nowPlaying.artists}
                        </p>
                      )}
                      {room.nowPlaying.playedBy && (
                        <p className="text-xs text-[#0097b2] dark:text-[#00b8d4] mt-1">
                          🎵 Played by {room.participants?.find(p => p._id === room.nowPlaying.playedBy)?.name || 'Creator'}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* Listen Song button for non-creators */}
                  {currentUserId && room.creator && currentUserId !== room.creator._id && !audioEnabled && (
                    <button
                      onClick={() => {
                        setAudioEnabled(true);
                        setIsPlaying(true);
                        
                        // Play and sync the current audio
                        setTimeout(() => {
                          const audioElement = document.querySelector('audio');
                          if (audioElement) {
                            // Sync playback position
                            if (room.nowPlaying && room.nowPlaying.startedAt) {
                              const startTime = new Date(room.nowPlaying.startedAt).getTime();
                              const currentTime = Date.now();
                              const elapsedSeconds = (currentTime - startTime) / 1000;
                              
                              if (audioElement.duration && elapsedSeconds < audioElement.duration && elapsedSeconds > 0) {
                                audioElement.currentTime = elapsedSeconds;
                                console.log(`⏩ Synced to ${elapsedSeconds.toFixed(1)}s`);
                              }
                            }
                            
                            audioElement.play()
                              .then(() => console.log('✅ Audio enabled and playing'))
                              .catch(err => {
                                console.error('Play error:', err);
                                setAudioEnabled(false);
                                setIsPlaying(false);
                              });
                          }
                        }, 100);
                      }}
                      className="w-full px-4 py-3 bg-[#0097b2] text-white rounded-lg hover:bg-[#007a93] transition-colors font-medium flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                      </svg>
                      Listen Song
                    </button>
                  )}
                  
                  {/* Listening badge for non-creators who enabled audio */}
                  {currentUserId && room.creator && currentUserId !== room.creator._id && audioEnabled && (
                    <div className="flex items-center justify-center gap-2 bg-green-50 dark:bg-green-900/20 px-4 py-3 rounded-lg text-green-700 dark:text-green-400">
                      <svg className="w-5 h-5 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                      </svg>
                      <span className="font-medium">Listening...</span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">No song playing</p>
              )}
              
              {/* Playback controls for creator only */}
              {currentUserId && room.creator && currentUserId === room.creator._id && (
                <div className="mt-4">
                  <button
                    onClick={handlePlayNext}
                    className="w-full px-4 py-2 bg-[#0097b2] text-white rounded-lg hover:bg-[#007a93] transition-colors text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!room.queue || room.queue.length === 0 || isSyncing}
                  >
                    {isSyncing ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Loading...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                        </svg>
                        Play Next from Queue
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Tabs */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
              <div className="flex border-b border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setActiveTab('chat')}
                  className={`flex-1 px-4 py-3 text-sm font-medium ${
                    activeTab === 'chat'
                      ? 'bg-[#0097b2]/10 dark:bg-[#0097b2]/20 text-[#0097b2] dark:text-[#00b8d4] border-b-2 border-[#0097b2]'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  Chat
                </button>
                <button
                  onClick={() => setActiveTab('queue')}
                  className={`flex-1 px-4 py-3 text-sm font-medium ${
                    activeTab === 'queue'
                      ? 'bg-[#0097b2]/10 dark:bg-[#0097b2]/20 text-[#0097b2] dark:text-[#00b8d4] border-b-2 border-[#0097b2]'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  Queue ({room.queue?.length || 0})
                </button>
                <button
                  onClick={() => setActiveTab('participants')}
                  className={`flex-1 px-4 py-3 text-sm font-medium ${
                    activeTab === 'participants'
                      ? 'bg-[#0097b2]/10 dark:bg-[#0097b2]/20 text-[#0097b2] dark:text-[#00b8d4] border-b-2 border-[#0097b2]'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  Participants ({room.participantCount})
                </button>
              </div>

              <div className="p-4 h-96 overflow-y-auto relative">
                {/* Floating Emojis */}
                {floatingEmojis.map((item) => (
                  <div
                    key={item.id}
                    className="floating-emoji"
                    style={{
                      position: 'absolute',
                      left: `${Math.random() * 80 + 10}%`,
                      animation: 'float-up 3s ease-out forwards',
                      fontSize: '2rem',
                      zIndex: 50
                    }}
                  >
                    {item.emoji}
                  </div>
                ))}

                {activeTab === 'chat' && (
                  <div className="space-y-3">
                    {messages.filter(msg => {
                      // Filter out join/left messages by messageType
                      if (msg.messageType === 'join' || msg.messageType === 'left' || msg.messageType === 'system') {
                        return false;
                      }
                      // Filter out join/left messages by content
                      if (msg.content && (msg.content.includes('joined the room') || msg.content.includes('left the room'))) {
                        return false;
                      }
                      return true;
                    }).slice(-50).map((msg, index) => (
                      <div key={`msg-${msg._id}-${index}`} className="flex gap-2">
                        <div className="flex-shrink-0">
                          {msg.senderProfilePicture ? (
                            <img
                              src={msg.senderProfilePicture}
                              alt={msg.senderName}
                              className="w-8 h-8 rounded-full"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-[#0097b2] flex items-center justify-center text-white text-sm font-medium">
                              {msg.senderName?.charAt(0) || '?'}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {msg.senderName}
                          </p>
                          {msg.messageType === 'emoji' ? (
                            <span className="text-2xl">{msg.emoji}</span>
                          ) : msg.messageType === 'song' && msg.sharedSong ? (
                            <div className="mt-1 p-2 bg-[#0097b2]/10 dark:bg-[#0097b2]/20 rounded-lg">
                              <p className="text-sm text-purple-900 dark:text-purple-100">
                                🎵 {msg.sharedSong.name}
                              </p>
                            </div>
                          ) : (
                            <p className="text-sm text-gray-900 dark:text-white break-words">
                              {msg.content}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}

                {activeTab === 'queue' && (
                  <div className="space-y-2">
                    {room.queue && room.queue.length > 0 ? (
                      room.queue.map((song, index) => (
                        <div key={`queue-${song._id || song.songId}-${index}`} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                          <span className="text-lg font-bold text-gray-400 dark:text-gray-500">
                            {index + 1}
                          </span>
                          {song.image && (
                            <img 
                              src={song.image} 
                              alt={song.songName}
                              className="w-12 h-12 rounded object-cover"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 dark:text-white truncate">
                              {song.songName}
                            </p>
                            {song.artists && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                {song.artists}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleUpvoteSong(song)}
                              disabled={song.voters?.includes(currentUserId)}
                              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors ${
                                song.voters?.includes(currentUserId)
                                  ? 'bg-[#0097b2]/20 text-[#0097b2] dark:bg-[#0097b2]/30 dark:text-[#00b8d4] cursor-not-allowed'
                                  : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-[#0097b2]/10 dark:hover:bg-[#0097b2]/20'
                              }`}
                              title={song.voters?.includes(currentUserId) ? 'Already voted' : 'Vote for this song'}
                            >
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                              </svg>
                              <span className="text-sm font-medium">{song.voteCount}</span>
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                        No songs in queue. Add songs to get started!
                      </p>
                    )}
                    
                    <button
                      onClick={() => setShowSongSearch(true)}
                      className="w-full mt-4 px-4 py-2 bg-[#0097b2] text-white rounded-lg hover:bg-[#007a93] transition-colors text-sm font-medium"
                    >
                      + Add Song to Queue
                    </button>
                  </div>
                )}

                {activeTab === 'participants' && (
                  <div className="space-y-2">
                    {room.participants?.map((participant) => {
                      const isActive = participant.isActive !== false;
                      const isCreator = participant._id === room.creator._id;
                      const canKick = currentUserId === room.creator._id && !isCreator;
                      
                      return (
                        <div key={participant._id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                          {/* Status indicator */}
                          <div className={`w-1 h-10 rounded-full ${isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                          
                          {participant.profilePicture ? (
                            <img
                              src={participant.profilePicture}
                              alt={participant.name}
                              className="w-10 h-10 rounded-full"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-[#0097b2] flex items-center justify-center text-white font-medium">
                              {participant.name?.charAt(0) || '?'}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 dark:text-white">
                              {participant.name}
                              {isCreator && (
                                <span className="ml-2 px-2 py-0.5 text-xs bg-[#0097b2]/10 dark:bg-[#0097b2]/20 text-[#0097b2] dark:text-[#00b8d4] rounded">
                                  Creator
                                </span>
                              )}
                            </p>
                            {participant.userId && (
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                @{participant.userId}
                              </p>
                            )}
                          </div>
                          
                          {/* Kick menu for room creator */}
                          {canKick && (
                            <div className="relative group">
                              <button
                                onClick={async () => {
                                  if (confirm(`Kick ${participant.name} from the room?`)) {
                                    try {
                                      const token = localStorage.getItem('token');
                                      const response = await fetch(`/api/audio-rooms/${roomId}/kick`, {
                                        method: 'POST',
                                        headers: {
                                          'Content-Type': 'application/json',
                                          'Authorization': `Bearer ${token}`
                                        },
                                        body: JSON.stringify({ userId: participant._id })
                                      });
                                      if (response.ok) {
                                        // Refresh room details
                                        fetchRoomDetails();
                                      } else {
                                        alert('Failed to kick user');
                                      }
                                    } catch (error) {
                                      console.error('Error kicking user:', error);
                                      alert('Failed to kick user');
                                    }
                                  }
                                }}
                                className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                                title="Kick user"
                              >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                </svg>
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {activeTab === 'chat' && (
                <div className="border-t border-gray-200 dark:border-gray-700 p-3 sm:p-4">
                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    {/* Emoji Button */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      >
                        😊
                      </button>
                      
                      {/* Emoji Picker */}
                      {showEmojiPicker && (
                        <div className="absolute bottom-full mb-2 left-0 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-3 z-10">
                          <div className="grid grid-cols-6 gap-2">
                            {['🎵', '🎶', '🎸', '🎹', '🎤', '🎧', '🎼', '🎺', '🥁', '🎻', '🎷', '🔥', '❤️', '😍', '🤩', '😎', '👍', '👏', '🙌', '✨', '💫', '⭐', '🌟', '💯'].map((emoji) => (
                              <button
                                key={emoji}
                                type="button"
                                onClick={() => {
                                  handleSendEmoji(emoji);
                                  setShowEmojiPicker(false);
                                }}
                                className="text-2xl hover:scale-125 transition-transform p-1"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <input
                      type="text"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 px-3 sm:px-4 py-2 text-sm sm:text-base bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0097b2] focus:border-transparent text-gray-900 dark:text-white"
                      maxLength={500}
                    />
                    <button
                      type="submit"
                      className="px-4 sm:px-6 py-2 bg-[#0097b2] text-white rounded-lg hover:bg-[#007a93] transition-colors font-medium text-sm sm:text-base"
                    >
                      Send
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Leave Room Button at Bottom */}
        <div className="mt-6 mb-8">
          <button
            onClick={() => {
              leaveRoom();
              router.push('/audio-rooms');
            }}
            className="w-full px-6 py-3 bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
            </svg>
            Leave Room
          </button>
        </div>
      </main>

      {/* Song Search Modal */}
      {showSongSearch && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Add Song to Queue
                </h2>
                <button
                  onClick={() => {
                    setShowSongSearch(false);
                    setSearchSong('');
                    setSearchResults([]);
                  }}
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={searchSong}
                  onChange={(e) => setSearchSong(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchSong()}
                  placeholder="Search for songs..."
                  className="flex-1 px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0097b2] focus:border-transparent text-gray-900 dark:text-white"
                />
                <button
                  onClick={handleSearchSong}
                  disabled={searching}
                  className="px-6 py-2 bg-[#0097b2] text-white rounded-lg hover:bg-[#007a93] transition-colors disabled:opacity-50"
                >
                  {searching ? 'Searching...' : 'Search'}
                </button>
              </div>

              <div className="space-y-2">
                {searchResults.length === 0 && !searching && searchSong.trim() && (
                  <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                    No songs found. Try a different search term.
                  </p>
                )}
                {searchResults.map((song, index) => {
                  const hasAudio = song.downloadUrl && (
                    (Array.isArray(song.downloadUrl) && song.downloadUrl.length > 0) ||
                    typeof song.downloadUrl === 'string'
                  );
                  
                  return (
                    <div key={`search-${song.id}-${index}`} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                      {song.image && (
                        <img 
                          src={song.image[2]?.link || song.image[0]?.link || song.image[0]?.url || (typeof song.image === 'string' ? song.image : '')} 
                          alt={song.name}
                          className="w-12 h-12 rounded object-cover"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white truncate">
                          {song.name}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                          {song.artists?.primary ? song.artists.primary.map(a => a.name).join(', ') : song.primaryArtists || song.artists || 'Unknown Artist'}
                        </p>
                        {!hasAudio && (
                          <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                            ⚠️ No audio available
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleVoteSong(song)}
                        disabled={!hasAudio}
                        className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium whitespace-nowrap ${
                          hasAudio 
                            ? 'bg-[#0097b2] text-white hover:bg-[#007a93]'
                            : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {hasAudio ? 'Add to Queue' : 'No Audio'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      <MobileFooter />

      <style jsx>{`
        @keyframes float-up {
          from {
            transform: translateY(0);
            opacity: 1;
          }
          to {
            transform: translateY(-200px);
            opacity: 0;
          }
        }
        .floating-emoji {
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}
