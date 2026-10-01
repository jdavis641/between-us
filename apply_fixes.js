const fs = require('fs');

// 1. Dashboard Copy Update
let dashCode = fs.readFileSync('app/dashboard/page.tsx', 'utf8');
dashCode = dashCode.replace(
  /Explore scenarios categorized by Mild \(🔥\), Medium \(🔥🔥\), and Spicy \(🔥🔥🔥\)\./,
  "Explore scenarios categorized by Sensory (🔥), Playful (🔥🔥), and Intense (🔥🔥🔥)."
);
fs.writeFileSync('app/dashboard/page.tsx', dashCode);

// 2. Sidebar Navigation Fix
let layoutCode = fs.readFileSync('app/dashboard/layout.tsx', 'utf8');
layoutCode = layoutCode.replace(
  /href="\/dashboard\/suggest".*?Improve the App/s,
  'href="/dashboard/improve" className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-zinc-900 text-zinc-500 hover:text-zinc-300 transition-colors mb-1">\n              🛠️ Improve the App'
);
fs.writeFileSync('app/dashboard/layout.tsx', layoutCode);

// 4. Settings UI Fix
let setCode = fs.readFileSync('app/dashboard/settings/page.tsx', 'utf8');

// Remove moderate option
setCode = setCode.replace(/<option value="Moderate">Moderate<\/option>\n\s*/i, '');
// Sometimes it's written differently, let's use a safer regex for the moderate option
setCode = setCode.replace(/<option value="moderate">Moderate<\/option>\n\s*/i, '');
setCode = setCode.replace(/<option value="Moderate">Moderate<\/option>/i, '');

// Add Saved toast logic
const toastState = `  const [baseTolerance, setBaseTolerance] = useState("")
  const [toleranceSaved, setToleranceSaved] = useState(false)`;

setCode = setCode.replace(/  const \[baseTolerance, setBaseTolerance\] = useState\(""\)/, toastState);

const handleSaveReplacement = `  const handleSaveTolerance = async (e?: React.MouseEvent) => {
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
      setToleranceSaved(true)
      setTimeout(() => setToleranceSaved(false), 3000)
    }
  }`;

setCode = setCode.replace(/  const handleSaveTolerance = async \(e\?: React\.MouseEvent\) => \{[\s\S]*?alert\('Tolerance saved!'\);\n    \}\n  \}/, handleSaveReplacement);

// Render the toast
const saveButtonReplacement = `<button onClick={handleSaveTolerance} className="text-xs font-semibold text-zinc-400 hover:text-zinc-200 uppercase">Save</button>
                </div>
                {toleranceSaved && <p className="text-green-500 text-xs mt-2 font-medium">Saved!</p>}`;

setCode = setCode.replace(/<button onClick=\{handleSaveTolerance\} className="text-xs font-semibold text-zinc-400 hover:text-zinc-200 uppercase">Save<\/button>\n\s*<\/div>/, saveButtonReplacement);

fs.writeFileSync('app/dashboard/settings/page.tsx', setCode);
