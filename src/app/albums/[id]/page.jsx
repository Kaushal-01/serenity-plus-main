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
    <div className="min-h-screen bg-white text-black px-10 md:px-20 py-16 mt-20">
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

      {/* Albums Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-8">
        {albums.map((album, i) => (
          <Link
            href={`/albums/details/${album.url
              ?.split("/")
              .pop()
              ?.replace("_", "")}`}
          >
            <motion.div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-all">
              <img
                src={album.image?.[2]?.url || album.image?.[1]?.url}
                alt={album.name}
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <h3 className="text-lg font-semibold truncate text-black">{album.name}</h3>
                <p className="text-gray-600 text-sm truncate">
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
