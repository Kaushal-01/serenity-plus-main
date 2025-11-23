"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { motion } from "framer-motion";
import { usePlayer } from "@/context/PlayerContext";

export default function PlaylistDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [playlist, setPlaylist] = useState(null);
  const [loading, setLoading] = useState(true);
  const { playSong } = usePlayer();

  useEffect(() => {
    if (id) fetchPlaylist();
  }, [id]);

  const fetchPlaylist = async () => {
    try {
      const res = await axios.get(`/api/serenity/playlist?id=${id}`);
      setPlaylist(res.data.data);
    } catch (err) {
      console.error("Playlist load error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p className="text-center text-gray-600 mt-20">Loading playlist...</p>;
  if (!playlist) return <p className="text-center text-gray-600 mt-20">Playlist not found.</p>;

  return (
    <div className="min-h-screen bg-white text-black px-10 md:px-20 py-16 mt-20">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="mb-6 flex items-center gap-2 text-gray-600 hover:text-[#0097b2] transition-all"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back
      </button>

      {/* Playlist Header */}
      <div className="flex flex-col md:flex-row gap-8 items-center mb-10">
        <img
          src={playlist.image?.[2]?.url || playlist.image?.[1]?.url}
          alt={playlist.name}
          className="w-60 h-60 rounded-2xl shadow-lg border border-gray-200"
        />
        <div>
          <h1 className="text-4xl font-bold mb-2 text-black">{playlist.name}</h1>
          {playlist.description && (
            <p className="text-gray-600 mb-3">{playlist.description}</p>
          )}
          <p className="text-gray-500 mb-2">
            {playlist.songCount || playlist.songs?.length || 0} Songs
          </p>
          {playlist.language && (
            <p className="text-gray-500">{playlist.language}</p>
          )}
        </div>
      </div>

      {/* Tracklist */}
      <h2 className="text-2xl font-semibold mb-4 text-[#0097b2]">Songs</h2>
      {playlist.songs && playlist.songs.length > 0 ? (
        <div className="space-y-3">
          {playlist.songs.map((song, i) => (
            <motion.div
              key={song.id || i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-4 bg-white border border-gray-200 rounded-xl px-4 py-3 hover:bg-gray-50 transition-all shadow-sm hover:shadow-md group"
            >
              <span className="text-gray-400 font-medium w-8">{i + 1}</span>
              <img
                src={song.image?.[1]?.url || song.image?.[0]?.url || playlist.image?.[1]?.url}
                alt={song.name}
                className="w-12 h-12 rounded-lg object-cover shadow-md"
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-black truncate">{song.name}</h3>
                <p className="text-sm text-gray-600 truncate">
                  {song.primaryArtists || song.artists?.primary?.map(a => a.name).join(", ")}
                </p>
              </div>
              {song.duration && (
                <span className="text-sm text-gray-500">
                  {Math.floor(song.duration / 60)}:{String(Math.floor(song.duration % 60)).padStart(2, '0')}
                </span>
              )}
              <motion.button
                onClick={() => playSong(song, playlist.songs)}
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
      ) : (
        <p className="text-center text-gray-600">No songs available in this playlist.</p>
      )}
    </div>
  );
}
