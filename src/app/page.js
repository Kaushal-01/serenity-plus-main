"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Home() {
  const [user, setUser] = useState(null);
  const [mounted, setMounted] = useState(false);

  // Simulated auth check — replace with your real API/auth logic
  useEffect(() => {
    setMounted(true);
    const storedUser = localStorage.getItem("user");
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
  };

  // Prevent hydration mismatch by not rendering user-dependent content until mounted
  if (!mounted) {
    return (
      <main className="h-screen flex flex-col bg-white text-black overflow-hidden">
        {/* ================= NAVBAR ================= */}
        <nav className="w-full flex justify-between items-center px-6 sm:px-10 py-3 bg-white border-b border-gray-200 shadow-sm">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0097b2] tracking-tight">
            Serenity
          </h1>
          <div className="flex items-center gap-3 sm:gap-5">
            <div className="text-sm sm:text-base px-4 py-2 rounded-full bg-gray-100 animate-pulse">
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            </div>
          </div>
        </nav>
        {/* Loading skeleton */}
        <section className="flex flex-col items-center justify-center text-center px-6 py-8">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4 text-[#0097b2] leading-tight">
            Feel the Music with Serenity
          </h2>
          <p className="text-gray-600 text-sm sm:text-base max-w-xl mb-6">
            Discover songs, albums, and artists like never before — all in one elegant,
            immersive experience.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="h-screen flex flex-col bg-white text-black overflow-hidden">
      {/* ================= NAVBAR ================= */}
      <nav className="w-full flex justify-between items-center px-6 sm:px-10 py-3 bg-white border-b border-gray-200 shadow-sm">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#0097b2] tracking-tight">
          Serenity
        </h1>

        {!user ? (
          <div className="flex items-center gap-3 sm:gap-5">
            <Link
              href="/login"
              className="text-sm sm:text-base px-4 py-2 rounded-full bg-[#0097b2] hover:bg-[#007a93] transition font-medium text-white"
            >
              Log In
            </Link>
            <Link
              href="/signup"
              className="text-sm sm:text-base px-4 py-2 rounded-full bg-gray-100 text-black hover:bg-gray-200 transition font-medium border border-gray-300"
            >
              Sign Up
            </Link>
          </div>
        ) : (
          <div className="flex items-center gap-4 sm:gap-5">
            <p className="text-gray-600 text-sm sm:text-base">
              Hi, {user.name || "Listener"} 👋
            </p>
            <Link
              href="/explore"
              className="text-sm sm:text-base px-4 py-2 rounded-full bg-[#0097b2] hover:bg-[#007a93] transition font-medium text-white"
            >
              Dashboard
            </Link>
            <button
              onClick={handleLogout}
              className="text-sm sm:text-base px-4 py-2 rounded-full bg-gray-200 hover:bg-gray-300 transition text-black"
            >
              Logout
            </button>
          </div>
        )}
      </nav>

      {/* ================= HERO SECTION ================= */}
      <section className="flex flex-col items-center justify-center text-center px-6 py-8">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4 text-[#0097b2] leading-tight">
          Feel the Music with Serenity
        </h2>
        <p className="text-gray-600 text-sm sm:text-base max-w-xl mb-6">
          Discover songs, albums, and artists like never before — all in one elegant,
          immersive experience.
        </p>

        {!user ? (
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6">
            <Link
              href="/signup"
              className="px-6 py-2.5 rounded-full bg-[#0097b2] hover:bg-[#007a93] transition text-base font-semibold text-white"
            >
              Get Started
            </Link>
            <Link
              href="/login"
              className="px-6 py-2.5 rounded-full border-2 border-[#0097b2] hover:bg-[#0097b2] hover:text-white transition text-base font-semibold text-[#0097b2]"
            >
              Log In
            </Link>
          </div>
        ) : (
          <Link
            href="/dashboard"
            className="px-8 py-2.5 rounded-full bg-[#0097b2] hover:bg-[#007a93] transition text-base font-semibold text-white mb-6"
          >
            Go to Dashboard →
          </Link>
        )}
      </section>

      {/* ================= FEATURE GRID ================= */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 px-6 sm:px-8 pb-6 flex-1 content-start">
        {[
          { 
            title: "Mood-Based Music", 
            icon: "🎭",
            desc: "Get personalized recommendations based on your emotions - Happy, Sad, Calm, or Angry."
          },
          { 
            title: "Smart Search", 
            icon: "🔍",
            desc: "Search for songs, albums, artists, and playlists across the entire music library."
          },
          { 
            title: "Favorites & Playlists", 
            icon: "❤️",
            desc: "Save your favorite songs and create custom playlists for every occasion."
          },
          { 
            title: "Audio Recognition", 
            icon: "🎙️",
            desc: "Identify any song by recording a short audio clip - find music instantly."
          },
          { 
            title: "AI Music Assistant", 
            icon: "🤖",
            desc: "Chat with our AI bot for personalized music recommendations and discovery."
          },
          { 
            title: "Full-Featured Player", 
            icon: "🎵",
            desc: "Advanced music player with shuffle, repeat, queue management, and volume control."
          },
        ].map((feature, i) => (
          <div
            key={i}
            className="group relative bg-white hover:bg-gray-50 
            transition-all duration-300 p-4 rounded-2xl border border-gray-200 
            hover:border-[#0097b2] hover:shadow-lg hover:shadow-[#0097b2]/10 
            hover:-translate-y-1 cursor-pointer"
          >
            {/* Icon */}
            <div className="text-2xl mb-2 group-hover:scale-110 transition-transform duration-300 inline-block">
              {feature.icon}
            </div>
            
            {/* Content */}
            <h3 className="text-lg font-semibold mb-1.5 text-black group-hover:text-[#0097b2] 
              transition-colors duration-300">
              {feature.title}
            </h3>
            <p className="text-gray-600 text-xs leading-relaxed">{feature.desc}</p>
          </div>
        ))}
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="py-3 text-center text-gray-500 text-xs border-t border-gray-200">
        
      </footer>
    </main>
  );
}
