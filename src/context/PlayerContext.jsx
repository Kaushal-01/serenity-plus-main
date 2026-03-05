"use client";
import { createContext, useContext, useState, useRef, useEffect } from "react";
import axios from "axios";
import MiniPlayer from "./MiniPlayer";
import { getDownloadedSong } from "@/lib/db/downloadedSongs";
const PlayerContext = createContext();

export function PlayerProvider({ children }) {
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [repeatMode, setRepeatMode] = useState("off"); // off, one, all
  const [shuffle, setShuffle] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isRoomListeningMode, setIsRoomListeningMode] = useState(false);
  const audioRef = useRef(null);
  const previousVolumeRef = useRef(0.7);
  const hasTrackedPlayRef = useRef(false);
  const isRestoringRef = useRef(false);
  const hasMountedRef = useRef(false);
  const lastSaveTimeRef = useRef(0);
  const currentBlobUrlRef = useRef(null); // Track blob URLs for cleanup

  // Sanitize song data to reduce localStorage size
  const sanitizeSongForStorage = (song) => {
    if (!song) return null;
    
    // Check if selectedAudioUrl is base64 (don't store large base64 strings)
    const isBase64Audio = song.selectedAudioUrl?.startsWith('data:audio/');
    
    return {
      id: song.id,
      name: song.name,
      album: song.album ? { id: song.album.id, name: song.album.name } : null,
      year: song.year,
      duration: song.duration,
      image: Array.isArray(song.image) 
        ? [song.image[song.image.length - 1]] // Keep only highest quality image
        : song.image,
      artists: song.artists ? {
        primary: song.artists.primary?.map(a => ({ id: a.id, name: a.name })),
        featured: song.artists.featured?.map(a => ({ id: a.id, name: a.name }))
      } : null,
      selectedAudioUrl: isBase64Audio ? null : song.selectedAudioUrl, // Don't store base64 audio
      // For artist songs, keep essential fields only (no audioFile base64)
      songName: song.songName,
      artistName: song.artistName,
      coverPhoto: song.coverPhoto,
      _id: song._id,
      // Artist songs need to be re-fetched if restored
      isArtistSong: !!song.audioFile || !!song._id
    };
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Restore player state from localStorage on mount
  useEffect(() => {
    if (hasMountedRef.current) return;
    hasMountedRef.current = true;

    try {
      const savedState = localStorage.getItem("serenity-player-state");
      if (savedState) {
        // Check if saved state is too large (> 500KB indicates issue)
        if (savedState.length > 500000) {
          console.warn("Player state too large, clearing...");
          localStorage.removeItem("serenity-player-state");
          return;
        }

        const { 
          song, 
          queueData, 
          index, 
          time, 
          volumeData, 
          repeat, 
          shuffleMode 
        } = JSON.parse(savedState);
        
        if (song) {
          isRestoringRef.current = true;
          setCurrentSong(song);
          setQueue(queueData || [song]);
          setCurrentIndex(index || 0);
          setVolume(volumeData || 0.7);
          setRepeatMode(repeat || "off");
          setShuffle(shuffleMode || false);
          
          // Restore playback position after audio loads
          setTimeout(() => {
            if (audioRef.current && time) {
              audioRef.current.currentTime = time;
              setCurrentTime(time);
            }
            isRestoringRef.current = false;
          }, 500);
        }
      }
    } catch (err) {
      console.error("Error restoring player state:", err);
      // Clear corrupted state
      localStorage.removeItem("serenity-player-state");
    }
  }, []);

  // Save player state to localStorage whenever it changes
  useEffect(() => {
    if (!hasMountedRef.current || isRestoringRef.current || !currentSong) return;

    try {
      const playerState = {
        song: sanitizeSongForStorage(currentSong),
        queueData: queue.map(s => sanitizeSongForStorage(s)),
        index: currentIndex,
        time: currentTime,
        volumeData: volume,
        repeat: repeatMode,
        shuffleMode: shuffle
      };
      localStorage.setItem("serenity-player-state", JSON.stringify(playerState));
    } catch (err) {
      console.error("Error saving player state:", err);
      // If still exceeds quota, clear old state and try with minimal data
      if (err.name === 'QuotaExceededError') {
        try {
          localStorage.removeItem("serenity-player-state");
          const minimalState = {
            song: sanitizeSongForStorage(currentSong),
            queueData: [sanitizeSongForStorage(currentSong)], // Only save current song
            index: 0,
            time: currentTime,
            volumeData: volume,
            repeat: repeatMode,
            shuffleMode: shuffle
          };
          localStorage.setItem("serenity-player-state", JSON.stringify(minimalState));
        } catch (e) {
          console.error("Failed to save even minimal state:", e);
        }
      }
    }
  }, [currentSong, queue, currentIndex, volume, repeatMode, shuffle]);

  // Save currentTime separately with throttling (every 2 seconds)
  useEffect(() => {
    if (!hasMountedRef.current || isRestoringRef.current || !currentSong) return;

    const now = Date.now();
    if (now - lastSaveTimeRef.current < 2000) return;
    
    lastSaveTimeRef.current = now;

    try {
      const savedState = localStorage.getItem("serenity-player-state");
      if (savedState) {
        const playerState = JSON.parse(savedState);
        playerState.time = currentTime;
        localStorage.setItem("serenity-player-state", JSON.stringify(playerState));
      }
    } catch (err) {
      if (err.name === 'QuotaExceededError') {
        console.warn("Storage quota exceeded when saving time, clearing old state");
        localStorage.removeItem("serenity-player-state");
      } else {
        console.error("Error saving playback time:", err);
      }
    }
  }, [currentTime]);

  // Save state before page unload to capture exact playback position
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (currentSong && audioRef.current) {
        try {
          const savedState = localStorage.getItem("serenity-player-state");
          if (savedState) {
            const playerState = JSON.parse(savedState);
            playerState.time = audioRef.current.currentTime;
            localStorage.setItem("serenity-player-state", JSON.stringify(playerState));
          }
        } catch (err) {
          if (err.name === 'QuotaExceededError') {
            localStorage.removeItem("serenity-player-state");
          }
          console.error("Error saving state on unload:", err);
        }
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [currentSong]);

  // Track song play after user listens for 5 seconds
  useEffect(() => {
    if (currentSong && currentTime >= 5 && !hasTrackedPlayRef.current) {
      hasTrackedPlayRef.current = true;
      trackSongPlay(currentSong);
    }
  }, [currentTime, currentSong]);

  const trackSongPlay = async (song) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "/api/user/track-play",
        { song },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        }
      );
    } catch (err) {
      console.error("Error tracking song play:", err);
    }
  };

  const playSong = async (song, playlistSongs = []) => {
    // Check if we have offline version first
    let audioUrl = null;
    let isOffline = false;
    
    // Try to load from IndexedDB if song has ID
    if (song?.id) {
      try {
        const offlineSong = await getDownloadedSong(song.id);
        if (offlineSong && offlineSong.audioBlob) {
          // Clean up previous blob URL
          if (currentBlobUrlRef.current) {
            URL.revokeObjectURL(currentBlobUrlRef.current);
          }
          
          // Create blob URL for offline playback
          const blobUrl = URL.createObjectURL(offlineSong.audioBlob);
          currentBlobUrlRef.current = blobUrl;
          audioUrl = blobUrl;
          isOffline = true;
          console.log("🎵 Playing from offline storage:", song.name || song.title);
        }
      } catch (error) {
        console.error("Failed to load offline audio:", error);
      }
    }
    
    // Fallback to online streaming if no offline version
    if (!audioUrl) {
      if (!song?.downloadUrl?.[0]?.url) {
        alert("No audio available for this song.");
        return;
      }
      
      // Select highest quality audio (320kbps preferred)
      let bestQualityUrl = song.downloadUrl[0].url;
      
      // Priority order: 320kbps > 160kbps > 96kbps > 48kbps > 12kbps
      const qualityPriority = ["320kbps", "160kbps", "96kbps", "48kbps", "12kbps"];
      
      for (const quality of qualityPriority) {
        const match = song.downloadUrl.find(dl => dl.quality === quality);
        if (match) {
          bestQualityUrl = match.url;
          break;
        }
      }
      
      // Fallback to last element if no quality match found
      if (bestQualityUrl === song.downloadUrl[0].url && song.downloadUrl.length > 1) {
        bestQualityUrl = song.downloadUrl[song.downloadUrl.length - 1].url;
      }
      
      audioUrl = bestQualityUrl;
    }
    
    // Reset tracking for new song
    hasTrackedPlayRef.current = false;
    
    if (playlistSongs.length > 0) {
      setQueue(playlistSongs);
      const index = playlistSongs.findIndex(s => s.id === song.id);
      setCurrentIndex(index >= 0 ? index : 0);
    } else {
      setQueue([song]);
      setCurrentIndex(0);
    }
    
    setCurrentSong({ ...song, selectedAudioUrl: audioUrl, _isOffline: isOffline });
    setCurrentTime(0);
    
    // Don't auto-play in room listening mode (non-creators need to click Listen Song)
    if (!isRoomListeningMode) {
      setIsPlaying(true);
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.play().catch(err => console.error("Playback error:", err));
        }
      }, 200);
    } else {
      // In room mode for non-creators, just load without playing
      setIsPlaying(false);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(err => console.error("Playback error:", err));
    }
    setIsPlaying(!isPlaying);
  };

  const stopSong = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const closePlayer = () => {
    // Clean up blob URLs
    if (currentBlobUrlRef.current) {
      URL.revokeObjectURL(currentBlobUrlRef.current);
      currentBlobUrlRef.current = null;
    }
    
    setCurrentSong(null);
    setQueue([]);
    setCurrentIndex(0);
    setIsPlaying(false);
    setCurrentTime(0);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    // Clear saved player state when user explicitly closes player
    localStorage.removeItem("serenity-player-state");
  };

  const playNext = () => {
    if (queue.length === 0) return;
    
    let nextIndex;
    if (shuffle) {
      nextIndex = Math.floor(Math.random() * queue.length);
    } else {
      nextIndex = (currentIndex + 1) % queue.length;
    }
    
    setCurrentIndex(nextIndex);
    playSong(queue[nextIndex], queue);
  };

  const playPrevious = () => {
    if (queue.length === 0) return;
    
    if (currentTime > 3) {
      // If more than 3 seconds played, restart current song
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
      }
      return;
    }
    
    let prevIndex;
    if (shuffle) {
      prevIndex = Math.floor(Math.random() * queue.length);
    } else {
      prevIndex = currentIndex === 0 ? queue.length - 1 : currentIndex - 1;
    }
    
    setCurrentIndex(prevIndex);
    playSong(queue[prevIndex], queue);
  };

  const seekTo = (time) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      setVolume(previousVolumeRef.current);
    } else {
      previousVolumeRef.current = volume;
      setIsMuted(true);
    }
  };

  const changeVolume = (newVolume) => {
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
    if (newVolume > 0) {
      previousVolumeRef.current = newVolume;
    }
  };

  const toggleRepeat = () => {
    const modes = ["off", "all", "one"];
    const currentModeIndex = modes.indexOf(repeatMode);
    const nextMode = modes[(currentModeIndex + 1) % modes.length];
    setRepeatMode(nextMode);
  };

  const toggleShuffle = () => {
    setShuffle(!shuffle);
  };

  const handleEnded = () => {
    if (repeatMode === "one") {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
      }
    } else if (repeatMode === "all" || currentIndex < queue.length - 1) {
      playNext();
    } else {
      setIsPlaying(false);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const playQueue = (songs, startIndex = 0) => {
    if (!songs || songs.length === 0) return;
    setQueue(songs);
    setCurrentIndex(startIndex);
    playSong(songs[startIndex], songs);
  };

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      if (currentBlobUrlRef.current) {
        URL.revokeObjectURL(currentBlobUrlRef.current);
      }
    };
  }, []);

  return (
    <PlayerContext.Provider
      value={{
        currentSong,
        isPlaying,
        setIsPlaying,
        playSong,
        togglePlay,
        stopSong,
        closePlayer,
        playNext,
        playPrevious,
        seekTo,
        volume,
        changeVolume,
        isMuted,
        toggleMute,
        repeatMode,
        toggleRepeat,
        shuffle,
        toggleShuffle,
        currentTime,
        duration,
        queue,
        currentIndex,
        audioRef,
        isRoomListeningMode,
        setIsRoomListeningMode,
      }}
    >
      {children}
      {/* Global Player visible on all pages */}
      <audio
        ref={audioRef}
        src={
          currentSong?.selectedAudioUrl || 
          currentSong?.audioFile || 
          currentSong?.downloadUrl?.[0]?.url
        }
        preload="auto"
        onEnded={handleEnded}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
      />
      {/* Hide MiniPlayer for non-creators in room listening mode */}
      {currentSong && !isRoomListeningMode && <MiniPlayer />}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  return useContext(PlayerContext);
}
