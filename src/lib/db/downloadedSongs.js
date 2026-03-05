/**
 * IndexedDB Layer for Offline Downloaded Songs
 * 
 * Provides a robust abstraction for storing and retrieving
 * audio files and metadata for offline playback.
 * 
 * Uses idb wrapper for better TypeScript support and Promise-based API
 */

import { openDB } from 'idb';

const DB_NAME = 'SerenityOfflineDB';
const DB_VERSION = 1;
const STORE_NAME = 'downloadedSongs';

/**
 * Initialize IndexedDB
 * Creates the object store with appropriate indexes
 */
async function initDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        
        // Create indexes for efficient querying
        store.createIndex('downloadedAt', 'downloadedAt');
        store.createIndex('artist', 'artist');
      }
    },
  });
}

/**
 * Download and save a song for offline playback
 * 
 * @param {Object} songMetadata - Song information
 * @param {string} audioUrl - URL to fetch audio from
 * @param {Function} onProgress - Progress callback (0-100)
 * @returns {Promise<Object>} Saved song data
 */
export async function saveSongForOffline(songMetadata, audioUrl, onProgress) {
  try {
    // Check storage quota before downloading
    const hasSpace = await checkStorageQuota();
    if (!hasSpace) {
      throw new Error('Insufficient storage space. Please free up space and try again.');
    }

    // Fetch audio with progress tracking
    const response = await fetch(audioUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch audio: ${response.statusText}`);
    }

    const contentLength = response.headers.get('content-length');
    const total = parseInt(contentLength, 10);
    
    let loaded = 0;
    const reader = response.body.getReader();
    const chunks = [];

    // Stream download with progress
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) break;
      
      chunks.push(value);
      loaded += value.length;
      
      if (onProgress && total) {
        const progress = Math.round((loaded / total) * 100);
        onProgress(progress);
      }
    }

    // Create blob from chunks
    const audioBlob = new Blob(chunks, { type: 'audio/mpeg' });

    // Prepare song data for storage
    const songData = {
      id: songMetadata.id,
      title: songMetadata.name || songMetadata.title,
      artist: songMetadata.artists?.primary?.[0]?.name || 
              songMetadata.artistName || 
              'Unknown Artist',
      album: songMetadata.album?.name || null,
      artwork: songMetadata.image?.[2]?.url || 
               songMetadata.image?.[1]?.url || 
               songMetadata.coverPhoto || 
               null,
      audioBlob,
      originalUrl: audioUrl,
      duration: songMetadata.duration,
      downloadedAt: Date.now(),
      size: audioBlob.size,
      // Additional metadata
      year: songMetadata.year,
      artists: {
        primary: songMetadata.artists?.primary?.map(a => ({ id: a.id, name: a.name })) || [],
        featured: songMetadata.artists?.featured?.map(a => ({ id: a.id, name: a.name })) || []
      }
    };

    // Save to IndexedDB
    const db = await initDB();
    await db.put(STORE_NAME, songData);
    
    console.log(`✓ Song "${songData.title}" saved for offline playback (${formatBytes(audioBlob.size)})`);
    
    return songData;
  } catch (error) {
    console.error('Failed to save song for offline:', error);
    throw error;
  }
}

/**
 * Retrieve a downloaded song by ID
 * 
 * @param {string} id - Song ID
 * @returns {Promise<Object|null>} Song data with blob or null
 */
export async function getDownloadedSong(id) {
  try {
    const db = await initDB();
    const song = await db.get(STORE_NAME, id);
    return song || null;
  } catch (error) {
    console.error('Failed to get downloaded song:', error);
    return null;
  }
}

/**
 * Get all downloaded songs (sorted by download date, newest first)
 * 
 * @returns {Promise<Array>} Array of downloaded songs
 */
export async function getAllDownloadedSongs() {
  try {
    const db = await initDB();
    const songs = await db.getAllFromIndex(STORE_NAME, 'downloadedAt');
    
    // Return sorted by newest first (without the blob to save memory)
    return songs
      .reverse()
      .map(song => ({
        ...song,
        // Don't include the blob in the list (memory optimization)
        audioBlob: undefined,
        size: song.size
      }));
  } catch (error) {
    console.error('Failed to get all downloaded songs:', error);
    return [];
  }
}

/**
 * Delete a downloaded song
 * 
 * @param {string} id - Song ID
 * @returns {Promise<boolean>} Success status
 */
export async function deleteDownloadedSong(id) {
  try {
    const db = await initDB();
    await db.delete(STORE_NAME, id);
    console.log(`✓ Song deleted from offline storage`);
    return true;
  } catch (error) {
    console.error('Failed to delete downloaded song:', error);
    return false;
  }
}

/**
 * Check if a song is downloaded
 * 
 * @param {string} id - Song ID
 * @returns {Promise<boolean>} True if downloaded
 */
export async function isSongDownloaded(id) {
  try {
    const db = await initDB();
    const song = await db.get(STORE_NAME, id);
    return !!song;
  } catch (error) {
    console.error('Failed to check if song is downloaded:', error);
    return false;
  }
}

/**
 * Get total size of all downloaded songs
 * 
 * @returns {Promise<number>} Total bytes used
 */
export async function getTotalDownloadedSize() {
  try {
    const db = await initDB();
    const songs = await db.getAll(STORE_NAME);
    
    const totalSize = songs.reduce((sum, song) => sum + (song.size || 0), 0);
    return totalSize;
  } catch (error) {
    console.error('Failed to calculate total size:', error);
    return 0;
  }
}

/**
 * Clear all downloaded songs (useful for storage management)
 * 
 * @returns {Promise<boolean>} Success status
 */
export async function clearAllDownloads() {
  try {
    const db = await initDB();
    await db.clear(STORE_NAME);
    console.log('✓ All offline downloads cleared');
    return true;
  } catch (error) {
    console.error('Failed to clear downloads:', error);
    return false;
  }
}

/**
 * Check storage quota and availability
 * 
 * @returns {Promise<boolean>} True if enough storage available
 */
async function checkStorageQuota() {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    const usagePercent = (estimate.usage / estimate.quota) * 100;
    
    console.log(`Storage: ${formatBytes(estimate.usage)} / ${formatBytes(estimate.quota)} (${usagePercent.toFixed(1)}%)`);
    
    // Reserve 10% buffer - don't download if we're above 90% usage
    return usagePercent < 90;
  }
  
  // If API not available, assume we have space
  return true;
}

/**
 * Get storage estimate details
 * 
 * @returns {Promise<Object>} Storage usage information
 */
export async function getStorageEstimate() {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    const totalDownloaded = await getTotalDownloadedSize();
    
    return {
      quota: estimate.quota,
      usage: estimate.usage,
      usagePercent: (estimate.usage / estimate.quota) * 100,
      available: estimate.quota - estimate.usage,
      downloadedAudioSize: totalDownloaded,
      quotaFormatted: formatBytes(estimate.quota),
      usageFormatted: formatBytes(estimate.usage),
      availableFormatted: formatBytes(estimate.quota - estimate.usage),
      downloadedAudioFormatted: formatBytes(totalDownloaded)
    };
  }
  
  return null;
}

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Cleanup orphaned blob URLs (call this on app unmount/cleanup)
 */
export function revokeAllBlobURLs() {
  // Blob URLs are tracked by the browser and auto-cleaned on navigation
  // This is a placeholder for any custom URL tracking if needed
  console.log('Blob URL cleanup triggered');
}

// Export formatBytes for use in components
export { formatBytes };
