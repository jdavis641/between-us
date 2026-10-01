const fs = require('fs');

const filesToUpdate = [
  'app/api/generate/content/route.ts',
  'scripts/seed-library.ts',
  'app/api/cron/mid-week/route.ts',
  'app/api/cron/weekend/route.ts'
];

for (const filePath of filesToUpdate) {
  if (fs.existsSync(filePath)) {
    let code = fs.readFileSync(filePath, 'utf8');
    
    // Replace the closing }); of openai.chat.completions.create with } as any);
    // Find extra_body block and the following });
    code = code.replace(/(extra_body: \{[\s\S]*?\}),?\s*\}\)/g, '$1\n        } as any)');

    fs.writeFileSync(filePath, code);
    console.log('Updated ' + filePath);
  }
}
