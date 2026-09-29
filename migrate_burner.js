const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function migrate() {
  const { data: users, error: authError } = await supabase.auth.admin.listUsers();
  if (authError) {
    console.error('Failed to list users:', authError);
    return;
  }
  
  const target = users.users.find(u => u.email === 'jdcdjd664411@proton.me');
  if (target) {
    console.log('Found user:', target.id);
    const { error } = await supabase.from('profiles').upsert({
      id: target.id,
      is_active: true,
      nickname: 'Developer'
    });
    if (error) {
      console.error('Failed to upsert profile:', error);
    } else {
      console.log('Successfully upserted jdcdjd664411@proton.me');
    }
  } else {
    console.log('User jdcdjd664411@proton.me not found in auth.');
  }
}

migrate();
