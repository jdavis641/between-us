import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function testExpiration() {
  const res = await fetch('http://localhost:3000/api/invite/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      selectedBoundaries: ['Test'],
      kinkSummary: 'Test Kinks',
      instructions: 'Enjoy!',
      contactMethod: 'email',
      contactInfo: 'test@example.com',
      expirationHours: 48
    })
  });
  
  if (!res.ok) {
    const errorText = await res.text();
    console.error('Error:', errorText);
    return;
  }
  
  const data = await res.json();
  console.log('Success!', data);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: dbData } = await supabase
    .from('invitations')
    .select('expires_at')
    .eq('invite_token', data.token)
    .single();

  console.log('expires_at in DB:', dbData?.expires_at);

  const createdTime = new Date().getTime();
  const expiresTime = new Date(dbData?.expires_at).getTime();
  const diffHours = (expiresTime - createdTime) / (1000 * 60 * 60);

  console.log('Hours difference:', diffHours.toFixed(2));
}

testExpiration();
