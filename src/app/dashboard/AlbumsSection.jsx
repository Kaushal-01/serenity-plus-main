"use client";
import { useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";

export default function AlbumsSection() {
  const [query, setQuery] = useState("");
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(false);

  const searchAlbums = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await axios.get(`/api/serenity/albums?query=${query}`);
      setAlbums(res.data.data.results || []);
    } catch (error) {
      console.error("Album fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mt-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-green-400 via-emerald-400 to-teal-500 bg-clip-text text-transparent">
          💿 Discover Albums
        </h2>

        <div className="flex items-center gap-2 mt-3 sm:mt-0">
          <input
            type="text"
            className="border border-gray-700 bg-gray-900/70 text-white p-2 px-4 rounded-full focus:outline-none focus:ring-2 focus:ring-green-400 w-72"
            placeholder="Search for albums..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            onClick={searchAlbums}
            className="bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold px-5 py-2 rounded-full hover:from-green-400 hover:to-emerald-500 transition-all"
          >
            {loading ? "Loading..." : "Search"}
          </button>
        </div>
      </div>

      {/* Album Grid */}
      <div
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6"
      >
        {albums.map((album, i) => (
          <motion.div
            key={album.id || i}
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="group relative bg-gradient-to-b from-gray-800 to-gray-900 rounded-2xl overflow-hidden shadow-lg hover:shadow-emerald-400/40 cursor-pointer"
          >
            {/* Album Image */}
            <div className="relative">
              <img
                src={album.image?.[2]?.url || album.image?.[1]?.url}
                alt={album.name}
                className="w-full h-56 object-cover transition-transform duration-300 group-hover:scale-110"
              />

              {/* Overlay Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-70 group-hover:opacity-90 transition-opacity duration-300"></div>

              {/* Play Button */}
              <motion.div
                whileHover={{ scale: 1.1 }}
                className="absolute bottom-4 right-4 bg-green-500 rounded-full w-10 h-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="white"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="none"
                  className="w-5 h-5"
                >
                  <path d="M5 3l14 9-14 9V3z" />
                </svg>
              </motion.div>
            </div>

            {/* Album Info */}
            <div className="p-4 flex flex-col">
              <h3 className="text-white font-semibold text-lg truncate">
                {album.name}
              </h3>
              <p className="text-gray-400 text-sm truncate">
                {album.artists?.primary?.[0]?.name || "Unknown Artist"}
              </p>

              <a
                href={album.url}
                target="_blank"
                className="mt-3 inline-block text-sm text-emerald-400 hover:text-emerald-300 transition-all"
              >
                View Album →
              </a>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {albums.length === 0 && !loading && (
        <div className="text-center mt-16 text-gray-400">
          <p className="text-lg">Search for your favorite albums 🎶</p>
        </div>
      )}
    </section>
  );
}
