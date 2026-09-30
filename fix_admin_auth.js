const fs = require('fs');

function fixAuth(file) {
  let code = fs.readFileSync(file, 'utf8');
  if (code.includes('let authHeader')) return;
  const replacement = `      let authHeader = req.headers.get('Authorization'); 
      let explicitToken = authHeader?.replace('Bearer ', '')?.trim();
      if (explicitToken === 'undefined' || explicitToken === 'null') explicitToken = undefined;

      const supabase = await createClient();
      let { data: { user }, error: authError } = await supabase.auth.getUser();

      if ((authError || !user) && explicitToken) {
        const res = await supabase.auth.getUser(explicitToken);
        user = res.data?.user || null;
        authError = res.error;
      }`;
  code = code.replace(/      const supabase = await createClient\(\);\n      const \{ data: \{ user \}, error: authError \} = await supabase\.auth\.getUser\(\);/, replacement);
  fs.writeFileSync(file, code);
}

fixAuth('app/api/admin/message/route.ts');
