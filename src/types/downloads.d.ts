/**
 * TypeScript Type Definitions for Offline Download System
 * 
 * Use these types in your TypeScript components for better type safety
 * If using JavaScript, these serve as documentation for expected shapes
 */

/**
 * Downloaded Song Data
 * Stored in IndexedDB
 */
export interface DownloadedSong {
  id: string;
  title: string;
  artist: string;
  album: string | null;
  artwork: string;
  audioBlob: Blob;
  originalUrl: string;
  duration: number;
  downloadedAt: number;
  size: number;
  year?: string;
  artists?: {
    primary: Artist[];
    featured: Artist[];
  };
}

/**
 * Artist Information
 */
export interface Artist {
  id: string;
  name: string;
}

/**
 * Download Status
 */
export type DownloadStatus = 
  | 'not-downloaded'
  | 'downloading'
  | 'completed'
  | 'failed'
  | 'downloaded';

/**
 * Download Queue Item
 */
export interface DownloadQueueItem {
  songId: string;
  title: string;
  progress: number; // 0-100
  status: 'downloading' | 'completed' | 'failed';
  error: string | null;
}

/**
 * Storage Estimate Information
 */
export interface StorageEstimate {
  quota: number;
  usage: number;
  usagePercent: number;
  available: number;
  downloadedAudioSize: number;
  quotaFormatted: string;
  usageFormatted: string;
  availableFormatted: string;
  downloadedAudioFormatted: string;
}

/**
 * Download Context State
 */
export interface DownloadContextState {
  downloadQueue: Map<string, DownloadQueueItem>;
  downloadedSongs: Set<string>;
  storageInfo: StorageEstimate | null;
  isInitialized: boolean;
  downloadCount: number;
  activeDownloads: number;
}

/**
 * Download Context Actions
 */
export interface DownloadContextActions {
  downloadSong: (song: SongMetadata, audioUrl: string) => Promise<{ success: boolean; error?: string }>;
  removeSong: (songId: string) => Promise<boolean>;
  isDownloaded: (songId: string) => boolean;
  getDownloadStatus: (songId: string) => { status: DownloadStatus; progress?: number; error?: string };
  getDownloads: () => Promise<DownloadedSong[]>;
  refreshStorageInfo: () => Promise<void>;
}

/**
 * Complete Download Context
 */
export interface DownloadContext extends DownloadContextState, DownloadContextActions {}

/**
 * Song Metadata (input to download)
 */
export interface SongMetadata {
  id: string;
  name?: string;
  title?: string;
  artists?: {
    primary?: Artist[];
    featured?: Artist[];
  };
  artistName?: string;
  album?: {
    id: string;
    name: string;
  };
  image?: ImageQuality[] | string;
  coverPhoto?: string;
  duration: number;
  year?: string;
  downloadUrl?: DownloadUrl[];
}

/**
 * Image Quality Variant
 */
export interface ImageQuality {
  quality: string;
  url: string;
}

/**
 * Audio Download URL
 */
export interface DownloadUrl {
  quality: string;
  url: string;
}

/**
 * Offline Song Hook Return
 */
export interface UseOfflineSongReturn {
  audioUrl: string | null;
  isOfflineMode: boolean;
  isLoading: boolean;
  isAvailable: boolean;
}

/**
 * Storage Quota Hook Return
 */
export interface UseStorageQuotaReturn {
  storageInfo: StorageEstimate | null;
  isRefreshing: boolean;
  refresh: () => Promise<void>;
}

/**
 * Download Button Props
 */
export interface DownloadButtonProps {
  song: SongMetadata;
  audioUrl: string;
  className?: string;
  size?: 'small' | 'default' | 'large';
}

/**
 * Storage Manager Props
 */
export interface StorageManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Progress Callback
 */
export type ProgressCallback = (progress: number) => void;

// JSDoc Examples for JavaScript users

/**
 * @typedef {Object} DownloadedSong
 * @property {string} id
 * @property {string} title
 * @property {string} artist
 * @property {string|null} album
 * @property {string} artwork
 * @property {Blob} audioBlob
 * @property {string} originalUrl
 * @property {number} duration
 * @property {number} downloadedAt
 * @property {number} size
 */

/**
 * @typedef {'not-downloaded'|'downloading'|'completed'|'failed'|'downloaded'} DownloadStatus
 */

/**
 * Download a song for offline playback
 * @param {SongMetadata} songMetadata - Song information
 * @param {string} audioUrl - URL to download from
 * @param {ProgressCallback} onProgress - Progress callback (0-100)
 * @returns {Promise<DownloadedSong>}
 */

/**
 * Check if a song is downloaded
 * @param {string} songId - Song ID
 * @returns {Promise<boolean>}
 */
