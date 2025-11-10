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

  // 🔍 Search functionality
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    try {
      const res = await axios.get(`/api/serenity/search?query=${encodeURIComponent(searchQuery)}`);
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
    <nav className="fixed top-0 left-0 z-50 w-full bg-white border-b border-gray-200 shadow-sm transition-all duration-300">
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
                className="text-black hover:text-[#0097b2] text-lg transition font-medium"
              >
                Dashboard
              </Link>
              <Link
                href="/playlists"
                className="text-black hover:text-[#0097b2] text-lg transition font-medium"
              >
                Playlists
              </Link>
              <Link
                href="/favorites"
                className="text-black hover:text-[#0097b2] text-lg transition font-medium"
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
              className="flex items-center gap-2 text-black hover:text-[#0097b2] transition-all hover:scale-110"
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
              className="md:hidden flex items-center text-black hover:text-[#0097b2] transition-all"
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
                className="text-black hover:text-[#0097b2] text-lg px-3 py-1.5 rounded-full hover:bg-gray-100 transition-all font-medium"
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
                className="hidden md:flex items-center gap-2 text-black hover:text-[#0097b2] transition-all hover:scale-110 group"
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
                className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-full hover:bg-gray-200 transition-all"
              >
                <motion.span layout className="text-sm font-medium text-black">
                  {user.name?.split(" ")[0] || "User"}
                </motion.span>
                <motion.svg
                  animate={{ rotate: menuOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-black"
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
                    className="absolute right-0 mt-3 w-48 bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-lg"
                  >
                    <Link
                      href="/profile"
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-black hover:bg-gray-100 transition-all font-medium"
                    >
                      My Profile
                    </Link>
                    <Link
                      href="/playlists"
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-black hover:bg-gray-100 transition-all font-medium"
                    >
                      My Playlists
                    </Link>
                    <Link
                      href="/favorites"
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-black hover:bg-gray-100 transition-all font-medium"
                    >
                      Favorites
                    </Link>
                    <button
                      onClick={logout}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 transition-all font-medium"
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
            className="md:hidden bg-white border-t border-gray-200 overflow-hidden"
          >
            <div className="px-6 py-4 space-y-3">
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-black hover:text-[#0097b2] text-base font-medium py-2 transition-all"
              >
                📊 Dashboard
              </Link>
              <Link
                href="/playlists"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-black hover:text-[#0097b2] text-base font-medium py-2 transition-all"
              >
                🎶 Playlists
              </Link>
              <Link
                href="/favorites"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-black hover:text-[#0097b2] text-base font-medium py-2 transition-all"
              >
                ❤️ Favorites
              </Link>
              <Link
                href="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-black hover:text-[#0097b2] text-base font-medium py-2 transition-all"
              >
                👤 My Profile
              </Link>
              <button
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('toggle-harmony-chat'));
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left text-black hover:text-[#0097b2] text-base font-medium py-2 transition-all"
              >
                💬 Serenity AI
              </button>
              <hr className="border-gray-200 my-2" />
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left text-red-600 hover:text-red-700 text-base font-medium py-2 transition-all"
              >
                🚪 Logout
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* �🔍 Search Modal */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 pt-20"
            onClick={closeSearch}
          >
            <motion.div
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -50, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-4xl w-full shadow-2xl max-h-[85vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Search Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-[#0097b2]">🔍 Search Music</h2>
                <button
                  onClick={closeSearch}
                  className="text-gray-500 hover:text-gray-700 transition-all"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Search Input */}
              <div className="flex gap-3 mb-6">
                <input
                  type="text"
                  placeholder="Search songs, albums, or playlists..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  className="flex-1 border border-gray-300 bg-white text-black px-5 py-3 rounded-full focus:outline-none focus:ring-2 focus:ring-[#0097b2] placeholder-gray-500"
                  autoFocus
                />
                <button
                  onClick={handleSearch}
                  disabled={searchLoading}
                  className="bg-[#0097b2] hover:bg-[#007a93] text-white font-semibold px-8 py-3 rounded-full transition-all disabled:opacity-50"
                >
                  {searchLoading ? "..." : "Search"}
                </button>
              </div>

              {/* Search Results */}
              <div className="space-y-8">
                {/* Songs */}
                {searchResults.songs.length > 0 && (
                  <div>
                    <h3 className="text-xl font-semibold text-[#0097b2] mb-4">🎧 Songs</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {searchResults.songs.slice(0, 8).map((song, i) => (
                        <motion.div
                          key={song.id || i}
                          whileHover={{ scale: 1.05 }}
                          className="bg-gray-50 border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer"
                          onClick={() => {
                            playSong(song);
                            closeSearch();
                          }}
                        >
                          <img
                            src={song.image?.[1]?.url || song.image?.[0]?.url}
                            alt={song.name}
                            className="w-full h-32 object-cover"
                          />
                          <div className="p-3">
                            <h4 className="font-semibold text-sm truncate text-black">{song.name}</h4>
                            <p className="text-gray-600 text-xs truncate">{song.primaryArtists}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Albums */}
                {searchResults.albums.length > 0 && (
                  <div>
                    <h3 className="text-xl font-semibold text-[#0097b2] mb-4">💿 Albums</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {searchResults.albums.slice(0, 8).map((album, i) => (
                        <Link
                          key={album.id || i}
                          href={`/albums/details/${encodeURIComponent(album.id)}`}
                          onClick={closeSearch}
                        >
                          <motion.div
                            whileHover={{ scale: 1.05 }}
                            className="bg-gray-50 border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer"
                          >
                            <img
                              src={album.image?.[1]?.url || album.image?.[0]?.url}
                              alt={album.name}
                              className="w-full h-32 object-cover"
                            />
                            <div className="p-3">
                              <h4 className="font-semibold text-sm truncate text-black">{album.name}</h4>
                              <p className="text-gray-600 text-xs truncate">{album.primaryArtists}</p>
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
                    <h3 className="text-xl font-semibold text-[#0097b2] mb-4">🎶 Playlists</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {searchResults.playlists.slice(0, 8).map((playlist, i) => (
                        <motion.div
                          key={playlist.id || i}
                          whileHover={{ scale: 1.05 }}
                          className="bg-gray-50 border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer"
                        >
                          <img
                            src={playlist.image?.[1]?.url || playlist.image?.[0]?.url}
                            alt={playlist.name}
                            className="w-full h-32 object-cover"
                          />
                          <div className="p-3">
                            <h4 className="font-semibold text-sm truncate text-black">{playlist.name}</h4>
                            <p className="text-gray-600 text-xs truncate">{playlist.language || "Mixed"}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* No Results */}
                {!searchLoading && 
                  searchQuery && 
                  searchResults.songs.length === 0 && 
                  searchResults.albums.length === 0 && 
                  searchResults.playlists.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-gray-600 text-lg">No results found for "{searchQuery}" 🎵</p>
                    <p className="text-gray-500 text-sm mt-2">Try a different search term</p>
                  </div>
                )}

                {/* Initial State */}
                {!searchQuery && (
                  <div className="text-center py-12">
                    <p className="text-gray-600 text-lg">🎵 Start typing to search music</p>
                    <p className="text-gray-500 text-sm mt-2">Find your favorite songs, albums, and playlists</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
