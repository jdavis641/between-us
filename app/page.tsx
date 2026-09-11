import Link from "next/link";
import Image from "next/image";
import AudienceAccordion from "@/components/AudienceAccordion";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50 flex flex-col selection:bg-rose-500/30 font-sans">
      {/* Navigation / Header */}
      <nav className="w-full p-6 flex justify-between items-center max-w-5xl mx-auto border-b border-zinc-900/50">
        <div className="flex items-center gap-3">
          <Image src="/brand-logo.webp" alt="Between Us Logo" width={32} height={32} priority className="rounded-md shadow-[0_0_15px_rgba(244,63,94,0.15)]" />
          <span className="font-semibold text-lg tracking-widest uppercase text-zinc-100">
            Between Us
          </span>
        </div>
        <Link 
          href="/signin" 
          className="text-sm font-medium text-zinc-400 hover:text-zinc-100 transition-colors"
        >
          Sign In
        </Link>
      </nav>

      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-24 text-center max-w-4xl mx-auto">
        <h1 className="text-5xl md:text-7xl font-serif font-medium tracking-tight mb-6 leading-tight text-zinc-100">
          Deepen your connection. <br className="hidden md:block" /> On your own terms.
        </h1>
        
        <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mb-12 leading-relaxed font-light">
          An evolving intimacy communication tool designed to enhance relationship connections. It learns your preferences, adapts to your boundaries, and ensures you never run out of ways to spark tension.
        </p>

        <Link 
          href="/signup" 
          className="group relative inline-flex items-center justify-center px-8 py-4 font-medium text-white transition-all duration-300 bg-zinc-100 text-zinc-950 border border-transparent rounded-full hover:bg-white hover:scale-[1.02] shadow-[0_0_20px_rgba(255,255,255,0.1)]"
        >
          $0.99 7-day trial (required for age verification)
          <svg className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
        </Link>
        <p className="mt-5 text-sm text-zinc-500 font-light tracking-wide">
          Ongoing subscription for under $3 a month per user via Stripe.
        </p>
      </section>

      {/* Value Proposition Section */}
      <section className="py-24 px-6 bg-zinc-900/30 border-y border-zinc-900/50">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 lg:grid-cols-3 gap-12 lg:gap-8">
          <div className="flex flex-col gap-4">
            <h3 className="text-xl font-serif font-medium text-zinc-200 border-b border-zinc-800 pb-4">No Stale Content</h3>
            <p className="text-zinc-400 leading-relaxed font-light">
              We deliver customized, serialized erotic fantasy literature and immersive roleplay scenarios updated regularly. The engine continuously improves based on your feedback, preferences, and dislikes.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <h3 className="text-xl font-serif font-medium text-zinc-200 border-b border-zinc-800 pb-4">Total Anonymity</h3>
            <p className="text-zinc-400 leading-relaxed font-light">
              Our blind magic-link pairing system ensures complete privacy. We explicitly encourage you to create a burner email account for full anonymity while aligning your desires securely.
            </p>
          </div>

          <div className="flex flex-col gap-4 lg:col-span-1 md:col-span-2">
            <h3 className="text-xl font-serif font-medium text-zinc-200 border-b border-zinc-800 pb-4">Unrestricted Access</h3>
            <p className="text-zinc-400 leading-relaxed font-light">
              Built exclusively as a Progressive Web App (PWA) to bypass puritanical app store restrictions. You get a premium, uncensored experience directly on your home screen without arbitrary corporate guidelines.
            </p>
          </div>
        </div>
      </section>

      {/* Target Audience Accordion Section */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-serif font-medium mb-4 text-zinc-100">
            Designed for every stage.
          </h2>
          <p className="text-lg text-zinc-400 font-light">
            Whether you&apos;re single, dating, or married, Between Us adapts to your unique dynamic.
          </p>
        </div>
        <AudienceAccordion />
      </section>

      {/* Bottom CTA */}
      <section className="py-24 px-6 text-center bg-zinc-900/30 border-t border-zinc-900/50 flex flex-col items-center">
        <h2 className="text-3xl font-serif font-medium mb-8 text-zinc-100">Ready to explore?</h2>
        <Link 
          href="/signup" 
          className="inline-flex items-center justify-center px-8 py-4 font-medium transition-all duration-300 bg-zinc-800 text-zinc-100 border border-zinc-700 rounded-full hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-600 focus:ring-offset-zinc-950"
        >
          $0.99 7-day trial (required for age verification)
        </Link>
        <p className="mt-5 text-sm text-zinc-500 font-light tracking-wide max-w-sm">
          Cancel anytime. After the trial, the cost is an ongoing subscription for under $3 a month per user via Stripe.
        </p>
      </section>
    </main>
  );
}
