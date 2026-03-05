'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import MobileFooter from '@/components/MobileFooter';

export default function AudioRoomsPage() {
  const router = useRouter();
  const [myRooms, setMyRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isPrivate: false,
    maxParticipants: 25
  });
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchMyRooms();
  }, []);

  const fetchMyRooms = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/audio-rooms', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMyRooms(data.rooms || []);
      } else if (response.status === 401) {
        router.push('/login');
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    setError('');
    setCreating(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/audio-rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        setShowCreateModal(false);
        setFormData({
          name: '',
          description: '',
          isPrivate: false,
          maxParticipants: 50
        });
        fetchMyRooms();
        // Navigate to the new room
        router.push(`/audio-rooms/${data.room.id}`);
      } else {
        setError(data.error || 'Failed to create room');
      }
    } catch (error) {
      console.error('Error creating room:', error);
      setError('Failed to create room');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteRoom = async (roomId) => {
    if (!confirm('Are you sure you want to delete this room? All participants will be removed.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/audio-rooms?roomId=${roomId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchMyRooms();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete room');
      }
    } catch (error) {
      console.error('Error deleting room:', error);
      alert('Failed to delete room');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 md:pt-24 py-8 pb-24 md:pb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Audio Rooms
            </h1>
          </div>
          
          <div className="flex gap-3 w-full sm:w-auto">
            <button
              onClick={() => router.push('/audio-rooms/discover')}
              className="flex-1 sm:flex-none px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Discover Rooms
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex-1 sm:flex-none px-6 py-2 bg-[#0097b2] text-white rounded-lg hover:bg-[#007a93] transition-colors"
              disabled={myRooms.length >= 2}
            >
              Create Room
            </button>
          </div>
        </div>

        {myRooms.length >= 2 && (
          <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-yellow-800 dark:text-yellow-200">
              You've reached the maximum of 2 audio rooms. Delete a room to create a new one.
            </p>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#0097b2]"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading rooms...</p>
          </div>
        ) : myRooms.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
              No audio rooms yet
            </h3>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Create your first audio room to get started
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-6 px-6 py-2 bg-[#0097b2] text-white rounded-lg hover:bg-[#007a93] transition-colors"
            >
              Create Your First Room
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myRooms.map((room) => (
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
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      room.isPrivate 
                        ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200' 
                        : 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                    }`}>
                      {room.isPrivate ? 'Private' : 'Public'}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Room Code:</span>
                      <code className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded font-mono">
                        {room.roomCode}
                      </code>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Participants:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {room.participantCount} / {room.maxParticipants}
                      </span>
                    </div>
                    {room.nowPlaying && (
                      <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Now Playing:</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {room.nowPlaying.songName}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={async () => {
                        // Ensure user is joined before entering
                        const token = localStorage.getItem('token');
                        await fetch('/api/audio-rooms/join', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                          },
                          body: JSON.stringify({ roomId: room.id })
                        });
                        router.push(`/audio-rooms/${room.id}`);
                      }}
                      className="flex-1 px-4 py-2 bg-[#0097b2] text-white rounded-lg hover:bg-[#007a93] transition-colors text-sm font-medium"
                    >
                      Enter Room
                    </button>
                    <button
                      onClick={() => handleDeleteRoom(room.id)}
                      className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors text-sm font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Room Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Create Audio Room
              </h2>

              {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
                </div>
              )}

              <form onSubmit={handleCreateRoom} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Room Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0097b2] focus:border-transparent text-gray-900 dark:text-white"
                    placeholder="My Awesome Room"
                    maxLength={50}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0097b2] focus:border-transparent text-gray-900 dark:text-white"
                    placeholder="Describe your room..."
                    rows={3}
                    maxLength={200}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Max Participants
                  </label>
                  <input
                    type="number"
                    value={formData.maxParticipants}
                    onChange={(e) => setFormData({ ...formData, maxParticipants: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0097b2] focus:border-transparent text-gray-900 dark:text-white"
                    min={2}
                    max={25}
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isPrivate"
                    checked={formData.isPrivate}
                    onChange={(e) => setFormData({ ...formData, isPrivate: e.target.checked })}
                    className="w-4 h-4 text-[#0097b2] bg-gray-100 border-gray-300 rounded focus:ring-[#0097b2]"
                  />
                  <label htmlFor="isPrivate" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Make this room private (requires room code to join)
                  </label>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Note:</strong> You must be at least 16 years old and can create up to 2 audio rooms.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setError('');
                    }}
                    className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="flex-1 px-4 py-2 bg-[#0097b2] text-white rounded-lg hover:bg-[#007a93] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {creating ? 'Creating...' : 'Create Room'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <MobileFooter />
    </div>
  );
}

