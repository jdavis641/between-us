const fs = require('fs');
let code = fs.readFileSync('scripts/seed-library.ts', 'utf8');

const callReplacement = `    try {
      const response = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: 'You are an AI assistant.\\n\\n' + prompt }] }],
        generationConfig: { responseMimeType: 'application/json' }
      });
      return response.response.text();`;

code = code.replace(/    try \{\s+const response = await openai\.chat\.completions\.create\(\{[\s\S]*?\}\);\s+return response\.choices\[0\]\.message\.content;/m, callReplacement);

fs.writeFileSync('scripts/seed-library.ts', code);
