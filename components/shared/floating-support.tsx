"use client";

import React, { useState } from "react";
import { useSupport } from "@/providers/support-provider";
import { MessageSquare } from "lucide-react";

export function FloatingSupport() {
  const { openSupport, isOpen } = useSupport();
  const [isHovered, setIsHovered] = useState(false);

  if (isOpen) return null;

  return (
    <div 
      className="fixed bottom-[96px] md:bottom-8 right-6 z-40 transition-all duration-300 transform hover:scale-105 active:scale-95"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <button
        onClick={openSupport}
        className="flex items-center gap-2.5 rounded-full border border-gray-200/50 bg-white/80 p-3.5 shadow-2xl backdrop-blur-md transition-all dark:border-white/5 dark:bg-[#07130d]/80 text-emerald-600 dark:text-emerald-400 group hover:border-emerald-500/30 hover:bg-emerald-500/5"
        aria-label="Contact Support"
      >
        {/* Pulsing online status indicator beacon */}
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>

        {/* Hover expanding text */}
        <span className={`text-xs font-semibold tracking-wide whitespace-nowrap overflow-hidden transition-all duration-300 ${
          isHovered ? "max-w-[120px] opacity-100" : "max-w-0 opacity-0 md:max-w-0"
        }`}>
          Support Online
        </span>

        {/* Icon */}
        <MessageSquare className="h-5 w-5 transition-transform duration-300 group-hover:rotate-12" />
      </button>
    </div>
  );
}
