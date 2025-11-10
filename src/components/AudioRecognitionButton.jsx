"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function AudioRecognitionButton() {
  const [isHovered, setIsHovered] = useState(false);
  const router = useRouter();

  const handleClick = () => {
    router.push("/recognize");
  };

  return (
    <motion.div
      className="fixed bottom-24 right-6 z-40 group"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.5, duration: 0.5, type: "spring" }}
    >
      <motion.button
        onClick={handleClick}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        className="relative w-16 h-16 rounded-full bg-[#0097b2] shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center overflow-hidden hover:bg-[#007a93]"
        whileHover={{ scale: 1.1, rotate: 5 }}
        whileTap={{ scale: 0.95 }}
      >
        {/* Animated background pulse */}
        <motion.div
          className="absolute inset-0 bg-[#00b8d4]"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Microphone Icon */}
        <svg
          className="w-8 h-8 text-white z-10 relative"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
          />
        </svg>

        {/* Ripple effect */}
        {isHovered && (
          <motion.div
            className="absolute inset-0 border-4 border-white rounded-full"
            initial={{ scale: 1, opacity: 1 }}
            animate={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        )}
      </motion.button>

      {/* Tooltip */}
      <motion.div
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: isHovered ? 1 : 0, x: isHovered ? 0 : 10 }}
        className="absolute right-20 top-1/2 -translate-y-1/2 bg-[#0097b2] text-white px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap pointer-events-none shadow-lg border border-gray-200"
      >
        Recognize Song 🎵
      </motion.div>
    </motion.div>
  );
}
