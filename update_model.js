const fs = require('fs');

function updateModel(filePath) {
  if (fs.existsSync(filePath)) {
    let code = fs.readFileSync(filePath, 'utf8');
    code = code.replace(/cognitivecomputations\/dolphin-mixtral-8x7b/g, 'nousresearch/nous-hermes-2-mixtral-8x7b-dpo');
    fs.writeFileSync(filePath, code);
    console.log('Updated ' + filePath);
  }
}

updateModel('app/api/generate/content/route.ts');
updateModel('scripts/seed-library.ts');
