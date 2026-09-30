const fs = require('fs');
let code = fs.readFileSync('app/dashboard/kinks/page.tsx', 'utf8');

const newSaveToDb = `  const saveToDb = async (newKinks: KinkEntry[]) => {
    setSaving(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      const payload = JSON.stringify(newKinks);
      
      const { data: existing } = await supabase.from('intimacy_preferences')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('category_tag', 'Primary Directive')
        .single();
        
      if (existing) {
        await supabase.from('intimacy_preferences').update({ kinks_override: payload }).eq('id', existing.id);
      } else {
        await supabase.from('intimacy_preferences').insert({
          user_id: session.user.id,
          category_tag: 'Primary Directive',
          preference_level: 'Definitely',
          kinks_override: payload
        });
      }

      setKinks(newKinks)
    }
    setSaving(false)
  }`;

code = code.replace(/  const saveToDb = async \(newKinks: KinkEntry\[\]\) => \{[\s\S]*?setSaving\(false\)\n  \}/, newSaveToDb);

fs.writeFileSync('app/dashboard/kinks/page.tsx', code);
