"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { usePlayer } from "@/context/PlayerContext";
import MiniPlayer from "@/context/MiniPlayer";

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

  const searchAll = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await axios.get(`/api/serenity/search?query=${encodeURIComponent(query)}`);
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

  useEffect(() => {
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
    loadDefault();
  }, []);

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
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 text-center sm:text-left">
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-4xl font-extrabold text-[#0097b2]"
        >
          Explore Music 🌐
        </motion.h2>

        <div className="flex items-center justify-center gap-3 mt-5 sm:mt-0">
          <input
            type="text"
            placeholder="Search songs, albums or playlists..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && searchAll()}
            className="border border-gray-300 bg-white text-black px-5 py-2 rounded-full focus:outline-none focus:ring-2 focus:ring-[#0097b2] w-80 placeholder-gray-500"
          />
          <button
            onClick={searchAll}
            className="bg-[#0097b2] hover:bg-[#007a93] text-white font-semibold px-6 py-2 rounded-full transition-all"
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </div>
      </div>

      {/* 🌀 Results Section */}
      <div className="relative z-10 space-y-20">
        {/* 🎧 Songs */}
        {results.songs.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            <h3 className="text-3xl font-semibold mb-6 text-[#0097b2]">
              🎧 Songs
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-8">
              {results.songs.slice(0, 10).map((song, i) => (
                <motion.div
                  key={song.id || i}
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="group relative bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-all"
                >
                  {/* ❤️ Favorite */}
                  <button
                    onClick={() => toggleFavorite(song)}
                    disabled={favLoading}
                    className={`absolute z-100 top-3 right-3 p-2 rounded-full ${
                      isFavorite(song.id)
                        ? "bg-red-500 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-red-500 hover:text-white"
                    }`}
                  >
                    {isFavorite(song.id) ? "❤️" : "🤍"}
                  </button>

                  <img
                    src={song.image?.[1]?.url || song.image?.[0]?.url || "/default-song.jpg"}
                    alt={song.name}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
                  />

                  <div className="p-4 text-center">
                    <h4 className="font-semibold truncate text-black">{song.name}</h4>
                    <p className="text-gray-600 text-sm truncate">
                      {song.primaryArtists || "Unknown Artist"}
                    </p>
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => playSong(song)}
                        className="flex-1 bg-[#0097b2] hover:bg-[#007a93] text-white px-3 py-2 rounded-full text-xs font-semibold transition-all"
                      >
                        ▶ Play
                      </button>
                      <button
                        onClick={() => openPlaylistModal(song)}
                        className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-all"
                        title="Add to playlist"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* 💿 Albums */}
        {results.albums.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            <h3 className="text-3xl font-semibold mb-6 text-[#0097b2]">
              💿 Albums
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-8">
              {results.albums.slice(0, 10).map((album, i) => (
                <a key={album.id || i} href={`/albums/details/${encodeURIComponent(album.id)}`}>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-all cursor-pointer"
                  >
                    <img
                      src={album.image?.[1]?.url || album.image?.[0]?.url || "/default-album.jpg"}
                      alt={album.name}
                      className="w-full h-48 object-cover hover:scale-105 transition-transform duration-500"
                    />
                    <div className="p-4 text-center">
                      <h4 className="font-semibold truncate text-black">{album.name}</h4>
                      <p className="text-gray-600 text-sm truncate">
                        {album.primaryArtists || "Unknown Artist"}
                      </p>
                    </div>
                  </motion.div>
                </a>
              ))}
            </div>
          </motion.div>
        )}

        {/* 🎶 Playlists */}
        {results.playlists.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            <h3 className="text-3xl font-semibold mb-6 text-[#0097b2]">
              🎶 Playlists
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-8">
              {results.playlists.slice(0, 10).map((pl, i) => (
                <motion.div
                  key={pl.id || i}
                  whileHover={{ scale: 1.05 }}
                  className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-all"
                >
                  <img
                    src={pl.image?.[1]?.url || pl.image?.[0]?.url || "/default-playlist.jpg"}
                    alt={pl.name}
                    className="w-full h-48 object-cover hover:scale-105 transition-transform duration-500"
                  />
                  <div className="p-4 text-center">
                    <h4 className="font-semibold truncate text-black">{pl.name}</h4>
                    <p className="text-gray-600 text-sm truncate">
                      {pl.language || "Mixed Languages"}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Empty */}
        {!loading &&
          !results.songs.length &&
          !results.albums.length &&
          !results.playlists.length && (
            <p className="text-gray-600 text-center text-lg mt-20">
              Start typing to explore your favorite music 🎶
            </p>
          )}
      </div>

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
              className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Add to Playlist</h3>
              <p className="text-sm text-gray-600 mb-6">
                Adding: <strong>{selectedSong?.name}</strong>
              </p>

              {userPlaylists.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">You don't have any playlists yet.</p>
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
                      className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all text-left group"
                    >
                      <div>
                        <h4 className="font-semibold text-gray-900">{playlist.name}</h4>
                        <p className="text-xs text-gray-600">
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
                className="mt-6 w-full bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium transition-all"
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
