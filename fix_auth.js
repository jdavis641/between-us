const fs = require('fs');
let code = fs.readFileSync('app/api/generate/content/route.ts', 'utf8');

const newAuth = `    // Auth Check
    let authHeader = req.headers.get('Authorization'); 
    let explicitToken = authHeader?.replace('Bearer ', '')?.trim();
    if (explicitToken === 'undefined' || explicitToken === 'null') explicitToken = undefined;

    const supabase = await createClient();
    
    let { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if ((authError || !user) && explicitToken) {
      const res = await supabase.auth.getUser(explicitToken);
      user = res.data?.user || null;
      authError = res.error;
    }
    
    if (authError || !user) {`;

code = code.replace(/    \/\/ Auth Check\s+const supabase = await createClient\(\);\s+const \{ data: \{ user \}, error: authError \} = await supabase\.auth\.getUser\(\);\s+if \(authError \|\| !user\) \{/g, newAuth);
fs.writeFileSync('app/api/generate/content/route.ts', code);
