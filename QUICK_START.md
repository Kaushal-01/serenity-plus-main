// Quick Start Guide for Offline Downloads

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install idb
```

### 2. Wrap your app with DownloadProvider

The providers are already set up in `src/app/layout.js`:

```javascript
<ThemeProvider>
  <DownloadProvider>
    <PlayerProvider>
      {children}
    </PlayerProvider>
  </DownloadProvider>
</ThemeProvider>
```

### 3. Add Download Button to Any Page

```javascript
import { useDownload } from '@/context/DownloadContext'
import DownloadButton from '@/components/DownloadButton'

export default function MyPage() {
  const { isDownloaded } = useDownload()
  
  return (
    <div>
      {songs.map(song => (
        <div key={song.id}>
          <h3>{song.name}</h3>
          
          {/* Add download button */}
          <DownloadButton 
            song={song}
            audioUrl={song.downloadUrl[0].url}
          />
          
          {/* Show indicator */}
          {isDownloaded(song.id) && (
            <span>✓ Available Offline</span>
          )}
        </div>
      ))}
    </div>
  )
}
```

### 4. Enable Download in SongCard

```javascript
<SongCard
  song={song}
  onPlay={handlePlay}
  showDownloadButton={true}  // ← Add this
  audioUrl={song.downloadUrl?.[0]?.url}  // ← And this
/>
```

### 5. Access Downloads Playlist

Users can access downloaded songs at `/downloads`

Add a navigation link:

```javascript
<Link href="/downloads">
  My Downloads ({downloadCount})
</Link>
```

---

## 📱 Testing Offline Mode

### Method 1: Chrome DevTools

1. Open DevTools (F12)
2. Go to Network tab
3. Select "Offline" from throttling dropdown
4. Try playing a downloaded song

### Method 2: Airplane Mode

1. Download a few songs
2. Enable airplane mode
3. Navigate to `/downloads`
4. Play songs - they should work!

---

## 🎯 Common Use Cases

### Show Download Status Badge

```javascript
const { isDownloaded, getDownloadStatus } = useDownload()

const status = getDownloadStatus(song.id)

{status.status === 'downloading' && (
  <div>Downloading... {status.progress}%</div>
)}

{isDownloaded(song.id) && (
  <div>✓ Downloaded</div>
)}
```

### Download Progress Indicator

```javascript
const { getDownloadStatus } = useDownload()
const status = getDownloadStatus(song.id)

{status.status === 'downloading' && (
  <div className="progress-bar">
    <div 
      className="progress-fill"
      style={{ width: `${status.progress}%` }}
    />
  </div>
)}
```

### Check Storage Before Download

```javascript
import { useStorageQuota } from '@/hooks/useOfflineSong'

const { storageInfo } = useStorageQuota()

{storageInfo && storageInfo.usagePercent > 80 && (
  <div className="warning">
    ⚠️ Storage is {storageInfo.usagePercent.toFixed(0)}% full
  </div>
)}
```

### Show Network Status

```javascript
import { useNetworkStatus } from '@/hooks/useOfflineSong'

const isOnline = useNetworkStatus()

<div className={isOnline ? 'online' : 'offline'}>
  {isOnline ? '📶 Online' : '📵 Offline Mode'}
</div>
```

---

## 🎨 Styling Examples

### Download Button Variants

```javascript
// Small button (in cards)
<DownloadButton song={song} audioUrl={url} size="small" />

// Default button
<DownloadButton song={song} audioUrl={url} size="default" />

// Large button
<DownloadButton song={song} audioUrl={url} size="large" />

// Custom styling
<DownloadButton 
  song={song} 
  audioUrl={url} 
  className="my-custom-class"
/>
```

---

## 🔧 Advanced Usage

### Manually Download

```javascript
import { useDownload } from '@/context/DownloadContext'

const { downloadSong } = useDownload()

const handleDownload = async () => {
  const result = await downloadSong(song, audioUrl)
  
  if (result.success) {
    console.log('Download complete!')
  } else {
    console.error('Download failed:', result.error)
  }
}
```

### Get All Downloads

```javascript
const { getDownloads } = useDownload()

const allDownloads = await getDownloads()
console.log(`Total: ${allDownloads.length} songs`)
```

### Remove Download

```javascript
const { removeSong } = useDownload()

await removeSong(songId)
```

---

## 📊 Monitor Downloads

### Show Download Count

```javascript
const { downloadCount, activeDownloads } = useDownload()

<div>
  <p>Downloaded: {downloadCount} songs</p>
  <p>Currently downloading: {activeDownloads}</p>
</div>
```

### Show Storage Manager

```javascript
import StorageManager from '@/components/StorageManager'
import { HardDrive } from 'lucide-react'

const [showStorage, setShowStorage] = useState(false)

<>
  <button onClick={() => setShowStorage(true)}>
    <HardDrive /> Manage Storage
  </button>
  
  <StorageManager 
    isOpen={showStorage}
    onClose={() => setShowStorage(false)}
  />
</>
```

---

## ✅ Verification

After implementation, verify:

1. ✓ Can download songs
2. ✓ Download progress shows
3. ✓ Songs play offline
4. ✓ Can view Downloads page
5. ✓ Can delete downloads
6. ✓ Storage quota shown
7. ✓ Works in offline mode
8. ✓ Service worker active

---

For complete documentation, see `OFFLINE_DOWNLOADS_GUIDE.md`
