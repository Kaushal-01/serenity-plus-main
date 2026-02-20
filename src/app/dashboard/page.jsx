"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { motion } from "framer-motion";
import { usePlayer } from "@/context/PlayerContext";
import SongCard from "@/components/SongCard";
import { Sun, CloudRain, Waves, Flame, Sparkles, TrendingUp, Headphones, History } from "lucide-react";

export default function Dashboard() {
  const router = useRouter();
  const { playSong } = usePlayer();
  const [userName, setUserName] = useState("Music Lover");
  const [recommendedSongs, setRecommendedSongs] = useState([]);
  const [trendingSongs, setTrendingSongs] = useState([]);
  const [listeningHistory, setListeningHistory] = useState([]);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [loadingTrending, setLoadingTrending] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedMood, setSelectedMood] = useState(null);
  const [favorites, setFavorites] = useState([]);

  const moodList = [
    { id: 1, name: "Happy", Icon: Sun, gradient: "from-yellow-300 via-amber-400 to-orange-500" },
    { id: 2, name: "Sad", Icon: CloudRain, gradient: "from-slate-500 via-gray-600 to-blue-800" },
    { id: 3, name: "Calm", Icon: Waves, gradient: "from-emerald-300 via-teal-400 to-cyan-500" },
    { id: 4, name: "Angry", Icon: Flame, gradient: "from-rose-500 via-red-600 to-pink-700" },
  ];

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    fetchUser(token);
    fetchRecommendations(token);
    fetchFavorites(token);
    fetchTrendingSongs();
    fetchListeningHistory(token);
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

  const fetchTrendingSongs = async () => {
    setLoadingTrending(true);
    try {
      const res = await axios.get("/api/user/trending");
      if (res.data.success) {
        setTrendingSongs(res.data.songs || []);
      }
    } catch (err) {
      console.error("Error fetching trending songs:", err);
    } finally {
      setLoadingTrending(false);
    }
  };

  const fetchListeningHistory = async (token) => {
    setLoadingHistory(true);
    try {
      const res = await axios.get("/api/user/listening-history", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        setListeningHistory(res.data.songs || []);
      }
    } catch (err) {
      console.error("Error fetching listening history:", err);
    } finally {
      setLoadingHistory(false);
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
        (res) => res.data.data?.songs?.results || []
      );

      // Deduplicate songs by ID and ensure exactly 12 songs
      const uniqueSongs = Array.from(
        new Map(allSongs.map(song => [song.id, song])).values()
      );
      
      setRecommendedSongs(uniqueSongs.slice(0, 12));
    } catch (err) {
      console.error("Error fetching recommendations:", err);
    } finally {
      setLoadingRecs(false);
    }
  };

  const fetchFavorites = async (token) => {
    try {
      const res = await axios.get("/api/user/favorites", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFavorites(res.data.favorites || []);
    } catch (err) {
      console.error("Error fetching favorites:", err);
    }
  };

  const toggleFavorite = async (song) => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please log in to add favorites.");
      return;
    }

    const isFav = favorites.some((f) => f.id === song.id);
    try {
      if (isFav) {
        await axios.delete(`/api/user/favorites?id=${encodeURIComponent(song.id)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setFavorites((prev) => prev.filter((f) => f.id !== song.id));
      } else {
        await axios.post("/api/user/favorites", { song }, { headers: { Authorization: `Bearer ${token}` } });
        setFavorites((prev) => [...prev, song]);
      }
    } catch (err) {
      console.error("Toggle favorite error:", err);
    }
  };

  const isFavorite = (songId) => favorites.some((f) => f.id === songId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0097b2]/5 to-white dark:from-gray-900 dark:to-gray-800 text-black dark:text-white overflow-x-hidden mt-20 pb-40 md:pb-0 transition-colors">
      {/* 🎵 Header */}
      <header className="px-10 md:px-16 py-10 flex flex-col md:flex-row justify-between items-center gap-4 bg-gray-50 dark:bg-gray-800 rounded-b-3xl border-b border-gray-200 dark:border-gray-700">
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-2xl md:text-4xl font-extrabold tracking-tight text-black dark:text-white"
        >
           Welcome back, <span className="font-semibold text-[#0097b2]">{userName}</span> 
        </motion.h1>
      </header>

      {/* 🌈 Mood Selector */}
      <section className="px-10 md:px-16 py-16 text-center bg-gradient-to-b from-gray-50 dark:from-gray-800/50 to-white dark:to-gray-900/50">
        <motion.h2
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl md:text-4xl font-bold mb-3 text-[#0097b2] flex items-center justify-center gap-3"
        >
          Tap Your Mood <Headphones size={36} strokeWidth={2} />
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-gray-600 dark:text-gray-300 mb-8 text-sm md:text-base"
        >
          Let your emotions guide your music journey
        </motion.p>
        <div className="flex flex-wrap justify-center gap-6">
          {moodList.map(({ id, name, Icon, gradient }, index) => (
            <motion.button
              key={id}
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: index * 0.1, type: "spring", stiffness: 200 }}
              onClick={() => router.push(`/dashboard/${name.toLowerCase()}`)}
              whileHover={{ scale: 1.08, rotate: 2 }}
              whileTap={{ scale: 0.92 }}
              className={`group relative w-40 h-40 rounded-3xl overflow-hidden transition-all duration-300 bg-gradient-to-br ${gradient} shadow-lg hover:shadow-2xl border-2 border-white/50`}
            >
              <div className="absolute inset-0 bg-white/20 group-hover:bg-white/10 transition-all"></div>
              <motion.div
                className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
              ></motion.div>
              <div className="relative z-10 flex flex-col items-center justify-center h-full text-white drop-shadow-lg">
                <motion.div
                  className="mb-3"
                  whileHover={{ scale: 1.2, rotate: 10 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Icon size={56} strokeWidth={2} />
                </motion.div>
                <span className="text-lg font-bold tracking-wide">{name}</span>
              </div>
            </motion.button>
          ))}
        </div>
      </section>

      {/* 🔮 Recommended for You */}
      <section className="px-10 md:px-16 py-12 bg-white dark:bg-gray-900">
        <div className="flex items-center justify-between mb-8">
          <motion.h2
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-xl md:text-3xl font-bold text-[#0097b2] flex items-center gap-3"
          >
            <Sparkles size={32} strokeWidth={2} /> Recommended for You
          </motion.h2>
        </div>

        {loadingRecs ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative w-20 h-20">
              <motion.div
                className="absolute inset-0 border-4 border-[#0097b2] border-t-transparent rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
            </div>
            <p className="text-gray-600 dark:text-gray-400 mt-4 animate-pulse">Loading music magic...</p>
          </div>
        ) : recommendedSongs.length > 0 ? (
          <>
            {/* Mobile: Horizontal Swipe Rows */}
            <div className="md:hidden space-y-4">
              {/* First Row - First 6 songs */}
              <div className="overflow-x-auto scrollbar-hide">
                <div className="flex gap-4 pb-2" style={{ width: 'max-content' }}>
                  {recommendedSongs.slice(0, 6).map((song, i) => (
                    <div key={song.id || i} className="flex-shrink-0" style={{ width: '160px' }}>
                      <SongCard
                        song={song}
                        onPlay={(s) => playSong(s, recommendedSongs)}
                        isFavorite={isFavorite(song.id)}
                        onToggleFavorite={() => toggleFavorite(song)}
                        showFavoriteButton={true}
                      />
                    </div>
                  ))}
                </div>
              </div>
              {/* Second Row - Last 6 songs */}
              {recommendedSongs.length > 6 && (
                <div className="overflow-x-auto scrollbar-hide">
                  <div className="flex gap-4 pb-2" style={{ width: 'max-content' }}>
                    {recommendedSongs.slice(6, 12).map((song, i) => (
                      <div key={song.id || i} className="flex-shrink-0" style={{ width: '160px' }}>
                        <SongCard
                          song={song}
                          onPlay={(s) => playSong(s, recommendedSongs)}
                          isFavorite={isFavorite(song.id)}
                          onToggleFavorite={() => toggleFavorite(song)}
                          showFavoriteButton={true}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {/* Desktop: Grid Layout */}
            <div className="hidden md:grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {recommendedSongs.map((song, i) => (
                <SongCard
                  key={song.id || i}
                  song={song}
                  onPlay={(s) => playSong(s, recommendedSongs)}
                  isFavorite={isFavorite(song.id)}
                  onToggleFavorite={() => toggleFavorite(song)}
                  showFavoriteButton={true}
                />
              ))}
            </div>
          </>
        ) : (
          <p className="text-gray-600 dark:text-gray-400 text-center">No personalized songs yet 🎶</p>
        )}
      </section>

      {/* 🌍 World Trending Songs */}
      <section className="px-10 md:px-16 py-12 bg-gradient-to-b from-white dark:from-gray-900 to-gray-50 dark:to-gray-800">
        <div className="flex items-center justify-between mb-8">
          <motion.h2
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-xl md:text-3xl font-bold text-[#0097b2] flex items-center gap-3"
          >
            <TrendingUp size={32} strokeWidth={2} /> World Trending Songs
          </motion.h2>
        </div>

        {loadingTrending ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative w-20 h-20">
              <motion.div
                className="absolute inset-0 border-4 border-[#0097b2] border-t-transparent rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
            </div>
            <p className="text-gray-600 dark:text-gray-400 mt-4 animate-pulse">Loading global trends...</p>
          </div>
        ) : trendingSongs.length > 0 ? (
          <>
            {/* Mobile: Horizontal Swipe Rows */}
            <div className="md:hidden space-y-4">
              {/* First Row - First 6 songs */}
              <div className="overflow-x-auto scrollbar-hide">
                <div className="flex gap-4 pb-2" style={{ width: 'max-content' }}>
                  {trendingSongs.slice(0, 6).map((song, i) => (
                    <div key={song.id || i} className="flex-shrink-0" style={{ width: '160px' }}>
                      <SongCard
                        song={song}
                        onPlay={(s) => playSong(s, trendingSongs)}
                        isFavorite={isFavorite(song.id)}
                        onToggleFavorite={() => toggleFavorite(song)}
                        showFavoriteButton={true}
                      />
                    </div>
                  ))}
                </div>
              </div>
              {/* Second Row - Last 4 songs (if more than 6) */}
              {trendingSongs.length > 6 && (
                <div className="overflow-x-auto scrollbar-hide">
                  <div className="flex gap-4 pb-2" style={{ width: 'max-content' }}>
                    {trendingSongs.slice(6, 10).map((song, i) => (
                      <div key={song.id || i} className="flex-shrink-0" style={{ width: '160px' }}>
                        <SongCard
                          song={song}
                          onPlay={(s) => playSong(s, trendingSongs)}
                          isFavorite={isFavorite(song.id)}
                          onToggleFavorite={() => toggleFavorite(song)}
                          showFavoriteButton={true}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {/* Desktop: Grid Layout */}
            <div className="hidden md:grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {trendingSongs.map((song, i) => (
                <SongCard
                  key={song.id || i}
                  song={song}
                  onPlay={(s) => playSong(s, trendingSongs)}
                  isFavorite={isFavorite(song.id)}
                  onToggleFavorite={() => toggleFavorite(song)}
                  showFavoriteButton={true}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400 text-lg mb-2">No trending songs yet</p>
            <p className="text-gray-500 dark:text-gray-500 text-sm">Start listening to build the global trending list! 🎧</p>
          </div>
        )}
      </section>

      {/* 🕒 Recently Played */}
      <section className="px-10 md:px-16 py-12 bg-white dark:bg-gray-900">
        <div className="flex items-center justify-between mb-8">
          <motion.h2
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-xl md:text-3xl font-bold text-[#0097b2] flex items-center gap-3"
          >
            <History size={32} strokeWidth={2} /> Recently Played
          </motion.h2>
        </div>

        {loadingHistory ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative w-20 h-20">
              <motion.div
                className="absolute inset-0 border-4 border-[#0097b2] border-t-transparent rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
            </div>
            <p className="text-gray-600 dark:text-gray-400 mt-4 animate-pulse">Loading history...</p>
          </div>
        ) : listeningHistory.length > 0 ? (
          <>
            {/* Mobile: Horizontal Swipe Rows */}
            <div className="md:hidden space-y-4">
              {/* First Row - First 6 songs */}
              <div className="overflow-x-auto scrollbar-hide">
                <div className="flex gap-4 pb-2" style={{ width: 'max-content' }}>
                  {listeningHistory.slice(0, 6).map((song, i) => (
                    <div key={song.id || i} className="flex-shrink-0" style={{ width: '160px' }}>
                      <SongCard
                        song={song}
                        onPlay={(s) => playSong(s, listeningHistory)}
                        isFavorite={isFavorite(song.id)}
                        onToggleFavorite={() => toggleFavorite(song)}
                        showFavoriteButton={true}
                      />
                    </div>
                  ))}
                </div>
              </div>
              {/* Second Row - Last 6 songs */}
              {listeningHistory.length > 6 && (
                <div className="overflow-x-auto scrollbar-hide">
                  <div className="flex gap-4 pb-2" style={{ width: 'max-content' }}>
                    {listeningHistory.slice(6, 12).map((song, i) => (
                      <div key={song.id || i} className="flex-shrink-0" style={{ width: '160px' }}>
                        <SongCard
                          song={song}
                          onPlay={(s) => playSong(s, listeningHistory)}
                          isFavorite={isFavorite(song.id)}
                          onToggleFavorite={() => toggleFavorite(song)}
                          showFavoriteButton={true}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {/* Desktop: Grid Layout */}
            <div className="hidden md:grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {listeningHistory.map((song, i) => (
                <SongCard
                  key={song.id || i}
                  song={song}
                  onPlay={(s) => playSong(s, listeningHistory)}
                  isFavorite={isFavorite(song.id)}
                  onToggleFavorite={() => toggleFavorite(song)}
                  showFavoriteButton={true}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400 text-lg mb-2">No listening history yet</p>
            <p className="text-gray-500 dark:text-gray-500 text-sm">Start playing songs to see your recently played tracks! 🎵</p>
          </div>
        )}
      </section>

      {/* 🌙 Footer */}
      <footer className="text-center text-gray-600 dark:text-gray-400 text-sm py-12 border-t border-gray-200 dark:border-gray-700 bg-gradient-to-t from-gray-50 dark:from-gray-800 to-white dark:to-gray-900">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <p className="font-semibold text-[#0097b2] mb-2">Serenity</p>
        </motion.div>
      </footer>
    </div>
  );
}
