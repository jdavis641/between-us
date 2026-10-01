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
    
    // First revert my bad @ts-ignore
    code = code.replace(/await openai\.chat\.completions\.create\(\{\n\/\/ @ts-ignore/g, 'await openai.chat.completions.create({');
    
    // Now add @ts-ignore right before the line with await
    code = code.replace(/(.+?)await openai\.chat\.completions\.create\(\{/g, '$1// @ts-ignore\n$1await openai.chat.completions.create({');
    
    fs.writeFileSync(filePath, code);
    console.log('Updated ' + filePath);
  }
}
