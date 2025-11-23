"use client";
import { useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import Link from "next/link";

export default function PlaylistsSection() {
  const [query, setQuery] = useState("");
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(false);

  const searchPlaylists = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await axios.get(`/api/serenity/playlists?query=${query}`);
      setPlaylists(res.data.data.results || []);
    } catch (error) {
      console.error("Playlist fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mt-16">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-red-500 bg-clip-text text-transparent">
          🎧 Curated Playlists
        </h2>

        <div className="flex items-center gap-2 mt-3 sm:mt-0">
          <input
            type="text"
            className="border border-gray-700 bg-gray-900/70 text-white p-2 px-4 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-400 w-72"
            placeholder="Search for playlists..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && searchPlaylists()}
          />
          <button
            onClick={searchPlaylists}
            className="bg-gradient-to-r from-purple-500 to-pink-600 text-white font-semibold px-5 py-2 rounded-full hover:from-purple-400 hover:to-pink-500 transition-all"
          >
            {loading ? "Loading..." : "Search"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {playlists.map((playlist, i) => (
          <Link key={playlist.id || i} href={`/playlists/details/${encodeURIComponent(playlist.id)}`}>
            <motion.div
              whileHover={{ y: -5 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="group relative bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl cursor-pointer"
            >
              <div className="relative aspect-square overflow-hidden bg-gray-100">
                <img
                  src={playlist.image?.[2]?.url || playlist.image?.[1]?.url}
                  alt={playlist.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[#0097b2] hover:bg-[#007a93] rounded-full w-12 h-12 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg"
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

              <div className="p-4">
                <h3 className="text-gray-900 font-semibold text-sm truncate mb-1" title={playlist.name}>
                  {playlist.name}
                </h3>
                <p className="text-gray-600 text-xs truncate mb-3">
                  {playlist.language || "Multi-language"}
                </p>

                <span className="inline-block text-xs text-purple-600 font-medium transition-all">
                  View Playlist →
                </span>
              </div>
            </motion.div>
          </Link>
        ))}
      </div>

      {playlists.length === 0 && !loading && (
        <div className="text-center mt-16 text-gray-400">
          <p className="text-lg">Search for curated playlists 🎶</p>
        </div>
      )}
    </section>
  );
}
