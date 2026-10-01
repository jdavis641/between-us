const fs = require('fs');

let layoutCode = fs.readFileSync('app/dashboard/layout.tsx', 'utf8');
const improveLink = `            <Link href="/dashboard/suggest" className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-zinc-900 text-zinc-500 hover:text-zinc-300 transition-colors mb-1">
              🛠️ Improve the App
            </Link>
            <Link href="/dashboard/settings"`;

layoutCode = layoutCode.replace(/            <Link href="\/dashboard\/settings"/, improveLink);
fs.writeFileSync('app/dashboard/layout.tsx', layoutCode);

let modalCode = fs.readFileSync('app/components/TolerancePromptManager.tsx', 'utf8');
modalCode = modalCode.replace(/router\.push\('\/onboarding'\)/, "router.push('/dashboard/settings')\n    setShowPrompt(false)");
fs.writeFileSync('app/components/TolerancePromptManager.tsx', modalCode);
