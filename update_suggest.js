const fs = require('fs');

let code = fs.readFileSync('app/dashboard/suggest/page.tsx', 'utf8');

const replacement = `            <p className="text-zinc-400 max-w-md">
              Your suggestions has been anonymously added to our admin team for approval. It should enter the database shortly.
            </p>`;

code = code.replace(/            <p className="text-zinc-400 max-w-md">\n              Your scenario idea has been anonymously submitted to our admin pipeline\. Thank you for helping Between Us evolve\.\n            <\/p>/, replacement);

fs.writeFileSync('app/dashboard/suggest/page.tsx', code);
