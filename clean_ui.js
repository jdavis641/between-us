const fs = require('fs');

function cleanAndFix(filePath) {
  let code = fs.readFileSync(filePath, 'utf8');

  // Remove ALL theme and targetBoundary declarations
  code = code.replace(/\s*const \[theme, setTheme\].*?;/g, '');
  code = code.replace(/\s*const \[targetBoundary, setTargetBoundary\].*?;/g, '');

  // Add exactly one back
  code = code.replace(/const \[playMode, setPlayMode\] = useState\(initialMode\);/, 'const [playMode, setPlayMode] = useState(initialMode);\n  const [theme, setTheme] = useState("");\n  const [targetBoundary, setTargetBoundary] = useState("");');

  // Fix fetch body
  const isRoleplay = filePath.includes('roleplay');
  const contentType = isRoleplay ? 'roleplay' : 'literature';
  const hasScripts = isRoleplay ? 'true' : 'false';

  const correctBody = `body: JSON.stringify({ 
          contentType: "${contentType}",
          playMode: playMode,
          hasScripts: ${hasScripts},
          theme: theme,
          targetBoundary: targetBoundary
        })`;

  code = code.replace(/body:\s*JSON\.stringify\(\{[\s\S]*?\}\)/, correctBody);

  // Remove previously inserted UI blocks
  code = code.replace(/\s*<div className="mb-6 space-y-4">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*/g, '\n');
  code = code.replace(/\s*<div className="mb-6 space-y-4">[\s\S]*?<\/div>\s*<\/div>\s*/g, '\n');

  const uiElements = `
          <div className="mb-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Target Boundary Level (Optional)</label>
              <select 
                value={targetBoundary} 
                onChange={(e) => setTargetBoundary(e.target.value)}
                className="w-full md:w-1/2 bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 text-zinc-300 focus:outline-none focus:border-red-900"
              >
                <option value="">Default (Use Profile Baseline)</option>
                <option value="Sensory">Sensory (Gentle & Emotional)</option>
                <option value="Playful">Playful (Teasing & Fun)</option>
                <option value="Intense">Intense (High Stakes & Passionate)</option>
                <option value="Extreme">Extreme (Boundary Pushing)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Theme Suggestions (Optional)</label>
              <textarea 
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                placeholder="e.g., A rainy night in a secluded cabin, masquerade ball, enemies to lovers..."
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-3 text-zinc-300 h-24 focus:outline-none focus:border-red-900"
              />
            </div>
          </div>
          
          <button `;

  // We only replace the first occurrence of <button onClick={handleGenerate}
  let buttonReplaced = false;
  code = code.replace(/<button\s+onClick=\{handleGenerate\}/g, (match) => {
    if (!buttonReplaced) {
      buttonReplaced = true;
      return uiElements.trim() + '\n            onClick={handleGenerate}';
    }
    return match;
  });

  fs.writeFileSync(filePath, code);
}

cleanAndFix('app/dashboard/roleplay/RolePlayClient.tsx');
cleanAndFix('app/dashboard/literature/LiteratureClient.tsx');
