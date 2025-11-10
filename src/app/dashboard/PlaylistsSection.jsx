"use client";
import { useState } from "react";
import axios from "axios";

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
    <div>
      <h2 className="text-2xl font-semibold mb-3">🎧 Playlists</h2>
      <div className="flex gap-2">
        <input
          type="text"
          className="border border-gray-500 bg-gray-800 text-white p-2 rounded w-full"
          placeholder="Search for playlists..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button
          onClick={searchPlaylists}
          className="bg-purple-600 px-4 py-2 rounded hover:bg-purple-700"
        >
          {loading ? "Loading..." : "Search"}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-6">
        {playlists.map((playlist) => (
          <div key={playlist.id} className="bg-gray-800 p-4 rounded-lg hover:bg-gray-700">
            <img
              src={playlist.image?.[1]?.url}
              alt={playlist.name}
              className="rounded mb-3 w-full"
            />
            <h3 className="font-semibold text-lg">{playlist.name}</h3>
            <p className="text-gray-400 text-sm">{playlist.language}</p>
            <a
              href={playlist.url}
              target="_blank"
              className="text-blue-400 text-sm hover:underline"
            >
              Open Playlist →
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
