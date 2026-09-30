const fs = require('fs');

let code = fs.readFileSync('app/dashboard/games/[id]/page.tsx', 'utf8');

// await params
const replacement = `  const { id } = await params;
  const supabase = await createClient()

  const { data: game } = await supabase
    .from('intimacy_games')
    .select('*')
    .eq('id', id)
    .maybeSingle()`;

code = code.replace(/  const supabase = await createClient\(\)\n\n  const \{ data: game \} = await supabase\n    \.from\('intimacy_games'\)\n    \.select\('\*'\)\n    \.eq\('id', params\.id\)\n    \.maybeSingle\(\)/, replacement);

fs.writeFileSync('app/dashboard/games/[id]/page.tsx', code);
