'use server';

import { createClient } from '@supabase/supabase-js';

export async function submitSuggestion(suggestionText: string, userId?: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error } = await supabase
    .from('scenario_suggestions')
    .insert({
      user_id: userId || null,
      suggestion_text: suggestionText
    });

  if (error) {
    console.error('Error submitting suggestion:', error);
    throw new Error('Failed to submit suggestion');
  }
}
