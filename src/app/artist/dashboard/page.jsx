"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { Music, TrendingUp, Calendar, Users, Play, Trash2, X } from "lucide-react";
import { usePlayer } from "@/context/PlayerContext";

export default function ArtistDashboardPage() {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalPlays: 0, totalListeners: 0, totalSongs: 0 });
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [songToDelete, setSongToDelete] = useState({ id: null, name: "", plays: 0, listeners: 0 });
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();
  const { playSong } = usePlayer();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    fetchSongs();
  }, []);

  const fetchSongs = async () => {
    try {
      const token = localStorage.getItem("token");
      // Exclude audio files to reduce latency and memory usage
      const res = await axios.get("/api/artist/songs?excludeAudio=true", {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data.success) {
        setSongs(res.data.songs);
        
        // Calculate stats
        const totalPlays = res.data.songs.reduce((sum, song) => sum + song.totalPlays, 0);
        const totalListeners = new Set(
          res.data.songs.flatMap(song => song.listenerCount)
        ).size;
        
        setStats({
          totalPlays,
          totalListeners,
          totalSongs: res.data.songs.length
        });
      }
    } catch (err) {
      console.error("Fetch songs error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePlay = async (song) => {
    // Fetch full song data with audio only when playing
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`/api/artist/songs?artistId=${song.uploadedBy._id || song.uploadedBy}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data.success) {
        const fullSong = res.data.songs.find(s => s._id === song._id);
        if (fullSong) {
          const formattedSong = {
            id: fullSong._id,
            name: fullSong.songName,
            primaryArtists: fullSong.artistName,
            image: [{ url: fullSong.coverPhoto }],
            downloadUrl: [{ url: fullSong.audioFile }],
            duration: fullSong.duration
          };
          playSong(formattedSong, [formattedSong]);
        }
      }
    } catch (err) {
      console.error("Error loading song for playback:", err);
      // Fallback: try to play with cached data if available
      const formattedSong = {
        id: song._id,
        name: song.songName,
        primaryArtists: song.artistName,
        image: [{ url: song.coverPhoto }],
        downloadUrl: [{ url: song.audioFileUrl || song.audioFile }],
        duration: song.duration
      };
      playSong(formattedSong, [formattedSong]);
    }
  };

  const handleDeleteClick = (song) => {
    // Only store minimal data - avoid passing large audio files
    setSongToDelete({
      id: song._id,
      name: song.songName,
      plays: song.totalPlays,
      listeners: song.listenerCount
    });
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!songToDelete.id) return;
    
    setIsDeleting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.delete(`/api/artist/songs?id=${songToDelete.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        // Remove song from local state
        setSongs(prevSongs => prevSongs.filter(s => s._id !== songToDelete.id));
        
        // Update stats
        setStats(prevStats => ({
          ...prevStats,
          totalSongs: prevStats.totalSongs - 1,
          totalPlays: prevStats.totalPlays - songToDelete.plays,
          totalListeners: prevStats.totalListeners - songToDelete.listeners
        }));

        // Close modal
        setDeleteModalOpen(false);
        setSongToDelete({ id: null, name: "", plays: 0, listeners: 0 });
      }
    } catch (err) {
      console.error("Delete song error:", err);
      alert(err.response?.data?.error || "Failed to delete song");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModalOpen(false);
    setSongToDelete({ id: null, name: "", plays: 0, listeners: 0 });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20 pb-24 flex items-center justify-center">
        <div className="w-12 h-12 border-3 border-[#0097b2] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-28 pb-24 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 text-center"
        >
          <h1 className="text-3xl md:text-4xl font-bold mb-3 inline-block px-8 py-3 bg-gradient-to-r from-[#0097b2] to-[#00b8d4] text-white rounded-xl shadow-lg">
            Artist Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base mt-4">
            Manage your music and track performance
          </p>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-[#0097b2] to-[#00b8d4] rounded-xl flex items-center justify-center">
                <Music className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Songs</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalSongs}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Plays</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalPlays}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Listeners</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalListeners}</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Upload Button */}
        <div className="mb-6">
          <button
            onClick={() => router.push("/artist/upload")}
            className="px-6 py-3 bg-gradient-to-r from-[#0097b2] to-[#00b8d4] hover:from-[#007a93] hover:to-[#0097b2] text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl"
          >
            + Upload New Song
          </button>
        </div>

        {/* Songs List */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg"
        >
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-6">Your Songs</h2>
          
          {songs.length === 0 ? (
            <div className="text-center py-12">
              <Music className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400 text-base mb-6">No songs uploaded yet</p>
              <button
                onClick={() => router.push("/artist/upload")}
                className="px-6 py-2.5 bg-[#0097b2] hover:bg-[#007a93] text-white rounded-lg transition-all shadow-md hover:shadow-lg font-medium"
              >
                Upload Your First Song
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {songs.map((song, idx) => (
                <motion.div
                  key={song._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-all group"
                >
                  <button
                    onClick={() => handlePlay(song)}
                    className="w-16 h-16 bg-gradient-to-br from-[#0097b2] to-[#00b8d4] rounded-lg flex items-center justify-center overflow-hidden relative group"
                  >
                    <img src={song.coverPhoto} alt={song.songName} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Play className="w-6 h-6 text-white" />
                    </div>
                  </button>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base text-gray-900 dark:text-white truncate">{song.songName}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{song.artistName}</p>
                    <div className="flex items-center gap-4 mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(song.uploadedAt).toLocaleDateString()}
                      </span>
                      {song.genre && <span>• {song.genre}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-right space-y-1 mr-2">
                      <div className="flex items-center justify-end gap-2 text-gray-700 dark:text-gray-300">
                        <TrendingUp className="w-4 h-4 text-[#0097b2]" />
                        <span className="text-sm font-medium">{song.totalPlays} plays</span>
                      </div>
                      <div className="flex items-center justify-end gap-2 text-gray-700 dark:text-gray-300">
                        <Users className="w-4 h-4 text-green-500" />
                        <span className="text-sm">{song.listenerCount} listeners</span>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleDeleteClick(song)}
                      className="w-9 h-9 rounded-lg flex items-center justify-center bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 transition-all opacity-0 group-hover:opacity-100"
                      title="Delete song"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={handleDeleteCancel}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                  <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                    Delete Song?
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Are you sure you want to delete <strong>"{songToDelete.name}"</strong>? 
                    This will permanently remove it from your library and all users' favorites, playlists, and listening history.
                  </p>
                  <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                    This action cannot be undone.
                  </p>
                </div>
                <button
                  onClick={handleDeleteCancel}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                  disabled={isDeleting}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={handleDeleteCancel}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
