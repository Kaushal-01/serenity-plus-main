"use client";
import { motion } from "framer-motion";

export function SongCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md border border-gray-200 dark:border-gray-700 animate-pulse">
      <div className="aspect-square bg-gray-200 dark:bg-gray-700" />
      <div className="p-4 space-y-2">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
      </div>
    </div>
  );
}

export function SongListSkeleton({ count = 5 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 animate-pulse"
        >
          <div className="w-8 h-6 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
          </div>
          <div className="w-12 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      ))}
    </div>
  );
}

export function AlbumGridSkeleton({ count = 12 }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-md animate-pulse"
        >
          <div className="aspect-square bg-gray-200 dark:bg-gray-700" />
          <div className="p-4 space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ArtistHeaderSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 mb-8 animate-pulse"
    >
      <div className="flex items-start gap-6">
        <div className="w-32 h-32 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
        <div className="flex-1 space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
          <div className="flex items-center gap-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24" />
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-16" />
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-20" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function PlaylistHeaderSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 mb-8 animate-pulse"
    >
      <div className="flex items-start gap-6">
        <div className="w-48 h-48 rounded-2xl bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
        <div className="flex-1 space-y-4">
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
          <div className="flex items-center gap-6">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24" />
          </div>
          <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-full w-32" />
        </div>
      </div>
    </motion.div>
  );
}

export function DashboardLoadingSkeleton() {
  return (
    <div className="space-y-12">
      {/* Header Skeleton */}
      <div className="px-10 md:px-16 py-10 bg-gray-50 dark:bg-gray-800 rounded-b-3xl">
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse" />
      </div>

      {/* Mood Cards Skeleton */}
      <div className="px-10 md:px-16 space-y-8">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48 mx-auto animate-pulse" />
        <div className="flex flex-wrap justify-center gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="w-40 h-40 bg-gray-200 dark:bg-gray-700 rounded-3xl animate-pulse"
            />
          ))}
        </div>
      </div>

      {/* Song Grid Skeleton */}
      <div className="px-10 md:px-16 space-y-6">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <SongCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
