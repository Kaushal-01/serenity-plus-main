/**
 * Downloads Playlist Page
 * 
 * Virtual/system playlist showing all offline-downloaded songs
 * Works entirely offline, pulling from IndexedDB
 */

"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Download, Trash2, WifiOff, Wifi, HardDrive, Play, ChevronLeft, Music } from 'lucide-react';
import Navbar from '@/components/Navbar';
import DownloadButton from '@/components/DownloadButton';
import { usePlayer } from '@/context/PlayerContext';
import { useDownload } from '@/context/DownloadContext';
import { useNetworkStatus, useStorageQuota } from '@/hooks/useOfflineSong';
import { formatBytes } from '@/lib/db/downloadedSongs';

export default function DownloadsPage() {
  const router = useRouter();
  const { playSong, playQueue } = usePlayer();
  const { getDownloads, removeSong, downloadCount, isInitialized } = useDownload();
  const { storageInfo } = useStorageQuota();
  const isOnline = useNetworkStatus();
  
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteAll, setShowDeleteAll] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    
    loadDownloads();
  }, [downloadCount]); // Reload when download count changes

  const loadDownloads = async () => {
    if (!isInitialized) return;
    
    setLoading(true);
    try {
      const downloaded = await getDownloads();
      setSongs(downloaded);
    } catch (error) {
      console.error('Failed to load downloads:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlaySong = (song, index) => {
    // Convert to player format
    const playerSong = {
      id: song.id,
      name: song.title,
      artists: {
        primary: song.artists?.primary || [{ name: song.artist }]
      },
      album: song.album ? { name: song.album } : null,
      image: [{ url: song.artwork }],
      duration: song.duration,
      // Signal to player to use offline version
      _isOffline: true
    };
    
    playSong(playerSong);
  };

  const handlePlayAll = () => {
    if (songs.length === 0) return;
    
    const queue = songs.map(song => ({
      id: song.id,
      name: song.title,
      artists: {
        primary: song.artists?.primary || [{ name: song.artist }]
      },
      album: song.album ? { name: song.album } : null,
      image: [{ url: song.artwork }],
      duration: song.duration,
      _isOffline: true
    }));
    
    playQueue(queue);
  };

  const handleRemoveSong = async (songId) => {
    await removeSong(songId);
    loadDownloads();
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0097b2]/5 to-white dark:from-gray-900 dark:to-gray-800 transition-colors">
      <Navbar />
      
      <main className="pt-24 px-4 sm:px-6 py-6 pb-32 md:pb-12 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-4"
          >
            <ChevronLeft className="w-5 h-5" />
            Back
          </button>
          
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-[#0097b2] to-[#007a93] flex items-center justify-center shadow-lg">
                <Download className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </div>
              
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1">
                  Downloads
                </h1>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                  {songs.length} song{songs.length !== 1 ? 's' : ''} • Available offline
                </p>
              </div>
            </div>

            {songs.length > 0 && (
              <button
                onClick={handlePlayAll}
                className="px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-[#0097b2] hover:bg-[#007a93] text-white font-semibold hover:shadow-lg transition-all flex items-center gap-2 text-sm sm:text-base"
              >
                <Play className="w-4 h-4 sm:w-5 sm:h-5" />
                Play All
              </button>
            )}
          </div>
        </div>

        {/* Network & Storage Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6">
          {/* Network Status - Only render after mount to prevent hydration errors */}
          {isMounted && (
            <div className={`p-4 rounded-xl ${isOnline ? 'bg-green-50 dark:bg-green-900/20' : 'bg-orange-50 dark:bg-orange-900/20'}`}>
              <div className="flex items-center gap-3">
                {isOnline ? (
                  <Wifi className="w-5 h-5 text-green-600 dark:text-green-400" />
                ) : (
                  <WifiOff className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                )}
                <div>
                  <p className={`font-semibold ${isOnline ? 'text-green-900 dark:text-green-100' : 'text-orange-900 dark:text-orange-100'}`}>
                    {isOnline ? 'Online' : 'Offline Mode'}
                  </p>
                  <p className={`text-sm ${isOnline ? 'text-green-700 dark:text-green-300' : 'text-orange-700 dark:text-orange-300'}`}>
                    {isOnline ? 'Connected to internet' : 'Playing from local storage'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Storage Info */}
          {storageInfo && (
            <div className="p-3 sm:p-4 rounded-xl bg-[#0097b2]/10 dark:bg-[#0097b2]/20">
              <div className="flex items-center gap-3">
                <HardDrive className="w-5 h-5 text-[#0097b2] dark:text-[#00bcd4]" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">
                    Storage Used
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">
                    {storageInfo.downloadedAudioFormatted} / {storageInfo.quotaFormatted}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs sm:text-sm font-medium text-[#0097b2] dark:text-[#00bcd4]">
                    {storageInfo.usagePercent.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Songs List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-[#0097b2] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : songs.length === 0 ? (
          <div className="text-center py-16">
            <Download className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
              No downloads yet
            </h3>
            <p className="text-gray-500 dark:text-gray-500">
              Download songs to listen offline
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {songs.map((song, index) => (
              <motion.div
                key={song.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white dark:bg-gray-800 rounded-xl p-3 sm:p-4 hover:shadow-lg transition-all group"
              >
                <div className="flex items-center gap-3 sm:gap-4">
                  {/* Album Art */}
                  <button
                    onClick={() => handlePlaySong(song, index)}
                    className="relative flex-shrink-0"
                  >
                    <img
                      src={song.artwork}
                      alt={song.title}
                      className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Play className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                  </button>

                  {/* Song Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate text-sm sm:text-base">
                      {song.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">
                      {song.artist}
                      {song.album && ` • ${song.album}`}
                    </p>
                  </div>

                  {/* Duration & Download Info */}
                  <div className="hidden sm:flex flex-col items-end gap-1 flex-shrink-0">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {formatDuration(song.duration)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      {formatDate(song.downloadedAt)} • {formatBytes(song.size)}
                    </p>
                  </div>

                  {/* Mobile: Show only duration */}
                  <div className="flex sm:hidden flex-col items-end gap-1 flex-shrink-0">
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                      {formatDuration(song.duration)}
                    </p>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => handleRemoveSong(song.id)}
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100 flex-shrink-0"
                    title="Remove from downloads"
                  >
                    <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
