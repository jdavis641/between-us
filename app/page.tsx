import Link from "next/link";
import Image from "next/image";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50 flex flex-col selection:bg-red-500/30">
      {/* Navigation / Header */}
      <nav className="w-full p-6 flex justify-between items-center max-w-5xl mx-auto">
        <div className="flex items-center gap-2">
          <Image src="/brand-logo.webp" alt="Between Us Logo" width={32} height={32} className="rounded-md drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
          <span className="font-bold text-xl tracking-wide uppercase text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">
            Between Us
          </span>
        </div>
        <Link 
          href="/onboarding" 
          className="text-sm font-medium text-zinc-300 hover:text-white transition-colors"
        >
          Sign In
        </Link>
      </nav>

      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center max-w-4xl mx-auto mt-10">
        <div className="mb-8 relative">
          <div className="absolute inset-0 blur-3xl bg-red-600/20 rounded-full w-32 h-32 mx-auto"></div>
          <div className="relative z-10 w-32 h-32 md:w-40 md:h-40 drop-shadow-[0_0_20px_rgba(239,68,68,0.8)]">
             <Image src="/brand-logo.webp" alt="Between Us Logo" fill className="object-contain rounded-xl" priority />
          </div>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
          The Uncensored <br className="hidden md:block" /> Intimacy App for Couples.
        </h1>
        
        <p className="text-xl md:text-2xl text-zinc-400 max-w-2xl mb-12 leading-relaxed">
          Reignite your spark with a secure, private space built exclusively for you and your partner. 
        </p>

        <Link 
          href="/onboarding" 
          className="group relative inline-flex items-center justify-center px-8 py-4 font-bold text-white transition-all duration-200 bg-red-600 border border-transparent rounded-full hover:bg-red-500 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-600 focus:ring-offset-zinc-950 shadow-[0_0_20px_rgba(220,38,38,0.4)]"
        >
          Start Your $0.99 Trial
          <svg className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
        </Link>
        <p className="mt-4 text-sm text-zinc-500">Cancel anytime. No app store tracking.</p>
      </section>

      {/* Value Proposition Section */}
      <section className="py-24 px-6 bg-zinc-900/50 border-y border-zinc-800/50">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-16">
          <div className="flex flex-col gap-4">
            <div className="w-12 h-12 bg-red-950/50 border border-red-900 rounded-xl flex items-center justify-center text-2xl mb-2 shadow-[0_0_10px_rgba(239,68,68,0.2)]">
              📖
            </div>
            <h3 className="text-2xl font-bold text-zinc-100">Serialized Fantasy Literature</h3>
            <p className="text-zinc-400 leading-relaxed text-lg">
              Receive weekly, customized erotic fantasy narratives tailored precisely to your shared boundaries and curiosities. Build anticipation throughout the week with immersive, strictly private stories.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <div className="w-12 h-12 bg-orange-950/50 border border-orange-900 rounded-xl flex items-center justify-center text-2xl mb-2 shadow-[0_0_10px_rgba(249,115,22,0.2)]">
              🎲
            </div>
            <h3 className="text-2xl font-bold text-zinc-100">Libraries of Intimacy Games</h3>
            <p className="text-zinc-400 leading-relaxed text-lg">
              Explore vast collections of curated experiences. From conversation-starting card games to movie night rules, drinking games, and complete date night blueprints.
            </p>
          </div>
        </div>
      </section>

      {/* Web-Only Framing Section */}
      <section className="py-24 px-6 max-w-4xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-6 text-zinc-100">
          Uncensored & Unrestricted
        </h2>
        <p className="text-xl text-zinc-400 leading-relaxed mb-10 max-w-3xl mx-auto">
          To bypass puritanical app store restrictions and provide a truly uncensored experience, <strong className="text-zinc-200">Between Us</strong> is exclusively available as a secure Progressive Web App. No app store tracking, no arbitrary content guidelines—just you, your partner, and direct access from your browser.
        </p>
        
        <div className="inline-flex items-center gap-3 bg-zinc-900 border border-zinc-800 px-6 py-4 rounded-2xl text-sm text-zinc-300">
          <span className="text-xl">📱</span>
          <span>Installs directly to your home screen like a native app.</span>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-12 text-center border-t border-zinc-900 flex flex-col items-center">
        <h2 className="text-2xl font-bold mb-6">Ready to turn up the heat?</h2>
        <Link 
          href="/onboarding" 
          className="inline-flex items-center justify-center px-8 py-4 font-bold text-white transition-all duration-200 bg-zinc-800 border border-zinc-700 rounded-full hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-600 focus:ring-offset-zinc-950"
        >
          Start $0.99 Trial Now
        </Link>
      </section>
    </main>
  );
}
