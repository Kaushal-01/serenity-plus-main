"use client";
import { usePlayer } from "@/context/PlayerContext";
import { Play, Pause, SkipForward, SkipBack, Shuffle, Repeat, Repeat1, Volume2, VolumeX } from "lucide-react";

/**
 * Player Demo Component
 * 
 * Shows current player state and all available controls
 * Useful for testing and understanding the player API
 * 
 * To use: Import this component anywhere in your app
 * import PlayerDemo from "@/components/PlayerDemo";
 * <PlayerDemo />
 */
export default function PlayerDemo() {
  const {
    currentSong,
    isPlaying,
    volume,
    isMuted,
    repeatMode,
    shuffle,
    currentTime,
    duration,
    queue,
    currentIndex,
    togglePlay,
    stopSong,
    playNext,
    playPrevious,
    seekTo,
    changeVolume,
    toggleMute,
    toggleRepeat,
    toggleShuffle,
  } = usePlayer();

  const formatTime = (time) => {
    if (!time || isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="fixed top-4 right-4 bg-white/95 backdrop-blur-lg border border-gray-200 rounded-xl shadow-xl p-4 max-w-sm z-[998]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-gray-800 flex items-center gap-2">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
          </svg>
          Player State
        </h3>
        <span className={`px-2 py-1 rounded-full text-xs flex items-center gap-1 ${isPlaying ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
          {isPlaying ? <><Play className="w-3 h-3" /> Playing</> : <><Pause className="w-3 h-3" /> Paused</>}
        </span>
      </div>

      {/* Current Song */}
      <div className="mb-3 pb-3 border-b border-gray-200">
        {currentSong ? (
          <div className="flex gap-2">
            <img 
              src={currentSong.image?.[0]?.url} 
              alt={currentSong.name}
              className="w-12 h-12 rounded-lg object-cover"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">
                {currentSong.name}
              </p>
              <p className="text-xs text-gray-600 truncate">
                {currentSong.artists?.primary?.map(a => a.name).join(", ")}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500 italic">No song playing</p>
        )}
      </div>

      {/* State Information */}
      <div className="space-y-2 text-xs mb-3">
        <div className="flex justify-between">
          <span className="text-gray-600">Time:</span>
          <span className="font-mono text-gray-800">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Volume:</span>
          <span className="text-gray-800 flex items-center gap-1">
            {isMuted ? <><VolumeX className="w-3 h-3" /> Muted</> : <><Volume2 className="w-3 h-3" /> {Math.round(volume * 100)}%</>}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Repeat:</span>
          <span className="text-gray-800 flex items-center gap-1">
            {repeatMode === "off" && <><Repeat className="w-3 h-3" /> Off</>}
            {repeatMode === "all" && <><Repeat className="w-3 h-3" /> All</>}
            {repeatMode === "one" && <><Repeat1 className="w-3 h-3" /> One</>}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Shuffle:</span>
          <span className="text-gray-800 flex items-center gap-1">
            {shuffle ? <><Shuffle className="w-3 h-3" /> On</> : "Off"}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Queue:</span>
          <span className="text-gray-800">
            {queue.length} song{queue.length !== 1 ? "s" : ""}
            {queue.length > 0 && ` (${currentIndex + 1}/${queue.length})`}
          </span>
        </div>
      </div>

      {/* Quick Controls */}
      <div className="flex flex-wrap gap-2 mb-3">
        <button
          onClick={togglePlay}
          disabled={!currentSong}
          className="px-3 py-1 bg-[#0097b2] hover:bg-[#007a93] disabled:bg-gray-300 text-white rounded-lg text-xs transition-all flex items-center gap-1"
        >
          {isPlaying ? <><Pause className="w-3 h-3" /> Pause</> : <><Play className="w-3 h-3" /> Play</>}
        </button>
        <button
          onClick={stopSong}
          disabled={!currentSong}
          className="px-3 py-1 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white rounded-lg text-xs transition-all flex items-center gap-1"
        >
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
          </svg>
          Stop
        </button>
        <button
          onClick={playPrevious}
          disabled={queue.length <= 1}
          className="px-3 py-1 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-300 text-white rounded-lg text-xs transition-all flex items-center gap-1"
        >
          <SkipBack className="w-3 h-3" />
        </button>
        <button
          onClick={playNext}
          disabled={queue.length <= 1}
          className="px-3 py-1 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-300 text-white rounded-lg text-xs transition-all flex items-center gap-1"
        >
          <SkipForward className="w-3 h-3" />
        </button>
      </div>

      {/* Mode Toggles */}
      <div className="flex gap-2 mb-3">
        <button
          onClick={toggleShuffle}
          className={`flex-1 px-3 py-1 rounded-lg text-xs transition-all flex items-center justify-center gap-1 ${
            shuffle
              ? "bg-[#0097b2] text-white"
              : "bg-gray-100 hover:bg-gray-200 text-gray-700"
          }`}
        >
          <Shuffle className="w-3 h-3" /> Shuffle
        </button>
        <button
          onClick={toggleRepeat}
          className={`flex-1 px-3 py-1 rounded-lg text-xs transition-all flex items-center justify-center gap-1 ${
            repeatMode !== "off"
              ? "bg-[#0097b2] text-white"
              : "bg-gray-100 hover:bg-gray-200 text-gray-700"
          }`}
        >
          {repeatMode === "one" ? <Repeat1 className="w-3 h-3" /> : <Repeat className="w-3 h-3" />} Repeat
        </button>
        <button
          onClick={toggleMute}
          className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs transition-all flex items-center justify-center"
        >
          {isMuted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
        </button>
      </div>

      {/* Volume Control */}
      <div className="mb-3">
        <label className="text-xs text-gray-600 mb-1 block">Volume</label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={(e) => changeVolume(parseFloat(e.target.value))}
          className="w-full"
        />
      </div>

      {/* Seek Control */}
      <div className="mb-3">
        <label className="text-xs text-gray-600 mb-1 block">Seek</label>
        <input
          type="range"
          min="0"
          max={duration || 100}
          step="1"
          value={currentTime}
          onChange={(e) => seekTo(parseFloat(e.target.value))}
          disabled={!currentSong}
          className="w-full"
        />
      </div>

      {/* Quick Seek Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => seekTo(Math.max(0, currentTime - 10))}
          disabled={!currentSong}
          className="flex-1 px-2 py-1 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 text-gray-700 rounded text-xs transition-all"
        >
          -10s
        </button>
        <button
          onClick={() => seekTo(0)}
          disabled={!currentSong}
          className="flex-1 px-2 py-1 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 text-gray-700 rounded text-xs transition-all"
        >
          Reset
        </button>
        <button
          onClick={() => seekTo(Math.min(duration, currentTime + 10))}
          disabled={!currentSong}
          className="flex-1 px-2 py-1 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 text-gray-700 rounded text-xs transition-all"
        >
          +10s
        </button>
      </div>

      <p className="text-xs text-gray-500 text-center mt-3 italic">
        Player Demo Component
      </p>
    </div>
  );
}
