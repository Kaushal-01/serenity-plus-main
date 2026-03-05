"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Drama, Search, Heart, Mic, Bot, Music } from "lucide-react";

export default function Home() {
  const [user, setUser] = useState(null);
  const [mounted, setMounted] = useState(false);

  // Structured data for SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Serenity",
    "description": "Discover music that heals, uplifts, and connects you to your emotions with Serenity+",
    "url": "https://serenity.app",
    "applicationCategory": "MultimediaApplication",
    "operatingSystem": "All",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    }
  };

  // Simulated auth check — replace with your real API/auth logic
  useEffect(() => {
    setMounted(true);
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) setUser(JSON.parse(storedUser));
    } catch (error) {
      // Handle localStorage errors (e.g., private browsing, quota exceeded)
      console.error("Failed to access localStorage:", error);
    }
  }, []);

  const handleLogout = () => {
    try {
      localStorage.removeItem("user");
    } catch (error) {
      console.error("Failed to clear localStorage:", error);
    }
    setUser(null);
  };

  // Prevent hydration mismatch by not rendering user-dependent content until mounted
  if (!mounted) {
    return (
      <>
        {/* Structured Data for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        
        <main className="min-h-screen flex flex-col bg-white text-black overflow-y-auto">
          {/* ================= NAVBAR ================= */}
          <nav className="w-full flex justify-between items-center px-6 sm:px-10 py-3 bg-white border-b border-gray-200 shadow-sm" role="navigation" aria-label="Main navigation">
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
          <section className="flex flex-col items-center justify-center text-center px-6 py-8" aria-labelledby="hero-heading">
            <h2 id="hero-heading" className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4 text-[#0097b2] leading-tight">
              Feel the Music with Serenity
            </h2>
            <p className="text-gray-600 text-sm sm:text-base max-w-xl mb-6">
              Discover songs, albums, and artists like never before — all in one elegant,
              immersive experience.
            </p>
          </section>
        </main>
      </>
    );
  }

  return (
    <>
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      
      <main className="min-h-screen flex flex-col bg-white text-black overflow-y-auto">
        {/* ================= NAVBAR ================= */}
        <nav className="w-full flex justify-between items-center px-6 sm:px-10 py-3 bg-white border-b border-gray-200 shadow-sm" role="navigation" aria-label="Main navigation">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#0097b2] tracking-tight">
          Serenity
        </h1>

        {!user ? (
          <div className="flex items-center gap-3 sm:gap-5">
            <Link
              href="/login"
              className="text-sm sm:text-base px-4 py-2 rounded-full bg-[#0097b2] hover:bg-[#007a93] transition font-medium text-white"
              aria-label="Log in to your account"
            >
              Log In
            </Link>
            <Link
              href="/signup"
              className="text-sm sm:text-base px-4 py-2 rounded-full bg-gray-100 text-black hover:bg-gray-200 transition font-medium border border-gray-300"
              aria-label="Create a new account"
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
              href="/dashboard"
              className="text-sm sm:text-base px-4 py-2 rounded-full bg-[#0097b2] hover:bg-[#007a93] transition font-medium text-white"
              aria-label="Go to dashboard"
            >
              Dashboard
            </Link>
            <button
              onClick={handleLogout}
              className="text-sm sm:text-base px-4 py-2 rounded-full bg-gray-200 hover:bg-gray-300 transition text-black"
              aria-label="Log out of your account"
            >
              Logout
            </button>
          </div>
        )}
      </nav>

        {/* ================= HERO SECTION ================= */}
        <section className="flex flex-col items-center justify-center text-center px-6 py-8" aria-labelledby="hero-heading">
          <h2 id="hero-heading" className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4 text-[#0097b2] leading-tight">
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
                aria-label="Get started with Serenity"
              >
                Get Started
              </Link>
              <Link
                href="/login"
                className="px-6 py-2.5 rounded-full border-2 border-[#0097b2] hover:bg-[#0097b2] hover:text-white transition text-base font-semibold text-[#0097b2]"
                aria-label="Log in to Serenity"
              >
                Log In
              </Link>
            </div>
          ) : (
            <Link
              href="/dashboard"
              className="px-8 py-2.5 rounded-full bg-[#0097b2] hover:bg-[#007a93] transition text-base font-semibold text-white mb-6"
              aria-label="Go to your dashboard"
            >
              Go to Dashboard →
            </Link>
          )}
        </section>

        {/* ================= FEATURE GRID ================= */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 px-6 sm:px-8 pb-6 pt-4" aria-label="Features">
        {[
          { 
            title: "Mood-Based Music", 
            Icon: Drama,
            desc: "Get personalized recommendations based on your emotions - Happy, Sad, Calm, or Angry."
          },
          { 
            title: "Smart Search", 
            Icon: Search,
            desc: "Search for songs, albums, artists, and playlists across the entire music library."
          },
          { 
            title: "Favorites & Playlists", 
            Icon: Heart,
            desc: "Save your favorite songs and create custom playlists for every occasion."
          },
          { 
            title: "Audio Recognition", 
            Icon: Mic,
            desc: "Identify any song by recording a short audio clip - find music instantly."
          },
          { 
            title: "AI Music Assistant", 
            Icon: Bot,
            desc: "Chat with our AI bot for personalized music recommendations and discovery."
          },
          { 
            title: "Full-Featured Player", 
            Icon: Music,
            desc: "Advanced music player with shuffle, repeat, queue management, and volume control."
          },
          ].map((feature, i) => (
            <article
              key={i}
              className="group relative bg-white hover:bg-gray-50 
              transition-all duration-300 p-4 rounded-2xl border border-gray-200 
              hover:border-[#0097b2] hover:shadow-lg hover:shadow-[#0097b2]/10 
              hover:-translate-y-1 cursor-pointer
              flex flex-col items-center sm:items-start text-center sm:text-left"
            >
              {/* Icon */}
              <div className="text-[#0097b2] mb-2 group-hover:scale-110 transition-transform duration-300" aria-hidden="true">
                <feature.Icon size={32} strokeWidth={1.5} />
              </div>
              
              {/* Content */}
              <h3 className="text-lg font-semibold mb-1.5 text-black group-hover:text-[#0097b2] 
                transition-colors duration-300">
                {feature.title}
              </h3>
              <p className="text-gray-600 text-xs leading-relaxed">{feature.desc}</p>
            </article>
          ))}
        </section>

        {/* ================= FOOTER ================= */}
        <footer className="mt-auto py-6 text-center text-gray-500 text-xs border-t border-gray-200" role="contentinfo">
          <div className="max-w-7xl mx-auto px-6">
            <p className="text-gray-400">
              © {new Date().getFullYear()} Serenity. All rights reserved.
            </p>
          </div>
        </footer>
      </main>
    </>
  );
}
