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
    
    // We match response_format: { type: "json_object" }, and add extra_body right after it
    if (!code.includes('extra_body: {')) {
      code = code.replace(
        /response_format: \{ type: "json_object" \},/g,
        `response_format: { type: "json_object" },
        extra_body: {
          models: [
            "sao10k/l3.1-euryale-70b",
            "neversleep/llama-3.1-lumimaid-70b",
            "cognitivecomputations/dolphin-mistral-24b-venice-edition"
          ]
        },`
      );
      fs.writeFileSync(filePath, code);
      console.log('Updated ' + filePath);
    } else {
      console.log('Skipped ' + filePath + ' (already has extra_body)');
    }
  }
}
