"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { usePlayer } from "./PlayerContext";
import axios from "axios";

export default function MiniPlayer() {
  const { currentSong, isPlaying, togglePlay, stopSong } = usePlayer();
  const [isFavorite, setIsFavorite] = useState(false);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);

  if (!currentSong) return null;

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
        <motion.div
          key={currentSong?.id || currentSong?.name}
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 120, damping: 18 }}
          className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[95%] md:w-[70%] lg:w-[60%]
          rounded-2xl bg-white border border-gray-200
          shadow-lg flex items-center justify-between gap-4
          p-3 md:p-4 text-black z-[999] hover:shadow-xl
          transition-all"
        >
          {/* 🎵 Song Info */}
          <div className="flex items-center gap-4 w-full md:w-auto overflow-hidden">
            <motion.img
              src={currentSong?.image?.[1]?.url || "/default-song.jpg"}
              alt={currentSong?.name}
              className="w-12 h-12 md:w-14 md:h-14 rounded-xl object-cover border border-gray-200 shadow-md"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            />
            <div className="flex flex-col truncate">
              <h4 className="font-semibold text-sm md:text-base truncate w-40 md:w-64 text-black">
                {currentSong?.name || "Unknown Track"}
              </h4>
              <p className="text-gray-600 text-xs truncate w-40 md:w-64">
                {currentSong?.artists?.primary
                  ?.map((a) => a.name)
                  .join(", ") || "Unknown Artist"}
              </p>
            </div>
          </div>

          {/* 🔊 Controls Section */}
          <div className="flex items-center gap-3 md:gap-4 flex-shrink-0">
            {/* ❤️ Favorite */}
            <motion.button
              onClick={toggleFavorite}
              whileTap={{ scale: 0.85 }}
              className={`w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-full 
              ${
                isFavorite
                  ? "bg-red-500 text-white"
                  : "bg-gray-100 hover:bg-red-100 text-gray-600"
              } border border-gray-200 transition-all`}
            >
              {isFavorite ? "❤️" : "🤍"}
            </motion.button>

            {/* ➕ Save to Playlist */}
            <motion.button
              onClick={() => setShowPlaylistModal(true)}
              whileTap={{ scale: 0.9 }}
              className="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-full 
              bg-gray-100 hover:bg-[#0097b2] text-gray-600 hover:text-white
              border border-gray-200 transition-all"
            >
              ➕
            </motion.button>

            {/* ▶️ Play / ⏸ Pause */}
            <motion.button
              onClick={togglePlay}
              whileTap={{ scale: 0.9 }}
              className={`flex items-center justify-center w-10 h-10 md:w-12 md:h-12 
              rounded-full shadow-md
              ${
                isPlaying
                  ? "bg-[#0097b2] text-white"
                  : "bg-gray-200 hover:bg-[#0097b2] text-black hover:text-white"
              } transition-all`}
            >
              {isPlaying ? "⏸" : "▶"}
            </motion.button>

            {/* ⏹ Stop */}
            <motion.button
              onClick={stopSong}
              whileTap={{ scale: 0.9 }}
              className="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-full 
              bg-gray-100 hover:bg-red-600 text-gray-600 hover:text-white border border-gray-200 transition-all"
            >
              ⏹
            </motion.button>
          </div>

          {/* 🎶 Animated Equalizer */}
          {isPlaying && (
            <div className="hidden md:flex gap-[3px] items-end justify-center ml-4 w-8">
              {[...Array(4)].map((_, i) => (
                <motion.span
                  key={i}
                  className="w-1 bg-[#0097b2] rounded-full"
                  animate={{
                    height: ["20%", "90%", "40%", "70%", "30%"],
                    opacity: [0.5, 1, 0.7, 1, 0.6],
                  }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: i * 0.15,
                  }}
                />
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* 🎧 Add to Playlist Modal */}
      <AnimatePresence>
        {showPlaylistModal && (
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[1000]"
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
              className="bg-white p-6 rounded-2xl border border-gray-200 shadow-lg w-[90%] max-w-md text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-[#0097b2] mb-4">
                Add to Playlist
              </h3>
              <p className="text-gray-600 text-sm mb-6">
                (This is a placeholder — connect to your playlist API or show available playlists here.)
              </p>
              <button
                onClick={() => setShowPlaylistModal(false)}
                className="bg-[#0097b2] hover:bg-[#007a93] px-5 py-2 rounded-full text-white font-medium"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
