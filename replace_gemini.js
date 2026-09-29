const fs = require('fs');
let code = fs.readFileSync('app/api/generate/content/route.ts', 'utf8');

// Replace imports
code = code.replace(/import OpenAI from 'openai';\n/g, '');
code = code.replace(/import \{ NextResponse \} from 'next\/server';/, "import { NextResponse } from 'next/server';\nimport { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';");

// Remove OpenRouter init
code = code.replace(/\/\/ Initialize OpenAI[\s\S]*?\}\);\n/, '');

// Add GenAI Init
const genAiInit = `// Initialize Gemini
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("Missing GEMINI_API_KEY");
    }
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction,
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      ]
    });
`;

code = code.replace('const systemInstruction = buildSystemInstruction(preferences || [], playMode);', 'const systemInstruction = buildSystemInstruction(preferences || [], playMode);\n\n' + genAiInit);

const callReplacement = `let result;
    try {
      const response = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json' }
      });
      result = response.response.text();
    } catch (apiError: any) {
      console.error("Gemini API Fetch Error:", apiError);
      return NextResponse.json({ error: apiError.message || "Gemini failed" }, { status: 500 });
    }

    const responseText = result || "{}";`;

code = code.replace(/let result;[\s\S]*?const responseText = result\.choices\[0\]\.message\.content \|\| "\{\}";/, callReplacement);

fs.writeFileSync('app/api/generate/content/route.ts', code);
