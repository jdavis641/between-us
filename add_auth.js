const fs = require('fs');

function addFrontendAuth(file) {
  let code = fs.readFileSync(file, 'utf8');

  // Add the session block
  const replacementSession = `      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
          alert('Session is still hydrating. Please wait a second and click Generate again.');
          setLoading(false);
          return;
        }`;
        
  code = code.replace(/      try \{\s*\n*\s*const res = await fetch/g, replacementSession + "\n        const res = await fetch");

  // Add the Authorization header
  code = code.replace(/"Content-Type": "application\/json"\n          \}/g, `"Content-Type": "application/json",\n            "Authorization": \`Bearer \${session.access_token}\`\n          }`);

  fs.writeFileSync(file, code);
}

addFrontendAuth('app/dashboard/roleplay/RolePlayClient.tsx');
addFrontendAuth('app/dashboard/literature/LiteratureClient.tsx');
