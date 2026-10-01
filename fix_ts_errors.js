const fs = require('fs');
const routePath = 'app/api/generate/content/route.ts';
let code = fs.readFileSync(routePath, 'utf8');

// Fix buildSystemInstruction
code = code.replace(
  /function buildSystemInstruction\(preferences: any\[\], playMode: string, theme\?: string, targetBoundary\?: string, contentType: string\)/,
  'function buildSystemInstruction(preferences: any[], playMode: string, theme?: string, targetBoundary?: string, contentType?: string)'
);

// Fix baseTolerance in POST
// In POST, replace baseTolerance with the same logic used in buildSystemInstruction
const baseToleranceLogic = `const baseTolerance = targetBoundary || (preferences?.find(p => p.category_tag === 'Base Tolerance' || p.category_tag === 'Primary Directive')?.preference_level || 'Moderate');`;

code = code.replace(
  /const systemInstruction = buildSystemInstruction\(preferences \|\| \[\], playMode, theme, targetBoundary, contentType\);/,
  `${baseToleranceLogic}\n    const systemInstruction = buildSystemInstruction(preferences || [], playMode, theme, targetBoundary, contentType);`
);

fs.writeFileSync(routePath, code);
console.log('Fixed typescript errors');
