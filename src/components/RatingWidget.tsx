"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";

interface RatingWidgetProps {
  contentType: "game" | "roleplay" | "literature";
  contentId: string;
}

export default function RatingWidget({ contentType, contentId }: RatingWidgetProps) {
  const [rating, setRating] = useState<number | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const handleRate = async (selectedRating: number) => {
    setRating(selectedRating);
    setError(null);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error: insertError } = await supabase
        .from('content_ratings')
        .insert({
          user_id: user?.id, // Will be null if anonymous, but RLS requires auth.
          content_type: contentType,
          content_id: contentId,
          rating: selectedRating
        });
        
      if (insertError) throw insertError;
      
      setSubmitted(true);
    } catch (err: any) {
      console.error("Error submitting rating", err);
      setError("Failed to submit rating. Please try again.");
      setRating(null);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center p-6 bg-zinc-900/50 rounded-xl border border-zinc-800">
        <p className="text-green-400 font-medium mb-1">Feedback Submitted!</p>
        <p className="text-zinc-500 text-sm">Your anonymous rating helps the AI evolve.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-zinc-900/30 rounded-xl border border-zinc-800/50">
      <p className="text-zinc-300 font-medium mb-3">Rate this {contentType}</p>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            className={`text-3xl transition-transform hover:scale-110 ${
              (hover || rating) && (hover || rating)! >= star
                ? "grayscale-0 opacity-100"
                : "grayscale opacity-30"
            }`}
            onClick={() => handleRate(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(null)}
            title={`Rate ${star} out of 5`}
          >
            🔥
          </button>
        ))}
      </div>
      {error && <p className="text-red-400 text-xs mt-3">{error}</p>}
    </div>
  );
}
