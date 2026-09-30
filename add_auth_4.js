const fs = require('fs');

function addFrontendAuth(file) {
  let code = fs.readFileSync(file, 'utf8');

  const replacement = `    try {
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

  const tryIdx = code.indexOf('    try {');
  const credsIdx = code.indexOf('credentials: "include",', tryIdx);
  if (tryIdx !== -1 && credsIdx !== -1) {
    code = code.substring(0, tryIdx) + replacement + '\n        ' + code.substring(credsIdx);
    fs.writeFileSync(file, code);
  }
}

addFrontendAuth('app/dashboard/roleplay/RolePlayClient.tsx');
addFrontendAuth('app/dashboard/literature/LiteratureClient.tsx');
