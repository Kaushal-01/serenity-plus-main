"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

const GENRES = [
  "Pop", "Rock", "Lofi", "Bollywood", "Jazz", "Classical", "Hip-Hop", "Electronic", "Indie", "Retro"
];

const ARTISTS = [
  "Arijit Singh", "Taylor Swift", "Imagine Dragons","Kishore Kumar", "Shreya Ghoshal", "The Weeknd", "AP Dhillon", "Billie Eilish", "Ed Sheeran", "Atif Aslam", "Pritam"
];

export default function OnboardingPage() {
  const [genres, setGenres] = useState([]);
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const toggleSelection = (type, value) => {
    if (type === "genre") {
      setGenres((prev) =>
        prev.includes(value) ? prev.filter((g) => g !== value) : [...prev, value]
      );
    } else {
      setArtists((prev) =>
        prev.includes(value) ? prev.filter((a) => a !== value) : [...prev, value]
      );
    }
  };

  const handleSubmit = async () => {
    const token = localStorage.getItem("token");
    if (!token) return router.push("/login");

    setLoading(true);
    try {
      await axios.post(
        "/api/user/preferences",
        { genres, artists },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      router.push("/dashboard");
    } catch (err) {
      console.error("Preferences save error:", err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
  const token = localStorage.getItem("token");
  if (!token) {
    router.push("/login");
    return;
  }

  const checkSetup = async () => {
    try {
      const res = await axios.get("/api/user/preferences", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data?.preferences?.isSetupComplete) {
        router.push("/dashboard");
      }
    } catch (err) {
      console.error("checkSetup error", err);
    }
  };

  checkSetup();
}, [router]);


  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white flex flex-col items-center justify-center p-6">
      <motion.h1
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-4xl font-bold mb-6 text-center bg-gradient-to-r from-green-400 via-emerald-400 to-teal-500 bg-clip-text text-transparent"
      >
        🎵 Personalize Your Music Taste
      </motion.h1>

      <p className="text-gray-400 mb-10 text-center max-w-md">
        Select your favorite genres and artists to help us tailor your dashboard experience.
      </p>

      {/* Genre Selection */}
      <div className="max-w-xl mb-10">
        <h2 className="text-xl mb-3 font-semibold">Pick your favorite genres</h2>
        <div className="flex flex-wrap gap-3">
          {GENRES.map((g) => (
            <button
              key={g}
              onClick={() => toggleSelection("genre", g)}
              className={`px-4 py-2 rounded-full text-sm border transition-all ${
                genres.includes(g)
                  ? "bg-emerald-500 border-emerald-400 text-white"
                  : "border-gray-600 text-gray-300 hover:bg-gray-800"
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Artist Selection */}
      <div className="max-w-xl mb-10">
        <h2 className="text-xl mb-3 font-semibold">Select your favorite artists</h2>
        <div className="flex flex-wrap gap-3">
          {ARTISTS.map((a) => (
            <button
              key={a}
              onClick={() => toggleSelection("artist", a)}
              className={`px-4 py-2 rounded-full text-sm border transition-all ${
                artists.includes(a)
                  ? "bg-green-500 border-green-400 text-white"
                  : "border-gray-600 text-gray-300 hover:bg-gray-800"
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      {/* Continue Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        onClick={handleSubmit}
        disabled={loading}
        className="bg-gradient-to-r from-green-500 to-emerald-600 px-8 py-3 rounded-full font-semibold hover:from-green-400 hover:to-emerald-500 transition-all disabled:opacity-50"
      >
        {loading ? "Saving..." : "Continue →"}
      </motion.button>
    </div>
  );
}
