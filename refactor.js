const fs = require('fs');

function refactorRoleplay() {
  let content = fs.readFileSync('app/dashboard/roleplay/page.tsx', 'utf8');

  content = content.replace('function RolePlayContent() {', 'export default function RolePlayContent({ accessToken }: { accessToken?: string }) {');
  content = content.replace(/export default function RolePlayPage\(\) \{[\s\S]*\}\n?/g, '');

  let fetchRegex = /try \{\s+const \{ data: \{ session \} \} = await supabase\.auth\.getSession\(\);\s+if \(!session\?\.access_token\) \{\s+alert\('Your session has expired or disconnected\. Please refresh the page or log in again\.'\);\s+setLoading\(false\);\s+return;\s+\}/m;

  content = content.replace(fetchRegex, 'try {\n        if (!accessToken) {\n          alert(\'Your session has expired. Please log in again.\');\n          setLoading(false);\n          return;\n        }');
  content = content.replace(/\`Bearer \$\{session\?\.access_token\}\`/g, '\`Bearer ${accessToken}\`');

  fs.writeFileSync('app/dashboard/roleplay/RolePlayClient.tsx', content);

  const newPage = `import { Suspense } from "react";
import { createClient } from "@/utils/supabase/server";
import RolePlayClient from "./RolePlayClient";

export default async function RolePlayPage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-pulse text-zinc-500">Loading experience...</div>
      </div>
    }>
      <RolePlayClient accessToken={session?.access_token} />
    </Suspense>
  );
}
`;
  fs.writeFileSync('app/dashboard/roleplay/page.tsx', newPage);
}

function refactorLiterature() {
  let content = fs.readFileSync('app/dashboard/literature/page.tsx', 'utf8');

  content = content.replace('function LiteratureContent() {', 'export default function LiteratureContent({ accessToken }: { accessToken?: string }) {');
  content = content.replace(/export default function LiteraturePage\(\) \{[\s\S]*\}\n?/g, '');

  let fetchRegex = /try \{\s+const \{ data: \{ session \} \} = await supabase\.auth\.getSession\(\);\s+if \(!session\?\.access_token\) \{\s+alert\('Your session has expired or disconnected\. Please refresh the page or log in again\.'\);\s+setLoading\(false\);\s+return;\s+\}/m;

  content = content.replace(fetchRegex, 'try {\n        if (!accessToken) {\n          alert(\'Your session has expired. Please log in again.\');\n          setLoading(false);\n          return;\n        }');
  content = content.replace(/\`Bearer \$\{session\?\.access_token\}\`/g, '\`Bearer ${accessToken}\`');

  fs.writeFileSync('app/dashboard/literature/LiteratureClient.tsx', content);

  const newPage = `import { Suspense } from "react";
import { createClient } from "@/utils/supabase/server";
import LiteratureClient from "./LiteratureClient";

export default async function LiteraturePage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-pulse text-zinc-500">Loading experience...</div>
      </div>
    }>
      <LiteratureClient accessToken={session?.access_token} />
    </Suspense>
  );
}
`;
  fs.writeFileSync('app/dashboard/literature/page.tsx', newPage);
}

refactorRoleplay();
refactorLiterature();
