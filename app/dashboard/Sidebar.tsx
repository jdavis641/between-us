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
        {/* Top-Level Primary Navigation in Exact Dashboard Order */}
        <div className="space-y-1.5">
          <Link
            href="/dashboard"
            onClick={() => setIsOpen(false)}
            className={`block px-3 py-2 rounded-lg transition-colors ${
              pathname === '/dashboard' ? 'bg-zinc-900 text-white font-medium' : 'hover:bg-zinc-900 text-zinc-300 hover:text-white'
            }`}
          >
            Dashboard Home
          </Link>

          {/* 1. Intimacy Games */}
          <Link
            href="/dashboard/games"
            onClick={() => setIsOpen(false)}
            className={`block px-3 py-2 rounded-lg transition-colors ${
              pathname?.startsWith('/dashboard/games') ? 'bg-zinc-900 text-white font-medium' : 'hover:bg-zinc-900 text-zinc-300 hover:text-white'
            }`}
          >
            🎲 Intimacy Games
          </Link>

          {/* 2. The Randomizer */}
          <Link
            href="/dashboard/randomizer"
            onClick={() => setIsOpen(false)}
            className={`block px-3 py-2 rounded-lg transition-colors ${
              pathname === '/dashboard/randomizer' ? 'bg-zinc-900 text-white font-medium' : 'hover:bg-zinc-900 text-zinc-300 hover:text-white'
            }`}
          >
            ⚡ The Randomizer
          </Link>

          {/* 3. Romantasy */}
          <Link
            href="/dashboard/literature"
            onClick={() => setIsOpen(false)}
            className={`block px-3 py-2 rounded-lg transition-colors ${
              pathname === '/dashboard/literature' ? 'bg-zinc-900 text-white font-medium' : 'hover:bg-zinc-900 text-zinc-300 hover:text-white'
            }`}
          >
            📖 Romantasy
          </Link>

          {/* 4. Role Play */}
          <Link
            href="/dashboard/roleplay"
            onClick={() => setIsOpen(false)}
            className={`block px-3 py-2 rounded-lg transition-colors ${
              pathname === '/dashboard/roleplay' ? 'bg-zinc-900 text-white font-medium' : 'hover:bg-zinc-900 text-zinc-300 hover:text-white'
            }`}
          >
            🎭 Role Play
          </Link>

          {/* 5. Saved Favorites */}
          <Link
            href="/dashboard/favorites"
            onClick={() => setIsOpen(false)}
            className={`block px-3 py-2 rounded-lg transition-colors ${
              pathname === '/dashboard/favorites' ? 'bg-zinc-900 text-white font-medium' : 'hover:bg-zinc-900 text-zinc-300 hover:text-white'
            }`}
          >
            ❤️ Saved Favorites
          </Link>

          {/* 6. Between Us Pass */}
          <Link
            href="/dashboard/partnerinvite"
            onClick={() => setIsOpen(false)}
            className={`block px-3 py-2 rounded-lg transition-colors ${
              pathname === '/dashboard/partnerinvite'
                ? 'bg-red-950/40 text-red-300 border border-red-800/50 font-medium'
                : 'hover:bg-zinc-900 text-zinc-300 hover:text-white'
            }`}
          >
            💑 Between Us Pass
          </Link>

          {/* 7. Guest Pass */}
          <Link
            href="/dashboard/pass"
            onClick={() => setIsOpen(false)}
            className={`block px-3 py-2 rounded-lg transition-colors ${
              pathname === '/dashboard/pass'
                ? 'bg-red-950/40 text-red-300 border border-red-800/50 font-medium'
                : 'hover:bg-zinc-900 text-zinc-300 hover:text-white'
            }`}
          >
            🎟️ Guest Pass
          </Link>

          {/* 8. Account Settings */}
          <Link
            href="/dashboard/settings"
            onClick={() => setIsOpen(false)}
            className={`block px-3 py-2 rounded-lg transition-colors ${
              pathname === '/dashboard/settings' ? 'bg-zinc-900 text-white font-medium' : 'hover:bg-zinc-900 text-zinc-300 hover:text-white'
            }`}
          >
            ⚙️ Account Settings
          </Link>
        </div>

        {/* Romantasy Category Section / Reading Modes */}
        <div>
          <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 px-3">Romantasy</h3>
          <div className="space-y-1">
            <Link
              href="/dashboard/literature?mode=solo"
              onClick={() => setIsOpen(false)}
              className="block px-3 py-1.5 text-sm rounded-lg hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200"
            >
              Solo Reading
            </Link>
            <Link
              href="/dashboard/literature?mode=couple"
              onClick={() => setIsOpen(false)}
              className="block px-3 py-1.5 text-sm rounded-lg hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200"
            >
              Couples Romantasy
            </Link>
            <Link
              href="/dashboard/literature?mode=group"
              onClick={() => setIsOpen(false)}
              className="block px-3 py-1.5 text-sm rounded-lg hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200"
            >
              Group Scenarios
            </Link>
          </div>
        </div>

        {/* Intimacy Games Category Section */}
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
              💡 Suggest Scenario
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

        {/* Account & Logout Footer */}
        <div className="pt-4 mt-4 border-t border-zinc-900">
          <Link
            href="/dashboard/messages"
            onClick={() => setIsOpen(false)}
            className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors mb-1 ${
              pathname === '/dashboard/messages' ? 'bg-zinc-900 text-white font-medium' : 'hover:bg-zinc-900 text-zinc-300 hover:text-white'
            }`}
          >
            📥 Inbox
          </Link>
          <Link
            href="/dashboard/settings"
            onClick={() => setIsOpen(false)}
            className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
              pathname === '/dashboard/settings' ? 'bg-zinc-900 text-white font-medium' : 'hover:bg-zinc-900 text-zinc-500 hover:text-zinc-300'
            }`}
          >
            ⚙️ Settings &amp; Billing
          </Link>
          <LogoutButton className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-red-950/20 text-red-500/70 hover:text-red-400 transition-colors mt-2 cursor-pointer" />
        </div>
      </nav>
    </aside>
  );
}
