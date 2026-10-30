import Link from "next/link";
import Image from "next/image";
import AudienceAccordion from "@/components/AudienceAccordion";
import FaqAccordion, { FaqItem } from "@/components/FaqAccordion";

const faqs: FaqItem[] = [
  {
    question: "Can I delete my account and retain my preferences?",
    answer: "No. For total anonymity, your preferences are strictly tied to your active account. If you delete it, everything is permanently erased."
  },
  {
    question: "Why isn't this in the app stores?",
    answer: "Apple and Android enforce strict puritanical censorship. Operating as a PWA allows us to deliver an unrestricted, inclusive experience that elevates your intimacy."
  },
  {
    question: "How do you curate content?",
    answer: "Visit the settings menu to update your tolerance level anytime. Want more detail? You can also choose specific themes that you find interesting to update your solo preferences or couple preferences 24/7. This generates an endless supply of games and literature incorporating your unique interests while explicitly filtering out no-go topics."
  },
  {
    question: "How does the system evolve?",
    answer: "The system anonymously gathers your content ratings and saved favorites. Delivering the 'greatest hits' from the user base so you always experience top-rated, fresh scenarios."
  },
  {
    question: "How is my anonymity protected?",
    answer: "We never collect identifying information. We encourage burner emails, never store payment data on our system, and assign randomized IDs so you can fully express your desires without fear of data breaches."
  },
  {
    question: "Is this an inclusive app?",
    answer: "Absolutely. We firmly believe that mind-blowing intimate encounters are a right for everyone. We work diligently to ensure that our system is universally inclusive, intuitively capturing diverse pronouns, genders, and sexual orientations to generate something for everyone. If you do not see your preference, suggest a theme, trope, or category, and our team will include it in the system for everyone to enjoy."
  },
  {
    question: "Who created this app?",
    answer: "This app was created by a married couple in the American midwest. After years of marriage, kids and responsibilities we found ourselves in a bit of a rut. Eventually becoming more roommates than lovers. Intimacy games that we bought online became repetitive and expensive. We designed an app to increase our communication and connection. It worked, and we hope you enjoy it too!"
  }
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50 flex flex-col selection:bg-rose-500/30 font-sans">
      {/* Navigation / Header */}
      <nav className="w-full px-4 py-4 sm:px-6 sm:py-5 flex justify-between items-center max-w-5xl mx-auto border-b border-zinc-900/50">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <Image src="/brand-logo.webp" alt="Between Us Logo" width={32} height={32} priority className="rounded-md shadow-[0_0_15px_rgba(244,63,94,0.15)]" />
          <span className="font-semibold text-base sm:text-lg tracking-wider sm:tracking-widest uppercase text-zinc-100">
            Between Us
          </span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link 
            href="/login" 
            className="border border-zinc-800 text-zinc-300 px-3.5 py-2 sm:px-5 sm:py-2.5 rounded-lg text-sm sm:text-base font-medium hover:bg-zinc-900 transition-colors"
          >
            Sign In
          </Link>
          <a 
            href="https://buy.stripe.com/28EcN5goV16l9JBgFNbbG00"
            className="bg-zinc-100 text-zinc-950 px-3.5 py-2 sm:px-5 sm:py-2.5 rounded-lg text-sm sm:text-base font-medium hover:bg-white transition-colors"
          >
            Sign Up
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-16 sm:py-24 text-center max-w-4xl mx-auto">
        <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-serif font-medium tracking-tight mb-6 sm:mb-8 leading-tight text-zinc-100 flex flex-col gap-1.5 md:gap-2">
          <span>Deepen Your Connection</span>
          <span>Explore Boundaries</span>
          <span className="text-zinc-400">All on Your Terms</span>
        </h1>
        
        <p className="text-base sm:text-lg md:text-xl text-zinc-400 max-w-2xl mb-8 sm:mb-12 leading-relaxed font-light">
          An evolving intimacy communication tool designed to enhance relationship connections and elevate first-time encounters. It learns your preferences, adapts to your boundaries, and ensures you never run out of ways to spark passion. Fresh games and content—as mild or spicy as you desire-always ready when you are.
        </p>

        <a 
          href="https://buy.stripe.com/28EcN5goV16l9JBgFNbbG00" 
          className="group relative inline-flex items-center justify-center w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 font-medium text-white transition-all duration-300 bg-zinc-100 text-zinc-950 border border-transparent rounded-full hover:bg-white hover:scale-[1.02] shadow-[0_0_20px_rgba(255,255,255,0.1)] text-sm sm:text-base text-center"
        >
          $0.99 7-day trial (required for age verification)
          <svg className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
        </a>
        <p className="mt-4 sm:mt-5 text-xs sm:text-sm text-zinc-400 font-light tracking-wide max-w-md">
          All of this for just $3/month. Cheaper than a single intimacy game, with your price locked in (and free upgrades) for the life of your account.
        </p>
      </section>

      {/* Value Proposition Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 bg-zinc-900/30 border-y border-zinc-900/50">
        <div className="max-w-5xl mx-auto space-y-8 sm:space-y-12">
          
          {/* Row 1: 3 Columns (No Stale Content, Total Anonymity, Unrestricted Access) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col gap-3 sm:gap-4">
              <h3 className="text-xl font-serif font-medium text-zinc-200 border-b border-zinc-800 pb-3 sm:pb-4">No Stale Content</h3>
              <p className="text-zinc-400 leading-relaxed font-light text-sm sm:text-base">
                Customized intimacy games, serialized erotic fantasy, and immersive roleplay—updated constantly. The system evolves based on your feedback, delivering a consistent, mutually beneficial experience without the repetition.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:gap-4">
              <h3 className="text-xl font-serif font-medium text-zinc-200 border-b border-zinc-800 pb-3 sm:pb-4">Total Anonymity</h3>
              <p className="text-zinc-400 leading-relaxed font-light text-sm sm:text-base">
                Built from the ground up with security and absolute privacy as our primary focus. Verification codes are sent directly to your email—we explicitly encourage using a burner account. No identifying personal information is ever stored. You control exactly who sees your profile and boundaries.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:gap-4">
              <h3 className="text-xl font-serif font-medium text-zinc-200 border-b border-zinc-800 pb-3 sm:pb-4">Unrestricted Access</h3>
              <p className="text-zinc-400 leading-relaxed font-light text-sm sm:text-base">
                Built exclusively as a Progressive Web App (PWA) to bypass puritanical app store restrictions. Enjoy a premium, uncensored experience free from arbitrary corporate guidelines.
              </p>
            </div>
          </div>

          {/* Row 2: 2 Columns (Between Us Pass, Guest Pass) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex flex-col gap-3 sm:gap-4 p-6 sm:p-8 rounded-2xl bg-zinc-950/40 border border-zinc-800/80">
              <div className="flex items-center gap-2.5 border-b border-zinc-800 pb-3 sm:pb-4">
                <span className="text-rose-500 text-lg">🎟️</span>
                <h3 className="text-xl sm:text-2xl font-serif font-medium text-zinc-200">Between Us Pass</h3>
              </div>
              <p className="text-zinc-400 leading-relaxed font-light text-sm sm:text-base">
                For couples linking accounts. Unlock an endless supply of intimacy games, stories, and roleplay scenarios securely curated to mutual interests, strictly avoiding your &apos;Off-Limits&apos; topics. Revoke access at any time.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:gap-4 p-6 sm:p-8 rounded-2xl bg-zinc-950/40 border border-zinc-800/80">
              <div className="flex items-center gap-2.5 border-b border-zinc-800 pb-3 sm:pb-4">
                <span className="text-amber-500 text-lg">⚡</span>
                <h3 className="text-xl sm:text-2xl font-serif font-medium text-zinc-200">Guest Pass</h3>
              </div>
              <p className="text-zinc-400 leading-relaxed font-light text-sm sm:text-base">
                Skip the awkward trial-and-error of first-time encounters. Set your desired preferences and temporarily share a customized &apos;how-to&apos; guide for the evening. Safely align mutual boundaries to guarantee a fulfilling, regret-free hookup.
              </p>
            </div>
          </div>

          {/* Row 3: Single Column (Pricing & Value Spreading Across Homepage) */}
          <div className="relative overflow-hidden rounded-3xl border border-rose-500/30 bg-gradient-to-br from-zinc-900/90 via-zinc-900/80 to-rose-950/30 p-6 sm:p-10 lg:p-12 shadow-[0_0_35px_rgba(244,63,94,0.12)]">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
              <div className="space-y-4 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold uppercase tracking-wider">
                  Lifetime Value Guarantee
                </div>
                <h3 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-medium text-white tracking-tight leading-tight">
                  Pricing &amp; Value
                </h3>
                <p className="text-zinc-300 leading-relaxed font-light text-base sm:text-lg">
                  All of this for just <span className="font-semibold text-rose-300">$3/month</span>. Cheaper than a single intimacy game, with your price locked in (and free upgrades) for the life of your account.
                </p>
                <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-xs sm:text-sm text-zinc-400 pt-1 font-light">
                  <span className="flex items-center gap-1.5"><span className="text-rose-400 font-semibold">✓</span> Age-verified &amp; anonymous</span>
                  <span className="flex items-center gap-1.5"><span className="text-rose-400 font-semibold">✓</span> Continual fresh updates</span>
                  <span className="flex items-center gap-1.5"><span className="text-rose-400 font-semibold">✓</span> Unrestricted uncensored PWA</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end justify-center gap-4 shrink-0">
                <div className="text-left sm:text-right lg:text-right">
                  <div className="flex items-baseline sm:justify-end gap-1.5">
                    <span className="text-3xl sm:text-4xl font-bold text-white tracking-tight">$0.99</span>
                    <span className="text-zinc-400 text-sm font-light">/ 7-day trial</span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-1 font-light">Then $3/mo • Locked in for account lifetime</p>
                </div>
                
                <a 
                  href="https://buy.stripe.com/28EcN5goV16l9JBgFNbbG00" 
                  className="inline-flex items-center justify-center px-8 py-4 font-semibold text-zinc-950 bg-zinc-100 hover:bg-white rounded-xl sm:rounded-full transition-all duration-300 hover:scale-[1.02] shadow-[0_0_20px_rgba(255,255,255,0.1)] text-center text-sm sm:text-base group"
                >
                  Start 7-Day Trial for $0.99
                  <span className="ml-2 transition-transform group-hover:translate-x-1">&rarr;</span>
                </a>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Target Audience Accordion Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-medium mb-3 sm:mb-4 text-zinc-100">
            Designed for every stage.
          </h2>
          <p className="text-base sm:text-lg text-zinc-400 font-light">
            Whether you&apos;re single, dating, or married, Between Us adapts to your unique dynamic.
          </p>
        </div>
        <AudienceAccordion />
      </section>

      {/* FAQ Accordion Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 border-t border-zinc-900/50">
        <div className="max-w-4xl mx-auto text-center mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-medium mb-3 sm:mb-4 text-zinc-100">
            Frequently Asked Questions
          </h2>
          <p className="text-base sm:text-lg text-zinc-400 font-light">
            Everything you need to know about Between Us and our commitment to you.
          </p>
        </div>
        <FaqAccordion faqs={faqs} />
      </section>

      {/* Bottom CTA */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 text-center bg-zinc-900/30 border-t border-zinc-900/50 flex flex-col items-center">
        <h2 className="text-2xl sm:text-3xl font-serif font-medium mb-6 sm:mb-8 text-zinc-100">Ready to explore?</h2>
        <a 
          href="https://buy.stripe.com/28EcN5goV16l9JBgFNbbG00" 
          className="inline-flex items-center justify-center w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 font-medium transition-all duration-300 bg-zinc-800 text-zinc-100 border border-zinc-700 rounded-full hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-600 focus:ring-offset-zinc-950 text-sm sm:text-base text-center"
        >
          $0.99 7-day trial (required for age verification)
        </a>
        <p className="mt-4 sm:mt-5 text-xs sm:text-sm text-zinc-400 font-light tracking-wide max-w-md">
          All of this for just $3/month. Cheaper than a single intimacy game, with your price locked in (and free upgrades) for the life of your account.
        </p>
      </section>
    </main>
  );
}
