# 🎵 Advanced Music Player - Usage Guide

## Features

Your new music player includes these advanced features:

### ✨ Core Features
- **Play/Pause/Stop**: Basic playback controls
- **Next/Previous**: Navigate through queue
- **Progress Bar**: Click to seek to any position
- **Volume Control**: Adjust volume with slider (hover over volume icon)
- **Time Display**: Current time / Total duration
- **Shuffle Mode**: Randomize playback order
- **Repeat Modes**: Off / Repeat All / Repeat One
- **Queue Management**: Play songs in sequence
- **Expanded View**: Click album art for fullscreen player
- **Animated Visualizer**: Real-time audio visualization
- **Favorites**: Mark songs as favorites
- **Add to Playlist**: Quick add to playlists

### 🎨 UI Features
- Compact mini player (bottom of screen)
- Fullscreen expanded player (dark mode)
- Smooth animations with Framer Motion
- Responsive design (mobile, tablet, desktop)
- Hover effects and interactions

## How to Use

### Playing a Single Song

```jsx
import { usePlayer } from "@/context/PlayerContext";

function MySongComponent() {
  const { playSong } = usePlayer();

  const handlePlay = () => {
    playSong(song);
  };

  return <button onClick={handlePlay}>Play Song</button>;
}
```

### Playing Songs with Queue

When you want to play a song from a list (playlist, album, search results), pass the entire list as the second parameter:

```jsx
import { usePlayer } from "@/context/PlayerContext";

function MyPlaylistComponent() {
  const { playSong } = usePlayer();
  const [songs, setSongs] = useState([]);

  const handlePlayFromList = (selectedSong) => {
    // This will enable next/previous buttons to work through the entire list
    playSong(selectedSong, songs);
  };

  return (
    <div>
      {songs.map((song) => (
        <button key={song.id} onClick={() => handlePlayFromList(song)}>
          Play {song.name}
        </button>
      ))}
    </div>
  );
}
```

### Example: Update Dashboard Recommended Section

To enable queue functionality in the dashboard, update the play button:

```jsx
// Before:
<button onClick={() => playSong(song)}>🎧 Play</button>

// After (with queue support):
<button onClick={() => playSong(song, recommendedSongs)}>🎧 Play</button>
```

### Accessing Player State

```jsx
import { usePlayer } from "@/context/PlayerContext";

function MyComponent() {
  const {
    currentSong,        // Currently playing song
    isPlaying,          // Boolean: is music playing?
    volume,             // Current volume (0-1)
    currentTime,        // Current playback position (seconds)
    duration,           // Total song duration (seconds)
    queue,              // Array of songs in queue
    currentIndex,       // Index of current song in queue
    repeatMode,         // "off", "all", or "one"
    shuffle,            // Boolean: shuffle enabled?
    
    // Control functions
    togglePlay,         // Play/pause toggle
    stopSong,           // Stop playback
    playNext,           // Skip to next song
    playPrevious,       // Go to previous song
    seekTo,             // Seek to specific time: seekTo(120) for 2:00
    changeVolume,       // Set volume: changeVolume(0.5) for 50%
    toggleMute,         // Mute/unmute
    toggleRepeat,       // Cycle through repeat modes
    toggleShuffle,      // Toggle shuffle on/off
  } = usePlayer();

  return (
    <div>
      <p>Now playing: {currentSong?.name}</p>
      <p>Volume: {Math.round(volume * 100)}%</p>
    </div>
  );
}
```

## Keyboard Shortcuts (Future Enhancement)

You can add these keyboard shortcuts in the PlayerContext:

```jsx
useEffect(() => {
  const handleKeyPress = (e) => {
    if (e.code === "Space" && e.target.tagName !== "INPUT") {
      e.preventDefault();
      togglePlay();
    }
    if (e.code === "ArrowLeft") playPrevious();
    if (e.code === "ArrowRight") playNext();
    if (e.code === "KeyM") toggleMute();
    if (e.code === "KeyR") toggleRepeat();
    if (e.code === "KeyS") toggleShuffle();
  };

  window.addEventListener("keydown", handleKeyPress);
  return () => window.removeEventListener("keydown", handleKeyPress);
}, []);
```

## Customization

### Change Theme Colors

Edit the colors in `MiniPlayer.jsx`:

```jsx
// Change primary color from #0097b2 to your color
className="bg-[#0097b2]"  // Replace with bg-[#YOUR_COLOR]

// Gradient examples:
from-[#0097b2] to-[#00b8d4]  // Current gradient
from-purple-500 to-pink-500   // Purple to pink
from-blue-500 to-cyan-400     // Blue to cyan
```

### Adjust Player Size

In `MiniPlayer.jsx`, find the compact player div:

```jsx
// Current: w-[95%] md:w-[80%] lg:w-[70%] xl:w-[60%]
// Make wider: w-[98%] md:w-[90%] lg:w-[85%] xl:w-[75%]
// Make smaller: w-[90%] md:w-[70%] lg:w-[60%] xl:w-[50%]
```

### Add Lyrics Display

You can add a lyrics section in the expanded view:

```jsx
{isExpanded && currentSong?.lyrics && (
  <div className="mt-6 text-center text-gray-300 max-h-32 overflow-y-auto">
    <p className="whitespace-pre-line">{currentSong.lyrics}</p>
  </div>
)}
```

## Tips

1. **Better Performance**: The player uses `useRef` for audio to avoid re-renders
2. **Responsive**: Works on mobile, tablet, and desktop
3. **Expandable**: Click the album art to open fullscreen view
4. **Volume Hover**: Hover over volume icon to show slider
5. **Queue Support**: Pass song array to enable next/previous navigation
6. **Smooth Transitions**: All animations use Framer Motion

## Troubleshooting

### Songs don't play in sequence
Make sure you're passing the songs array: `playSong(song, songsArray)`

### Volume slider not showing
Hover over the volume icon (speaker) in compact mode

### Expanded view doesn't open
Click directly on the album artwork in compact mode

### Controls disabled
Check that the queue has more than 1 song for next/previous to work

---

Enjoy your new advanced music player! 🎵✨
