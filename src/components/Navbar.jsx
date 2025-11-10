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
    <nav className="fixed top-0 left-0 z-50 w-full backdrop-blur-2xl bg-white/5 border-b border-white/10 shadow-[0_0_25px_rgba(0,255,255,0.1)] transition-all duration-300">
      <div className="max-w-7xl mx-auto px-6 py-3 flex justify-between items-center">
        {/* 🌌 Logo */}
        <Link
          href="/dashboard"
          className="text-2xl font-extrabold bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent hover:opacity-90 transition-all"
        >
          Serenity
        </Link>

        {/* 🧭 Links */}
        <div className="hidden md:flex items-center gap-6">
          {user && (
            <>
              <Link
                href="/dashboard"
                className="text-gray-300 hover:text-white text-sm transition"
              >
                Dashboard
              </Link>
              <Link
                href="/favorites"
                className="text-gray-300 hover:text-white text-sm transition"
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
                className="text-gray-300 hover:text-white text-sm px-3 py-1.5 rounded-full hover:bg-white/10 transition-all"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-blue-400 hover:to-cyan-500 text-white text-sm px-4 py-1.5 rounded-full font-medium transition-all shadow-[0_0_15px_rgba(0,255,255,0.2)] hover:shadow-[0_0_25px_rgba(0,255,255,0.4)]"
              >
                Sign Up
              </Link>
            </>
          ) : (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full hover:bg-white/20 backdrop-blur-sm transition-all"
              >
                <motion.span layout className="text-sm font-medium text-white">
                  {user.name?.split(" ")[0] || "User"}
                </motion.span>
                <motion.svg
                  animate={{ rotate: menuOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-white"
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
                    className="absolute right-0 mt-3 w-48 bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-[0_0_20px_rgba(0,255,255,0.2)]"
                  >
                    <Link
                      href="/profile"
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-200 hover:bg-white/10 transition-all"
                    >
                      My Profile
                    </Link>
                    <Link
                      href="/favorites"
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-200 hover:bg-white/10 transition-all"
                    >
                      Favorites
                    </Link>
                    <button
                      onClick={logout}
                      className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-white/10 transition-all"
                    >
                      Logout
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
