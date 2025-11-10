"use client";
import { createContext, useContext, useState, useRef, useEffect } from "react";
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

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const playSong = (song, playlistSongs = []) => {
    if (!song?.downloadUrl?.[0]?.url) {
      alert("No audio available for this song.");
      return;
    }
    
    if (playlistSongs.length > 0) {
      setQueue(playlistSongs);
      const index = playlistSongs.findIndex(s => s.id === song.id);
      setCurrentIndex(index >= 0 ? index : 0);
    } else {
      setQueue([song]);
      setCurrentIndex(0);
    }
    
    setCurrentSong(song);
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
        src={currentSong?.downloadUrl?.[0]?.url}
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
