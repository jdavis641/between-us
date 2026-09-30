const fs = require('fs');

function fixStripeAuth() {
  let code = fs.readFileSync('app/api/stripe/portal/route.ts', 'utf8');

  const replacement = `  export async function POST(req: Request) {
    try {
      let authHeader = req.headers.get('Authorization'); 
      let explicitToken = authHeader?.replace('Bearer ', '')?.trim();
      if (explicitToken === 'undefined' || explicitToken === 'null') explicitToken = undefined;

      const supabase = await createClient();
      let { data: { user }, error: userError } = await supabase.auth.getUser();

      if ((userError || !user) && explicitToken) {
        const res = await supabase.auth.getUser(explicitToken);
        user = res.data?.user || null;
        userError = res.error;
      }`;

  code = code.replace(/  export async function POST\(req: Request\) \{\n    try \{\n      const supabase = await createClient\(\)\n      const \{ data: \{ user \}, error: userError \} = await supabase\.auth\.getUser\(\)/, replacement);
  fs.writeFileSync('app/api/stripe/portal/route.ts', code);
}

fixStripeAuth();
