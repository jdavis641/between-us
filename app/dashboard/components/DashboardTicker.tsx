'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function DashboardTicker() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      // Begin fade-out transition
      setFade(false);

      // Change text after fade-out, then fade-in
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % 3);
        setFade(true);
      }, 350);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-gray-800 p-4 md:p-6 rounded-xl border border-gray-700 text-center min-h-[72px] sm:min-h-[68px] flex items-center justify-center overflow-hidden">
      <div
        className={`text-sm text-zinc-400 font-normal transition-opacity duration-300 ease-in-out ${
          fade ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {currentIndex === 0 && (
          <span>
            Change your tolerance level from Sensory, Playful, Intense or Extreme in the{' '}
            <Link
              href="/dashboard/settings"
              className="text-blue-400 hover:text-blue-300 underline transition-colors"
            >
              settings menu
            </Link>
            .
          </span>
        )}

        {currentIndex === 1 && (
          <span>
            Be sure to rate stories, role play scenarios and games to curate the content to your preferences.
          </span>
        )}

        {currentIndex === 2 && (
          <span>
            Want to contribute? You can also suggest content or add your own to the community anonymously.
          </span>
        )}
      </div>
    </div>
  );
}
