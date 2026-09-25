import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function testInsert() {
  const { data, error } = await supabase
    .from('scenario_suggestions')
    .insert({
      suggestion_text: "test anon"
    });
  console.log(error || data);
}

testInsert();
