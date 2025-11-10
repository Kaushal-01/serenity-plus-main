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
    <div className="min-h-screen bg-white text-black px-10 md:px-20 py-16 mt-20">
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
            whileHover={{ scale: 1.02 }}
            className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-3 hover:bg-gray-50 transition-all shadow-sm hover:shadow-md"
          >
            <div>
              <h3 className="font-semibold text-black">{song.name}</h3>
              <p className="text-sm text-gray-600">{song.primaryArtists}</p>
            </div>
            <button
              onClick={() => playSong(song)}
              className="bg-[#0097b2] hover:bg-[#007a93] text-white px-4 py-1.5 rounded-full text-sm transition-all"
            >
              🎵 Play
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
