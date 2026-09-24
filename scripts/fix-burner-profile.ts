import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function fixBurnerProfile() {
  const email = 'jdcdjd664411@proton.me';
  
  // 1. Get the user ID from auth.users via admin API
  const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
  
  if (userError) {
    console.error('Error fetching users:', userError);
    return;
  }
  
  const user = userData.users.find(u => u.email === email);
  if (!user) {
    console.error(`User with email ${email} not found.`);
    return;
  }
  
  const userId = user.id;
  console.log(`Found user ${email} with ID ${userId}`);
  
  // 2. Upsert the profile
  const { data, error } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      nickname: 'BurnerBoss',
      anonymous_alias: 'BurnerBoss',
      is_active: true
    })
    .select();
    
  if (error) {
    console.error('Error upserting profile:', error);
  } else {
    console.log('Successfully upserted profile for burner account:', data);
  }
}

fixBurnerProfile();
