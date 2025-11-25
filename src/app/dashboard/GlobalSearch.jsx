"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { usePlayer } from "@/context/PlayerContext";
import MiniPlayer from "@/context/MiniPlayer";
import SongCard from "@/components/SongCard";
import Link from "next/link";
import { Music2, Lightbulb, Disc3, ListMusic } from "lucide-react";

export default function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState({ songs: [], albums: [], playlists: [] });
  const [favorites, setFavorites] = useState([]);
  const [userPlaylists, setUserPlaylists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [selectedSong, setSelectedSong] = useState(null);

  const { playSong } = usePlayer();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      fetchFavorites(token);
      fetchPlaylists(token);
    }
  }, []);

  const fetchFavorites = async (token) => {
    try {
      const res = await axios.get("/api/user/favorites", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFavorites(res.data.favorites || []);
    } catch (err) {
      console.error("fetch favorites err", err);
    }
  };

  const fetchPlaylists = async (token) => {
    try {
      const res = await axios.get("/api/user/playlists", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUserPlaylists(res.data.playlists || []);
    } catch (err) {
      console.error("fetch playlists err", err);
    }
  };

  const searchAll = async (searchQuery) => {
    const queryToSearch = searchQuery || query;
    if (!queryToSearch.trim()) {
      // Load default trending if query is empty
      loadDefault();
      return;
    }
    setLoading(true);
    try {
      const res = await axios.get(`/api/serenity/search?query=${encodeURIComponent(queryToSearch)}`);
      const data = res.data.data;
      if (Array.isArray(data.results)) {
        setResults({ songs: data.results || [], albums: [], playlists: [] });
      } else {
        setResults({
          songs: data.songs?.results || data.songs || [],
          albums: data.albums?.results || data.albums || [],
          playlists: data.playlists?.results || data.playlists || [],
        });
      }
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadDefault = async () => {
    try {
      const res = await axios.get(`/api/serenity/search?query=trending`);
      const data = res.data.data;
      if (Array.isArray(data.results)) {
        setResults({ songs: data.results || [], albums: [], playlists: [] });
      } else {
        setResults({
          songs: data.songs?.results || data.songs || [],
          albums: data.albums?.results || data.albums || [],
          playlists: data.playlists?.results || data.playlists || [],
        });
      }
    } catch (err) {
      console.error("Default search load error:", err);
    }
  };

  // Load default trending on mount
  useEffect(() => {
    loadDefault();
  }, []);

  // Real-time search with debouncing
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (query.trim()) {
        searchAll(query);
      } else {
        loadDefault();
      }
    }, 500); // 500ms delay

    return () => clearTimeout(debounceTimer);
  }, [query]);

  const toggleFavorite = async (song) => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please log in to add favorites.");
      return;
    }

    const isFav = favorites.some((f) => f.id === song.id);
    setFavLoading(true);
    try {
      if (isFav) {
        await axios.delete(`/api/user/favorites?id=${encodeURIComponent(song.id)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setFavorites((prev) => prev.filter((f) => f.id !== song.id));
      } else {
        await axios.post("/api/user/favorites", { song }, { headers: { Authorization: `Bearer ${token}` } });
        setFavorites((prev) => [...prev, song]);
      }
    } catch (err) {
      console.error("toggle favorite err", err);
    } finally {
      setFavLoading(false);
    }
  };

  const isFavorite = (songId) => favorites.some((f) => f.id === songId);

  const openPlaylistModal = (song) => {
    setSelectedSong(song);
    setShowPlaylistModal(true);
  };

  const addToPlaylist = async (playlistId) => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please log in to add songs to playlists.");
      return;
    }

    try {
      await axios.post(
        "/api/user/playlists/songs",
        { playlistId, song: selectedSong },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Song added to playlist!");
      setShowPlaylistModal(false);
      setSelectedSong(null);
    } catch (err) {
      console.error("add to playlist err", err);
      alert(err.response?.data?.error || "Failed to add song to playlist");
    }
  };

  return (
    <section className="mt-20 relative">
      {/* 🔍 Search Header */}
      <div className="relative z-10 mb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <h2 className="text-5xl font-extrabold bg-gradient-to-r from-[#0097b2] via-[#00b8d4] to-[#0097b2] bg-clip-text text-transparent mb-3 flex items-center justify-center gap-3">
            Explore Music <Music2 size={48} strokeWidth={2.5} className="text-[#0097b2]" />
          </h2>
          <p className="text-gray-600 text-lg">Discover your next favorite song, album, or playlist</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="max-w-3xl mx-auto"
        >
          <div className="relative">
            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search songs, albums, playlists, or artists..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && searchAll()}
              className="w-full pl-14 pr-6 py-4 text-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-black dark:text-white rounded-2xl 
              focus:outline-none focus:border-[#0097b2] focus:ring-4 focus:ring-[#0097b2]/20 
              placeholder-gray-400 dark:placeholder-gray-500 transition-all shadow-sm hover:shadow-md"
            />
            {loading && (
              <div className="absolute inset-y-0 right-5 flex items-center">
                <div className="w-6 h-6 border-3 border-[#0097b2] border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
            {query && !loading && (
              <button
                onClick={() => setQuery("")}
                className="absolute inset-y-0 right-5 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          <div className="flex items-center justify-center gap-2 mt-4 text-sm text-gray-500 dark:text-gray-400">
            <Lightbulb size={16} strokeWidth={2} />
            <span>Tip: Results appear as you type</span>
          </div>
        </motion.div>
      </div>

      {/* 🌀 Results Section */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <div className="relative">
              <div className="w-16 h-16 border-4 border-gray-200 border-t-[#0097b2] rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="w-8 h-8 text-[#0097b2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              </div>
            </div>
            <p className="mt-6 text-gray-600 text-lg font-medium">Searching for amazing music...</p>
          </motion.div>
        ) : (
          <div className="relative z-10 space-y-16">
            {/* 🎧 Songs */}
            {results.songs.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#0097b2] to-[#00b8d4] rounded-xl flex items-center justify-center">
                    <Music2 size={24} strokeWidth={2} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold text-[#0097b2]">Songs</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{results.songs.length} results found</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {results.songs.slice(0, 12).map((song, i) => (
                    <motion.div
                      key={song.id || i}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.05, duration: 0.3 }}
                    >
                      <SongCard
                        song={song}
                        allSongs={results.songs}
                        onPlay={(s) => playSong(s, results.songs)}
                        isFavorite={isFavorite(song.id)}
                        onToggleFavorite={() => toggleFavorite(song)}
                        onAddToPlaylist={() => openPlaylistModal(song)}
                        showFavoriteButton={true}
                        showAddToPlaylistButton={true}
                      />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* 💿 Albums */}
            {results.albums.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#0097b2] to-[#00b8d4] rounded-xl flex items-center justify-center">
                    <Disc3 size={24} strokeWidth={2} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold text-[#0097b2]">Albums</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{results.albums.length} albums found</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {results.albums.slice(0, 12).map((album, i) => (
                    <motion.div
                      key={album.id || i}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.05, duration: 0.3 }}
                    >
                      <a href={`/albums/details/${encodeURIComponent(album.id)}`}>
                        <motion.div
                          whileHover={{ y: -5 }}
                          transition={{ type: "spring", stiffness: 300, damping: 20 }}
                          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-md hover:shadow-xl dark:shadow-gray-900/50 transition-all group"
                        >
                    <div className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-gray-700">
                      <img
                        src={album.image?.[2]?.url || album.image?.[1]?.url || "/default-album.jpg"}
                        alt={album.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          className="bg-[#0097b2] hover:bg-[#007a93] rounded-full w-12 h-12 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="white"
                            viewBox="0 0 24 24"
                            className="w-6 h-6 ml-1"
                          >
                            <path d="M5 3l14 9-14 9V3z" />
                          </svg>
                        </motion.div>
                      </div>
                    </div>
                          <div className="p-4">
                            <h4 className="font-semibold text-sm truncate text-black dark:text-white" title={album.name}>{album.name}</h4>
                            <p className="text-gray-600 dark:text-gray-400 text-xs truncate">
                              {album.primaryArtists || "Unknown Artist"}
                            </p>
                          </div>
                        </motion.div>
                      </a>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* 🎶 Playlists */}
            {results.playlists.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#0097b2] to-[#00b8d4] rounded-xl flex items-center justify-center">
                    <ListMusic size={24} strokeWidth={2} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold text-[#0097b2]">Playlists</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{results.playlists.length} playlists found</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {results.playlists.slice(0, 12).map((pl, i) => (
                    <Link key={pl.id || i} href={`/playlists/details/${encodeURIComponent(pl.id)}`}>
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05, duration: 0.3 }}
                        whileHover={{ y: -5 }}
                        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-md hover:shadow-xl dark:shadow-gray-900/50 transition-all group cursor-pointer"
                      >
                        <div className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-gray-700">
                          <img
                            src={pl.image?.[2]?.url || pl.image?.[1]?.url || "/default-playlist.jpg"}
                            alt={pl.name}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
                            <div className="bg-[#0097b2] hover:bg-[#007a93] rounded-full w-12 h-12 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="white"
                                viewBox="0 0 24 24"
                                className="w-6 h-6 ml-1"
                              >
                                <path d="M5 3l14 9-14 9V3z" />
                              </svg>
                            </div>
                          </div>
                        </div>
                        <div className="p-4">
                          <h4 className="font-semibold text-sm truncate text-black dark:text-white" title={pl.name}>{pl.name}</h4>
                          <p className="text-gray-600 dark:text-gray-400 text-xs truncate">
                            {pl.language || "Mixed Languages"}
                          </p>
                        </div>
                      </motion.div>
                    </Link>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Empty State */}
            {!results.songs.length &&
              !results.albums.length &&
              !results.playlists.length && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center py-20"
                >
                  <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-6">
                    <svg className="w-12 h-12 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No results found</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-lg text-center max-w-md">
                    {query ? `We couldn't find anything matching "${query}". Try a different search term.` : "Start typing to discover amazing music"}
                  </p>
                </motion.div>
              )}
          </div>
        )}
      </AnimatePresence>

      {/* Add to Playlist Modal */}
      <AnimatePresence>
        {showPlaylistModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowPlaylistModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full shadow-2xl max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Add to Playlist</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                Adding: <strong>{selectedSong?.name}</strong>
              </p>

              {userPlaylists.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600 dark:text-gray-400 mb-4">You don't have any playlists yet.</p>
                  <button
                    onClick={() => {
                      setShowPlaylistModal(false);
                      window.location.href = "/playlists";
                    }}
                    className="bg-[#0097b2] hover:bg-[#007a93] text-white px-6 py-2 rounded-full font-medium transition-all"
                  >
                    Create Playlist
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {userPlaylists.map((playlist) => (
                    <button
                      key={playlist._id}
                      onClick={() => addToPlaylist(playlist._id)}
                      className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-xl transition-all text-left group"
                    >
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">{playlist.name}</h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {playlist.songs?.length || 0} songs
                        </p>
                      </div>
                      <svg className="w-5 h-5 text-gray-400 group-hover:text-[#0097b2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  ))}
                </div>
              )}

              <button
                onClick={() => {
                  setShowPlaylistModal(false);
                  setSelectedSong(null);
                }}
                className="mt-6 w-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg font-medium transition-all"
              >
                Cancel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
