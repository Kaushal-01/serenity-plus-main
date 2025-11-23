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

      {/* Album Grid - 6 per row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {albums.map((album, i) => (
          <motion.div
            key={album.id || i}
            whileHover={{ y: -5 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="group relative bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl cursor-pointer"
          >
            {/* Album Image */}
            <div className="relative aspect-square overflow-hidden bg-gray-100">
              <img
                src={album.image?.[2]?.url || album.image?.[1]?.url}
                alt={album.name}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              />

              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

              {/* Circular Play Button */}
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

            {/* Album Info */}
            <div className="p-4">
              <h3 className="text-gray-900 font-semibold text-sm truncate mb-1" title={album.name}>
                {album.name}
              </h3>
              <p className="text-gray-600 text-xs truncate mb-3" title={album.artists?.primary?.[0]?.name}>
                {album.artists?.primary?.[0]?.name || "Unknown Artist"}
              </p>

              <a
                href={album.url}
                target="_blank"
                className="inline-block text-xs text-emerald-600 hover:text-emerald-700 font-medium hover:underline transition-all"
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
