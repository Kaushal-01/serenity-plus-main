/**
 * useOfflineSong Hook
 * 
 * Provides offline-aware audio URL management
 * Automatically switches between online streaming and offline blob URLs
 */

"use client";
import { useState, useEffect, useRef } from 'react';
import { getDownloadedSong } from '@/lib/db/downloadedSongs';
import { useDownload } from '@/context/DownloadContext';

export function useOfflineSong(songId, onlineUrl) {
  const [audioUrl, setAudioUrl] = useState(onlineUrl);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const blobUrlRef = useRef(null);
  const { isDownloaded } = useDownload();

  useEffect(() => {
    let isMounted = true;
    
    async function loadAudio() {
      if (!songId) {
        setAudioUrl(onlineUrl);
        setIsOfflineMode(false);
        return;
      }

      setIsLoading(true);

      try {
        // Check if we're offline
        const isOffline = !navigator.onLine;
        
        // Check if song is downloaded
        const downloaded = isDownloaded(songId);

        if (downloaded) {
          // Load from IndexedDB
          const songData = await getDownloadedSong(songId);
          
          if (songData && songData.audioBlob && isMounted) {
            // Revoke previous blob URL to prevent memory leaks
            if (blobUrlRef.current) {
              URL.revokeObjectURL(blobUrlRef.current);
            }

            // Create new blob URL
            const blobUrl = URL.createObjectURL(songData.audioBlob);
            blobUrlRef.current = blobUrl;
            
            setAudioUrl(blobUrl);
            setIsOfflineMode(true);
            console.log(`🎵 Playing from offline storage: ${songData.title}`);
          }
        } else if (isOffline) {
          // Offline but not downloaded - can't play
          console.warn('Song not available offline');
          setAudioUrl(null);
          setIsOfflineMode(true);
        } else {
          // Online and not downloaded - stream normally
          setAudioUrl(onlineUrl);
          setIsOfflineMode(false);
        }
      } catch (error) {
        console.error('Failed to load offline audio:', error);
        // Fallback to online URL
        if (isMounted) {
          setAudioUrl(onlineUrl);
          setIsOfflineMode(false);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadAudio();

    // Cleanup blob URL on unmount or song change
    return () => {
      isMounted = false;
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, [songId, onlineUrl, isDownloaded]);

  // Listen for online/offline events
  useEffect(() => {
    function handleOnline() {
      console.log('📶 Back online');
      // Could trigger re-evaluation if needed
    }

    function handleOffline() {
      console.log('📵 Gone offline');
      // Could trigger re-evaluation if needed
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    audioUrl,
    isOfflineMode,
    isLoading,
    isAvailable: !!audioUrl
  };
}

/**
 * useNetworkStatus Hook
 * 
 * Provides real-time network status
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    function handleOnline() {
      setIsOnline(true);
    }

    function handleOffline() {
      setIsOnline(false);
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

/**
 * useStorageQuota Hook
 * 
 * Provides storage quota information with real-time updates
 */
export function useStorageQuota() {
  const { storageInfo, refreshStorageInfo } = useDownload();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refresh = async () => {
    setIsRefreshing(true);
    await refreshStorageInfo();
    setIsRefreshing(false);
  };

  return {
    storageInfo,
    isRefreshing,
    refresh
  };
}
