const fs = require('fs');

function addFrontendAuth(file) {
  let code = fs.readFileSync(file, 'utf8');

  const replacement = `      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
          alert('Session is still hydrating. Please wait a second and click Generate again.');
          setLoading(false);
          return;
        }
        
        const res = await fetch("/api/generate/content", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": \`Bearer \${session.access_token}\`
          },`;

  const parts = code.split(/      try \{[\s\S]*?method: "POST",[\s\S]*?headers: \{[\s\S]*?"Content-Type": "application\/json"[\s\S]*?\},/);
  if (parts.length > 1) {
    code = parts[0] + replacement + parts[1];
    fs.writeFileSync(file, code);
  }
}

addFrontendAuth('app/dashboard/roleplay/RolePlayClient.tsx');
addFrontendAuth('app/dashboard/literature/LiteratureClient.tsx');
