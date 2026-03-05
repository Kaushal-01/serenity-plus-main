/**
 * Storage Manager Component
 * 
 * Displays storage usage and allows users to manage offline downloads
 * Shows quota information and provides cleanup options
 */

"use client";
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HardDrive, Trash2, AlertTriangle, X, RefreshCw } from 'lucide-react';
import { useDownload } from '@/context/DownloadContext';
import { useStorageQuota } from '@/hooks/useOfflineSong';
import { clearAllDownloads, formatBytes } from '@/lib/db/downloadedSongs';

export default function StorageManager({ isOpen, onClose }) {
  const { getDownloads, downloadCount, refreshStorageInfo } = useDownload();
  const { storageInfo, isRefreshing, refresh } = useStorageQuota();
  const [songs, setSongs] = useState([]);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadSongs();
    }
  }, [isOpen, downloadCount]);

  const loadSongs = async () => {
    const downloaded = await getDownloads();
    // Sort by size (largest first)
    const sorted = downloaded.sort((a, b) => (b.size || 0) - (a.size || 0));
    setSongs(sorted);
  };

  const handleClearAll = async () => {
    setIsClearing(true);
    try {
      await clearAllDownloads();
      await refreshStorageInfo();
      setSongs([]);
      setShowClearConfirm(false);
    } catch (error) {
      console.error('Failed to clear downloads:', error);
    } finally {
      setIsClearing(false);
    }
  };

  const handleRefresh = async () => {
    await refresh();
    await loadSongs();
  };

  if (!isOpen) return null;

  const isNearLimit = storageInfo && storageInfo.usagePercent > 80;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: "100%", sm: { scale: 0.9 } }}
          animate={{ y: 0, scale: 1 }}
          exit={{ y: "100%", sm: { scale: 0.9 } }}
          className="bg-white dark:bg-gray-800 rounded-t-3xl sm:rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between z-10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <HardDrive className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Storage Manager
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Manage offline downloads
                </p>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-100px)] p-6 space-y-6">
            {/* Storage Overview */}
            {storageInfo && (
              <div className={`p-4 rounded-xl ${isNearLimit ? 'bg-orange-50 dark:bg-orange-900/20' : 'bg-blue-50 dark:bg-blue-900/20'}`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {isNearLimit && (
                      <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    )}
                    <h3 className={`font-semibold ${isNearLimit ? 'text-orange-900 dark:text-orange-100' : 'text-blue-900 dark:text-blue-100'}`}>
                      Storage Usage
                    </h3>
                  </div>
                  <button
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        isNearLimit 
                          ? 'bg-orange-500' 
                          : 'bg-gradient-to-r from-blue-500 to-purple-600'
                      }`}
                      style={{ width: `${Math.min(storageInfo.usagePercent, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className={`${isNearLimit ? 'text-orange-700 dark:text-orange-300' : 'text-blue-700 dark:text-blue-300'}`}>
                      Downloaded Audio
                    </p>
                    <p className={`font-semibold ${isNearLimit ? 'text-orange-900 dark:text-orange-100' : 'text-blue-900 dark:text-blue-100'}`}>
                      {storageInfo.downloadedAudioFormatted}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`${isNearLimit ? 'text-orange-700 dark:text-orange-300' : 'text-blue-700 dark:text-blue-300'}`}>
                      Total Available
                    </p>
                    <p className={`font-semibold ${isNearLimit ? 'text-orange-900 dark:text-orange-100' : 'text-blue-900 dark:text-blue-100'}`}>
                      {storageInfo.quotaFormatted}
                    </p>
                  </div>
                </div>

                {isNearLimit && (
                  <p className="text-xs text-orange-700 dark:text-orange-300 mt-2">
                    ⚠️ Storage is running low. Consider removing some downloads.
                  </p>
                )}
              </div>
            )}

            {/* Downloaded Songs by Size */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Downloads ({songs.length})
                </h3>
                {songs.length > 0 && (
                  <button
                    onClick={() => setShowClearConfirm(true)}
                    className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 flex items-center gap-1"
                  >
                    <Trash2 className="w-4 h-4" />
                    Clear All
                  </button>
                )}
              </div>

              {songs.length === 0 ? (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                  No downloads yet
                </p>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {songs.map((song) => (
                    <div
                      key={song.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50"
                    >
                      <img
                        src={song.artwork}
                        alt={song.title}
                        className="w-10 h-10 rounded object-cover flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white truncate text-sm">
                          {song.title}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                          {song.artist}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                          {formatBytes(song.size)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Tips */}
            <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
              <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-2 text-sm">
                💡 Storage Tips
              </h3>
              <ul className="text-xs text-purple-700 dark:text-purple-300 space-y-1">
                <li>• Average song size: 3-5 MB (320kbps)</li>
                <li>• Downloads work completely offline</li>
                <li>• Remove old downloads to free space</li>
                <li>• Storage is managed automatically by your browser</li>
              </ul>
            </div>
          </div>

          {/* Clear All Confirmation */}
          <AnimatePresence>
            {showClearConfirm && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
              >
                <motion.div
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.9 }}
                  className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
                >
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                    Clear All Downloads?
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                    This will remove all {songs.length} downloaded songs. You can download them again later.
                  </p>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowClearConfirm(false)}
                      disabled={isClearing}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleClearAll}
                      disabled={isClearing}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isClearing ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Clearing...
                        </>
                      ) : (
                        'Clear All'
                      )}
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
