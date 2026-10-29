'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';

const GOOGLE_REVIEW_LINK = process.env.NEXT_PUBLIC_GOOGLE_REVIEW_URL || 'YOUR_GOOGLE_BUSINESS_REVIEW_LINK';

export default function SurveyPage() {
  const [overallDesign, setOverallDesign] = useState<number>(0);
  const [valueForExperience, setValueForExperience] = useState<number>(0);
  const [suggestions, setSuggestions] = useState<string>('');
  const [enteredPreferences, setEnteredPreferences] = useState<'Yes' | 'No' | ''>('');
  const [preferencesGenerated, setPreferencesGenerated] = useState<'Yes' | 'No' | ''>('');
  const [usedWithPartner, setUsedWithPartner] = useState<'Yes' | 'No' | ''>('');
  const [partnerPreferencesGenerated, setPartnerPreferencesGenerated] = useState<'Yes' | 'No' | ''>('');
  const [finalNotes, setFinalNotes] = useState<string>('');
  const [willingToReviewGoogle, setWillingToReviewGoogle] = useState<'Yes' | 'No' | ''>('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Form Validation
    if (overallDesign === 0) {
      setErrorMessage("Please rate the app's overall design.");
      return;
    }
    if (valueForExperience === 0) {
      setErrorMessage("Please rate the value for the experience.");
      return;
    }
    if (!enteredPreferences) {
      setErrorMessage("Please answer whether you have entered preferences/kinks in the settings menu.");
      return;
    }
    if (!preferencesGenerated) {
      setErrorMessage("Please answer whether the app generated your preferences.");
      return;
    }
    if (!usedWithPartner) {
      setErrorMessage("Please answer whether you have used the app with a partner.");
      return;
    }
    if (usedWithPartner === 'Yes' && !partnerPreferencesGenerated) {
      setErrorMessage("Please answer whether your partner's preferences showed up in the generated content.");
      return;
    }
    if (!willingToReviewGoogle) {
      setErrorMessage("Please indicate whether you would be willing to review us on Google.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Retrieve the active user's registered email address from Supabase session
      const { data: { session } } = await supabase.auth.getSession();
      const userEmail = session?.user?.email || 'anonymous@betweenusapp.io';

      const payload = {
        email: userEmail,
        answers: {
          overallDesign,
          valueForExperience,
          suggestions: suggestions.trim(),
          enteredPreferences,
          preferencesGenerated,
          usedWithPartner,
          partnerPreferencesGenerated: usedWithPartner === 'Yes' ? partnerPreferencesGenerated : 'N/A',
          finalNotes: finalNotes.trim(),
          willingToReviewGoogle
        }
      };

      const res = await fetch('/api/survey/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error(`Survey dispatch failed (${res.status})`);
      }

      // Conditional Routing evaluation
      if (willingToReviewGoogle === 'Yes') {
        setIsRedirecting(true);
        setIsSubmitted(true);
        // Ensure Resend payload fires, then redirect
        setTimeout(() => {
          window.location.href = GOOGLE_REVIEW_LINK;
        }, 1200);
      } else {
        // If 'No': Render a clean UI success state thanking them for their time
        setIsSubmitted(true);
      }
    } catch (err: any) {
      console.error("Survey submission error:", err);
      setErrorMessage(err?.message || "Failed to submit survey. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 p-4 md:p-8 lg:p-12 font-sans selection:bg-red-900/50">
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* Navigation */}
        <div>
          <Link
            href="/dashboard"
            className="text-sm font-medium text-zinc-500 hover:text-zinc-300 transition-colors inline-flex items-center gap-1.5"
          >
            &larr; Back to Dashboard
          </Link>
        </div>

        {/* Header */}
        <header className="space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-red-500 bg-red-950/30 px-3.5 py-1.5 rounded-full border border-red-900/40 inline-block">
            48-Hour Experience Check-In
          </span>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-zinc-100 tracking-tight">
            Help Shape Between Us
          </h1>
          <p className="text-sm sm:text-base text-zinc-400 leading-relaxed max-w-2xl">
            Your feedback directly guides our core development and design roadmap. Take two minutes to tell us about your experience so far.
          </p>
        </header>

        {/* Content Body */}
        {isSubmitted ? (
          <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-8 sm:p-12 text-center space-y-6 shadow-2xl animate-in fade-in zoom-in-95 duration-500">
            {isRedirecting ? (
              <>
                <span className="text-5xl block animate-bounce">⭐</span>
                <h2 className="text-2xl sm:text-3xl font-serif font-bold text-zinc-100">
                  Thank You for Your Generosity!
                </h2>
                <p className="text-sm sm:text-base text-zinc-400 max-w-lg mx-auto leading-relaxed">
                  Your feedback has been securely forwarded to our team. Redirecting you to leave a Google review now...
                </p>
                <div className="flex justify-center pt-2">
                  <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                </div>
                <p className="text-xs text-zinc-500">
                  If you are not redirected automatically, <a href={GOOGLE_REVIEW_LINK} className="text-red-400 underline">click here</a>.
                </p>
              </>
            ) : (
              <>
                <span className="text-5xl block">❤️</span>
                <h2 className="text-2xl sm:text-3xl font-serif font-bold text-zinc-100">
                  Thank You for Your Time!
                </h2>
                <p className="text-sm sm:text-base text-zinc-400 max-w-lg mx-auto leading-relaxed">
                  Your insights have been dispatched directly to the development team. We appreciate you helping us make Between Us a more intimate, intuitive, and fulfilling experience.
                </p>
                <div className="pt-4">
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center justify-center px-8 py-3.5 bg-red-950/70 hover:bg-red-900/90 text-red-200 hover:text-white border border-red-900/70 rounded-xl text-sm font-semibold transition-all shadow-lg active:scale-95"
                  >
                    Return to Dashboard
                  </Link>
                </div>
              </>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in duration-500">
            
            {/* Field 1: Overall Design Rating */}
            <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6 sm:p-7 space-y-3.5 shadow-lg">
              <label className="block text-sm sm:text-base font-semibold text-zinc-200">
                Rate the app on a scale of 1-5 (overall design) <span className="text-red-400">*</span>
              </label>
              <div className="flex flex-wrap items-center gap-2.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setOverallDesign(star)}
                    className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl transition-all cursor-pointer border ${
                      overallDesign >= star
                        ? 'bg-rose-950/70 border-rose-700 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.3)] scale-105'
                        : 'bg-zinc-950/80 border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700'
                    }`}
                    aria-label={`Rate design ${star} out of 5`}
                  >
                    ★
                  </button>
                ))}
                {overallDesign > 0 && (
                  <span className="text-xs sm:text-sm font-medium text-zinc-400 ml-2 animate-in fade-in">
                    {overallDesign === 1 && "1 - Needs Work"}
                    {overallDesign === 2 && "2 - Fair"}
                    {overallDesign === 3 && "3 - Good"}
                    {overallDesign === 4 && "4 - Great"}
                    {overallDesign === 5 && "5 - Exceptional"}
                  </span>
                )}
              </div>
            </div>

            {/* Field 2: Value for Experience Rating */}
            <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6 sm:p-7 space-y-3.5 shadow-lg">
              <label className="block text-sm sm:text-base font-semibold text-zinc-200">
                How would you rate the value for the experience? <span className="text-red-400">*</span>
              </label>
              <div className="flex flex-wrap items-center gap-2.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setValueForExperience(star)}
                    className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl transition-all cursor-pointer border ${
                      valueForExperience >= star
                        ? 'bg-rose-950/70 border-rose-700 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.3)] scale-105'
                        : 'bg-zinc-950/80 border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700'
                    }`}
                    aria-label={`Rate value ${star} out of 5`}
                  >
                    ★
                  </button>
                ))}
                {valueForExperience > 0 && (
                  <span className="text-xs sm:text-sm font-medium text-zinc-400 ml-2 animate-in fade-in">
                    {valueForExperience === 1 && "1 - Low Value"}
                    {valueForExperience === 2 && "2 - Fair Value"}
                    {valueForExperience === 3 && "3 - Good Value"}
                    {valueForExperience === 4 && "4 - Very Valuable"}
                    {valueForExperience === 5 && "5 - Incredible Value"}
                  </span>
                )}
              </div>
            </div>

            {/* Field 3: Suggestions (Optional) */}
            <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6 sm:p-7 space-y-2.5 shadow-lg">
              <div className="flex items-center justify-between">
                <label htmlFor="suggestions" className="block text-sm sm:text-base font-semibold text-zinc-200">
                  If you were on the development team, what suggestions would you have to improve the app?
                </label>
                <span className="text-xs text-zinc-500 font-light">Optional</span>
              </div>
              <textarea
                id="suggestions"
                value={suggestions}
                onChange={(e) => setSuggestions(e.target.value)}
                placeholder="What features, changes, or additions would enhance your intimacy journey?"
                rows={3}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-red-600 transition-colors text-sm resize-y"
              />
            </div>

            {/* Field 4: Entered Preferences in Settings */}
            <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6 sm:p-7 space-y-3 shadow-lg">
              <label className="block text-sm sm:text-base font-semibold text-zinc-200">
                Have you entered preferences/kinks in the settings menu? <span className="text-red-400">*</span>
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setEnteredPreferences('Yes')}
                  className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer border ${
                    enteredPreferences === 'Yes'
                      ? 'bg-emerald-950/70 border-emerald-700 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                  }`}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => setEnteredPreferences('No')}
                  className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer border ${
                    enteredPreferences === 'No'
                      ? 'bg-rose-950/70 border-rose-800 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.3)]'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                  }`}
                >
                  No
                </button>
              </div>
            </div>

            {/* Field 5: Preferences Generated */}
            <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6 sm:p-7 space-y-3 shadow-lg">
              <label className="block text-sm sm:text-base font-semibold text-zinc-200">
                Did the app generate your preferences in the stories, roleplay, games? <span className="text-red-400">*</span>
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setPreferencesGenerated('Yes')}
                  className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer border ${
                    preferencesGenerated === 'Yes'
                      ? 'bg-emerald-950/70 border-emerald-700 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                  }`}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => setPreferencesGenerated('No')}
                  className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer border ${
                    preferencesGenerated === 'No'
                      ? 'bg-rose-950/70 border-rose-800 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.3)]'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                  }`}
                >
                  No
                </button>
              </div>
            </div>

            {/* Field 6: Used with Partner */}
            <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6 sm:p-7 space-y-3 shadow-lg">
              <label className="block text-sm sm:text-base font-semibold text-zinc-200">
                Have you used the app with a partner? <span className="text-red-400">*</span>
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setUsedWithPartner('Yes')}
                  className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer border ${
                    usedWithPartner === 'Yes'
                      ? 'bg-emerald-950/70 border-emerald-700 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                  }`}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUsedWithPartner('No');
                    setPartnerPreferencesGenerated('');
                  }}
                  className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer border ${
                    usedWithPartner === 'No'
                      ? 'bg-rose-950/70 border-rose-800 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.3)]'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                  }`}
                >
                  No
                </button>
              </div>
            </div>

            {/* Field 7 (Conditional): Partner Preferences Generated */}
            {usedWithPartner === 'Yes' && (
              <div className="bg-zinc-900/60 border border-red-900/40 rounded-2xl p-6 sm:p-7 space-y-3 shadow-lg animate-in fade-in slide-in-from-top-3 duration-300">
                <label className="block text-sm sm:text-base font-semibold text-red-200">
                  If yes, did your partner's preferences show up in the stories, roleplay and games? <span className="text-red-400">*</span>
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setPartnerPreferencesGenerated('Yes')}
                    className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer border ${
                      partnerPreferencesGenerated === 'Yes'
                        ? 'bg-emerald-950/70 border-emerald-700 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                    }`}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => setPartnerPreferencesGenerated('No')}
                    className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer border ${
                      partnerPreferencesGenerated === 'No'
                        ? 'bg-rose-950/70 border-rose-800 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.3)]'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                    }`}
                  >
                    No
                  </button>
                </div>
              </div>
            )}

            {/* Field 8: Final Notes */}
            <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6 sm:p-7 space-y-2.5 shadow-lg">
              <label htmlFor="finalNotes" className="block text-sm sm:text-base font-semibold text-zinc-200">
                Any final notes for the development team?
              </label>
              <textarea
                id="finalNotes"
                value={finalNotes}
                onChange={(e) => setFinalNotes(e.target.value)}
                placeholder="Share any other thoughts, reactions, or suggestions..."
                rows={3}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-red-600 transition-colors text-sm resize-y"
              />
            </div>

            {/* Field 9: Google Review Toggle */}
            <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6 sm:p-7 space-y-3 shadow-lg">
              <div>
                <label className="block text-sm sm:text-base font-semibold text-zinc-200">
                  Would you be willing to review us on Google? <span className="text-red-400">*</span>
                </label>
                <p className="text-xs text-zinc-500 mt-1">
                  Honest reviews help other couples and individuals discover a safe, authentic intimacy space.
                </p>
              </div>
              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setWillingToReviewGoogle('Yes')}
                  className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer border ${
                    willingToReviewGoogle === 'Yes'
                      ? 'bg-emerald-950/70 border-emerald-700 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                  }`}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => setWillingToReviewGoogle('No')}
                  className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer border ${
                    willingToReviewGoogle === 'No'
                      ? 'bg-rose-950/70 border-rose-800 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.3)]'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                  }`}
                >
                  No
                </button>
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-4 bg-red-950/50 border border-red-800 rounded-xl text-red-300 text-sm animate-in fade-in">
                {errorMessage}
              </div>
            )}

            {/* Submission CTA */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-xs text-zinc-500">
                Responses are encrypted and forwarded directly to support@betweenusapp.io.
              </span>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto px-8 py-3.5 bg-red-900 hover:bg-red-800 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-all shadow-lg hover:shadow-[0_0_20px_rgba(239,68,68,0.3)] active:scale-95 cursor-pointer shrink-0"
              >
                {isSubmitting ? 'Submitting Feedback...' : 'Submit Survey'}
              </button>
            </div>

          </form>
        )}

      </div>
    </main>
  );
}
