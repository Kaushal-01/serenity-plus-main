"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { usePlayer } from "@/context/PlayerContext";
import MiniPlayer from "@/context/MiniPlayer";

export default function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState({ songs: [], albums: [], playlists: [] });
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [favLoading, setFavLoading] = useState(false);

  const { playSong } = usePlayer();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) fetchFavorites(token);
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
                    <button
                      onClick={() => playSong(song)}
                      className="mt-3 w-full bg-[#0097b2] hover:bg-[#007a93] text-white px-4 py-2 rounded-full text-sm font-semibold transition-all"
                    >
                      ▶ Play
                    </button>
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
                <motion.div
                  key={album.id || i}
                  whileHover={{ scale: 1.05 }}
                  className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-all"
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
    </section>
  );
}
