const fs = require('fs');

let code = fs.readFileSync('app/dashboard/kinks/page.tsx', 'utf8');

const replacement = `  const [successMsg, setSuccessMsg] = useState('');

  const saveToDb = async (newKinks: KinkEntry[]) => {
    setSaving(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      const payload = JSON.stringify(newKinks);
      
      const { data: existing } = await supabase.from('intimacy_preferences')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('category_tag', 'Primary Directive')
        .maybeSingle();

      const { data, error } = await supabase.from('intimacy_preferences')
        .upsert({
          ...(existing ? { id: existing.id } : {}),
          user_id: session.user.id,
          category_tag: 'Primary Directive',
          preference_level: 'Definitely',
          kinks_override: payload
        })
        .select();

      if (!error && data) {
        setKinks(newKinks)
        setSuccessMsg('Saved successfully!');
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        alert('Failed to save: ' + error?.message);
      }
    }
    setSaving(false)
  }`;

code = code.replace(/  const saveToDb = async \(newKinks: KinkEntry\[\]\) => \{[\s\S]*?setSaving\(false\)\n    \}/, replacement);

const returnReplacement = `<div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-white mb-2">Your Intimacy Directives</h1>
              <p className="text-zinc-400">Define custom kinks, strict boundaries, and non-negotiables for the AI engine.</p>
            </div>
            {successMsg && <div className="text-green-500 font-medium">{successMsg}</div>}
          </div>`;

code = code.replace(/<div className="mb-8">\s*<h1 className="text-3xl font-semibold tracking-tight text-white mb-2">Your Intimacy Directives<\/h1>\s*<p className="text-zinc-400">Define custom kinks, strict boundaries, and non-negotiables for the AI engine\.<\/p>\s*<\/div>/, returnReplacement);

fs.writeFileSync('app/dashboard/kinks/page.tsx', code);
