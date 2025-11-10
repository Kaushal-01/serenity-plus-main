"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

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

  return (
    <nav className="fixed top-0 left-0 z-50 w-full bg-white border-b border-gray-200 shadow-sm transition-all duration-300">
      <div className="max-w-7xl mx-auto px-6 py-3 flex justify-between items-center">
        {/* 🌌 Logo */}
        <Link
          href="/dashboard"
          className="text-2xl font-extrabold text-[#0097b2] hover:opacity-80 transition-all"
        >
          Serenity
        </Link>

        {/* 🧭 Links */}
        <div className="hidden md:flex items-center gap-6">
          {user && (
            <>
              <Link
                href="/dashboard"
                className="text-black hover:text-[#0097b2] text-sm transition font-medium"
              >
                Dashboard
              </Link>
              <Link
                href="/favorites"
                className="text-black hover:text-[#0097b2] text-sm transition font-medium"
              >
                Favorites
              </Link>
            </>
          )}
        </div>

        {/* 🧍 User Menu */}
        <div className="flex items-center gap-3">
          {!user ? (
            <>
              <Link
                href="/login"
                className="text-black hover:text-[#0097b2] text-sm px-3 py-1.5 rounded-full hover:bg-gray-100 transition-all font-medium"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="bg-[#0097b2] hover:bg-[#007a93] text-white text-sm px-4 py-1.5 rounded-full font-medium transition-all"
              >
                Sign Up
              </Link>
            </>
          ) : (
            <>
              {/* Harmony Chat Icon */}
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('toggle-harmony-chat'))}
                className="flex items-center gap-2 text-black hover:text-[#0097b2] transition-all hover:scale-110 group"
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
                <span className="text-xs hidden lg:inline group-hover:text-[#0097b2] font-medium">Serenity AI</span>
              </button>
              
              <div className="relative">
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
    </nav>
  );
}
