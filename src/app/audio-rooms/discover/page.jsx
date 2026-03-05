'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import MobileFooter from '@/components/MobileFooter';

export default function DiscoverRoomsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('public'); // 'public', 'all', 'code'
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [joining, setJoining] = useState(null);

  useEffect(() => {
    searchRooms();
  }, []);

  const searchRooms = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        q: searchQuery,
        type: searchType
      });

      const response = await fetch(`/api/audio-rooms/search?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRooms(data.rooms || []);
      } else if (response.status === 401) {
        router.push('/login');
      }
    } catch (error) {
      console.error('Error searching rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    searchRooms();
  };

  const handleJoinRoom = async (room) => {
    setJoining(room.id);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/audio-rooms/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ roomId: room.id })
      });

      const data = await response.json();

      if (response.ok) {
        router.push(`/audio-rooms/${room.id}`);
      } else {
        alert(data.error || 'Failed to join room');
      }
    } catch (error) {
      console.error('Error joining room:', error);
      alert('Failed to join room');
    } finally {
      setJoining(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 md:pt-24 py-8 pb-24 md:pb-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Discover Audio Rooms
          </h1>
        </div>

        {/* Search Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6 mb-8">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={searchType}
                onChange={(e) => setSearchType(e.target.value)}
                className="px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0097b2] focus:border-transparent text-gray-900 dark:text-white"
              >
                <option value="public">Public Rooms</option>
                <option value="all">All Rooms</option>
                <option value="code">Search by Code</option>
              </select>

              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={searchType === 'code' ? 'Enter 6-digit room code' : 'Search rooms...'}
                className="flex-1 px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0097b2] focus:border-transparent text-gray-900 dark:text-white"
                maxLength={searchType === 'code' ? 6 : 100}
              />

              <button
                type="submit"
                className="px-6 py-2 bg-[#0097b2] text-white rounded-lg hover:bg-[#007a93] transition-colors"
                disabled={loading}
              >
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>
          </form>
        </div>

        {/* Results */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#0097b2]"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Searching rooms...</p>
          </div>
        ) : rooms.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
              No rooms found
            </h3>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Try adjusting your search or create your own room
            </p>
            <button
              onClick={() => router.push('/audio-rooms')}
              className="mt-6 px-6 py-2 bg-[#0097b2] text-white rounded-lg hover:bg-[#007a93] transition-colors"
            >
              Go to My Rooms
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map((room) => (
              <div
                key={room.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                        {room.name}
                      </h3>
                      {room.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                          {room.description}
                        </p>
                      )}
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded ml-2 ${
                      room.isPrivate 
                        ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200' 
                        : 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                    }`}>
                      {room.isPrivate ? 'Private' : 'Public'}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span>{room.creator.name}</span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        {room.participantCount} / {room.maxParticipants} participants
                      </span>
                      {room.participantCount >= room.maxParticipants && (
                        <span className="text-red-600 dark:text-red-400 text-xs font-medium">
                          Full
                        </span>
                      )}
                    </div>

                    {room.nowPlaying && (
                      <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Now Playing:</p>
                        </div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {room.nowPlaying.songName}
                        </p>
                        {room.nowPlaying.artists && (
                          <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                            {room.nowPlaying.artists}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleJoinRoom(room)}
                    disabled={joining === room.id || room.participantCount >= room.maxParticipants}
                    className="w-full px-4 py-2 bg-[#0097b2] text-white rounded-lg hover:bg-[#007a93] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    {joining === room.id ? 'Joining...' : 
                     room.participantCount >= room.maxParticipants ? 'Room Full' : 
                     'Join Room'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <MobileFooter />
    </div>
  );
}

