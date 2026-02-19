"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { LayoutDashboard, Music, Heart, User, Search } from "lucide-react";
import { usePlayer } from "@/context/PlayerContext";

export default function MobileFooter() {
  const pathname = usePathname();
  const { currentSong } = usePlayer();
  const [user, setUser] = useState(null);
  const [isPlayerExpanded, setIsPlayerExpanded] = useState(false);

  // Check if user is logged in
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

    updateUserState();
    window.addEventListener("serenity-auth-update", updateUserState);
    window.addEventListener("storage", updateUserState);

    return () => {
      window.removeEventListener("serenity-auth-update", updateUserState);
      window.removeEventListener("storage", updateUserState);
    };
  }, []);

  // Listen for player expanded state
  useEffect(() => {
    const handlePlayerExpand = (e) => setIsPlayerExpanded(e.detail?.isExpanded || false);
    window.addEventListener("player-expanded", handlePlayerExpand);
    return () => window.removeEventListener("player-expanded", handlePlayerExpand);
  }, []);

  // Don't show footer if user is not logged in or on auth pages
  if (!user || pathname === "/login" || pathname === "/signup" || pathname === "/onboarding") {
    return null;
  }

  // Hide when player is expanded
  if (isPlayerExpanded) {
    return null;
  }

  const navItems = [
    { href: "/playlists", icon: Music, label: "Playlists" },
    { href: "/search", icon: Search, label: "Search" },
    { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/favorites", icon: Heart, label: "Favorites" },
  ];

  const isActive = (href) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard" || pathname.startsWith("/dashboard/");
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <motion.nav
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="fixed md:hidden left-0 right-0 bottom-0 z-[40] bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-lg transition-all duration-300"
    >
      <div className="flex items-center justify-around px-2 py-2 safe-area-inset-bottom">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-col items-center justify-center flex-1 py-2 px-1 transition-all"
            >
              {active && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-[#0097b2]/10 rounded-xl"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <Icon
                className={`w-6 h-6 relative z-10 transition-colors ${
                  active
                    ? "text-[#0097b2]"
                    : "text-gray-500 dark:text-gray-400"
                }`}
              />
              <span
                className={`text-xs mt-1 font-medium relative z-10 transition-colors ${
                  active
                    ? "text-[#0097b2]"
                    : "text-gray-500 dark:text-gray-400"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </motion.nav>
  );
}
