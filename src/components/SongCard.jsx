"use client";
import { motion } from "framer-motion";
import { Play } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SongCard({ 
  song, 
  onPlay, 
  isFavorite = false, 
  onToggleFavorite, 
  onAddToPlaylist,
  showFavoriteButton = false, 
  showAddToPlaylistButton = false 
}) {
  const router = useRouter();

  const formatDuration = (seconds) => {
    if (!seconds) return null;
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const artistName = song.artists?.primary?.[0]?.name || 
                     song.artists?.[0]?.name || 
                     song.primaryArtists || 
                     "Unknown Artist";
  const artistId = song.artists?.primary?.[0]?.id || song.artists?.[0]?.id;

  const handleArtistClick = (e) => {
    e.stopPropagation();
    if (artistId) {
      router.push(`/artists/${artistId}`);
    }
  };

  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md hover:shadow-xl dark:shadow-gray-900/50 transition-all group relative"
    >
      {/* Image with Play Overlay */}
      <div className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-gray-700">
        {/* Favorite Button (top-right) */}
        {showFavoriteButton && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite && onToggleFavorite();
            }}
            className={`absolute z-10 top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
              isFavorite
                ? "bg-red-500 text-white"
                : "bg-white/80 dark:bg-gray-800/80 text-gray-600 dark:text-gray-300 hover:bg-red-500 hover:text-white"
            }`}
            title={isFavorite ? "Remove from favorites" : "Add to favorites"}
          >
            {isFavorite ? "❤️" : "🤍"}
          </button>
        )}
        
        <img
          src={song.image?.[2]?.url || song.image?.[1]?.url || song.image?.[0]?.url}
          alt={song.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
        />
        
        {/* Duration Badge */}
        {song.duration && formatDuration(song.duration) && (
          <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-md font-medium">
            {formatDuration(song.duration)}
          </div>
        )}

        {/* Circular Play Button Overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
          <motion.button
            onClick={() => onPlay(song)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="bg-[#0097b2] hover:bg-[#007a93] text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          >
            <Play className="w-6 h-6 ml-1" fill="white" />
          </motion.button>
        </div>
      </div>

      {/* Song Info */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 dark:text-white text-sm truncate mb-1" title={song.name}>
          {song.name}
        </h3>
        <button
          onClick={handleArtistClick}
          className="text-xs text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:underline truncate block w-full text-left transition-colors"
          title={artistName}
        >
          {artistName}
        </button>
        
        {/* Add to Playlist Button */}
        {showAddToPlaylistButton && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddToPlaylist && onAddToPlaylist();
            }}
            className="mt-2 w-full flex items-center justify-center gap-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-3 py-1.5 rounded-lg text-xs transition-all"
            title="Add to playlist"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Playlist</span>
          </button>
        )}
      </div>
    </motion.div>
  );
}
