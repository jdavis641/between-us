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
    code = code.replace(/nousresearch\/nous-hermes-2-mixtral-8x7b-dpo/g, 'neversleep/llama-3-lumimaid-70b');
    fs.writeFileSync(filePath, code);
    console.log('Updated ' + filePath);
  }
}
