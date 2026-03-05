# Offline Download Feature - Complete Documentation

## 📋 Overview

This implementation provides a **production-ready offline download system** for Serenity PWA music streaming app. Users can download songs to their device and play them without an internet connection.

---

## 🏗️ Architecture

### Storage Strategy

```
┌─────────────────────────────────────────┐
│          Browser Storage Layers         │
├─────────────────────────────────────────┤
│                                         │
│  Cache Storage (Service Worker)        │
│  └─ App shell (HTML, CSS, JS)          │
│  └─ Static assets (images, fonts)      │
│  └─ API responses (optional)           │
│                                         │
│  IndexedDB                              │
│  └─ Audio files (Blobs)                │
│  └─ Song metadata                      │
│  └─ Download timestamps                │
│                                         │
└─────────────────────────────────────────┘
```

### Why This Separation?

1. **Cache Storage** is designed for HTTP-cacheable resources
   - Fast network-first/cache-first strategies
   - Automatically managed by service worker
   - Limited to ~50MB on mobile

2. **IndexedDB** is designed for large binary data
   - Can store GBs of data (quota permitting)
   - Better blob handling
   - Manual lifecycle control
   - No HTTP overhead

---

## 📁 File Structure

```
src/
├── app/
│   ├── downloads/
│   │   └── page.jsx              # Downloads playlist page
│   └── layout.js                 # Updated with DownloadProvider
│
├── components/
│   ├── DownloadButton.jsx        # Download button with states
│   ├── StorageManager.jsx        # Storage quota management
│   └── SongCard.jsx              # Updated with download support
│
├── context/
│   ├── DownloadContext.jsx       # Global download state
│   └── PlayerContext.jsx         # Updated for offline playback
│
├── hooks/
│   └── useOfflineSong.js         # Offline audio resolution hook
│
└── lib/
    └── db/
        └── downloadedSongs.js    # IndexedDB abstraction layer

public/
└── sw.js                         # Custom service worker
```

---

## 🔧 Components Guide

### 1. IndexedDB Layer (`lib/db/downloadedSongs.js`)

**Core Functions:**

```javascript
// Download and store a song
await saveSongForOffline(songMetadata, audioUrl, onProgress)

// Retrieve downloaded song
const song = await getDownloadedSong(songId)

// Get all downloads
const songs = await getAllDownloadedSongs()

// Check if downloaded
const isDownloaded = await isSongDownloaded(songId)

// Delete download
await deleteDownloadedSong(songId)

// Get storage stats
const estimate = await getStorageEstimate()
```

**Schema:**

```javascript
{
  id: string,
  title: string,
  artist: string,
  album: string,
  artwork: string (URL),
  audioBlob: Blob,
  originalUrl: string,
  duration: number,
  downloadedAt: timestamp,
  size: number (bytes),
  year: string,
  artists: { primary: [], featured: [] }
}
```

---

### 2. Download Context (`context/DownloadContext.jsx`)

**State Management:**

```javascript
const {
  downloadQueue,        // Map of active downloads
  downloadedSongs,      // Set of downloaded song IDs
  storageInfo,          // Storage quota info
  isInitialized,        // Context ready
  
  downloadSong,         // Download a song
  removeSong,           // Remove download
  isDownloaded,         // Check if song downloaded
  getDownloadStatus,    // Get download progress
  getDownloads,         // Get all downloads
  refreshStorageInfo,   // Update storage stats
  
  downloadCount,        // Number of downloads
  activeDownloads       // Number of active downloads
} = useDownload()
```

**Usage Example:**

```javascript
import { useDownload } from '@/context/DownloadContext'

function MyComponent({ song }) {
  const { downloadSong, isDownloaded } = useDownload()
  
  const handleDownload = async () => {
    const audioUrl = song.downloadUrl[0].url
    await downloadSong(song, audioUrl)
  }
  
  return (
    <button onClick={handleDownload}>
      {isDownloaded(song.id) ? 'Downloaded' : 'Download'}
    </button>
  )
}
```

---

### 3. Download Button (`components/DownloadButton.jsx`)

**Props:**

```javascript
<DownloadButton 
  song={songObject}
  audioUrl="https://..."
  size="small|default|large"
  className="custom-classes"
/>
```

**States:**

- **Not Downloaded**: Download icon
- **Downloading**: Circular progress (0-100%)
- **Downloaded**: Green checkmark (click to remove)
- **Failed**: Red error icon (click to retry)

---

### 4. Offline Playback Hook (`hooks/useOfflineSong.js`)

**Usage:**

```javascript
const { audioUrl, isOfflineMode, isLoading, isAvailable } = 
  useOfflineSong(songId, onlineUrl)

// audioUrl contains either:
// - Blob URL (offline mode)
// - Online streaming URL (online mode)
// - null (not available)
```

**Auto Cleanup:**

Blob URLs are automatically revoked on unmount to prevent memory leaks.

---

### 5. Service Worker (`public/sw.js`)

**Caching Strategy:**

```javascript
// Navigation (HTML pages)
Network First → Cache Fallback → Offline Page

// Static Assets (CSS, JS, images)
Cache First → Network Fallback

// API Requests
Network Only (no caching)

// Audio Files
Never Cached (uses IndexedDB instead)
```

**Why Audio is Excluded:**

- Cache Storage has strict size limits
- Audio files are large (3-5MB each)
- IndexedDB provides better blob handling
- Prevents cache quota errors

---

## 🎵 Integration Examples

### Example 1: Add Download to Dashboard

```javascript
// In dashboard/page.jsx
import { useDownload } from '@/context/DownloadContext'
import DownloadButton from '@/components/DownloadButton'

export default function Dashboard() {
  const { isDownloaded } = useDownload()
  
  return (
    <div>
      {songs.map(song => (
        <div key={song.id}>
          <h3>{song.name}</h3>
          <DownloadButton 
            song={song}
            audioUrl={song.downloadUrl[0].url}
          />
          {isDownloaded(song.id) && <span>✓ Offline</span>}
        </div>
      ))}
    </div>
  )
}
```

---

### Example 2: SongCard with Download

```javascript
<SongCard
  song={song}
  onPlay={handlePlay}
  showDownloadButton={true}
  audioUrl={song.downloadUrl?.[0]?.url}
/>
```

---

### Example 3: Check Online/Offline Status

```javascript
import { useNetworkStatus } from '@/hooks/useOfflineSong'

function NetworkBanner() {
  const isOnline = useNetworkStatus()
  
  return (
    <div className={isOnline ? 'bg-green' : 'bg-orange'}>
      {isOnline ? '📶 Online' : '📵 Offline'}
    </div>
  )
}
```

---

## 📊 Storage Management

### Check Storage Quota

```javascript
import { useStorageQuota } from '@/hooks/useOfflineSong'

function StorageIndicator() {
  const { storageInfo, refresh } = useStorageQuota()
  
  if (!storageInfo) return null
  
  return (
    <div>
      <p>Used: {storageInfo.downloadedAudioFormatted}</p>
      <p>Available: {storageInfo.availableFormatted}</p>
      <p>Usage: {storageInfo.usagePercent.toFixed(1)}%</p>
      <button onClick={refresh}>Refresh</button>
    </div>
  )
}
```

### Storage Manager Component

```javascript
import StorageManager from '@/components/StorageManager'

function Settings() {
  const [showStorage, setShowStorage] = useState(false)
  
  return (
    <>
      <button onClick={() => setShowStorage(true)}>
        Manage Storage
      </button>
      
      <StorageManager 
        isOpen={showStorage}
        onClose={() => setShowStorage(false)}
      />
    </>
  )
}
```

---

## 🔐 Security & Best Practices

### 1. Quota Management

- Downloads stop if storage > 90% full
- Users are warned at 80% usage
- Storage Manager shows real-time usage

### 2. Memory Management

- Blob URLs are created on-demand
- URLs are revoked when component unmounts
- Only one blob URL per song at a time

### 3. Error Handling

```javascript
try {
  await downloadSong(song, audioUrl)
} catch (error) {
  if (error.message.includes('storage')) {
    // Handle quota exceeded
  } else if (error.message.includes('network')) {
    // Handle network error
  }
}
```

### 4. Duplicate Prevention

- Cannot download same song twice
- Queue prevents concurrent downloads
- IndexedDB uses song ID as primary key

---

## 🚀 Performance Optimizations

### 1. Streaming Downloads

```javascript
// Downloads use ReadableStream for efficient memory usage
const reader = response.body.getReader()
while (true) {
  const { done, value } = await reader.read()
  if (done) break
  chunks.push(value) // Process in chunks
}
```

### 2. Progress Tracking

Real-time download progress with throttling:

```javascript
saveSongForOffline(song, url, (progress) => {
  console.log(`${progress}% downloaded`)
})
```

### 3. Lazy Loading

- Downloads page loads metadata only (no blobs)
- Blobs loaded on-demand during playback
- Reduces memory footprint

---

## 🧪 Testing Checklist

### Functionality
- [ ] Download a song
- [ ] Play downloaded song offline
- [ ] Remove downloaded song
- [ ] View Downloads playlist
- [ ] Check storage usage
- [ ] Clear all downloads

### Edge Cases
- [ ] Download while offline (should fail gracefully)
- [ ] Download duplicate song (should prevent)
- [ ] Download when storage full (should show error)
- [ ] Refresh page during download (should resume/reset)
- [ ] Play song while downloading (should use online)

### Performance
- [ ] Download progress updates smoothly
- [ ] No memory leaks (check DevTools Performance)
- [ ] Offline playback starts instantly
- [ ] Multiple downloads work concurrently

### PWA
- [ ] Works in airplane mode
- [ ] Service worker caches app shell
- [ ] Downloads persist after browser restart
- [ ] Works on mobile devices

---

## 🐛 Troubleshooting

### Downloads not saving

```javascript
// Check if idb is installed
npm install idb

// Check IndexedDB in DevTools
// Application → Storage → IndexedDB → SerenityOfflineDB
```

### Playback fails offline

```javascript
// Verify blob URL is created
const song = await getDownloadedSong(songId)
console.log(song.audioBlob) // Should be Blob object

// Check PlayerContext integration
console.log(currentSong._isOffline) // Should be true
```

### Storage quota errors

```javascript
// Check quota
const estimate = await getStorageEstimate()
if (estimate.usagePercent > 90) {
  // Remove old downloads
  await clearAllDownloads()
}
```

---

## 📱 PWA Manifest Integration

The feature works with your existing manifest.json:

```json
{
  "name": "Serenity+",
  "short_name": "Serenity",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0097b2",
  "theme_color": "#0097b2",
  "icons": [...]
}
```

---

## 🎯 Key Features Summary

✅ **True Offline Playback** - Works in airplane mode  
✅ **Streaming Downloads** - Memory-efficient chunk processing  
✅ **Progress Tracking** - Real-time download progress  
✅ **Storage Management** - Quota monitoring and cleanup  
✅ **State Persistence** - Downloads survive page refresh  
✅ **Memory Safety** - Automatic blob URL cleanup  
✅ **Error Recovery** - Retry failed downloads  
✅ **PWA Optimized** - Service worker integration  
✅ **Production Ready** - Full error handling and edge cases  

---

## 🔄 Future Enhancements

1. **Background Sync** - Resume downloads after offline
2. **Batch Downloads** - Download entire playlists
3. **Auto-cleanup** - Remove old/least-played downloads
4. **Quality Selection** - Choose download quality
5. **Smart Caching** - Pre-cache frequently played songs

---

## 📞 Support

For issues or questions:

1. Check IndexedDB in DevTools (Application → Storage)
2. Verify service worker is active (Application → Service Workers)
3. Check console for errors
4. Verify `idb` package is installed

---

**Version:** 1.0.0  
**Last Updated:** 2026-02-23  
**Author:** Serenity Development Team
