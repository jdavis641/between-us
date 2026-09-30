const fs = require('fs');

let code = fs.readFileSync('app/dashboard/settings/page.tsx', 'utf8');

const replacementTolerance = `  const handleSaveTolerance = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault()
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      await supabase.from('profiles').update({ base_tolerance: baseTolerance }).eq('id', session.user.id)
      setProfile((prev: any) => ({ ...prev, base_tolerance: baseTolerance }))
      alert('Tolerance saved!');
    }
  }`;
code = code.replace(/  const handleSaveTolerance = async \(\) => \{[\s\S]*?setProfile\(\(prev: any\) => \(\{ \.\.\.prev, base_tolerance: baseTolerance \}\)\)\n    \}\n  \}/, replacementTolerance);

const replacementPronouns = `  const handleSavePronouns = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault()
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      await supabase.from('profiles').update({ pronouns }).eq('id', session.user.id)
      setProfile((prev: any) => ({ ...prev, pronouns }))
      alert('Pronouns saved!');
    }
  }`;
code = code.replace(/  const handleSavePronouns = async \(\) => \{[\s\S]*?setProfile\(\(prev: any\) => \(\{ \.\.\.prev, pronouns \}\)\)\n    \}\n  \}/, replacementPronouns);

const replacementUsername = `  const handleSaveUsername = async (e: React.MouseEvent | React.FormEvent, usernameToSave: string) => {
    if (e) e.preventDefault()
    if (!usernameToSave || usernameToSave.trim() === '') return
    setSavingUsername(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      const { error } = await supabase
        .from('profiles')
        .update({ nickname: usernameToSave, anonymous_alias: usernameToSave })
        .eq('id', session.user.id)
      
      if (!error) {
        setProfile((prev: any) => ({ ...prev, nickname: usernameToSave, anonymous_alias: usernameToSave }))
        setIsEditingUsername(false)
        setNewUsername('')
      } else {
        alert("Error saving username: " + error.message)
      }
    }
    setSavingUsername(false)
  }`;
code = code.replace(/  const handleSaveUsername = async \(usernameToSave: string\) => \{[\s\S]*?setSavingUsername\(false\)\n  \}/, replacementUsername);

// update fetch logic
const replacementFetch = `        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        setProfile({
          ...profileData,
          base_tolerance: profileData?.base_tolerance || 'Not set'
        })
        setPronouns(profileData?.pronouns || '')
        setBaseTolerance(profileData?.base_tolerance || '')`;
code = code.replace(/        const \{ data: profileData \}[\s\S]*?setBaseTolerance\(prefData \? prefData\.preference_level : ''\)/, replacementFetch);

// update JSX calls
code = code.replace(/onClick=\{\(\) => handleSaveUsername\(newUsername\.trim\(\)\)\}/g, "onClick={(e) => handleSaveUsername(e, newUsername.trim())}");
code = code.replace(/upsert\(\{ id: session\.user\.id, nickname: usernameToSave, anonymous_alias: usernameToSave, username: usernameToSave \}\)/g, "update({ nickname: usernameToSave, anonymous_alias: usernameToSave }).eq('id', session.user.id)");

fs.writeFileSync('app/dashboard/settings/page.tsx', code);
