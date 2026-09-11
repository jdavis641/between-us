import Link from "next/link";
import Image from "next/image";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-zinc-950 text-zinc-100 selection:bg-red-500/30">
      
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-72 bg-zinc-950 border-b md:border-b-0 md:border-r border-zinc-900 flex flex-col md:h-screen md:sticky md:top-0 shrink-0">
        <div className="p-6 flex items-center justify-between md:justify-start gap-3">
          <Image src="/brand-logo.webp" alt="Between Us Logo" width={32} height={32} className="rounded-md" />
          <h2 className="text-xl font-bold tracking-widest uppercase text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">
            Between Us
          </h2>
        </div>
        
        <nav className="flex-1 overflow-y-auto p-4 space-y-8 hidden md:block">
          
          {/* Main */}
          <div className="space-y-2">
            <Link href="/dashboard" className="block px-3 py-2 rounded-lg hover:bg-zinc-900 text-zinc-300 hover:text-white transition-colors">
              Dashboard Home
            </Link>
            <Link href="/dashboard/pass" className="block px-3 py-2 rounded-lg bg-red-950/20 text-red-400 hover:bg-red-950/40 border border-red-900/30 transition-colors">
              🎟️ Between Us Pass
            </Link>
          </div>

          {/* Intimacy Games */}
          <div>
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 px-3">Intimacy Games</h3>
            <div className="space-y-1">
              <Link href="/games#card" className="block px-3 py-1.5 text-sm rounded-lg hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200">Card Games</Link>
              <Link href="/games#movie" className="block px-3 py-1.5 text-sm rounded-lg hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200">Movie Night</Link>
              <Link href="/games#drinking" className="block px-3 py-1.5 text-sm rounded-lg hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200">Drinking Games</Link>
              <Link href="/games#date" className="block px-3 py-1.5 text-sm rounded-lg hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200">Date Night</Link>
            </div>
          </div>

          {/* Role Play */}
          <div>
            <div className="flex items-center justify-between px-3 mb-3">
              <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Role Play</h3>
              <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full border border-zinc-700">Scripts Toggle</span>
            </div>
            <div className="space-y-1">
              <Link href="/dashboard/roleplay?mode=solo" className="block px-3 py-1.5 text-sm rounded-lg hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200">Solo Play</Link>
              <Link href="/dashboard/roleplay?mode=couple" className="block px-3 py-1.5 text-sm rounded-lg hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200">Couple Play</Link>
              <Link href="/dashboard/roleplay?mode=group" className="block px-3 py-1.5 text-sm rounded-lg hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200">Group Play</Link>
            </div>
          </div>

          {/* Erotic Literature */}
          <div>
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 px-3">Erotic Literature</h3>
            <div className="space-y-1">
              <Link href="/dashboard/literature?mode=solo" className="block px-3 py-1.5 text-sm rounded-lg hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200">Solo Reading</Link>
              <Link href="/dashboard/literature?mode=couple" className="block px-3 py-1.5 text-sm rounded-lg hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200">Couple Reading</Link>
              <Link href="/dashboard/literature?mode=group" className="block px-3 py-1.5 text-sm rounded-lg hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200">Group Reading</Link>
            </div>
          </div>
          
          {/* Community & Feedback */}
          <div>
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 px-3">Community</h3>
            <div className="space-y-1">
              <Link href="/dashboard/suggest" className="block px-3 py-1.5 text-sm rounded-lg hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200">💡 Suggest Scenario</Link>
            </div>
          </div>

          {/* Account */}
          <div className="pt-4 mt-4 border-t border-zinc-900">
            <Link href="/dashboard/settings" className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-zinc-900 text-zinc-500 hover:text-zinc-300 transition-colors">
              ⚙️ Settings & Billing
            </Link>
          </div>
          
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 overflow-x-hidden flex flex-col relative w-full">
        {children}
      </div>

    </div>
  );
}
