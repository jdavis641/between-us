'use client';

import React from 'react';

interface FlameLoaderProps {
  isGenerating?: boolean;
  progressText?: string;
  className?: string;
}

export default function FlameLoader({
  isGenerating = true,
  progressText,
  className = ''
}: FlameLoaderProps) {
  if (!isGenerating) return null;

  return (
    <div className={`flex flex-col items-center justify-center p-8 bg-zinc-950/80 border border-zinc-800/80 rounded-2xl shadow-2xl relative overflow-hidden ${className}`}>
      {/* Background ambient flame glow */}
      <div className="absolute inset-0 bg-radial from-red-950/40 via-transparent to-transparent opacity-75 pointer-events-none animate-pulse" />

      {/* Flame Animation Container */}
      <div className="relative w-24 h-24 flex items-center justify-center select-none my-2">
        {/* Base Unfilled Flame (translucent / grayscale) */}
        <div 
          className="absolute inset-0 flex items-center justify-center text-6xl filter grayscale contrast-50 opacity-25 select-none pointer-events-none"
          aria-hidden="true"
        >
          🔥
        </div>

        {/* Animated Filling Flame (fills from bottom to top with gradient and glowing fire) */}
        <div 
          className="absolute inset-0 flex items-center justify-center text-6xl select-none pointer-events-none flame-fill-anim drop-shadow-[0_0_25px_rgba(239,68,68,0.75)]"
          aria-hidden="true"
        >
          🔥
        </div>
      </div>

      {/* Status Messages */}
      <div className="mt-3 text-center z-10 space-y-1.5">
        <p className="text-zinc-200 font-serif text-lg tracking-wide animate-pulse">
          {progressText || "Igniting intimate narrative..."}
        </p>
        <p className="text-zinc-500 text-xs tracking-widest uppercase font-sans">
          Building tension, pacing & visceral desires
        </p>
      </div>

      <style>{`
        @keyframes fillFromBottom {
          0% {
            clip-path: inset(100% 0 0 0);
            transform: scale(0.96);
            filter: brightness(0.9);
          }
          48% {
            clip-path: inset(0% 0 0 0);
            transform: scale(1.06);
            filter: brightness(1.25);
          }
          54% {
            clip-path: inset(0% 0 0 0);
            transform: scale(1.06);
            filter: brightness(1.25);
          }
          100% {
            clip-path: inset(100% 0 0 0);
            transform: scale(0.96);
            filter: brightness(0.9);
          }
        }

        .flame-fill-anim {
          animation: fillFromBottom 2.2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
          background: linear-gradient(to top, #dc2626, #ea580c, #f59e0b);
          -webkit-background-clip: text;
        }
      `}</style>
    </div>
  );
}
