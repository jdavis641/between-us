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
    answer: "Our conversational onboarding assessment lets you rate themes as definitely interested, curious, or off-limits. This generates an endless supply of games and literature incorporating your unique interests while explicitly filtering out no-go topics."
  },
  {
    question: "How does the system evolve?",
    answer: "The system anonymously gathers ratings, delivering the 'greatest hits' from the user base so you always experience top-rated, fresh scenarios."
  },
  {
    question: "How is my anonymity protected?",
    answer: "We never collect identifying information. We encourage burner emails, never store payment data on our system, and assign randomized IDs so you can fully express your desires without fear of data breaches."
  },
  {
    question: "Is this an inclusive app?",
    answer: "Absolutely. We firmly believe that mind-blowing intimate encounters are a right for everyone. We work diligently to ensure that our system is universally inclusive, intuitively capturing diverse pronouns, genders, and sexual orientations to generate something for everyone. If you do not see your preference, suggest a theme, trope, or category, and our team will include it in the system for everyone to enjoy."
  }
];

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
        <div className="flex items-center gap-3">
          <Link 
            href="/login" 
            className="border border-zinc-800 text-zinc-300 px-5 py-2.5 rounded-lg font-medium hover:bg-zinc-900 transition-colors"
          >
            Sign In
          </Link>
          <a 
            href="https://buy.stripe.com/28EcN5goV16l9JBgFNbbG00"
            className="bg-zinc-100 text-zinc-950 px-5 py-2.5 rounded-lg font-medium hover:bg-white transition-colors"
          >
            Sign Up
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-24 text-center max-w-4xl mx-auto">
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif font-medium tracking-tight mb-8 leading-tight text-zinc-100 flex flex-col gap-1.5 md:gap-2">
          <span>Deepen Your Connection</span>
          <span>Explore Boundaries</span>
          <span>Anonymously Reignite</span>
          <span className="text-zinc-400">All on Your Terms</span>
        </h1>
        
        <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mb-12 leading-relaxed font-light">
          An evolving intimacy communication tool designed to enhance relationship connections and elevate first-time encounters. It learns your preferences, adapts to your boundaries, and ensures you never run out of ways to spark passion. Fresh games and content—always ready when you are.
        </p>

        <a 
          href="https://buy.stripe.com/28EcN5goV16l9JBgFNbbG00" 
          className="group relative inline-flex items-center justify-center px-8 py-4 font-medium text-white transition-all duration-300 bg-zinc-100 text-zinc-950 border border-transparent rounded-full hover:bg-white hover:scale-[1.02] shadow-[0_0_20px_rgba(255,255,255,0.1)]"
        >
          $0.99 7-day trial (required for age verification)
          <svg className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
        </a>
        <p className="mt-5 text-sm text-zinc-400 font-light tracking-wide max-w-md">
          All of this for just $3/month. Cheaper than a single board game, with your price locked in for the life of your account.
        </p>
      </section>

      {/* Value Proposition Section */}
      <section className="py-24 px-6 bg-zinc-900/30 border-y border-zinc-900/50">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 lg:grid-cols-3 gap-12 lg:gap-8">
          <div className="flex flex-col gap-4">
            <h3 className="text-xl font-serif font-medium text-zinc-200 border-b border-zinc-800 pb-4">No Stale Content</h3>
            <p className="text-zinc-400 leading-relaxed font-light">
              Customized intimacy games, serialized erotic fantasy, and immersive roleplay—updated constantly. The system evolves based on your feedback, delivering a consistent, mutually beneficial experience without the repetition.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <h3 className="text-xl font-serif font-medium text-zinc-200 border-b border-zinc-800 pb-4">Total Anonymity</h3>
            <p className="text-zinc-400 leading-relaxed font-light">
              Built from the ground up with security and absolute privacy as our primary focus. Verification codes are sent directly to your email—we explicitly encourage using a burner account. No identifying personal information is ever stored. You control exactly who sees your profile and boundaries.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <h3 className="text-xl font-serif font-medium text-zinc-200 border-b border-zinc-800 pb-4">Unrestricted Access</h3>
            <p className="text-zinc-400 leading-relaxed font-light">
              Built exclusively as a Progressive Web App (PWA) to bypass puritanical app store restrictions. Enjoy a premium, uncensored experience free from arbitrary corporate guidelines.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <h3 className="text-xl font-serif font-medium text-zinc-200 border-b border-zinc-800 pb-4">Between Us Pass</h3>
            <p className="text-zinc-400 leading-relaxed font-light">
              For couples linking accounts. Unlock an endless supply of intimacy games, stories, and roleplay scenarios securely curated to mutual interests, strictly avoiding your &apos;Off-Limits&apos; topics. Revoke access at any time.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <h3 className="text-xl font-serif font-medium text-zinc-200 border-b border-zinc-800 pb-4">Guest Pass</h3>
            <p className="text-zinc-400 leading-relaxed font-light">
              Skip the awkward trial-and-error of first-time encounters. Set your desired preferences and temporarily share a customized &apos;how-to&apos; guide for the evening. Safely align mutual boundaries to guarantee a fulfilling, regret-free hookup.
            </p>
          </div>

          <div className="flex flex-col gap-4 bg-zinc-950/60 p-6 rounded-2xl border border-zinc-800/80 justify-between">
            <div>
              <h3 className="text-xl font-serif font-medium text-zinc-100 pb-3">Pricing &amp; Value</h3>
              <p className="text-zinc-300 leading-relaxed font-light">
                All of this for just $3/month. Cheaper than a single board game, with your price locked in for the life of your account.
              </p>
            </div>
            <a 
              href="https://buy.stripe.com/28EcN5goV16l9JBgFNbbG00" 
              className="inline-flex items-center text-sm font-medium text-rose-400 hover:text-rose-300 transition-colors pt-4 group"
            >
              Start 7-day trial for $0.99 
              <span className="ml-1.5 transition-transform group-hover:translate-x-1">&rarr;</span>
            </a>
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

      {/* FAQ Accordion Section */}
      <section className="py-24 px-6 border-t border-zinc-900/50">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-serif font-medium mb-4 text-zinc-100">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-zinc-400 font-light">
            Everything you need to know about Between Us and our commitment to you.
          </p>
        </div>
        <FaqAccordion faqs={faqs} />
      </section>

      {/* Bottom CTA */}
      <section className="py-24 px-6 text-center bg-zinc-900/30 border-t border-zinc-900/50 flex flex-col items-center">
        <h2 className="text-3xl font-serif font-medium mb-8 text-zinc-100">Ready to explore?</h2>
        <a 
          href="https://buy.stripe.com/28EcN5goV16l9JBgFNbbG00" 
          className="inline-flex items-center justify-center px-8 py-4 font-medium transition-all duration-300 bg-zinc-800 text-zinc-100 border border-zinc-700 rounded-full hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-600 focus:ring-offset-zinc-950"
        >
          $0.99 7-day trial (required for age verification)
        </a>
        <p className="mt-5 text-sm text-zinc-400 font-light tracking-wide max-w-md">
          All of this for just $3/month. Cheaper than a single board game, with your price locked in for the life of your account.
        </p>
      </section>
    </main>
  );
}
