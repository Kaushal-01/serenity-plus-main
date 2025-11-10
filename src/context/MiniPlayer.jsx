"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { usePlayer } from "./PlayerContext";
import axios from "axios";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Shuffle,
  Repeat,
  Repeat1,
  Volume2,
  VolumeX,
  Volume1,
  Volume,
  Heart,
  Plus,
  X,
  Maximize2,
} from "lucide-react";

export default function MiniPlayer() {
  const {
    currentSong,
    isPlaying,
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
  } = usePlayer();

  const [isFavorite, setIsFavorite] = useState(false);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [playlists, setPlaylists] = useState([]);
  const [loadingPlaylists, setLoadingPlaylists] = useState(false);
  const [addingToPlaylist, setAddingToPlaylist] = useState(null);

  // Fetch playlists when modal opens
  useEffect(() => {
    if (showPlaylistModal) {
      fetchPlaylists();
    }
  }, [showPlaylistModal]);

  const fetchPlaylists = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please login to add songs to playlists!");
      setShowPlaylistModal(false);
      return;
    }

    setLoadingPlaylists(true);
    try {
      const res = await axios.get("/api/user/playlists", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPlaylists(res.data.playlists || []);
    } catch (err) {
      console.error("Fetch playlists error:", err);
      alert("Failed to load playlists");
    } finally {
      setLoadingPlaylists(false);
    }
  };

  const addToPlaylist = async (playlistId) => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please login!");
      return;
    }

    setAddingToPlaylist(playlistId);
    try {
      await axios.post(
        "/api/user/playlists/songs",
        { playlistId, song: currentSong },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Song added to playlist!");
      setShowPlaylistModal(false);
    } catch (err) {
      console.error("Add to playlist error:", err);
      alert(err.response?.data?.error || "Failed to add song");
    } finally {
      setAddingToPlaylist(null);
    }
  };

  if (!currentSong) return null;

  const formatTime = (time) => {
    if (!time || isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleProgressChange = (e) => {
    const progressBar = e.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = percent * duration;
    seekTo(newTime);
  };

  const handleProgressDrag = (e) => {
    if (isDragging) {
      handleProgressChange(e);
    }
  };

  const getVolumeIcon = () => {
    if (isMuted || volume === 0) return <VolumeX className="w-4 h-4" />;
    if (volume < 0.3) return <Volume className="w-4 h-4" />;
    if (volume < 0.7) return <Volume1 className="w-4 h-4" />;
    return <Volume2 className="w-4 h-4" />;
  };

  const getRepeatIcon = () => {
    if (repeatMode === "one") return <Repeat1 className="w-4 h-4" />;
    if (repeatMode === "all") return <Repeat className="w-4 h-4" />;
    return <Repeat className="w-4 h-4" />;
  };

  // ❤️ Toggle favorite
  const toggleFavorite = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please login to save favorites!");
      return;
    }

    setIsFavorite((prev) => !prev);
    try {
      if (!isFavorite) {
        await axios.post(
          "/api/user/favorites",
          { song: currentSong },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        await axios.delete(`/api/user/favorites?id=${currentSong.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch (err) {
      console.error("Favorite toggle error:", err);
    }
  };

  return (
    <>
      <AnimatePresence>
        {!isExpanded ? (
          /* ========== COMPACT PLAYER ========== */
          <motion.div
            key="compact-player"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 120, damping: 18 }}
            className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[95%] md:w-[80%] lg:w-[70%] xl:w-[60%]
            rounded-2xl bg-gradient-to-br from-white to-gray-50 border border-gray-200
            shadow-2xl text-black z-[999] hover:shadow-3xl
            transition-all duration-300 backdrop-blur-lg"
          >
            {/* Progress Bar */}
            <div
              className="absolute top-0 left-0 right-0 h-1 bg-gray-200 rounded-t-2xl cursor-pointer group"
              onClick={handleProgressChange}
              onMouseDown={() => setIsDragging(true)}
              onMouseUp={() => setIsDragging(false)}
              onMouseMove={handleProgressDrag}
              onMouseLeave={() => setIsDragging(false)}
            >
              <motion.div
                className="h-full bg-gradient-to-r from-[#0097b2] to-[#00b8d4] rounded-full relative"
                style={{ width: `${(currentTime / duration) * 100 || 0}%` }}
                animate={{ opacity: [0.8, 1, 0.8] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.div>
            </div>

            <div className="flex items-center justify-between gap-4 p-4">
              {/* Left: Song Info */}
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <motion.div
                  className="relative group cursor-pointer"
                  whileHover={{ scale: 1.05 }}
                  onClick={() => setIsExpanded(true)}
                >
                  <img
                    src={currentSong?.image?.[2]?.url || "/default-song.jpg"}
                    alt={currentSong?.name}
                    className="w-14 h-14 md:w-16 md:h-16 rounded-xl object-cover border-2 border-gray-200 shadow-md"
                  />
                  {isPlaying && (
                    <div className="absolute inset-0 bg-black/30 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-white text-xs">Expand</span>
                    </div>
                  )}
                </motion.div>

                <div className="flex flex-col min-w-0 flex-1">
                  <h4 className="font-semibold text-sm md:text-base truncate text-black">
                    {currentSong?.name || "Unknown Track"}
                  </h4>
                  <p className="text-gray-600 text-xs md:text-sm truncate">
                    {currentSong?.artists?.primary?.map((a) => a.name).join(", ") || "Unknown Artist"}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500">{formatTime(currentTime)}</span>
                    <span className="text-xs text-gray-400">/</span>
                    <span className="text-xs text-gray-500">{formatTime(duration)}</span>
                  </div>
                </div>
              </div>

              {/* Center: Main Controls */}
              <div className="flex items-center gap-2 md:gap-3">
                {/* Shuffle */}
                <motion.button
                  onClick={toggleShuffle}
                  whileTap={{ scale: 0.9 }}
                  className={`hidden md:flex w-9 h-9 items-center justify-center rounded-full 
                  ${shuffle ? "bg-[#0097b2] text-white" : "bg-gray-100 hover:bg-gray-200 text-gray-600"}
                  border border-gray-200 transition-all`}
                  title="Shuffle"
                >
                  <Shuffle className="w-4 h-4" />
                </motion.button>

                {/* Previous */}
                <motion.button
                  onClick={playPrevious}
                  whileTap={{ scale: 0.9 }}
                  className={`w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-full 
                  border border-gray-200 transition-all
                  ${queue.length <= 1 
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                  }`}
                  disabled={queue.length <= 1}
                >
                  <SkipBack className="w-4 h-4" />
                </motion.button>

                {/* Play/Pause */}
                <motion.button
                  onClick={togglePlay}
                  whileTap={{ scale: 0.95 }}
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center justify-center w-12 h-12 md:w-14 md:h-14 
                  rounded-full shadow-lg bg-gradient-to-br from-[#0097b2] to-[#00b8d4] 
                  text-white hover:shadow-xl transition-all relative overflow-hidden"
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5 md:w-6 md:h-6" />
                  ) : (
                    <Play className="w-5 h-5 md:w-6 md:h-6 ml-0.5" />
                  )}
                </motion.button>

                {/* Next */}
                <motion.button
                  onClick={playNext}
                  whileTap={{ scale: 0.9 }}
                  className={`w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-full 
                  border border-gray-200 transition-all
                  ${queue.length <= 1 
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                  }`}
                  disabled={queue.length <= 1}
                >
                  <SkipForward className="w-4 h-4" />
                </motion.button>

                {/* Repeat */}
                <motion.button
                  onClick={toggleRepeat}
                  whileTap={{ scale: 0.9 }}
                  className={`hidden md:flex w-9 h-9 items-center justify-center rounded-full 
                  ${repeatMode !== "off" ? "bg-[#0097b2] text-white" : "bg-gray-100 hover:bg-gray-200 text-gray-600"}
                  border border-gray-200 transition-all`}
                  title={`Repeat: ${repeatMode}`}
                >
                  {getRepeatIcon()}
                </motion.button>
              </div>

              {/* Right: Extra Controls */}
              <div className="flex items-center gap-2 md:gap-3">
                {/* Favorite */}
                <motion.button
                  onClick={toggleFavorite}
                  whileTap={{ scale: 0.85 }}
                  className={`hidden md:flex w-9 h-9 items-center justify-center rounded-full 
                  ${isFavorite ? "bg-red-500 text-white" : "bg-gray-100 hover:bg-red-100 text-gray-600"}
                  border border-gray-200 transition-all`}
                  title="Favorite"
                >
                  <Heart className={`w-4 h-4 ${isFavorite ? "fill-white" : ""}`} />
                </motion.button>

                {/* Volume Control */}
                <div
                  className="relative"
                  onMouseEnter={() => setShowVolumeSlider(true)}
                  onMouseLeave={() => setShowVolumeSlider(false)}
                >
                  <motion.button
                    onClick={toggleMute}
                    whileTap={{ scale: 0.9 }}
                    className="hidden md:flex w-9 h-9 items-center justify-center rounded-full 
                    bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 transition-all"
                  >
                    {getVolumeIcon()}
                  </motion.button>

                  <AnimatePresence>
                    {showVolumeSlider && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-white rounded-lg shadow-lg border border-gray-200 p-3"
                      >
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.01"
                          value={volume}
                          onChange={(e) => changeVolume(parseFloat(e.target.value))}
                          className="w-24 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer 
                          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 
                          [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full 
                          [&::-webkit-slider-thumb]:bg-[#0097b2] rotate-0 md:rotate-[-90deg] origin-center"
                          style={{ width: "100px", transform: "rotate(-90deg)", transformOrigin: "center" }}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Add to Playlist */}
                <motion.button
                  onClick={() => setShowPlaylistModal(true)}
                  whileTap={{ scale: 0.9 }}
                  className="hidden md:flex w-9 h-9 items-center justify-center rounded-full 
                  bg-gray-100 hover:bg-[#0097b2] text-gray-600 hover:text-white
                  border border-gray-200 transition-all"
                  title="Add to Playlist"
                >
                  <Plus className="w-4 h-4" />
                </motion.button>

                {/* Queue Info */}
                {queue.length > 1 && (
                  <div className="hidden lg:flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-600">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M3 4h14v2H3V4zm0 5h14v2H3V9zm0 5h14v2H3v-2z" />
                    </svg>
                    <span>{queue.length}</span>
                  </div>
                )}
              </div>

              {/* Animated Equalizer */}
              {isPlaying && (
                <div className="hidden xl:flex gap-[2px] items-end h-8 ml-2">
                  {[...Array(5)].map((_, i) => (
                    <motion.span
                      key={i}
                      className="w-1 bg-gradient-to-t from-[#0097b2] to-[#00b8d4] rounded-full"
                      animate={{
                        height: ["30%", "100%", "50%", "80%", "40%"],
                      }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: i * 0.1,
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          /* ========== EXPANDED PLAYER ========== */
          <motion.div
            key="expanded-player"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black z-[1000] flex items-center justify-center p-4 md:p-8"
          >
            {/* Close Button */}
            <motion.button
              onClick={() => setIsExpanded(false)}
              whileTap={{ scale: 0.9 }}
              className="absolute top-4 right-4 md:top-8 md:right-8 w-10 h-10 flex items-center justify-center 
              rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-lg transition-all z-10"
            >
              <X className="w-5 h-5" />
            </motion.button>

            <div className="w-full max-w-2xl text-white">
              {/* Album Art */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="relative mx-auto w-64 h-64 md:w-80 md:h-80 mb-8"
              >
                <img
                  src={currentSong?.image?.[2]?.url || "/default-song.jpg"}
                  alt={currentSong?.name}
                  className="w-full h-full rounded-3xl object-cover shadow-2xl"
                />
                {isPlaying && (
                  <motion.div
                    className="absolute inset-0 rounded-3xl border-4 border-[#0097b2]"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  />
                )}
              </motion.div>

              {/* Song Info */}
              <div className="text-center mb-8">
                <motion.h2
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-2xl md:text-4xl font-bold mb-2"
                >
                  {currentSong?.name}
                </motion.h2>
                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-lg md:text-xl text-gray-300"
                >
                  {currentSong?.artists?.primary?.map((a) => a.name).join(", ")}
                </motion.p>
              </div>

              {/* Progress Bar */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="mb-4"
              >
                <div
                  className="h-2 bg-white/20 rounded-full cursor-pointer group relative"
                  onClick={handleProgressChange}
                  onMouseDown={() => setIsDragging(true)}
                  onMouseUp={() => setIsDragging(false)}
                  onMouseMove={handleProgressDrag}
                  onMouseLeave={() => setIsDragging(false)}
                >
                  <div
                    className="h-full bg-gradient-to-r from-[#0097b2] to-[#00b8d4] rounded-full relative"
                    style={{ width: `${(currentTime / duration) * 100 || 0}%` }}
                  >
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
                <div className="flex justify-between text-sm text-gray-400 mt-2">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </motion.div>

              {/* Controls */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="flex items-center justify-center gap-4 md:gap-6 mb-6"
              >
                <motion.button
                  onClick={toggleShuffle}
                  whileTap={{ scale: 0.9 }}
                  className={`w-12 h-12 flex items-center justify-center rounded-full 
                  ${shuffle ? "bg-[#0097b2] text-white" : "bg-white/10 hover:bg-white/20 text-white"}
                  transition-all`}
                >
                  <Shuffle className="w-5 h-5" />
                </motion.button>

                <motion.button
                  onClick={playPrevious}
                  whileTap={{ scale: 0.9 }}
                  className={`w-14 h-14 flex items-center justify-center rounded-full 
                  transition-all text-white
                  ${queue.length <= 1 
                    ? "bg-white/5 cursor-not-allowed" 
                    : "bg-white/10 hover:bg-white/20"
                  }`}
                  disabled={queue.length <= 1}
                >
                  <SkipBack className="w-6 h-6" />
                </motion.button>

                <motion.button
                  onClick={togglePlay}
                  whileTap={{ scale: 0.95 }}
                  whileHover={{ scale: 1.05 }}
                  className="w-20 h-20 flex items-center justify-center rounded-full 
                  bg-gradient-to-br from-[#0097b2] to-[#00b8d4] text-white shadow-2xl"
                >
                  {isPlaying ? (
                    <Pause className="w-8 h-8" />
                  ) : (
                    <Play className="w-8 h-8 ml-1" />
                  )}
                </motion.button>

                <motion.button
                  onClick={playNext}
                  whileTap={{ scale: 0.9 }}
                  className={`w-14 h-14 flex items-center justify-center rounded-full 
                  transition-all text-white
                  ${queue.length <= 1 
                    ? "bg-white/5 cursor-not-allowed" 
                    : "bg-white/10 hover:bg-white/20"
                  }`}
                  disabled={queue.length <= 1}
                >
                  <SkipForward className="w-6 h-6" />
                </motion.button>

                <motion.button
                  onClick={toggleRepeat}
                  whileTap={{ scale: 0.9 }}
                  className={`w-12 h-12 flex items-center justify-center rounded-full 
                  ${repeatMode !== "off" ? "bg-[#0097b2] text-white" : "bg-white/10 hover:bg-white/20 text-white"}
                  transition-all`}
                >
                  {getRepeatIcon()}
                </motion.button>
              </motion.div>

              {/* Bottom Actions */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="flex items-center justify-center gap-4"
              >
                <motion.button
                  onClick={toggleFavorite}
                  whileTap={{ scale: 0.9 }}
                  className={`w-12 h-12 flex items-center justify-center rounded-full 
                  ${isFavorite ? "bg-red-500 text-white" : "bg-white/10 hover:bg-white/20 text-white"}
                  transition-all`}
                >
                  <Heart className={`w-5 h-5 ${isFavorite ? "fill-white" : ""}`} />
                </motion.button>

                <motion.button
                  onClick={toggleMute}
                  whileTap={{ scale: 0.9 }}
                  className="w-12 h-12 flex items-center justify-center rounded-full 
                  bg-white/10 hover:bg-white/20 transition-all text-white"
                >
                  {getVolumeIcon()}
                </motion.button>

                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={(e) => changeVolume(parseFloat(e.target.value))}
                  className="w-32 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer 
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 
                  [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full 
                  [&::-webkit-slider-thumb]:bg-white"
                />

                <motion.button
                  onClick={() => setShowPlaylistModal(true)}
                  whileTap={{ scale: 0.9 }}
                  className="w-12 h-12 flex items-center justify-center rounded-full 
                  bg-white/10 hover:bg-white/20 transition-all text-white"
                >
                  <Plus className="w-5 h-5" />
                </motion.button>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🎧 Add to Playlist Modal */}
      <AnimatePresence>
        {showPlaylistModal && (
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[1001]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowPlaylistModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-white p-6 rounded-2xl border border-gray-200 shadow-lg w-[90%] max-w-md max-h-[70vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-[#0097b2]">
                  Add to Playlist
                </h3>
                <button
                  onClick={() => setShowPlaylistModal(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-600 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Current Song Info */}
              <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
                <img
                  src={currentSong?.image?.[0]?.url}
                  alt={currentSong?.name}
                  className="w-12 h-12 rounded-lg object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-800 truncate">
                    {currentSong?.name}
                  </p>
                  <p className="text-xs text-gray-600 truncate">
                    {currentSong?.artists?.primary?.map((a) => a.name).join(", ")}
                  </p>
                </div>
              </div>

              {/* Playlists List */}
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {loadingPlaylists ? (
                  <div className="text-center py-8">
                    <div className="inline-block w-8 h-8 border-4 border-[#0097b2] border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-600 text-sm mt-2">Loading playlists...</p>
                  </div>
                ) : playlists.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600 text-sm mb-4">No playlists found</p>
                    <button
                      onClick={() => {
                        setShowPlaylistModal(false);
                        // You can add navigation to create playlist page
                      }}
                      className="text-[#0097b2] hover:underline text-sm"
                    >
                      Create your first playlist
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {playlists.map((playlist) => (
                      <motion.button
                        key={playlist._id}
                        onClick={() => addToPlaylist(playlist._id)}
                        disabled={addingToPlaylist === playlist._id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full flex items-center justify-between p-3 rounded-lg 
                        bg-gray-50 hover:bg-gray-100 border border-gray-200 
                        transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-800 truncate">
                            {playlist.name}
                          </p>
                          <p className="text-xs text-gray-600">
                            {playlist.songs?.length || 0} songs
                          </p>
                        </div>
                        {addingToPlaylist === playlist._id ? (
                          <div className="w-5 h-5 border-2 border-[#0097b2] border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <Plus className="w-5 h-5 text-[#0097b2]" />
                        )}
                      </motion.button>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowPlaylistModal(false)}
                  className="w-full bg-gray-100 hover:bg-gray-200 px-5 py-2 rounded-full text-gray-700 font-medium transition-all"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
