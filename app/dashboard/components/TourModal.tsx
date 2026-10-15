"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

const TOUR_STEPS = [
  {
    step: 1,
    title: "Settings & Customization",
    icon: "⚙️",
    content: "Settings allows you to update your tolerance levels, kinks, pronouns, etc. anytime."
  },
  {
    step: 2,
    title: "The Between Us Pass",
    icon: "🤝",
    content: "The Between Us Pass allows you to link your account with a partner to share mutually beneficial interests or desires, curating games, stories, and roleplay scenarios that meet everyone's needs. Add or remove users anytime on the Between Us Pass page."
  },
  {
    step: 3,
    title: "The Guest Pass",
    icon: "✨",
    content: "The Guest Pass allows you to customize a sharable, public-facing preference list to ensure a mutually beneficial romantic encounter (great for first-time hookups)."
  },
  {
    step: 4,
    title: "Guest Pass Expiration & Access",
    icon: "⏳",
    content: "Choose the expiration of your Guest Pass (24 or 48 hours) before access is removed and manage passes in the Guest Pass page. *Paid membership required for guests to view preferences."
  }
];

export default function TourModal() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [tourStarted, setTourStarted] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    const isTourRequested = searchParams?.get("tour") === "true";
    if (isTourRequested) {
      setIsOpen(true);
      setTourStarted(false);
      setCurrentStepIndex(0);
    }
  }, [searchParams]);

  const cleanUrl = () => {
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("tour");
      window.history.replaceState({}, "", url.pathname + (url.search ? url.search : ""));
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    cleanUrl();
  };

  const handleStartTour = () => {
    setTourStarted(true);
    setCurrentStepIndex(0);
  };

  const handleNext = () => {
    if (currentStepIndex < TOUR_STEPS.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  if (!isOpen) return null;

  const currentStep = TOUR_STEPS[currentStepIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-2xl text-zinc-100">
        
        {/* Close Icon */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-300 transition-colors p-2 text-xl leading-none"
          aria-label="Close Tour"
        >
          ✕
        </button>

        {!tourStarted ? (
          /* Initial Prompt */
          <div className="text-center space-y-6 py-2">
            <div className="w-16 h-16 mx-auto bg-red-950/60 border border-red-900/50 rounded-2xl flex items-center justify-center text-3xl shadow-inner">
              ✨
            </div>
            <div>
              <h3 className="text-2xl font-serif font-medium text-zinc-100">Welcome to Between Us</h3>
              <p className="text-zinc-400 mt-2 text-base leading-relaxed">
                Would you like a quick tour?
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={handleStartTour}
                className="flex-1 py-3 px-6 bg-red-900 hover:bg-red-800 text-white font-medium rounded-xl transition-colors shadow-lg shadow-red-950/50"
              >
                Yes
              </button>
              <button
                onClick={handleClose}
                className="flex-1 py-3 px-6 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium rounded-xl transition-colors border border-zinc-700"
              >
                No
              </button>
            </div>
          </div>
        ) : (
          /* Step-by-Step Sequence */
          <div className="space-y-6 py-1">
            {/* Header with Step Indicator */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <span className="text-xs uppercase tracking-widest font-semibold text-red-500">
                Step {currentStep.step} of {TOUR_STEPS.length}
              </span>
              <button
                onClick={handleClose}
                className="text-xs text-zinc-500 hover:text-zinc-400 uppercase tracking-wider font-medium"
              >
                Skip Tour
              </button>
            </div>

            {/* Step Content */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl p-2.5 bg-zinc-800/80 rounded-xl border border-zinc-700/60">
                  {currentStep.icon}
                </span>
                <h4 className="text-xl font-serif font-medium text-zinc-100">
                  {currentStep.title}
                </h4>
              </div>

              <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-5">
                <p className="text-zinc-300 text-sm sm:text-base leading-relaxed font-light">
                  {currentStep.content}
                </p>
              </div>
            </div>

            {/* Step Dots */}
            <div className="flex items-center justify-center gap-2 pt-2">
              {TOUR_STEPS.map((s, idx) => (
                <div
                  key={s.step}
                  className={`h-1.5 rounded-full transition-all ${
                    idx === currentStepIndex
                      ? "w-8 bg-red-600"
                      : "w-2 bg-zinc-700"
                  }`}
                />
              ))}
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                onClick={handlePrev}
                disabled={currentStepIndex === 0}
                className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed text-zinc-300 font-medium rounded-xl transition-colors text-sm border border-zinc-700"
              >
                Previous
              </button>
              <button
                onClick={handleNext}
                className="px-6 py-2.5 bg-red-900 hover:bg-red-800 text-white font-medium rounded-xl transition-colors text-sm shadow-md shadow-red-950"
              >
                {currentStepIndex === TOUR_STEPS.length - 1 ? "Finish Tour" : "Next"}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
