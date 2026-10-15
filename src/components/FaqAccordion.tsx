'use client'

import { useState } from 'react'

export interface FaqItem {
  question: string
  answer: string
}

interface FaqAccordionProps {
  faqs?: FaqItem[]
}

const defaultFaqs: FaqItem[] = [
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
]

export default function FaqAccordion({ faqs = defaultFaqs }: FaqAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      {faqs.map((faq, index) => {
        const isOpen = openIndex === index
        return (
          <div 
            key={faq.question} 
            className="border border-zinc-800 bg-zinc-900/40 rounded-xl overflow-hidden transition-all duration-300"
          >
            <button
              onClick={() => toggle(index)}
              className="w-full flex items-center justify-between p-6 text-left focus:outline-none focus:bg-zinc-800/50 hover:bg-zinc-800/50 transition-colors"
              aria-expanded={isOpen}
            >
              <span className="text-lg md:text-xl font-medium text-zinc-100 pr-4">
                {faq.question}
              </span>
              <span className={`text-zinc-500 transition-transform duration-300 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </span>
            </button>
            
            <div 
              className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
            >
              <div className="p-6 pt-0 text-zinc-400 leading-relaxed text-base md:text-lg border-t border-zinc-800/50 mt-2 font-light">
                {faq.answer}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
