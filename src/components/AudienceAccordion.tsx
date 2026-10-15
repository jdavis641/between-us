'use client'

import { useState } from 'react'

const audiences = [
  {
    title: 'Singles',
    icon: '🔥',
    content: "Skip the trial-and-error of casual dating. Generate a temporary, easily modifiable 'Guest Pass' before a hookup to safely connect and discover where your mutual boundaries intersect. Grant limited-time access to your current desires and a 'how-to' guide for satisfying your needs—without ever exposing your rejected or 'Off-Limits' topics."
  },
  {
    title: 'Couples',
    icon: '🥂',
    content: "Eliminate awkward boundary conversations. Share your deepest desires in a completely judgment-free space. Step into customized games and serialized romantasy tailored for solo exploration, dual-perspective storylines, or group dynamics, allowing everyone to play a role in a shared narrative."
  },
  {
    title: 'Married Couples',
    icon: '💍',
    content: "A lack of open, judgment-free communication is a leading cause of relationship disconnect. Maintain a spicy marriage by linking your profiles to safely share evolving boundaries and desires. By discovering the safe intersection of your mutual interests, you can effortlessly understand your partner's intimate triggers without the anxiety of rejection. Cross a boundary? No problem—just blame the app!"
  }
]

export default function AudienceAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      {audiences.map((audience, index) => {
        const isOpen = openIndex === index
        return (
          <div 
            key={audience.title} 
            className="border border-zinc-800 bg-zinc-900/40 rounded-xl overflow-hidden transition-all duration-300"
          >
            <button
              onClick={() => toggle(index)}
              className="w-full flex items-center justify-between p-6 text-left focus:outline-none focus:bg-zinc-800/50 hover:bg-zinc-800/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <span className="text-2xl">{audience.icon}</span>
                <span className="text-xl font-bold text-zinc-100">{audience.title}</span>
              </div>
              <span className={`text-zinc-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </span>
            </button>
            
            <div 
              className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
            >
              <div className="p-6 pt-0 text-zinc-400 leading-relaxed text-lg border-t border-zinc-800/50 mt-2">
                {audience.content}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
