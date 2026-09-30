const fs = require('fs');

let code = fs.readFileSync('app/api/generate/content/route.ts', 'utf8');

// Modify function signature
code = code.replace(/function buildSystemInstruction\(preferences: any\[\], playMode: string\) \{/, 'function buildSystemInstruction(preferences: any[], playMode: string, theme?: string, targetBoundary?: string) {');

// Modify baseTolerance
code = code.replace(/const baseTolerance = preferences\?\.find\(p => p\.category_tag === 'Base Tolerance'\)\?\.preference_level \|\| 'Moderate';/, "const baseTolerance = targetBoundary || (preferences?.find(p => p.category_tag === 'Base Tolerance')?.preference_level || 'Moderate');");

// Inject theme driver
const themeInjection = `  if (theme) {
    sys += \`Primary Narrative Driver:\\nCenter the plot, pacing, and vocabulary entirely around this concept: \${theme}\\n\\n\`;
  }

  return sys;`;
code = code.replace(/  return sys;/, themeInjection);

// Read body in POST
const bodyExtraction = `    const contentType = body.contentType;
    const category = body.category;
    const hasScripts = body.hasScripts;
    const theme = body.theme;
    const targetBoundary = body.targetBoundary;`;

code = code.replace(/    const contentType = body\.contentType;\s*const category = body\.category;\s*const hasScripts = body\.hasScripts;/, bodyExtraction);

// Update call to buildSystemInstruction
code = code.replace(/const sysInstruction = buildSystemInstruction\(preferences, playMode\);/, 'const sysInstruction = buildSystemInstruction(preferences, playMode, theme, targetBoundary);');

fs.writeFileSync('app/api/generate/content/route.ts', code);
