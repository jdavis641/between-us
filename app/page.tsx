import Link from "next/link";
import Image from "next/image";
import AudienceAccordion from "@/components/AudienceAccordion";
import FaqAccordion, { FaqItem } from "@/components/FaqAccordion";

const faqs: FaqItem[] = [
  {
    question: "Is this an inclusive app?",
    answer: "Absolutely. We firmly believe that mind-blowing intimate encounters are a right for everyone. We work diligently to ensure that our system is universally inclusive, intuitively capturing diverse pronouns, genders, and sexual orientations to generate something for everyone. If you do not see your preference, suggest a theme, trope, or category, and our team will include it in the system for everyone to enjoy."
  },
  {
    question: "How does Between Us ensure complete anonymity?",
    answer: "Built from the ground up with security and absolute privacy as our primary focus. Verification codes are sent directly to your email—we explicitly encourage using a burner account. No identifying personal information is ever stored. You control exactly who sees your profile and boundaries."
  },
  {
    question: "What is the difference between a Between Us Pass and a Guest Pass?",
    answer: "The Between Us Pass is for couples linking accounts to unlock an endless supply of intimacy games, stories, and roleplay scenarios securely curated to mutual interests, strictly avoiding your 'Off-Limits' topics (revoke access anytime). The Guest Pass lets you set desired preferences and temporarily share a customized 'how-to' guide for first-time encounters to safely align mutual boundaries."
  },
  {
    question: "Why is Between Us built as a Progressive Web App (PWA)?",
    answer: "Built exclusively as a Progressive Web App (PWA) to bypass puritanical app store restrictions. Enjoy a premium, uncensored experience free from arbitrary corporate guidelines directly from your mobile browser or added to your home screen."
  },
  {
    question: "Can I cancel my subscription at any time?",
    answer: "Yes. Cancel anytime with no hassle. Following the $0.99 7-day trial (required for age verification), ongoing access is an affordable subscription for under $3 a month per user via Stripe."
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
        <Link 
          href="/login" 
          className="border border-zinc-800 text-zinc-300 px-6 py-3 rounded-lg font-medium hover:bg-zinc-900 transition-colors"
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
          An evolving intimacy communication tool designed to enhance relationship connections. It learns your preferences, adapts to your boundaries, and ensures you never run out of ways to spark passion.
        </p>

        <Link 
          href="/onboarding" 
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
              We built this app from the ground up with security and anonymity as our primary focus. Verification codes are sent directly to your email—we explicitly encourage using a burner account for absolute privacy. No identifying personal information is ever stored within our system, ensuring your profile and boundaries are only shared with the partners you choose.
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
        <Link 
          href="/onboarding" 
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
