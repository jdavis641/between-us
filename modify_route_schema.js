const fs = require('fs');
const routePath = 'app/api/generate/content/route.ts';
let code = fs.readFileSync(routePath, 'utf8');

const regex = /if\s*\(contentType\s*===\s*"roleplay"\s*\|\|\s*contentType\s*===\s*"literature"\)\s*\{[\s\S]*?\}\s*else if\s*\(contentType\s*===\s*"game"\)/;

const newCode = `if (contentType === "literature") {
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
    } else if (contentType === "game")`;

code = code.replace(regex, newCode);
fs.writeFileSync(routePath, code);
console.log('Replaced JSON schema blocks');
