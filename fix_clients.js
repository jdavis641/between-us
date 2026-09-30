const fs = require('fs');

function addSessionCheck(filePath) {
  let code = fs.readFileSync(filePath, 'utf8');

  if (!code.includes('@/utils/supabase/client')) {
    code = code.replace(/import \{ useState \} from "react";/, 'import { useState } from "react";\nimport { createClient } from "@/utils/supabase/client";');
  }

  if (!code.includes('createClient()')) {
    code = code.replace(/const \[error, setError\] = useState<string \| null>\(null\);/, 'const [error, setError] = useState<string | null>(null);\n  const [supabase] = useState(() => createClient());');
  }

  const sessionCheck = `    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Auth Rejected: Session expired or missing.");
      }
      
      const res = await fetch`;

  code = code.replace(/    try \{\s*const res = await fetch/g, sessionCheck);

  const tokenHeader = `        headers: { 
          "Content-Type": "application/json",
          "Authorization": \`Bearer \${session.access_token}\`
        },`;
  
  code = code.replace(/        headers: \{ \s*"Content-Type": "application\/json"\s*\},/g, tokenHeader);

  fs.writeFileSync(filePath, code);
}

addSessionCheck('app/dashboard/roleplay/RolePlayClient.tsx');
addSessionCheck('app/dashboard/literature/LiteratureClient.tsx');
