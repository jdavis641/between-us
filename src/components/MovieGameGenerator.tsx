"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";

export default function MovieGameGenerator({ gameTitle }: { gameTitle: string }) {
  const [movieInput, setMovieInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatedRules, setGeneratedRules] = useState<string[] | null>(null);
  const [supabase] = useState(() => createClient());

  const handleGenerate = async () => {
    if (!movieInput.trim()) return;
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
      const token = session?.access_token;
      const reqHeaders = {
        "Content-Type": "application/json",
        ...(anonKey ? { "apikey": anonKey } : {}),
        ...(token ? { "Authorization": `Bearer ${token}` } : (anonKey ? { "Authorization": `Bearer ${anonKey}` } : {}))
      };
      const res = await fetch("/api/generate/movie-game", {
        method: "POST",
        headers: reqHeaders,
        body: JSON.stringify({
          movie_title: movieInput,
          category: 'movie_drinking'
        })
      });
      
      let data: any;
      if (res.ok) {
        data = await res.json();
      } else {
        // Fallback to /api/generate/content
        const fallbackRes = await fetch("/api/generate/content", {
          method: "POST",
          headers: reqHeaders,
          body: JSON.stringify({
            movie_title: movieInput,
            category: 'movie_drinking'
          })
        });
        const rawText = await fallbackRes.text();
        try {
          const cleaned = rawText.trim().replace(/^\`\`\`json\s*/i, '').replace(/^\`\`\`\s*/i, '').replace(/\`\`\`\s*$/i, '').trim();
          data = JSON.parse(cleaned);
        } catch {
          data = JSON.parse(rawText);
        }
      }

      if (data?.content?.rules && Array.isArray(data.content.rules)) {
        setGeneratedRules(data.content.rules);
      } else if (Array.isArray(data?.rules)) {
        setGeneratedRules(data.rules);
      } else if (data.preExperienceTasks) {
        setGeneratedRules(data.preExperienceTasks);
      } else if (data.partnerAPerspective) {
        setGeneratedRules([data.partnerAPerspective]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-8 bg-zinc-900 border border-zinc-800 rounded-xl p-6">
      <h3 className="text-lg font-medium text-zinc-100 mb-2">Custom AI Tropes</h3>
      <p className="text-sm text-zinc-400 mb-4">Generate custom, alternating-role viewing rules mapped directly to specific tropes for your movie.</p>
      
      <div className="flex gap-2">
        <input 
          type="text" 
          value={movieInput} 
          onChange={(e) => setMovieInput(e.target.value)} 
          placeholder="Movie Title or Genre" 
          className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-zinc-200 focus:outline-none focus:border-red-900"
        />
        <button 
          onClick={handleGenerate} 
          disabled={loading || !movieInput.trim()} 
          className="bg-red-900 hover:bg-red-800 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium"
        >
          {loading ? "Generating..." : "Generate"}
        </button>
      </div>

      {generatedRules && (
        <div className="mt-6 space-y-3">
          {generatedRules.map((rule, idx) => (
            <div key={idx} className="p-4 bg-zinc-950 rounded-lg border border-zinc-800 text-zinc-300">
              {rule}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
