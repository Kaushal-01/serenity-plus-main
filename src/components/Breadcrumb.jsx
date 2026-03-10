"use client";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { motion } from "framer-motion";

export default function Breadcrumb({ items }) {
  return (
    <motion.nav
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-1.5 text-sm mb-6 overflow-x-auto scrollbar-hide pb-1 flex-nowrap w-full"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      <Link
        href="/dashboard"
        className="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-[#0097b2] transition-colors flex-shrink-0 whitespace-nowrap"
      >
        <Home className="w-4 h-4 flex-shrink-0" />
        <span>Dashboard</span>
      </Link>
      
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-1.5 flex-shrink-0 whitespace-nowrap">
          <ChevronRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
          {item.href ? (
            <Link
              href={item.href}
              className="text-gray-600 dark:text-gray-400 hover:text-[#0097b2] transition-colors whitespace-nowrap"
              title={item.label}
            >
              {item.label}
            </Link>
          ) : (
            <span 
              className="text-gray-900 dark:text-white font-medium whitespace-nowrap"
              title={item.label}
            >
              {item.label}
            </span>
          )}
        </div>
      ))}
    </motion.nav>
  );
}
