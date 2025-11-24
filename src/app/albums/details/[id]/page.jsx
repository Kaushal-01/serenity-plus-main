"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import axios from "axios";
import { motion } from "framer-motion";
import { usePlayer } from "@/context/PlayerContext";

export default function AlbumDetailsPage() {
  const { id } = useParams();
  const [album, setAlbum] = useState(null);
  const [loading, setLoading] = useState(true);
  const { playSong } = usePlayer();

  useEffect(() => {
    if (id) fetchAlbum();
  }, [id]);

  const fetchAlbum = async () => {
    try {
      const res = await axios.get(`/api/serenity/album?id=${id}`);
      setAlbum(res.data.data);
    } catch (err) {
      console.error("Album load error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p className="text-center text-gray-600 mt-20">Loading album...</p>;
  if (!album) return <p className="text-center text-gray-600 mt-20">Album not found.</p>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0097b2]/5 to-white dark:from-gray-900 dark:to-gray-800 text-black dark:text-white px-10 md:px-20 py-16 mt-20 transition-colors">
      {/* Album Header */}
      <div className="flex flex-col md:flex-row gap-8 items-center mb-10">
        <img
          src={album.image?.[2]?.url || album.image?.[1]?.url}
          alt={album.name}
          className="w-60 h-60 rounded-2xl shadow-lg border border-gray-200"
        />
        <div>
          <h1 className="text-4xl font-bold mb-2 text-black">{album.name}</h1>
          <p className="text-gray-600 mb-3">
            {album.artists?.primary?.map((a) => a.name).join(", ")}
          </p>
          <p className="text-gray-500">{album.songCount} Songs</p>
        </div>
      </div>

      {/* Tracklist */}
      <h2 className="text-2xl font-semibold mb-4 text-[#0097b2]">Tracklist</h2>
      <div className="space-y-3">
        {album.songs?.map((song, i) => (
          <motion.div
            key={song.id || i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center gap-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm hover:shadow-md group"
          >
            <span className="text-gray-400 dark:text-gray-500 font-medium w-8">{i + 1}</span>
            <img
              src={song.image?.[1]?.url || song.image?.[0]?.url || album.image?.[1]?.url}
              alt={song.name}
              className="w-12 h-12 rounded-lg object-cover shadow-md"
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-black dark:text-white truncate">{song.name}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{song.primaryArtists}</p>
            </div>
            {song.duration && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {Math.floor(song.duration / 60)}:{String(Math.floor(song.duration % 60)).padStart(2, '0')}
              </span>
            )}
            <motion.button
              onClick={() => playSong(song, album.songs)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="bg-[#0097b2] hover:bg-[#007a93] text-white rounded-full w-10 h-10 flex items-center justify-center transition-all shadow-md opacity-0 group-hover:opacity-100"
              title="Play song"
            >
              <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
              </svg>
            </motion.button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
