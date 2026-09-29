const fs = require('fs');

function convertToOpenRouter(filePath) {
  let code = fs.readFileSync(filePath, 'utf8');

  // Replace imports
  code = code.replace(/import \{ GoogleGenerativeAI.*\} from ['"]@google\/generative-ai['"];?\n?/g, "import OpenAI from 'openai';\n");

  // Replace genAI initialization
  const openRouterInit = `const openai = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: process.env.OPENROUTER_API_KEY,
    });`;
  
  code = code.replace(/const genAI = new GoogleGenerativeAI[^\n]+\n[^\n]+getGenerativeModel[^\n]+\n/g, openRouterInit + '\n');

  // Replace generation call
  const callReplacement = `const result = await openai.chat.completions.create({
          model: 'cognitivecomputations/dolphin-mixtral-8x7b',
          messages: [{ role: 'system', content: 'You are an AI assistant.' }, { role: 'user', content: prompt }],
          response_format: { type: 'json_object' }
        });
        const generatedContent = JSON.parse(result.choices[0].message.content);`;

  code = code.replace(/const result = await model\.generateContent\(\{[\s\S]*?\}\);\s*const generatedContent = JSON\.parse\(result\.response\.text\(\)\);/m, callReplacement);

  fs.writeFileSync(filePath, code);
}

convertToOpenRouter('app/api/cron/mid-week/route.ts');
convertToOpenRouter('app/api/cron/weekend/route.ts');
