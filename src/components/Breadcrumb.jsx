"use client";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { motion } from "framer-motion";

export default function Breadcrumb({ items }) {
  return (
    <motion.nav
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2 text-sm mb-6 flex-wrap"
    >
      <Link
        href="/dashboard"
        className="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-[#0097b2] transition-colors"
      >
        <Home className="w-4 h-4" />
        <span>Dashboard</span>
      </Link>
      
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <ChevronRight className="w-4 h-4 text-gray-400" />
          {item.href ? (
            <Link
              href={item.href}
              className="text-gray-600 dark:text-gray-400 hover:text-[#0097b2] transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-gray-900 dark:text-white font-medium">
              {item.label}
            </span>
          )}
        </div>
      ))}
    </motion.nav>
  );
}
