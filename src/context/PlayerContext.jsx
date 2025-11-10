"use client";
import { createContext, useContext, useState, useRef } from "react";
import MiniPlayer from "./MiniPlayer";
const PlayerContext = createContext();

export function PlayerProvider({ children }) {
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  const playSong = (song) => {
    if (!song?.downloadUrl?.[0]?.url) {
      alert("No audio available for this song.");
      return;
    }
    setCurrentSong(song);
    setIsPlaying(true);
    setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.play();
      }
    }, 200);
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const stopSong = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
  };

  return (
    <PlayerContext.Provider
      value={{ currentSong, isPlaying, playSong, togglePlay, stopSong, audioRef }}
    >
      {children}
      {/* Global Player visible on all pages */}
      <audio
        ref={audioRef}
        src={currentSong?.downloadUrl?.[0]?.url}
        onEnded={() => setIsPlaying(false)}
      />
      {currentSong && <MiniPlayer />}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  return useContext(PlayerContext);
}
