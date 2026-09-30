const fs = require('fs');

let code = fs.readFileSync('app/dashboard/games/[id]/page.tsx', 'utf8');

// Change notFound() to the div
code = code.replace(/  if \(!game\) \{\n    notFound\(\)\n  \}/, `  if (!game) {
    return <div className="p-12 text-center text-zinc-400">Game not found.</div>
  }`);

// Change ul to ol
code = code.replace(/<ul className="space-y-4">/, '<ol className="space-y-4 list-decimal list-inside">');
code = code.replace(/<\/ul>/, '</ol>');

fs.writeFileSync('app/dashboard/games/[id]/page.tsx', code);
