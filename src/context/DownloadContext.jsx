/**
 * Download Context
 * 
 * Global state management for offline downloads
 * Tracks download progress, status, and provides actions
 */

"use client";
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  saveSongForOffline,
  getDownloadedSong,
  getAllDownloadedSongs,
  deleteDownloadedSong,
  isSongDownloaded,
  getTotalDownloadedSize,
  getStorageEstimate
} from '@/lib/db/downloadedSongs';

const DownloadContext = createContext();

export function DownloadProvider({ children }) {
  // Download state tracking
  const [downloadQueue, setDownloadQueue] = useState(new Map());
  const [downloadedSongs, setDownloadedSongs] = useState(new Set());
  const [storageInfo, setStorageInfo] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize - load existing downloads
  useEffect(() => {
    initializeDownloads();
  }, []);

  const initializeDownloads = async () => {
    try {
      // Load all downloaded song IDs
      const songs = await getAllDownloadedSongs();
      const songIds = new Set(songs.map(s => s.id));
      setDownloadedSongs(songIds);

      // Get storage info
      await updateStorageInfo();
      
      setIsInitialized(true);
      console.log(`✓ Downloads initialized: ${songIds.size} songs available offline`);
    } catch (error) {
      console.error('Failed to initialize downloads:', error);
      setIsInitialized(true);
    }
  };

  const updateStorageInfo = async () => {
    try {
      const info = await getStorageEstimate();
      setStorageInfo(info);
    } catch (error) {
      console.error('Failed to get storage info:', error);
    }
  };

  /**
   * Download a song for offline playback
   */
  const downloadSong = useCallback(async (song, audioUrl) => {
    const songId = song.id;

    // Prevent duplicate downloads
    if (downloadQueue.has(songId)) {
      console.log('Song is already downloading');
      return { success: false, error: 'Already downloading' };
    }

    if (downloadedSongs.has(songId)) {
      console.log('Song is already downloaded');
      return { success: false, error: 'Already downloaded' };
    }

    // Add to download queue with initial progress
    setDownloadQueue(prev => {
      const newQueue = new Map(prev);
      newQueue.set(songId, {
        songId,
        title: song.name || song.title,
        progress: 0,
        status: 'downloading',
        error: null
      });
      return newQueue;
    });

    try {
      // Download with progress tracking
      await saveSongForOffline(song, audioUrl, (progress) => {
        setDownloadQueue(prev => {
          const newQueue = new Map(prev);
          const item = newQueue.get(songId);
          if (item) {
            item.progress = progress;
          }
          return newQueue;
        });
      });

      // Mark as complete
      setDownloadQueue(prev => {
        const newQueue = new Map(prev);
        newQueue.set(songId, {
          songId,
          title: song.name || song.title,
          progress: 100,
          status: 'completed',
          error: null
        });
        return newQueue;
      });

      // Add to downloaded set
      setDownloadedSongs(prev => new Set([...prev, songId]));

      // Update storage info
      await updateStorageInfo();

      // Remove from queue after 2 seconds
      setTimeout(() => {
        setDownloadQueue(prev => {
          const newQueue = new Map(prev);
          newQueue.delete(songId);
          return newQueue;
        });
      }, 2000);

      console.log(`✓ Download complete: ${song.name || song.title}`);
      return { success: true };
    } catch (error) {
      console.error('Download failed:', error);
      
      // Mark as failed
      setDownloadQueue(prev => {
        const newQueue = new Map(prev);
        newQueue.set(songId, {
          songId,
          title: song.name || song.title,
          progress: 0,
          status: 'failed',
          error: error.message
        });
        return newQueue;
      });

      // Remove from queue after 5 seconds
      setTimeout(() => {
        setDownloadQueue(prev => {
          const newQueue = new Map(prev);
          newQueue.delete(songId);
          return newQueue;
        });
      }, 5000);

      return { success: false, error: error.message };
    }
  }, [downloadQueue, downloadedSongs]);

  /**
   * Delete a downloaded song
   */
  const removeSong = useCallback(async (songId) => {
    try {
      const success = await deleteDownloadedSong(songId);
      
      if (success) {
        setDownloadedSongs(prev => {
          const newSet = new Set(prev);
          newSet.delete(songId);
          return newSet;
        });
        
        await updateStorageInfo();
        console.log(`✓ Song removed from offline storage`);
      }
      
      return success;
    } catch (error) {
      console.error('Failed to remove song:', error);
      return false;
    }
  }, []);

  /**
   * Check if song is downloaded
   */
  const isDownloaded = useCallback((songId) => {
    return downloadedSongs.has(songId);
  }, [downloadedSongs]);

  /**
   * Get download status for a song
   */
  const getDownloadStatus = useCallback((songId) => {
    if (downloadQueue.has(songId)) {
      return downloadQueue.get(songId);
    }
    
    if (downloadedSongs.has(songId)) {
      return { status: 'downloaded' };
    }
    
    return { status: 'not-downloaded' };
  }, [downloadQueue, downloadedSongs]);

  /**
   * Get all downloaded songs (for Downloads playlist)
   */
  const getDownloads = useCallback(async () => {
    try {
      return await getAllDownloadedSongs();
    } catch (error) {
      console.error('Failed to get downloads:', error);
      return [];
    }
  }, []);

  /**
   * Refresh storage info
   */
  const refreshStorageInfo = useCallback(async () => {
    await updateStorageInfo();
  }, []);

  const value = {
    // State
    downloadQueue,
    downloadedSongs,
    storageInfo,
    isInitialized,
    
    // Actions
    downloadSong,
    removeSong,
    isDownloaded,
    getDownloadStatus,
    getDownloads,
    refreshStorageInfo,
    
    // Computed
    downloadCount: downloadedSongs.size,
    activeDownloads: Array.from(downloadQueue.values()).filter(d => d.status === 'downloading').length
  };

  return (
    <DownloadContext.Provider value={value}>
      {children}
    </DownloadContext.Provider>
  );
}

export function useDownload() {
  const context = useContext(DownloadContext);
  if (!context) {
    throw new Error('useDownload must be used within DownloadProvider');
  }
  return context;
}
