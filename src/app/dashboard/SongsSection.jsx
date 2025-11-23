"use client";
import { useState } from "react";
import axios from "axios";
import { usePlayer } from "@/context/PlayerContext";
import SongCard from "@/components/SongCard";

export default function SongsSection() {
  const [query, setQuery] = useState("");
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(false);
  const { playSong } = usePlayer();

  const searchSongs = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await axios.get(`/api/serenity/search?query=${query}`);
      setSongs(res.data.data.results || []);
    } catch (error) {
      console.error("Song fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mb-16">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-500 bg-clip-text text-transparent">
          🎵 Discover Songs
        </h2>

        <div className="flex items-center gap-2 mt-3 sm:mt-0">
          <input
            type="text"
            className="border border-gray-700 bg-gray-900/70 text-white p-2 px-4 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400 w-72"
            placeholder="Search for songs..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && searchSongs()}
          />
          <button
            onClick={searchSongs}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold px-5 py-2 rounded-full hover:from-blue-400 hover:to-purple-500 transition-all"
          >
            {loading ? "Loading..." : "Search"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {songs.map((song) => (
          <SongCard
            key={song.id}
            song={song}
            onPlay={(s) => playSong(s, songs)}
          />
        ))}
      </div>

      {songs.length === 0 && !loading && (
        <div className="text-center mt-16 text-gray-400">
          <p className="text-lg">Search for your favorite songs 🎶</p>
        </div>
      )}
    </section>
  );
}
