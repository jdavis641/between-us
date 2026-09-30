const fs = require('fs');

function stripFrontendAuth(file) {
  let code = fs.readFileSync(file, 'utf8');

  // Strip the session block
  code = code.replace(/const\s+\{\s*data:\s*\{\s*session\s*\}\s*\}\s*=\s*await\s+supabase\.auth\.getSession\(\);\s*if\s*\(!session\)\s*\{\s*throw\s+new\s+Error\("Auth\s+Rejected:\s+Session\s+expired\s+or\s+missing\."\);\s*\}/g, "");

  // Strip the Authorization header
  code = code.replace(/,\s*"Authorization":\s*`Bearer\s*\$\{session\.access_token\}`/g, "");

  fs.writeFileSync(file, code);
}

stripFrontendAuth('app/dashboard/roleplay/RolePlayClient.tsx');
stripFrontendAuth('app/dashboard/literature/LiteratureClient.tsx');
