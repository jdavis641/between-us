const fs = require('fs');

function stripFrontendAuth(file) {
  let code = fs.readFileSync(file, 'utf8');

  // Remove session fetching
  code = code.replace(/        const \{ data: \{ session \} \} = await supabase\.auth\.getSession\(\);\n        if \(!session\) \{\n          throw new Error\("Auth Rejected: Session expired or missing\."\);\n        \}\n/g, "");

  // Remove Authorization header completely
  code = code.replace(/,\n            "Authorization": `Bearer \$\{session\.access_token\}`\n          \}/g, "\n          }");

  fs.writeFileSync(file, code);
}

stripFrontendAuth('app/dashboard/roleplay/RolePlayClient.tsx');
stripFrontendAuth('app/dashboard/literature/LiteratureClient.tsx');
