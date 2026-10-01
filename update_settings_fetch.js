const fs = require('fs');

let code = fs.readFileSync('app/dashboard/settings/page.tsx', 'utf8');

const replacement = `  useEffect(() => {
    async function fetchProfile() {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        const { data: prefData } = await supabase
          .from('intimacy_preferences')
          .select('preference_level')
          .eq('user_id', session.user.id)
          .eq('category_tag', 'Primary Directive')
          .maybeSingle();

        const tolerance = prefData?.preference_level || profileData?.base_tolerance || '';

        setProfile({
          ...profileData,
          base_tolerance: tolerance || 'Not set'
        })
        setPronouns(profileData?.pronouns || '')
        setBaseTolerance(tolerance)
      }
      setLoading(false)
    }
    fetchProfile()
  }, [])`;

code = code.replace(/  useEffect\(\(\) => \{[\s\S]*?fetchProfile\(\)\n  \}, \[\]\)/, replacement);

fs.writeFileSync('app/dashboard/settings/page.tsx', code);
