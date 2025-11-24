"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { motion } from "framer-motion";
import Link from "next/link";

export default function AlbumsByQuery() {
  const { id: query } = useParams(); // here [id] is treated as query
  const router = useRouter();
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (query) fetchAlbums();
  }, [query]);

  // 🔍 Fetch albums based on query
  const fetchAlbums = async () => {
    try {
      const res = await axios.get(`/api/serenity/albums?query=${query}`);
      const data = res.data?.data?.results || [];
      setAlbums(data);
    } catch (err) {
      console.error("Album search error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return <p className="text-center text-gray-600 mt-20">Loading albums...</p>;

  if (!albums || albums.length === 0)
    return (
      <div className="text-center text-gray-600 mt-20">
        <p>No albums found for "{decodeURIComponent(query)}" 😕</p>
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0097b2]/5 to-white dark:from-gray-900 dark:to-gray-800 text-black dark:text-white px-10 md:px-20 py-16 mt-20 transition-colors">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="mb-8 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-full text-sm text-gray-700 hover:text-black transition-all border border-gray-200"
      >
        ← Back
      </button>

      {/* Page title */}
      <h1 className="text-4xl font-bold mb-8">
        Albums for{" "}
        <span className="text-[#0097b2]">"{decodeURIComponent(query)}"</span>
      </h1>

      {/* Albums Grid - 6 per row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {albums.map((album, i) => (
          <Link
            key={album.id || i}
            href={`/albums/details/${album.url
              ?.split("/")
              .pop()
              ?.replace("_", "")}`}
          >
            <motion.div 
              whileHover={{ y: -5 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-md hover:shadow-xl dark:shadow-gray-900/50 transition-all group"
            >
              <div className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-gray-700">
                <img
                  src={album.image?.[2]?.url || album.image?.[1]?.url}
                  alt={album.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
                
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 flex items-center justify-center">
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
                <h3 className="text-sm font-semibold truncate text-black" title={album.name}>{album.name}</h3>
                <p className="text-gray-600 text-xs truncate">
                  {album.artists?.primary?.map((a) => a.name).join(", ") ||
                    "Various"}
                </p>
              </div>
            </motion.div>
          </Link>
        ))}
      </div>
    </div>
  );
}
