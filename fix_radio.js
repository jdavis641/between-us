const fs = require('fs');
let code = fs.readFileSync('app/dashboard/literature/LiteratureClient.tsx', 'utf8');

const soloRegex = /<label className="flex items-center gap-2 cursor-pointer">[\s\S]*?value="solo"[\s\S]*?<\/label>/;
const coupleRegex = /<label className="flex items-center gap-2 cursor-pointer">[\s\S]*?value="couple"[\s\S]*?<\/label>/;
const groupRegex = /<label className="flex items-center gap-2 cursor-pointer">[\s\S]*?value="group"[\s\S]*?<\/label>/;

const soloMatch = code.match(soloRegex)[0];
const coupleMatch = code.match(coupleRegex)[0];
const groupMatch = code.match(groupRegex)[0];

const newRadioBlock = soloMatch + '\n            ' + coupleMatch + '\n            ' + groupMatch;

// Replace the whole div
const oldDiv = /<div className="flex flex-wrap gap-4 mb-6">[\s\S]*?<\/div>/;
code = code.replace(oldDiv, '<div className="flex flex-wrap gap-4 mb-6">\n            ' + newRadioBlock + '\n          </div>');

fs.writeFileSync('app/dashboard/literature/LiteratureClient.tsx', code);
