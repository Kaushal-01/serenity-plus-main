"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import Navbar from "../../../components/Navbar";
import { usePlayer } from "@/context/PlayerContext";
import { motion, AnimatePresence } from "framer-motion";
import Breadcrumb from "@/components/Breadcrumb";
import { PlaylistHeaderSkeleton, SongListSkeleton } from "@/components/LoadingSkeleton";

export default function PlaylistDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { playSong } = usePlayer();
  const [playlist, setPlaylist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    fetchPlaylist();
  }, [id]);

  const fetchPlaylist = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    
    setLoading(true);
    try {
      const res = await axios.get("/api/user/playlists", {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const foundPlaylist = res.data.playlists.find(p => p._id === id);
      if (foundPlaylist) {
        setPlaylist(foundPlaylist);
      } else {
        setMessage({ type: "error", text: "Playlist not found" });
      }
    } catch (err) {
      console.error("Fetch playlist error:", err);
      setMessage({ type: "error", text: "Failed to load playlist" });
    } finally {
      setLoading(false);
    }
  };

  const removeSong = async (songId) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await axios.delete(
        `/api/user/playlists/songs?playlistId=${encodeURIComponent(id)}&songId=${encodeURIComponent(songId)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        setMessage({ type: "success", text: "Song removed from playlist" });
        fetchPlaylist();
      }
    } catch (err) {
      console.error("Remove song error:", err);
      setMessage({ type: "error", text: "Failed to remove song" });
    }
  };

  const playAllSongs = () => {
    if (playlist?.songs && playlist.songs.length > 0) {
      playSong(playlist.songs[0]);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0097b2]/5 to-white dark:from-gray-900 dark:to-gray-800 transition-colors">
        <Navbar />
        <div className="pt-20 md:pt-24 px-4 md:px-6 pb-40 md:pb-12 max-w-7xl mx-auto">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-64 mb-6 animate-pulse" />
          <PlaylistHeaderSkeleton />
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-6 animate-pulse" />
          <SongListSkeleton count={8} />
        </div>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0097b2]/5 to-white dark:from-gray-900 dark:to-gray-800 transition-colors">
        <Navbar />
        <div className="pt-20 md:pt-24 px-4 md:px-8 pb-40 md:pb-12 text-center">
          <p className="text-gray-600 dark:text-gray-300 text-lg md:text-xl">Playlist not found</p>
          <button
            onClick={() => router.push("/playlists")}
            className="mt-6 bg-[#0097b2] hover:bg-[#007a93] text-white px-6 py-2.5 md:py-3 rounded-full font-medium transition-all text-sm md:text-base"
          >
            Back to Playlists
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0097b2]/5 to-white dark:from-gray-900 dark:to-gray-800 transition-colors">
      <Navbar />
      
      <div className="pt-20 md:pt-24 px-4 md:px-6 pb-40 md:pb-12 max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <Breadcrumb
          items={[
            { label: "Playlists", href: "/playlists" },
            { label: playlist?.name || "Playlist" },
          ]}
        />

        {/* Message Alert */}
        <AnimatePresence>
          {message.text && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`mb-6 p-4 rounded-lg ${
                message.type === "success"
                  ? "bg-green-100 text-green-800 border border-green-300"
                  : "bg-red-100 text-red-800 border border-red-300"
              }`}
            >
              {message.text}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Playlist Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 md:p-8 mb-6 md:mb-8"
        >
          <div className="flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-6">
            <div className="w-32 h-32 md:w-48 md:h-48 bg-gradient-to-br from-[#0097b2] to-[#007a93] rounded-2xl flex items-center justify-center shadow-xl flex-shrink-0">
              <svg className="w-16 h-16 md:w-24 md:h-24 text-white opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
            <div className="flex-1 text-center md:text-left w-full">
              <h1 className="text-2xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">{playlist.name}</h1>
              {playlist.description && (
                <p className="text-gray-600 dark:text-gray-300 mb-3 md:mb-4 text-sm md:text-base">{playlist.description}</p>
              )}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 md:gap-6 text-xs md:text-sm text-gray-500 dark:text-gray-400 mb-4 md:mb-6">
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                  {playlist.songs?.length || 0} songs
                </span>
                <span>Created {formatDate(playlist.createdAt)}</span>
                {playlist.updatedAt && playlist.updatedAt !== playlist.createdAt && (
                  <span>Updated {formatDate(playlist.updatedAt)}</span>
                )}
              </div>
              {playlist.songs && playlist.songs.length > 0 && (
                <button
                  onClick={playAllSongs}
                  className="flex items-center justify-center gap-2 bg-[#0097b2] hover:bg-[#007a93] text-white px-6 py-2.5 md:py-3 rounded-full font-medium transition-all shadow-lg hover:shadow-xl text-sm md:text-base w-full md:w-auto"
                >
                  <svg className="w-4 h-4 md:w-5 md:h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                  </svg>
                  Play All
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Songs List */}
        {playlist.songs && playlist.songs.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 md:p-6"
          >
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-4 md:mb-6">Songs</h2>
            <div className="space-y-2 md:space-y-3">
              {playlist.songs.map((song, idx) => (
                <motion.div
                  key={song.id || idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex items-center gap-2 md:gap-4 p-2 md:p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all group"
                >
                  <span className="text-gray-400 dark:text-gray-500 font-medium w-6 md:w-8 text-sm md:text-base">{idx + 1}</span>
                  <img
                    src={song.image?.[1]?.url || song.image?.[0]?.url}
                    alt={song.name}
                    className="w-12 h-12 md:w-14 md:h-14 rounded-lg object-cover shadow-md"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate text-sm md:text-base">{song.name}</h3>
                    <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 truncate">
                      {song.artists?.primary?.map((artist, i) => (
                        <span key={artist.id || i}>
                          <button
                            onClick={() => router.push(`/artists/${artist.id}`)}
                            className="hover:text-[#0097b2] hover:underline transition-colors"
                          >
                            {artist.name}
                          </button>
                          {i < song.artists.primary.length - 1 && ", "}
                        </span>
                      )) || song.primaryArtists || song.artists?.[0]?.name || "Unknown Artist"}
                    </p>
                  </div>
                  {song.duration && (
                    <span className="hidden md:block text-sm text-gray-500 dark:text-gray-400 w-12 text-right">
                      {Math.floor(song.duration / 60)}:{String(Math.floor(song.duration % 60)).padStart(2, '0')}
                    </span>
                  )}
                  <div className="flex items-center gap-1 md:gap-2">
                    <motion.button
                      onClick={() => playSong(song, playlist.songs)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      className="p-1.5 md:p-2 bg-[#0097b2] hover:bg-[#007a93] text-white rounded-full transition-all opacity-100 md:opacity-0 group-hover:opacity-100 shadow-md"
                      title="Play song"
                    >
                      <svg className="w-3 h-3 md:w-4 md:h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                      </svg>
                    </motion.button>
                    <motion.button
                      onClick={() => removeSong(song.id)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      className="p-1.5 md:p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-full transition-all shadow-md"
                      title="Remove from playlist"
                    >
                      <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 md:p-12 text-center"
          >
            <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 md:w-10 md:h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
            <h3 className="text-lg md:text-xl font-bold text-gray-700 dark:text-gray-200 mb-2">No Songs Yet</h3>
            <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mb-6">Start adding songs to this playlist from the dashboard or search</p>
            <button
              onClick={() => router.push("/dashboard")}
              className="bg-[#0097b2] hover:bg-[#007a93] text-white px-6 py-2.5 md:py-3 rounded-full font-medium transition-all text-sm md:text-base"
            >
              Browse Music
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
