"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Music } from "lucide-react";

const GENRES = [
  "Pop", "Rock", "Lofi", "Bollywood", "Jazz", "Classical", "Hip-Hop", "Electronic", "Indie", "Retro"
];

export default function OnboardingPage() {
  const [genres, setGenres] = useState([]);
  const [artists, setArtists] = useState([]);
  const [artistSearchQuery, setArtistSearchQuery] = useState("");
  const [artistSearchResults, setArtistSearchResults] = useState([]);
  const [searchingArtists, setSearchingArtists] = useState(false);
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

  const addArtist = (artistName) => {
    if (!artists.includes(artistName)) {
      setArtists((prev) => [...prev, artistName]);
    }
    // Clear search after adding
    setArtistSearchQuery("");
    setArtistSearchResults([]);
  };

  const removeArtist = (artistName) => {
    setArtists((prev) => prev.filter((a) => a !== artistName));
  };

  // Search for artists
  useEffect(() => {
    const searchArtists = async () => {
      if (!artistSearchQuery.trim()) {
        setArtistSearchResults([]);
        return;
      }
      
      setSearchingArtists(true);
      try {
        const res = await axios.get(`/api/serenity/search?query=${encodeURIComponent(artistSearchQuery)}`);
        const data = res.data.data;
        
        // Extract unique artist names from search results
        const artistsFromSongs = data.songs?.results || [];
        const uniqueArtists = new Set();
        
        artistsFromSongs.forEach(song => {
          if (song.artists?.primary) {
            song.artists.primary.forEach(artist => {
              if (artist.name) uniqueArtists.add(artist.name);
            });
          }
        });
        
        setArtistSearchResults(Array.from(uniqueArtists).slice(0, 10));
      } catch (error) {
        console.error("Artist search error:", error);
      } finally {
        setSearchingArtists(false);
      }
    };

    const debounceTimer = setTimeout(() => {
      searchArtists();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [artistSearchQuery]);

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
    <div className="min-h-screen bg-gradient-to-br from-[#0097b2]/5 to-white dark:from-gray-900 dark:to-gray-800 text-black dark:text-white flex flex-col items-center justify-center p-6 pb-32 transition-colors">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center mb-4"
      >
        <Music className="w-10 h-10 md:w-12 md:h-12 text-[#0097b2] mb-3" strokeWidth={2} />
        <h1 className="text-2xl md:text-4xl font-bold text-center text-[#0097b2]">
          {isUpdating ? 'Update Your Music Preferences' : 'Personalize Your Music Taste'}
        </h1>
      </motion.div>

      <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mb-10 text-center max-w-md">
        {isUpdating ? 'Update your favorite genres and artists to refine your music recommendations.' : 'Select your favorite genres and artists to help us tailor your dashboard experience.'}
      </p>

      {/* Genre Selection */}
      <div className="max-w-xl mb-10 w-full">
        <h2 className="text-lg md:text-xl mb-3 font-semibold text-black dark:text-white">Pick your favorite genres</h2>
        <div className="flex flex-wrap gap-3">
          {GENRES.map((g) => (
            <button
              key={g}
              onClick={() => toggleSelection("genre", g)}
              className={`px-4 py-2 rounded-full text-sm border transition-all ${
                genres.includes(g)
                  ? "bg-[#0097b2] border-[#0097b2] text-white"
                  : "border-gray-300 dark:border-gray-600 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Artist Selection */}
      <div className="max-w-xl mb-10 w-full">
        <h2 className="text-lg md:text-xl mb-3 font-semibold text-black dark:text-white">Select your favorite artists</h2>
        
        {/* Search Input */}
        <div className="relative mb-4">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search for artists..."
            value={artistSearchQuery}
            onChange={(e) => setArtistSearchQuery(e.target.value)}
            className="w-full pl-12 pr-12 py-3 text-base border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-black dark:text-white rounded-xl 
            focus:outline-none focus:border-[#0097b2] focus:ring-2 focus:ring-[#0097b2]/20 
            placeholder-gray-400 dark:placeholder-gray-500 transition-all"
          />
          {searchingArtists && (
            <div className="absolute inset-y-0 right-4 flex items-center">
              <div className="w-5 h-5 border-2 border-[#0097b2] border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>

        {/* Search Results */}
        {artistSearchResults.length > 0 && (
          <div className="mb-4 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg max-h-48 overflow-y-auto">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Click to add:</p>
            {artistSearchResults.map((artistName, idx) => (
              <button
                key={idx}
                onClick={() => addArtist(artistName)}
                className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-sm text-black dark:text-white flex items-center justify-between group"
              >
                <span>{artistName}</span>
                <span className="text-[#0097b2] opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Selected Artists */}
        {artists.length > 0 && (
          <div className="mb-3">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Selected artists:</p>
            <div className="flex flex-wrap gap-2">
              {artists.map((artistName, idx) => (
                <motion.div
                  key={idx}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="px-4 py-2 rounded-full bg-[#0097b2] text-white text-sm flex items-center gap-2 group"
                >
                  <span>{artistName}</span>
                  <button
                    onClick={() => removeArtist(artistName)}
                    className="hover:bg-white/20 rounded-full p-0.5 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        )}
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
