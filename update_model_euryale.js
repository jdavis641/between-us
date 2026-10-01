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
    code = code.replace(/neversleep\/llama-3-lumimaid-70b/g, 'sao10k/l3.1-euryale-70b');
    fs.writeFileSync(filePath, code);
    console.log('Updated ' + filePath);
  }
}
