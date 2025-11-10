"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { motion } from "framer-motion";
import { usePlayer } from "@/context/PlayerContext";
import GlobalSearch from "./GlobalSearch";
import Link from "next/link";

export default function Dashboard() {
  const router = useRouter();
  const { playSong } = usePlayer();
  const [userName, setUserName] = useState("Music Lover");
  const [featuredAlbums, setFeaturedAlbums] = useState([]);
  const [recommendedSongs, setRecommendedSongs] = useState([]);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [selectedMood, setSelectedMood] = useState(null);

  const moodList = [
    { id: 1, name: "Happy", emoji: "☀️", gradient: "from-yellow-400 via-orange-400 to-pink-500" },
    { id: 2, name: "Sad", emoji: "🌧️", gradient: "from-indigo-600 via-blue-700 to-cyan-500" },
    { id: 3, name: "Calm", emoji: "🌊", gradient: "from-cyan-400 via-sky-500 to-indigo-600" },
    { id: 4, name: "Angry", emoji: "🔥", gradient: "from-red-600 via-orange-500 to-rose-600" },
  ];

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    fetchUser(token);
    fetchAlbums();
    fetchRecommendations(token);
  }, [router]);

  const fetchUser = async (token) => {
    try {
      const res = await axios.get("/api/auth/verify", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) setUserName(res.data.user.name);
    } catch (err) {
      console.error("Error fetching user:", err);
    }
  };

  const fetchAlbums = async () => {
    try {
      const res = await axios.get(`/api/serenity/albums?query=Top%20Hits`);
      setFeaturedAlbums(res.data.data.results.slice(0, 6));
    } catch (err) {
      console.error("Error fetching albums:", err);
    }
  };

  const fetchRecommendations = async (token) => {
    setLoadingRecs(true);
    try {
      const prefRes = await axios.get("/api/user/preferences", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const { preferences } = prefRes.data;
      if (!preferences?.isSetupComplete) {
        router.push("/onboarding");
        return;
      }

      const queries = [
        ...(preferences.genres || []),
        ...(preferences.artists || []),
      ];
      if (queries.length === 0) return;

      const songRequests = queries
        .slice(0, 4)
        .map((q) =>
          axios.get(`/api/serenity/search?query=${encodeURIComponent(q)}`)
        );

      const responses = await Promise.all(songRequests);
      const allSongs = responses.flatMap(
        (res) => res.data.data?.songs?.results?.slice(0, 2) || []
      );

      setRecommendedSongs(allSongs);
    } catch (err) {
      console.error("Error fetching recommendations:", err);
    } finally {
      setLoadingRecs(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#05091a] via-[#0b1030] to-[#000000] text-white overflow-x-hidden mt-20">
      {/* 🎵 Header */}
      <header className="px-10 md:px-16 py-10 flex flex-col md:flex-row justify-between items-center gap-4 backdrop-blur-md bg-white/5 rounded-b-3xl border-b border-white/10">
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent"
        >
           Welcome back, <span className="font-semibold text-white">{userName}👋</span> 
        </motion.h1>
      </header>

      {/* 🌈 Mood Selector */}
      <section className="px-10 md:px-16 py-16 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-8 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
          Tap Your Mood 🎧
        </h2>
        <div className="flex flex-wrap justify-center gap-6">
          {moodList.map(({ id, name, emoji, gradient }) => (
            <motion.button
              key={id}
              onClick={() => router.push(`/dashboard/${name.toLowerCase()}`)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`group relative w-40 h-40 rounded-3xl overflow-hidden transition-all duration-300 bg-gradient-to-br ${gradient} shadow-[0_0_25px_rgba(0,255,200,0.2)] hover:shadow-[0_0_40px_rgba(0,255,200,0.35)]`}
            >
              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm group-hover:backdrop-blur-2xl transition-all"></div>
              <div className="relative z-10 flex flex-col items-center justify-center h-full">
                <span className="text-4xl mb-2">{emoji}</span>
                <span className="text-lg font-semibold">{name}</span>
              </div>
            </motion.button>
          ))}
        </div>
      </section>

      {/* 🔮 Recommended for You */}
      <section className="px-10 md:px-16 py-20">
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold mb-8 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent"
        >
          Recommended for You
        </motion.h2>

        {loadingRecs ? (
          <p className="text-gray-400 text-center animate-pulse">Loading music magic...</p>
        ) : recommendedSongs.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-8">
            {recommendedSongs.map((song, i) => (
              <motion.div
                key={song.id || i}
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.3 }}
                className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden shadow-lg hover:shadow-cyan-500/30 transition-all"
              >
                <img
                  src={song.image?.[1]?.url || song.image?.[0]?.url}
                  alt={song.name}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <h3 className="font-semibold truncate">{song.name}</h3>
                  <p className="text-gray-400 text-sm truncate">
                    {song.primaryArtists || "Unknown Artist"}
                  </p>
                  <button
                    onClick={() => playSong(song)}
                    className="mt-3 w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-blue-500 hover:to-cyan-500 text-white px-4 py-2 rounded-full text-sm transition-all"
                  >
                    🎧 Play
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center">No personalized songs yet 🎶</p>
        )}
      </section>

      {/* 🔥 Trending Albums */}
      <section className="px-10 md:px-16 py-16">
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold mb-8 bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent"
        >
          Trending Albums 🔥
        </motion.h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-8">
          {featuredAlbums.map((album, i) => (
            <Link key={album.id || i} href={`/albums/${encodeURIComponent(album.name)}`}>
              <motion.div
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.3 }}
                className="bg-white/10 border border-white/10 backdrop-blur-md rounded-2xl overflow-hidden hover:shadow-cyan-500/30"
              >
                <img
                  src={album.image?.[2]?.url || album.image?.[1]?.url}
                  alt={album.name}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <h3 className="font-semibold truncate">{album.name}</h3>
                  <p className="text-gray-400 text-sm truncate">
                    {album.artists?.primary?.[0]?.name || "Unknown"}
                  </p>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      </section>

      {/* 🔍 Search */}
      <div className="px-10 md:px-16 py-20">
        <GlobalSearch />
      </div>

      {/* 🌙 Footer */}
      <footer className="text-center text-gray-400 text-sm py-10 border-t border-white/10">
        Made with 💙 by Abhishek Kumar — Serenity
      </footer>
    </div>
  );
}
