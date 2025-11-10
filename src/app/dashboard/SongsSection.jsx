"use client";
import { useState } from "react";
import axios from "axios";

export default function SongsSection() {
  const [query, setQuery] = useState("");
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(false);

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
  const addFavorite = async (song) => {
  const token = localStorage.getItem("token");
  if (!token) {
    router.push("/login");
    return;
  }
  try {
    await axios.post("/api/user/favorites", { song }, {
      headers: { Authorization: `Bearer ${token}` },
    });
    // optional: show toast or update local UI
  } catch (err) {
    console.error("add favorite err", err);
  }
};


  return (
    <div className="mb-10">
      <h2 className="text-2xl font-semibold mb-3">🎵 Songs</h2>
      <div className="flex gap-2">
        <input
          type="text"
          className="border border-gray-500 bg-gray-800 text-white p-2 rounded w-full"
          placeholder="Search for songs..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button
          onClick={searchSongs}
          className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700"
        >
          {loading ? "Loading..." : "Search"}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-6">
        {songs.map((song) => (
          <div
            key={song.id}
            className="bg-gray-800 p-4 rounded-lg hover:bg-gray-700"
          >
            // inside the map for each song
            <button
              onClick={() => addFavorite(song)}
              className="ml-2 bg-yellow-500 text-black px-2 py-1 rounded text-sm"
            >
              + Favorite
            </button>
            <img
              src={song.image?.[1]?.url}
              alt={song.name}
              className="rounded mb-3 w-full"
            />
            <h3 className="font-semibold text-lg">{song.name}</h3>
            <p className="text-gray-400 text-sm">
              {song.artists?.primary?.[0]?.name}
            </p>
            {song.downloadUrl && (
              <a
                href={song.downloadUrl[0].url}
                target="_blank"
                className="text-blue-400 text-sm hover:underline"
              >
                Download
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
