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
    
    // First remove the broken ts-ignore lines
    code = code.replace(/result = \/\/ @ts-ignore\n/g, '');
    code = code.replace(/const response = \/\/ @ts-ignore\n/g, '');
    
    // Now replace the trailing "      });" or "      }) as any;" with "      } as any);"
    // Actually, I can just do a regex replace on the create call block
    code = code.replace(/await openai\.chat\.completions\.create\(\{([\s\S]*?extra_body: \{[\s\S]*?\}\,)\n\s*\}\)/g, 'await openai.chat.completions.create({$1} as any)');

    // It seems there's an extra comma at the end of extra_body, so it's "}," instead of "}" in my regex
    code = code.replace(/await openai\.chat\.completions\.create\(\{([\s\S]*?extra_body: \{[\s\S]*?\}\,)\n\s*\}\)/g, 'await openai.chat.completions.create({$1\n        } as any)');
    
    // Simpler approach: find "      });" that follow the extra_body block
    code = code.replace(/extra_body: \{[\s\S]*?\}\,\n\s*\}/g, match => {
      return match.replace(/\}$/, '} as any');
    });

    fs.writeFileSync(filePath, code);
    console.log('Updated ' + filePath);
  }
}
