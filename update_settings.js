const fs = require('fs');

let code = fs.readFileSync('app/dashboard/settings/page.tsx', 'utf8');

const replacement = `  const handleSaveTolerance = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault()
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      await supabase.from('profiles').update({ base_tolerance: baseTolerance }).eq('id', session.user.id)
      
      const { data: existing } = await supabase.from('intimacy_preferences')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('category_tag', 'Primary Directive')
        .maybeSingle();

      if (existing) {
        await supabase.from('intimacy_preferences').update({ preference_level: baseTolerance }).eq('id', existing.id);
      } else {
        await supabase.from('intimacy_preferences').insert({ user_id: session.user.id, category_tag: 'Primary Directive', preference_level: baseTolerance });
      }

      setProfile((prev: any) => ({ ...prev, base_tolerance: baseTolerance }))
      alert('Tolerance saved!');
    }
  }`;

code = code.replace(/  const handleSaveTolerance = async \(e\?: React\.MouseEvent\) => \{[\s\S]*?alert\('Tolerance saved!'\);\n    \}\n  \}/, replacement);

fs.writeFileSync('app/dashboard/settings/page.tsx', code);
