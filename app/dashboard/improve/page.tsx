"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { submitImprovement } from "./actions";

export default function ImproveAppPage() {
  const [suggestion, setSuggestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!suggestion.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      await submitImprovement(suggestion.trim(), user?.id);

      setSubmitted(true);
      setSuggestion("");
    } catch (err: any) {
      console.error("Error submitting improvement", err);
      setError("Failed to submit. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="p-6 md:p-10 w-full max-w-3xl mx-auto flex flex-col min-h-[80vh]">
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Improve the App</h1>
        <p className="text-zinc-400">Have feedback or feature requests? Let our team know directly.</p>
      </header>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex-1">
        {submitted ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center animate-in fade-in">
            <span className="text-5xl mb-4">🛠️</span>
            <h2 className="text-2xl font-bold text-green-400 mb-2">Received!</h2>
            <p className="text-zinc-400 max-w-md">
              Thank you for taking the time to suggest improvements. The Admin team will review and update the system ASAP.
            </p>
            <button 
              onClick={() => setSubmitted(false)}
              className="mt-8 px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors"
            >
              Submit Another
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col h-full animate-in fade-in">
            <label htmlFor="suggestion" className="text-sm font-medium text-zinc-300 mb-2">
              Feedback
            </label>
            <textarea
              id="suggestion"
              value={suggestion}
              onChange={(e) => setSuggestion(e.target.value)}
              placeholder="How can we improve your app experience?"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-4 text-zinc-100 focus:border-red-500 focus:outline-none transition-colors min-h-[250px] resize-y mb-4"
              required
            />
            
            {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

            <div className="mt-auto flex justify-end">
              <button
                type="submit"
                disabled={loading || !suggestion.trim()}
                className="px-8 py-3 bg-red-900 text-white hover:bg-red-800 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {loading ? "Submitting..." : "Submit"}
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
