const fs = require('fs');

let code = fs.readFileSync('app/dashboard/settings/page.tsx', 'utf8');

// Add pronouns state
code = code.replace(/const \[isEditingUsername, setIsEditingUsername\] = useState\(false\)/, 'const [isEditingUsername, setIsEditingUsername] = useState(false)\n  const [pronouns, setPronouns] = useState("")\n  const [baseTolerance, setBaseTolerance] = useState("")');

// In fetchProfile, populate pronouns and baseTolerance
const oldFetch = /setProfile\(\{\s*\.\.\.profileData,\s*base_tolerance: prefData \? prefData\.preference_level : 'Not set'\s*\}\)\s*\}/;

const newFetch = `setProfile({
          ...profileData,
          base_tolerance: prefData ? prefData.preference_level : 'Not set'
        })
        setPronouns(profileData?.pronouns || '')
        setBaseTolerance(prefData ? prefData.preference_level : '')
      }`;

code = code.replace(oldFetch, newFetch);

// Add handlers for pronouns and baseTolerance
const handlers = `
  const handleSavePronouns = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      await supabase.from('profiles').update({ pronouns }).eq('id', session.user.id)
      setProfile((prev: any) => ({ ...prev, pronouns }))
    }
  }

  const handleSaveTolerance = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      const { data: existing } = await supabase.from('intimacy_preferences').select('id').eq('user_id', session.user.id).eq('category_tag', 'Base Tolerance').single();
      if (existing) {
        await supabase.from('intimacy_preferences').update({ preference_level: baseTolerance }).eq('id', existing.id);
      } else {
        await supabase.from('intimacy_preferences').insert({ user_id: session.user.id, category_tag: 'Base Tolerance', preference_level: baseTolerance });
      }
      setProfile((prev: any) => ({ ...prev, base_tolerance: baseTolerance }))
    }
  }
`;

code = code.replace(/  \/\/ Debounced Username Availability Check/, handlers + '\n  // Debounced Username Availability Check');

// Replace base tolerance paragraph and add pronouns input
const oldBaseTolerance = /            <div>\s*<p className="text-sm text-zinc-500 mb-1">Base Tolerance Tier<\/p>\s*<p className="text-zinc-300 font-medium">\{profile\?\.base_tolerance \|\| profile\?\.tolerance \|\| 'Not set'\}<\/p>\s*<\/div>/;

const newInputs = `            <div>
              <p className="text-sm text-zinc-500 mb-1">Pronouns</p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={pronouns}
                  onChange={(e) => setPronouns(e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-zinc-200 focus:outline-none focus:border-zinc-500"
                  placeholder="e.g., they/them, she/her"
                />
                <button onClick={handleSavePronouns} className="text-xs font-semibold text-zinc-400 hover:text-zinc-200 uppercase">Save</button>
              </div>
            </div>

            <div>
              <p className="text-sm text-zinc-500 mb-1">Base Tolerance Tier</p>
              <div className="flex items-center gap-2">
                <select
                  value={baseTolerance}
                  onChange={(e) => setBaseTolerance(e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-zinc-200 focus:outline-none focus:border-zinc-500"
                >
                  <option value="">Select a baseline</option>
                  <option value="Moderate">Moderate</option>
                  <option value="Sensory">Sensory</option>
                  <option value="Playful">Playful</option>
                  <option value="Intense">Intense</option>
                  <option value="Extreme">Extreme</option>
                </select>
                <button onClick={handleSaveTolerance} className="text-xs font-semibold text-zinc-400 hover:text-zinc-200 uppercase">Save</button>
              </div>
            </div>`;

code = code.replace(oldBaseTolerance, newInputs);

fs.writeFileSync('app/dashboard/settings/page.tsx', code);
