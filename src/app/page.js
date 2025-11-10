"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Home() {
  const [user, setUser] = useState(null);

  // Simulated auth check — replace with your real API/auth logic
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <main className="min-h-screen flex flex-col bg-white text-black">
      {/* ================= NAVBAR ================= */}
      <nav className="w-full fixed top-0 z-20 flex justify-between items-center px-6 sm:px-10 py-4 bg-white border-b border-gray-200 shadow-sm">
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
      <section className="flex flex-col items-center justify-center text-center flex-grow px-6 pt-28 sm:pt-36">
        <h2 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-6 text-[#0097b2] leading-tight">
          Feel the Music with Serenity
        </h2>
        <p className="text-gray-600 text-base sm:text-lg max-w-xl mb-8">
          Discover songs, albums, and artists like never before — all in one elegant,
          immersive experience.
        </p>

        {!user ? (
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
            <Link
              href="/signup"
              className="px-6 py-3 rounded-full bg-[#0097b2] hover:bg-[#007a93] transition text-base sm:text-lg font-semibold text-white"
            >
              Get Started
            </Link>
            <Link
              href="/login"
              className="px-6 py-3 rounded-full border-2 border-[#0097b2] hover:bg-[#0097b2] hover:text-white transition text-base sm:text-lg font-semibold text-[#0097b2]"
            >
              Log In
            </Link>
          </div>
        ) : (
          <Link
            href="/dashboard"
            className="px-8 py-3 rounded-full bg-[#0097b2] hover:bg-[#007a93] transition text-lg font-semibold text-white"
          >
            Go to Dashboard →
          </Link>
        )}
      </section>

      {/* ================= FEATURE GRID ================= */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 px-8 pb-20 mt-8">
        {[
          { title: "Top Charts", desc: "Listen to trending hits right now." },
          { title: "New Releases", desc: "Discover the latest from your favorite artists." },
          { title: "Made For You", desc: "Personalized playlists to match your mood." },
          { title: "Classic Vibes", desc: "Rediscover timeless melodies." },
          { title: "Regional Beats", desc: "Enjoy the sound of every region." },
          { title: "Podcasts", desc: "Stream stories, shows, and talks." },
        ].map((feature, i) => (
          <div
            key={i}
            className="bg-white hover:bg-gray-50 transition p-6 rounded-2xl border border-gray-200 shadow-sm"
          >
            <h3 className="text-xl font-semibold mb-2 text-black">{feature.title}</h3>
            <p className="text-gray-600 text-sm">{feature.desc}</p>
          </div>
        ))}
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="py-6 text-center text-gray-500 text-sm border-t border-gray-200">
        
      </footer>
    </main>
  );
}
