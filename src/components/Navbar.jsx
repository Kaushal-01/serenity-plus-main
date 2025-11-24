"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { usePlayer } from "@/context/PlayerContext";

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState({ songs: [], albums: [], playlists: [] });
  const [searchLoading, setSearchLoading] = useState(false);
  const router = useRouter();
  const { playSong } = usePlayer();

  // 🌐 Listen for login/logout changes dynamically
  useEffect(() => {
    const updateUserState = () => {
      const token = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");

      if (token && storedUser) {
        setUser(JSON.parse(storedUser));
      } else {
        setUser(null);
      }
    };

    // Initial load
    updateUserState();

    // Listen for updates triggered anywhere in the app
    window.addEventListener("serenity-auth-update", updateUserState);
    window.addEventListener("storage", updateUserState);

    return () => {
      window.removeEventListener("serenity-auth-update", updateUserState);
      window.removeEventListener("storage", updateUserState);
    };
  }, []);

  // 🧠 Verify token if user data missing
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || user) return;

    const fetchUser = async () => {
      try {
        const res = await axios.get("/api/auth/verify", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data?.success) {
          setUser(res.data.user);
          localStorage.setItem("user", JSON.stringify(res.data.user));
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error("verify error", err);
      }
    };

    fetchUser();
  }, [user]);

  // 🚪 Logout
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setMenuOpen(false);

    // 🔥 Broadcast logout event to all components
    window.dispatchEvent(new Event("serenity-auth-update"));

    router.push("/login");
  };

  // 🔍 Search functionality with real-time search
  const handleSearch = async (query) => {
    const searchTerm = query || searchQuery;
    if (!searchTerm.trim()) {
      setSearchResults({ songs: [], albums: [], playlists: [] });
      return;
    }
    setSearchLoading(true);
    try {
      const res = await axios.get(`/api/serenity/search?query=${encodeURIComponent(searchTerm)}`);
      const data = res.data.data;
      if (Array.isArray(data.results)) {
        setSearchResults({ songs: data.results || [], albums: [], playlists: [] });
      } else {
        setSearchResults({
          songs: data.songs?.results || data.songs || [],
          albums: data.albums?.results || data.albums || [],
          playlists: data.playlists?.results || data.playlists || [],
        });
      }
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setSearchLoading(false);
    }
  };

  // Real-time search with debouncing
  useEffect(() => {
    if (!searchOpen) return;
    
    const debounceTimer = setTimeout(() => {
      if (searchQuery.trim()) {
        handleSearch(searchQuery);
      } else {
        setSearchResults({ songs: [], albums: [], playlists: [] });
      }
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, searchOpen]);

  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const closeSearch = () => {
    setSearchOpen(false);
    setSearchQuery("");
    setSearchResults({ songs: [], albums: [], playlists: [] });
  };

  return (
    <nav className="fixed top-0 left-0 z-50 w-full bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm transition-all duration-300">
      <div className="max-w-7xl mx-auto px-6 py-3 flex justify-between items-center">
        {/* 🌌 Logo */}
        <Link
          href="/dashboard"
          className="flex items-center gap-3 hover:opacity-80 transition-all"
        >
          <img 
            src="/new-logo.png" 
            alt="Serenity Logo" 
            className="w-10 h-10 object-contain"
          />
          <span className="text-2xl font-extrabold text-[#0097b2]">Serenity</span>
        </Link>

        {/* 🧭 Links */}
        <div className="hidden md:flex items-center gap-6">
          {user && (
            <>
              <Link
                href="/dashboard"
                className="text-black dark:text-white hover:text-[#0097b2] text-lg transition font-medium"
              >
                Dashboard
              </Link>
              <Link
                href="/playlists"
                className="text-black dark:text-white hover:text-[#0097b2] text-lg transition font-medium"
              >
                Playlists
              </Link>
              <Link
                href="/favorites"
                className="text-black dark:text-white hover:text-[#0097b2] text-lg transition font-medium"
              >
                Favorites
              </Link>
            </>
          )}
        </div>

        {/* 🧍 User Menu */}
        <div className="flex items-center gap-3">
          {/* 🔍 Search Button */}
          {user && (
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 text-black dark:text-white hover:text-[#0097b2] transition-all hover:scale-110"
              title="Search Music"
            >
              <svg 
                className="w-6 h-6" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
                />
              </svg>
            </button>
          )}

          {/* 🍔 Hamburger Menu Button (Mobile) */}
          {user && (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden flex items-center text-black dark:text-white hover:text-[#0097b2] transition-all"
              aria-label="Toggle menu"
            >
              <svg 
                className="w-6 h-6" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                {mobileMenuOpen ? (
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M6 18L18 6M6 6l12 12" 
                  />
                ) : (
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M4 6h16M4 12h16M4 18h16" 
                  />
                )}
              </svg>
            </button>
          )}

          {!user ? (
            <>
              <Link
                href="/login"
                className="text-black dark:text-white hover:text-[#0097b2] text-lg px-3 py-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-all font-medium"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="bg-[#0097b2] hover:bg-[#007a93] text-white text-lg px-4 py-1.5 rounded-full font-medium transition-all"
              >
                Sign Up
              </Link>
            </>
          ) : (
            <>
              {/* Harmony Chat Icon */}
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('toggle-harmony-chat'))}
                className="hidden md:flex items-center gap-2 text-black dark:text-white hover:text-[#0097b2] transition-all hover:scale-110 group"
                title="Chat with SerenityAI"
              >
                <svg 
                  className="w-6 h-6" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" 
                  />
                </svg>
              </button>
              
              <div className="hidden md:block relative">
                <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
              >
                <motion.span layout className="text-sm font-medium text-black dark:text-white">
                  {user.name?.split(" ")[0] || "User"}
                </motion.span>
                <motion.svg
                  animate={{ rotate: menuOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-black dark:text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </motion.svg>
              </button>

              {/* ✨ Dropdown */}
              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-3 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden shadow-lg"
                  >
                    <Link
                      href="/profile"
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-all font-medium"
                    >
                      My Profile
                    </Link>
                    <Link
                      href="/playlists"
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-all font-medium"
                    >
                      My Playlists
                    </Link>
                    <Link
                      href="/favorites"
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-all font-medium"
                    >
                      Favorites
                    </Link>
                    <button
                      onClick={logout}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all font-medium"
                    >
                      Logout
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
              </div>
            </>
          )}
        </div>
      </div>

      {/* � Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && user && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            <div className="px-6 py-4 space-y-3">
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-black dark:text-white hover:text-[#0097b2] text-base font-medium py-2 transition-all"
              >
                📊 Dashboard
              </Link>
              <Link
                href="/playlists"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-black dark:text-white hover:text-[#0097b2] text-base font-medium py-2 transition-all"
              >
                🎶 Playlists
              </Link>
              <Link
                href="/favorites"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-black dark:text-white hover:text-[#0097b2] text-base font-medium py-2 transition-all"
              >
                ❤️ Favorites
              </Link>
              <Link
                href="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-black dark:text-white hover:text-[#0097b2] text-base font-medium py-2 transition-all"
              >
                👤 My Profile
              </Link>
              <button
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('toggle-harmony-chat'));
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left text-black dark:text-white hover:text-[#0097b2] text-base font-medium py-2 transition-all"
              >
                💬 Serenity AI
              </button>
              <hr className="border-gray-200 dark:border-gray-700 my-2" />
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-base font-medium py-2 transition-all"
              >
                🚪 Logout
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🔍 Search Modal */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center z-50 p-4 pt-16 md:pt-24"
            onClick={closeSearch}
          >
            <motion.div
              initial={{ y: -50, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -50, opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white dark:bg-gray-800 rounded-3xl p-6 md:p-8 max-w-5xl w-full shadow-2xl max-h-[85vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Search Header */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-[#0097b2] to-[#00b8d4] bg-clip-text text-transparent">Quick Search</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Results appear as you type</p>
                  </div>
                  <button
                    onClick={closeSearch}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 transition-all"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Search Input */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Search songs, albums, playlists, or artists..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleSearchKeyDown}
                    className="w-full pl-14 pr-12 py-4 text-base border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-black dark:text-white rounded-2xl 
                    focus:outline-none focus:border-[#0097b2] focus:ring-4 focus:ring-[#0097b2]/20 
                    placeholder-gray-400 dark:placeholder-gray-500 transition-all"
                    autoFocus
                  />
                  {searchLoading && (
                    <div className="absolute inset-y-0 right-5 flex items-center">
                      <div className="w-5 h-5 border-2 border-[#0097b2] border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                  {searchQuery && !searchLoading && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute inset-y-0 right-5 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {/* Search Results */}
              {searchLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-12 h-12 border-3 border-[#0097b2] border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="text-gray-600 dark:text-gray-400">Searching...</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Songs */}
                  {searchResults.songs.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 bg-gradient-to-br from-[#0097b2] to-[#00b8d4] rounded-lg flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Songs</h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{searchResults.songs.length} found</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {searchResults.songs.slice(0, 8).map((song, i) => (
                          <motion.div
                            key={song.id || i}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.05 }}
                            whileHover={{ y: -3 }}
                            className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all cursor-pointer group"
                            onClick={() => {
                              playSong(song, searchResults.songs);
                              closeSearch();
                            }}
                          >
                            <div className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-gray-600">
                              <img
                                src={song.image?.[2]?.url || song.image?.[1]?.url || song.image?.[0]?.url}
                                alt={song.name}
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
                                <div className="bg-[#0097b2] rounded-full w-10 h-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                  <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                                  </svg>
                                </div>
                              </div>
                            </div>
                            <div className="p-3">
                              <h4 className="font-semibold text-sm truncate text-black dark:text-white">{song.name}</h4>
                              <p className="text-gray-600 dark:text-gray-300 text-xs truncate">{song.primaryArtists}</p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Albums */}
                  {searchResults.albums.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Albums</h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{searchResults.albums.length} found</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {searchResults.albums.slice(0, 8).map((album, i) => (
                          <Link
                            key={album.id || i}
                            href={`/albums/details/${encodeURIComponent(album.id)}`}
                            onClick={closeSearch}
                          >
                            <motion.div
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: i * 0.05 }}
                              whileHover={{ y: -3 }}
                              className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all group"
                            >
                              <div className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-gray-600">
                                <img
                                  src={album.image?.[2]?.url || album.image?.[1]?.url || album.image?.[0]?.url}
                                  alt={album.name}
                                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
                                  <div className="bg-[#0097b2] rounded-full w-10 h-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                                      <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                                    </svg>
                                  </div>
                                </div>
                              </div>
                              <div className="p-3">
                                <h4 className="font-semibold text-sm truncate text-black dark:text-white">{album.name}</h4>
                                <p className="text-gray-600 dark:text-gray-300 text-xs truncate">{album.primaryArtists}</p>
                              </div>
                            </motion.div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Playlists */}
                  {searchResults.playlists.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Playlists</h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{searchResults.playlists.length} found</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {searchResults.playlists.slice(0, 8).map((playlist, i) => (
                          <Link
                            key={playlist.id || i}
                            href={`/playlists/details/${encodeURIComponent(playlist.id)}`}
                            onClick={closeSearch}
                          >
                            <motion.div
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: i * 0.05 }}
                              whileHover={{ y: -3 }}
                              className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all group cursor-pointer"
                            >
                              <div className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-gray-600">
                                <img
                                  src={playlist.image?.[1]?.url || playlist.image?.[0]?.url}
                                  alt={playlist.name}
                                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
                                  <div className="bg-[#0097b2] rounded-full w-10 h-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                                      <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                                    </svg>
                                  </div>
                                </div>
                              </div>
                              <div className="p-3">
                                <h4 className="font-semibold text-sm truncate text-black dark:text-white">{playlist.name}</h4>
                                <p className="text-gray-600 dark:text-gray-300 text-xs truncate">{playlist.language || "Mixed"}</p>
                              </div>
                            </motion.div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* No Results */}
                  {searchQuery && 
                    searchResults.songs.length === 0 && 
                    searchResults.albums.length === 0 && 
                    searchResults.playlists.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-16">
                        <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                          <svg className="w-10 h-10 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No results found</h3>
                        <p className="text-gray-600 dark:text-gray-400">Try different keywords or check spelling</p>
                      </div>
                    )}

                  {/* Initial State */}
                  {!searchQuery && (
                    <div className="flex flex-col items-center justify-center py-16">
                      <div className="w-20 h-20 bg-gradient-to-br from-[#0097b2] to-[#00b8d4] rounded-full flex items-center justify-center mb-4">
                        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Start searching</h3>
                      <p className="text-gray-600 dark:text-gray-400">Type to discover songs, albums, and playlists</p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
