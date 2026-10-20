'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import LogoutButton from '../components/LogoutButton';

interface SidebarProps {
  logo?: React.ReactNode;
}

export default function Sidebar({ logo }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Close menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <aside className="w-full md:w-72 bg-zinc-950 border-b md:border-b-0 md:border-r border-zinc-900 flex flex-col md:h-screen md:sticky md:top-0 shrink-0">
      <div className="p-4 md:p-6 flex items-center justify-between md:justify-start gap-3">
        <div className="flex items-center gap-3">
          {/* Mobile-only hamburger menu button */}
          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            className="md:hidden p-2 -ml-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-700 transition-colors"
            aria-label="Toggle Navigation Menu"
            aria-expanded={isOpen}
          >
            {isOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>

          {logo ? (
            logo
          ) : (
            <Link href="/dashboard" className="flex items-center gap-3" onClick={() => setIsOpen(false)}>
              <Image src="/brand-logo.webp" alt="Between Us Logo" width={32} height={32} priority className="rounded-md" />
              <h2 className="text-xl font-bold tracking-widest uppercase text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">
                Between Us
              </h2>
            </Link>
          )}
        </div>
      </div>

      {/* Navigation links: toggleable on mobile, always visible on desktop */}
      <nav
        className={`flex-1 overflow-y-auto p-4 space-y-8 ${
          isOpen ? "block animate-in slide-in-from-top-2 duration-200" : "hidden"
        } md:block`}
      >
        {/* Main */}
        <div className="space-y-2">
          <Link
            href="/dashboard"
            onClick={() => setIsOpen(false)}
            className="block px-3 py-2 rounded-lg hover:bg-zinc-900 text-zinc-300 hover:text-white transition-colors"
          >
            Dashboard Home
          </Link>
          <Link
            href="/dashboard/pass"
            onClick={() => setIsOpen(false)}
            className="block px-3 py-2 rounded-lg bg-red-950/20 text-red-400 hover:bg-red-950/40 border border-red-900/30 transition-colors"
          >
            🎟️ Between Us Pass
          </Link>
          <Link
            href="/dashboard/randomizer"
            onClick={() => setIsOpen(false)}
            className="block px-3 py-2 rounded-lg hover:bg-zinc-900 text-zinc-300 hover:text-white transition-colors"
          >
            🎲 Randomizer Games
          </Link>
          <Link
            href="/dashboard/games"
            onClick={() => setIsOpen(false)}
            className="block px-3 py-2 rounded-lg hover:bg-zinc-900 text-zinc-300 hover:text-white transition-colors"
          >
            ✨ Card Games
          </Link>
          <Link
            href="/dashboard/literature"
            onClick={() => setIsOpen(false)}
            className="block px-3 py-2 rounded-lg hover:bg-zinc-900 text-zinc-300 hover:text-white transition-colors"
          >
            📖 Erotic Stories
          </Link>
          <Link
            href="/dashboard/roleplay"
            onClick={() => setIsOpen(false)}
            className="block px-3 py-2 rounded-lg hover:bg-zinc-900 text-zinc-300 hover:text-white transition-colors"
          >
            🎭 Role Play
          </Link>
          <Link
            href="/dashboard/favorites"
            onClick={() => setIsOpen(false)}
            className="block px-3 py-2 rounded-lg hover:bg-zinc-900 text-zinc-300 hover:text-white transition-colors"
          >
            ❤️ Your Favorites
          </Link>
        </div>

        {/* Intimacy Games */}
        <div>
          <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 px-3">Intimacy Games</h3>
          <div className="space-y-1">
            <Link
              href="/dashboard/games#card"
              onClick={() => setIsOpen(false)}
              className="block px-3 py-1.5 text-sm rounded-lg hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200"
            >
              Card Games
            </Link>
            <Link
              href="/dashboard/games#movie"
              onClick={() => setIsOpen(false)}
              className="block px-3 py-1.5 text-sm rounded-lg hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200"
            >
              Movie Night
            </Link>
            <Link
              href="/dashboard/games#drinking"
              onClick={() => setIsOpen(false)}
              className="block px-3 py-1.5 text-sm rounded-lg hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200"
            >
              Drinking Games
            </Link>
            <Link
              href="/dashboard/games#date_night"
              onClick={() => setIsOpen(false)}
              className="block px-3 py-1.5 text-sm rounded-lg hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200"
            >
              Date Night
            </Link>
          </div>
        </div>

        {/* Community & Feedback */}
        <div>
          <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 px-3">Community</h3>
          <div className="space-y-1">
            <Link
              href="/dashboard/suggest"
              onClick={() => setIsOpen(false)}
              className="block px-3 py-1.5 text-sm rounded-lg hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200"
            >
              💡 Suggest an erotic literature scenario for public enjoyment
            </Link>
            <Link
              href="/dashboard/improve"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-zinc-900 text-zinc-500 hover:text-zinc-300 transition-colors mb-1"
            >
              🛠️ Improve the App
            </Link>
          </div>
        </div>

        {/* Account */}
        <div className="pt-4 mt-4 border-t border-zinc-900">
          <Link
            href="/dashboard/messages"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-zinc-900 text-zinc-300 hover:text-white transition-colors mb-1"
          >
            📥 Inbox
          </Link>
          <Link
            href="/dashboard/settings"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-zinc-900 text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            ⚙️ Settings & Billing
          </Link>
          <LogoutButton className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-red-950/20 text-red-500/70 hover:text-red-400 transition-colors mt-2" />
        </div>
      </nav>
    </aside>
  );
}
