const fs = require('fs');

const routePath = 'app/api/generate/content/route.ts';
let code = fs.readFileSync(routePath, 'utf8');

// 1. Add maxDuration
if (!code.includes('export const maxDuration')) {
  code = `export const maxDuration = 300;\n${code}`;
}

// 2. Modify buildSystemInstruction to accept contentType and add prompt logic
code = code.replace(
  /function buildSystemInstruction\((.*?)\) \{/,
  'function buildSystemInstruction($1, contentType: string) {'
);

code = code.replace(
  /let sys = `You are an expert intimacy and relationship guide\.\\n\\n`;/,
  `let sys = \`You are an expert intimacy and relationship guide.\\n\\n\`;

  if (contentType === 'literature') {
    sys += \`You are a master of serialized erotic fantasy. You MUST generate a full, multi-chapter story (minimum 3 chapters, 1500+ words). You must establish a slow-burn narrative buildup in Chapter 1, escalating tension in Chapter 2, and a highly explicit, detailed climax in Chapter 3. Use Markdown headers (e.g., '## Chapter 1') to separate sections. Do not summarize; write the full scenes.\\n\\n\`;
  } else if (contentType === 'roleplay') {
    sys += \`Generate a complete, highly detailed roleplay script. Include 'Pre-Experience Tasks', 'The Storyboard', and explicit 'Dialogue/Action Scripts'. Do not stall or summarize.\\n\\n\`;
  }`
);

// Update call to buildSystemInstruction
code = code.replace(
  /const systemInstruction = buildSystemInstruction\(preferences \|\| \[\], playMode, theme, targetBoundary\);/,
  'const systemInstruction = buildSystemInstruction(preferences || [], playMode, theme, targetBoundary, contentType);'
);

// 3. Fix JSON Schema in prompt
const oldSchema = `    if (contentType === "roleplay" || contentType === "literature") {
      prompt += \`
JSON SCHEMA REQUIREMENT:
You must return a valid JSON object matching this schema exactly:
{
  "title": "A catchy title for the scenario",
  "overview": "A rich, setting-the-scene context",
  "preExperienceTasks": ["Task for Partner A", "Task for Partner B"],
  "partnerAPerspective": "Internal monologue, motivation, or secret instructions for Partner A. Make it emotionally engaging and focused on intimacy without being explicitly sexually graphic.",
  "partnerBPerspective": "Internal monologue, motivation, or secret instructions for Partner B. Make it emotionally engaging and focused on intimacy without being explicitly sexually graphic.",
  "fullScript": \${hasScripts ? \`"A back-and-forth dialogue script for them to follow."\` : "null"}
}
Make the tone emotionally engaging, suspenseful, and romantic fantasy. NEVER break the JSON structure.\`;
    }`;

const newSchema = `    if (contentType === "literature") {
      prompt += \`
JSON SCHEMA REQUIREMENT:
You must return a valid JSON object matching this schema exactly:
{
  "title": "A catchy title for the story",
  "body": "The full markdown text of the multi-chapter story as requested. Do not summarize, write the full scenes."
}
Make the tone emotionally engaging, suspenseful, and romantic fantasy. NEVER break the JSON structure.\`;
    } else if (contentType === "roleplay") {
      prompt += \`
JSON SCHEMA REQUIREMENT:
You must return a valid JSON object matching this schema exactly:
{
  "title": "A catchy title for the scenario",
  "overview": "The Storyboard. A rich, setting-the-scene context",
  "preExperienceTasks": ["Pre-Experience Task for Partner A", "Pre-Experience Task for Partner B"],
  "partnerAPerspective": "Internal monologue, motivation, or secret instructions for Partner A. Make it emotionally engaging and focused on intimacy without being explicitly sexually graphic.",
  "partnerBPerspective": "Internal monologue, motivation, or secret instructions for Partner B. Make it emotionally engaging and focused on intimacy without being explicitly sexually graphic.",
  "fullScript": \${hasScripts ? \`"Dialogue/Action Scripts. A back-and-forth dialogue script for them to follow."\` : "null"}
}
Make the tone emotionally engaging, suspenseful, and romantic fantasy. NEVER break the JSON structure.\`;
    }`;

code = code.replace(oldSchema, newSchema);

// 4. Implement max_tokens: 4000
code = code.replace(
  /response_format: \{ type: "json_object" \},/g,
  'max_tokens: 4000,\n        response_format: { type: "json_object" },'
);

// 5. Inventory-First Retrieval
const inventorySnippet = `
    // Check Inventory First
    if (theme) {
      const { data: existingData } = await supabase
        .from('generated_content')
        .select('*')
        .eq('content_type', contentType)
        .ilike('theme_tags', \`%\${theme}%\`)
        .limit(1)
        .maybeSingle();

      if (existingData) {
        // We have to parse the body if it's stored as JSON string, but maybe it's just the object
        let cachedContent = existingData.body;
        try {
          if (typeof cachedContent === 'string') {
            cachedContent = JSON.parse(cachedContent);
          }
        } catch (e) {}
        
        // ensure title is there
        if (typeof cachedContent === 'object' && cachedContent !== null) {
          cachedContent.title = cachedContent.title || existingData.title;
        }

        return NextResponse.json({ ...cachedContent, cached: true });
      }
    }

    // Initialize OpenAI`;

code = code.replace(/\/\/ Initialize OpenAI/, inventorySnippet);

fs.writeFileSync(routePath, code);
console.log('Done rewriting route.ts');
