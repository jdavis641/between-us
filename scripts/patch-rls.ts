import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function patch() {
  const { error: e1 } = await supabase.rpc('exec_sql', { sql: 
    `
    ALTER TABLE public.intimacy_games ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Allow authenticated read intimacy_games" ON public.intimacy_games FOR SELECT TO authenticated USING (true);
    
    ALTER TABLE public.generated_content ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Allow authenticated read generated_content" ON public.generated_content FOR SELECT TO authenticated USING (true);
    CREATE POLICY "Allow authenticated insert generated_content" ON public.generated_content FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Allow authenticated update generated_content" ON public.generated_content FOR UPDATE TO authenticated USING (auth.uid() = user_id);
  `
  });
  console.log('RLS patch result (via RPC):', e1);
}
patch();