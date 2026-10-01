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
    
    // Fix the "const         const result = " syntax error in the cron routes
    code = code.replace(/const\s+const response = /g, 'const response = ');
    code = code.replace(/const\s+const result = /g, 'const result = ');
    
    // Fix "const result =" if there are trailing newlines
    
    fs.writeFileSync(filePath, code);
    console.log('Fixed syntax in ' + filePath);
  }
}
