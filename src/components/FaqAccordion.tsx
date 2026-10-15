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
              className="w-full flex items-center justify-between p-4 sm:p-6 text-left focus:outline-none focus:bg-zinc-800/50 hover:bg-zinc-800/50 transition-colors"
              aria-expanded={isOpen}
            >
              <span className="text-base sm:text-lg md:text-xl font-medium text-zinc-100 pr-3">
                {faq.question}
              </span>
              <span className={`text-zinc-500 transition-transform duration-300 shrink-0 ${isOpen ? 'rotate-180' : ''}`}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </span>
            </button>
            
            <div 
              className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}
            >
              <div className="p-4 sm:p-6 pt-0 text-zinc-400 leading-relaxed text-sm sm:text-base md:text-lg border-t border-zinc-800/50 mt-2 font-light">
                {faq.answer}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
