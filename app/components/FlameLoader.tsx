'use client';

import React from 'react';

interface FlameLoaderProps {
  isGenerating?: boolean;
  progressText?: string;
  className?: string;
}

// Official "Between Us" Lined Flame Logo path coordinates
const FLAME_PATH_D = [
  // Top petal & inner ribbon
  "M 234 158 C 212 115 228 65 256 22 C 284 65 300 115 278 158",
  // Under-strand continuing to lower-right loop
  "M 266 198 C 280 216 298 244 298 276 C 298 312 280 338 256 342",
  // Over-strand (apex -> right petal -> crossover -> lower-left loop)
  "M 256 22 C 284 65 300 115 278 158 C 266 182 242 210 228 244 C 216 274 216 308 234 332 C 243 340 256 342 256 342",
  // Outer Left Wing
  "M 204 94 C 158 144 126 210 128 268 C 130 326 172 360 236 364 C 255 365 272 362 282 356",
  // Outer Right Wing
  "M 308 94 C 354 144 386 210 384 268 C 382 328 344 372 274 374 C 255 374 238 370 228 364"
].join(" ");

export default function FlameLoader({
  isGenerating = true,
  progressText,
  className = ''
}: FlameLoaderProps) {
  // State management: only render when isGenerating is true
  if (!isGenerating) return null;

  return (
    <div className={`flex flex-col items-center justify-center p-8 bg-zinc-950/80 border border-zinc-800/80 rounded-2xl shadow-2xl relative overflow-hidden ${className}`}>
      {/* Background ambient flame glow */}
      <div className="absolute inset-0 bg-radial from-red-950/30 via-purple-950/15 to-transparent opacity-75 pointer-events-none animate-pulse" />

      {/* Official Lined Flame Animation Container */}
      <div className="relative w-28 h-36 flex items-center justify-center select-none my-2">
        <svg
          viewBox="105 15 302 370"
          className="w-full h-full overflow-visible select-none pointer-events-none"
          xmlns="http://www.w3.org/2000/svg"
          aria-label="Between Us Flame Loader"
        >
          <defs>
            {/* LinearGradient: 0% (Bottom) Purple -> 50% (Middle) Red-Orange -> 100% (Top) Orange-Yellow */}
            <linearGradient id="flame-gradient" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#8B5CF6" />
              <stop offset="50%" stopColor="#F43F5E" />
              <stop offset="100%" stopColor="#FBBF24" />
            </linearGradient>

            {/* Reusable flame path definition */}
            <path
              id="flame-path-def"
              d={FLAME_PATH_D}
              fill="none"
              stroke="url(#flame-gradient)"
              strokeWidth="18"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </defs>

          {/* Base Layer: Clean multi-colored outline of the flame visible immediately */}
          <g className="flame-base-layer">
            {/* Soft translucent multi-colored ribbon track */}
            <path
              d={FLAME_PATH_D}
              fill="none"
              stroke="url(#flame-gradient)"
              strokeWidth="18"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.25"
            />
            {/* Sharp multi-colored outline stroke */}
            <path
              d={FLAME_PATH_D}
              fill="none"
              stroke="url(#flame-gradient)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.85"
            />
          </g>

          {/* Fill Layer: Duplicated flame path with purple-to-yellow gradient rising from base */}
          <g
            className="flame-fill-layer drop-shadow-[0_0_16px_rgba(244,63,94,0.65)]"
            style={{
              clipPath: 'inset(100% 0 0 0)',
              animation: 'fillUp 60s ease-in-out forwards'
            }}
          >
            <path
              d={FLAME_PATH_D}
              fill="none"
              stroke="url(#flame-gradient)"
              strokeWidth="18"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        </svg>
      </div>

      {/* Status Messages */}
      <div className="mt-3 text-center z-10 space-y-1.5">
        <p className="text-zinc-200 font-serif text-lg tracking-wide animate-pulse">
          {progressText || "Reviewing your preferences... Creating your content... This is going to be great!"}
        </p>
        <p className="text-zinc-500 text-xs tracking-widest uppercase font-sans">
          Building tension, pacing & visceral desires
        </p>
      </div>

      <style>{`
        @keyframes fillUp {
          0% {
            clip-path: inset(100% 0 0 0);
          }
          100% {
            clip-path: inset(0% 0 0 0);
          }
        }

        .flame-fill-layer {
          clip-path: inset(100% 0 0 0);
          animation: fillUp 60s ease-in-out forwards;
        }
      `}</style>
    </div>
  );
}
