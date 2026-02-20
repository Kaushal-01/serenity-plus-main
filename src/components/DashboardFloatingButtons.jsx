"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import ChatBot from "./ChatBot";
import AudioRecognitionButton from "./AudioRecognitionButton";

export default function DashboardFloatingButtons() {
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if screen is mobile on mount
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  // Desktop: show everywhere (original behavior)
  // Mobile: only show on dashboard
  const shouldShow = !isMobile || (isMobile && pathname === "/dashboard");

  if (!shouldShow) {
    return null;
  }

  return (
    <>
      <ChatBot />
      <AudioRecognitionButton />
    </>
  );
}
