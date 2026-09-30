const fs = require('fs');

function addFields(filePath) {
  let code = fs.readFileSync(filePath, 'utf8');

  // Add state variables
  code = code.replace(/const \[playMode, setPlayMode\] = useState\(initialMode\);/, 'const [playMode, setPlayMode] = useState(initialMode);\n  const [theme, setTheme] = useState("");\n  const [targetBoundary, setTargetBoundary] = useState("");');

  // Update fetch body
  const oldBody = /body: JSON\.stringify\(\{([\s\S]*?)hasScripts:\s*(true|false)\s*\}\)/;
  code = code.replace(oldBody, (match, p1, p2) => {
    return `body: JSON.stringify({${p1}hasScripts: ${p2},\n          theme: theme,\n          targetBoundary: targetBoundary\n        })`;
  });

  // Add UI Elements
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
          
          <button 
            onClick={handleGenerate}`;

  code = code.replace(/          <button \s*onClick=\{handleGenerate\}/, uiElements);

  fs.writeFileSync(filePath, code);
}

addFields('app/dashboard/roleplay/RolePlayClient.tsx');
addFields('app/dashboard/literature/LiteratureClient.tsx');
