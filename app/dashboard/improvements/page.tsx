"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";

export default function ImprovementsPage() {
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [supabase] = useState(() => createClient());

  const handleSubmit = async () => {
    if (!feedback.trim()) return;
    
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Auth Rejected: Session expired or missing.");

      const res = await fetch("/api/improvements", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ feedback_text: feedback })
      });

      if (!res.ok) throw new Error("Failed to submit feedback.");

      setSuccess(true);
      setFeedback("");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-8 pb-32">
      <div className="max-w-2xl mx-auto space-y-8">
        
        <header className="border-b border-zinc-800 pb-8">
          <h1 className="text-3xl font-serif font-medium text-zinc-100 mb-2">Suggest App Improvements</h1>
          <p className="text-zinc-400">Help us build a better platform. Your feedback is sent directly to our development team.</p>
        </header>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 md:p-8">
          <label className="block text-sm font-medium text-zinc-300 mb-3">How can we improve your experience?</label>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="I would love to see a feature that..."
            className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-4 text-zinc-200 h-40 focus:outline-none focus:border-red-900 resize-none mb-6 transition-colors"
          />

          {error && <div className="text-red-400 text-sm mb-4">{error}</div>}
          
          {success && (
            <div className="text-green-400 text-sm mb-4 bg-green-950/30 p-3 rounded-lg border border-green-900/50">
              Thank you! Your feedback has been successfully submitted.
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading || !feedback.trim()}
            className="w-full md:w-auto px-8 py-3 bg-red-900 hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
          >
            {loading ? "Submitting..." : "Submit Feedback"}
          </button>
        </div>

      </div>
    </div>
  );
}
