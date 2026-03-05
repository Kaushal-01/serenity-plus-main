/**
 * DownloadButton Component
 * 
 * Displays download status and allows users to download/remove songs
 * 
 * States:
 * - Not downloaded: Shows download icon
 * - Downloading: Shows progress circle
 * - Downloaded: Shows checkmark (can click to remove)
 * - Failed: Shows error state with retry option
 */

"use client";
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Check, X, Loader2, AlertCircle } from 'lucide-react';
import { useDownload } from '@/context/DownloadContext';

export default function DownloadButton({ song, audioUrl, className = "", size = "default" }) {
  const { isDownloaded, downloadSong, removeSong, getDownloadStatus } = useDownload();
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  
  const downloaded = isDownloaded(song.id);
  const status = getDownloadStatus(song.id);
  
  // Size variants
  const sizeClasses = {
    small: "w-7 h-7",
    default: "w-9 h-9",
    large: "w-11 h-11"
  };
  
  const iconSizes = {
    small: "w-3.5 h-3.5",
    default: "w-4 h-4",
    large: "w-5 h-5"
  };

  const handleClick = async (e) => {
    e.stopPropagation();
    
    if (status.status === 'downloading') {
      // Can't cancel while downloading (could add this feature)
      return;
    }
    
    if (status.status === 'failed') {
      // Retry download
      await downloadSong(song, audioUrl);
      return;
    }
    
    if (downloaded) {
      // Show confirmation before deleting
      setShowConfirmDelete(true);
      return;
    }
    
    // Start download
    if (audioUrl) {
      await downloadSong(song, audioUrl);
    } else {
      console.error('No audio URL provided for download');
    }
  };

  const handleConfirmDelete = async (e) => {
    e.stopPropagation();
    await removeSong(song.id);
    setShowConfirmDelete(false);
  };

  const handleCancelDelete = (e) => {
    e.stopPropagation();
    setShowConfirmDelete(false);
  };

  // Render different states
  const renderButton = () => {
    // Downloading state
    if (status.status === 'downloading') {
      return (
        <div className={`relative ${sizeClasses[size]} flex items-center justify-center`}>
          {/* Background circle */}
          <svg className="absolute inset-0 -rotate-90" viewBox="0 0 36 36">
            <circle
              cx="18"
              cy="18"
              r="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-gray-300 dark:text-gray-600"
            />
            <circle
              cx="18"
              cy="18"
              r="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray={`${status.progress || 0}, 100`}
              className="text-blue-500 transition-all duration-300"
            />
          </svg>
          <Loader2 className={`${iconSizes[size]} animate-spin text-blue-500`} />
        </div>
      );
    }

    // Failed state
    if (status.status === 'failed') {
      return (
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          className="relative"
        >
          <AlertCircle className={`${iconSizes[size]} text-red-500`} />
        </motion.div>
      );
    }

    // Completed state  
    if (status.status === 'completed' || downloaded) {
      return (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 25 }}
        >
          <Check className={`${iconSizes[size]} text-green-500`} />
        </motion.div>
      );
    }

    // Not downloaded state
    return (
      <Download className={`${iconSizes[size]} text-gray-600 dark:text-gray-300 group-hover:text-blue-500 transition-colors`} />
    );
  };

  return (
    <>
      <button
        onClick={handleClick}
        disabled={status.status === 'downloading'}
        className={`
          ${sizeClasses[size]} 
          rounded-full flex items-center justify-center 
          bg-white/90 dark:bg-gray-800/90 
          hover:bg-gray-100 dark:hover:bg-gray-700 
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-all shadow-md group
          ${className}
        `}
        title={
          status.status === 'downloading' 
            ? `Downloading... ${status.progress}%`
            : status.status === 'failed'
            ? 'Download failed - Click to retry'
            : downloaded
            ? 'Downloaded - Click to remove'
            : 'Download for offline playback'
        }
      >
        {renderButton()}
      </button>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showConfirmDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={handleCancelDelete}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                Remove from Downloads?
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                This will delete the offline copy of "{song.name || song.title}". 
                You can download it again later.
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={handleCancelDelete}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 transition-colors"
                >
                  Remove
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
