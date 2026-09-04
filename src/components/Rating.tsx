"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";

export default function Rating({ scenarioId }: { scenarioId: string }) {
  const [rating, setRating] = useState<number | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const supabase = createClient();

  const handleRate = async (value: number) => {
    setRating(value);
    
    // Insert into Supabase
    await supabase.from("scenario_ratings").insert({
      scenario_id: scenarioId,
      rating: value,
    });

    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center p-6 bg-zinc-900 border border-zinc-800 rounded-xl text-center shadow-lg">
        <span className="text-3xl mb-2">💖</span>
        <h3 className="font-semibold text-lg text-zinc-100">Thank you for rating!</h3>
        <p className="text-sm text-zinc-400">Your anonymous feedback helps us improve.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center p-6 bg-zinc-900 border border-zinc-800 rounded-xl shadow-lg">
      <h3 className="font-semibold text-lg text-zinc-100 mb-4">Rate this scenario</h3>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => handleRate(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(null)}
            className="text-4xl transition-transform hover:scale-110 focus:outline-none"
          >
            <span className={star <= (hover ?? rating ?? 0) ? "text-yellow-500" : "text-zinc-700"}>
              ★
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
