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
  const [isUpdating, setIsUpdating] = useState(false);
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
      // Use PUT if updating existing preferences, POST for initial setup
      const method = isUpdating ? 'put' : 'post';
      await axios[method](
        "/api/user/preferences",
        { genres, artists },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      router.push(isUpdating ? "/profile" : "/dashboard");
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

    const fetchPreferences = async () => {
      try {
        const res = await axios.get("/api/user/preferences", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data?.preferences?.isSetupComplete) {
          // Load existing preferences for updating
          setIsUpdating(true);
          setGenres(res.data.preferences.genres || []);
          setArtists(res.data.preferences.artists || []);
        }
      } catch (err) {
        console.error("fetchPreferences error", err);
      }
    };

    fetchPreferences();
  }, [router]);


  return (
    <div className="min-h-screen bg-white text-black flex flex-col items-center justify-center p-6">
      <motion.h1
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-4xl font-bold mb-6 text-center text-[#0097b2]"
      >
        🎵 {isUpdating ? 'Update Your Music Preferences' : 'Personalize Your Music Taste'}
      </motion.h1>

      <p className="text-gray-600 mb-10 text-center max-w-md">
        {isUpdating ? 'Update your favorite genres and artists to refine your music recommendations.' : 'Select your favorite genres and artists to help us tailor your dashboard experience.'}
      </p>

      {/* Genre Selection */}
      <div className="max-w-xl mb-10">
        <h2 className="text-xl mb-3 font-semibold text-black">Pick your favorite genres</h2>
        <div className="flex flex-wrap gap-3">
          {GENRES.map((g) => (
            <button
              key={g}
              onClick={() => toggleSelection("genre", g)}
              className={`px-4 py-2 rounded-full text-sm border transition-all ${
                genres.includes(g)
                  ? "bg-[#0097b2] border-[#0097b2] text-white"
                  : "border-gray-300 text-black hover:bg-gray-100"
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Artist Selection */}
      <div className="max-w-xl mb-10">
        <h2 className="text-xl mb-3 font-semibold text-black">Select your favorite artists</h2>
        <div className="flex flex-wrap gap-3">
          {ARTISTS.map((a) => (
            <button
              key={a}
              onClick={() => toggleSelection("artist", a)}
              className={`px-4 py-2 rounded-full text-sm border transition-all ${
                artists.includes(a)
                  ? "bg-[#0097b2] border-[#0097b2] text-white"
                  : "border-gray-300 text-black hover:bg-gray-100"
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
        className="bg-[#0097b2] hover:bg-[#007a93] px-8 py-3 rounded-full font-semibold text-white transition-all disabled:opacity-50"
      >
        {loading ? "Saving..." : isUpdating ? "Save Changes" : "Continue →"}
      </motion.button>
    </div>
  );
}
