"use client";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import gsap from "gsap";
import { ScrollSmoother } from "gsap/ScrollSmoother";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export default function MoodPage() {
  const { mood } = useParams();
  const router = useRouter();
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reloading, setReloading] = useState(false);

  // 🎭 Mood configuration
  const moodMap = {
    happy: {
      id: 0,
      color: "from-yellow-300 via-amber-400 to-orange-500",
      accent: "text-amber-300",
      particle: "rgba(255,215,0,0.3)",
      aura: "rgba(255,200,50,0.2)",
      quote: "Feel the sunshine through the sound",
    },
    sad: {
      id: 1,
      color: "from-slate-500 via-gray-600 to-blue-800",
      accent: "text-slate-300",
      particle: "rgba(100,116,139,0.3)",
      aura: "rgba(71,85,105,0.2)",
      quote: "Even the blues sing beautifully",
    },
    calm: {
      id: 2,
      color: "from-emerald-300 via-teal-400 to-cyan-500",
      accent: "text-teal-300",
      particle: "rgba(45,212,191,0.3)",
      aura: "rgba(20,184,166,0.2)",
      quote: "Breathe in the rhythm of peace",
    },
    angry: {
      id: 3,
      color: "from-rose-500 via-red-600 to-pink-700",
      accent: "text-rose-300",
      particle: "rgba(244,63,94,0.3)",
      aura: "rgba(225,29,72,0.2)",
      quote: "Turn your fire into rhythm",
    },
  };

  const selectedMood = moodMap[mood];

  useEffect(() => {
    let smoother;
    const initializeSmoothScroll = () => {
      if (typeof window === "undefined") return;
      gsap.registerPlugin(ScrollTrigger, ScrollSmoother);
      if (ScrollSmoother.get()) ScrollSmoother.get().kill();
      smoother = ScrollSmoother.create({
        wrapper: "#smooth-wrapper",
        content: "#smooth-content",
        smooth: 1.5,
        normalizeScroll: true,
        ignoreMobileResize: true,
        effects: true,
        smoothTouch: 0.1,
      });
    };
    const timeout = setTimeout(initializeSmoothScroll, 400);
    if (mood) fetchMoodSongs();
    return () => {
      clearTimeout(timeout);
      if (smoother) smoother.kill();
    };
  }, [mood]);

  const fetchMoodSongs = async () => {
    try {
      const res = await fetch("/api/serenity/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mood: selectedMood?.id }),
      });
      const data = await res.json();
      setSongs(data.songs || data);
    } catch (error) {
      console.error("Error fetching mood songs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRecommendMore = async () => {
    setReloading(true);
    try {
      const res = await fetch("/api/serenity/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mood: selectedMood?.id }),
      });
      const data = await res.json();
      setSongs((prev) => [...prev, ...(data.songs || data)]);
    } catch (error) {
      console.error("Error fetching more songs:", error);
    } finally {
      setReloading(false);
    }
  };

  const getSpotifyEmbedUrl = (uri) => {
    if (!uri) return null;
    const trackId = uri.split(":").pop();
    return `https://open.spotify.com/embed/track/${trackId}`;
  };

  return (
    <div id="smooth-wrapper">
      <div
        id="smooth-content"
        className="relative min-h-screen flex flex-col items-center justify-center bg-gray-950 text-white overflow-hidden px-6 sm:px-10 md:px-16 py-20"
      >
        {/* 🌅 Gradient background */}
        <motion.div
          className={`absolute inset-0 bg-gradient-to-br ${
            selectedMood?.color || "from-emerald-800 to-gray-900"
          } opacity-40 blur-3xl`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ duration: 2, ease: "easeInOut" }}
        />

        {/* 🔙 Back button */}
        <motion.button
          onClick={() => router.push("/dashboard")}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="absolute top-6 left-6 bg-gray-800/70 hover:bg-emerald-600/80 text-white text-sm px-4 py-2 rounded-full backdrop-blur-md transition-all z-20"
        >
          ← Back to Dashboard
        </motion.button>

        {/* 🎧 Header */}
        <motion.div
          className="relative text-center mb-10 z-10 flex flex-col items-center justify-center"
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <motion.div
            className="absolute rounded-full"
            style={{
              width: "300px",
              height: "300px",
              background: selectedMood?.aura,
              filter: "blur(80px)",
            }}
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.4, 0.8, 0.4],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.h1
            className={`text-5xl md:text-6xl font-extrabold bg-gradient-to-r ${selectedMood?.color} bg-clip-text text-transparent drop-shadow-[0_0_25px_rgba(0,255,200,0.3)]`}
          >
            {mood.charAt(0).toUpperCase() + mood.slice(1)} Vibes
          </motion.h1>
          <p
            className={`mt-4 text-lg md:text-xl italic font-light ${selectedMood?.accent}`}
          >
            {selectedMood?.quote}
          </p>
        </motion.div>

        {/* 🌊 Loader */}
        {loading && (
          <motion.div
            className="relative z-20 mt-20 flex flex-col items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
          >
            <div className="flex gap-3">
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  className={`w-2 h-10 rounded-full ${selectedMood?.accent}`}
                  animate={{ scaleY: [1, 2, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{
                    duration: 0.9,
                    delay: i * 0.1,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </div>
            <motion.p
              className="mt-6 text-gray-400 text-sm tracking-wider"
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              Syncing your {mood} energy...
            </motion.p>
          </motion.div>
        )}

        {/* 🎶 Songs Grid */}
        {!loading && songs.length > 0 && (
          <motion.div
            className="relative z-10 w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 mt-10 place-items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, ease: "easeInOut" }}
          >
            {songs.map((song, i) => {
              const embedUrl = getSpotifyEmbedUrl(song.uri);
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: i * 0.08,
                    duration: 0.7,
                    ease: "easeOut",
                  }}
                  className="relative w-full max-w-md rounded-3xl overflow-hidden bg-gray-900/50 border border-white/10 backdrop-blur-2xl shadow-[0_0_40px_rgba(0,255,180,0.15)] hover:shadow-[0_0_60px_rgba(0,255,200,0.25)] transition-all duration-700"
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-r ${selectedMood?.color} opacity-10`}
                  />
                  <div className="relative z-10 p-6 flex flex-col gap-4">
                    {embedUrl ? (
                      <iframe
                        src={embedUrl}
                        width="100%"
                        height="152"
                        frameBorder="0"
                        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                        loading="lazy"
                        className="rounded-2xl shadow-[0_0_30px_rgba(0,255,150,0.1)] hover:shadow-[0_0_40px_rgba(0,255,200,0.3)] transition-all duration-700"
                      />
                    ) : (
                      <p className="text-gray-500 text-sm italic">
                        No Spotify preview available
                      </p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* 🔁 Recommend More Button */}
        {!loading && songs.length > 0 && (
          <motion.div
            className="mt-16 z-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            <button
              onClick={handleRecommendMore}
              disabled={reloading}
              className="px-6 py-3 rounded-full bg-[#0097b2] hover:bg-[#007a93] text-white font-semibold text-sm tracking-wide transition-all shadow-[0_0_20px_rgba(0,151,178,0.3)] hover:shadow-[0_0_30px_rgba(0,151,178,0.5)] disabled:opacity-50"
            >
              {reloading ? "Fetching more..." : "Recommend More Songs"}
            </button>
          </motion.div>
        )}

        {/* 😕 No songs */}
        {!loading && songs.length === 0 && (
          <motion.p
            className="text-gray-500 text-center mt-10 z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            No songs found for {mood} mood 😕
          </motion.p>
        )}
      </div>
    </div>
  );
}
