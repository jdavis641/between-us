'use server';

import { createClient } from '@/utils/supabase/server';

export async function submitImprovement(feedback: string, userId?: string) {
  const supabase = await createClient();
  
  const { error } = await supabase.from('app_improvements').insert({
    feedback,
    user_id: userId || null,
    status: 'pending'
  });

  if (error) {
    throw error;
  }
}
