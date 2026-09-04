"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";

export default function SuggestScenario() {
  const [idea, setIdea] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success">("idle");
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idea.trim()) return;

    setStatus("submitting");
    
    // Get user id if logged in
    const { data: { user } } = await supabase.auth.getUser();
    
    // Insert to Supabase
    await supabase.from("scenario_suggestions").insert({
      user_id: user ? user.id : null,
      suggestion_text: idea,
      status: "pending"
    });
    
    setStatus("success");
    setIdea("");
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 w-full shadow-lg">
      <h3 className="text-xl font-bold mb-2 text-zinc-100 flex items-center gap-2">
        <span>💡</span> Suggest a Scenario
      </h3>
      <p className="text-sm text-zinc-400 mb-4">Have a spicy idea? Submit it to the community.</p>
      
      {status === "success" ? (
        <div className="bg-green-950/30 border border-green-900/50 text-green-400 p-5 rounded-lg text-center animate-in fade-in">
          Thank you! Your suggestion has been sent.
          <button 
            onClick={() => setStatus("idle")}
            className="block w-full mt-4 text-sm text-zinc-400 hover:text-zinc-200 underline"
          >
            Submit another
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 animate-in fade-in">
          <textarea
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            placeholder="Describe your scenario setting, characters, and plot..."
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-4 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-red-500/50 min-h-[140px] resize-y"
            disabled={status === "submitting"}
          />
          <button
            type="submit"
            disabled={status === "submitting" || !idea.trim()}
            className="w-full py-3 bg-red-900 text-white hover:bg-red-800 disabled:opacity-50 disabled:hover:bg-red-900 rounded-lg font-medium transition-colors border border-red-800/50"
          >
            {status === "submitting" ? "Sending..." : "Submit Suggestion"}
          </button>
        </form>
      )}
    </div>
  );
}
