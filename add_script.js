const fs = require('fs');

const packagePath = 'package.json';
let packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

packageData.scripts["seed:tropes"] = "ts-node scripts/seed-romantasy-tropes.ts";

fs.writeFileSync(packagePath, JSON.stringify(packageData, null, 2));
console.log('Added seed:tropes to package.json');
