const fs = require('fs');
let code = fs.readFileSync('scripts/seed-library.ts', 'utf8');

// Replace imports
code = code.replace(/import OpenAI from 'openai';\n/g, '');
code = code.replace(/import \* as dotenv/, "import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';\nimport * as dotenv");

// Remove OpenRouter init
code = code.replace(/const openai = new OpenAI\(\{[\s\S]*?\}\);\n/, '');

// Add GenAI Init
const genAiInit = `// Initialize Gemini
if (!process.env.GEMINI_API_KEY) {
  throw new Error("Missing GEMINI_API_KEY");
}
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: 'gemini-1.5-flash',
  safetySettings: [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  ]
});
`;

code = code.replace('const TIERS =', genAiInit + '\nconst TIERS =');

const callReplacement = `    try {
      const response = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: 'You are an AI assistant.\\n\\n' + prompt }] }],
        generationConfig: { responseMimeType: 'application/json' }
      });
      return response.response.text();`;

code = code.replace(/    try \{\n      const response = await openai\.chat\.completions\.create\(\{[\s\S]*?\}\);\n\n      return response\.choices\[0\]\.message\.content;/, callReplacement);

fs.writeFileSync('scripts/seed-library.ts', code);
