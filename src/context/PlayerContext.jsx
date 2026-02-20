"use client";
import { createContext, useContext, useState, useRef, useEffect } from "react";
import axios from "axios";
import MiniPlayer from "./MiniPlayer";
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
  const audioRef = useRef(null);
  const previousVolumeRef = useRef(0.7);
  const hasTrackedPlayRef = useRef(false);
  const isRestoringRef = useRef(false);
  const hasMountedRef = useRef(false);
  const lastSaveTimeRef = useRef(0);

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
    }
  }, []);

  // Save player state to localStorage whenever it changes
  useEffect(() => {
    if (!hasMountedRef.current || isRestoringRef.current || !currentSong) return;

    try {
      const playerState = {
        song: currentSong,
        queueData: queue,
        index: currentIndex,
        time: currentTime,
        volumeData: volume,
        repeat: repeatMode,
        shuffleMode: shuffle
      };
      localStorage.setItem("serenity-player-state", JSON.stringify(playerState));
    } catch (err) {
      console.error("Error saving player state:", err);
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
      console.error("Error saving playback time:", err);
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

  const playSong = (song, playlistSongs = []) => {
    if (!song?.downloadUrl?.[0]?.url) {
      alert("No audio available for this song.");
      return;
    }
    
    // Reset tracking for new song
    hasTrackedPlayRef.current = false;
    
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
    
    if (playlistSongs.length > 0) {
      setQueue(playlistSongs);
      const index = playlistSongs.findIndex(s => s.id === song.id);
      setCurrentIndex(index >= 0 ? index : 0);
    } else {
      setQueue([song]);
      setCurrentIndex(0);
    }
    
    setCurrentSong({ ...song, selectedAudioUrl: bestQualityUrl });
    setIsPlaying(true);
    setCurrentTime(0);
    
    setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.play().catch(err => console.error("Playback error:", err));
      }
    }, 200);
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

  return (
    <PlayerContext.Provider
      value={{
        currentSong,
        isPlaying,
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
      }}
    >
      {children}
      {/* Global Player visible on all pages */}
      <audio
        ref={audioRef}
        src={currentSong?.selectedAudioUrl || currentSong?.downloadUrl?.[0]?.url}
        preload="auto"
        onEnded={handleEnded}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
      />
      {currentSong && <MiniPlayer />}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  return useContext(PlayerContext);
}
