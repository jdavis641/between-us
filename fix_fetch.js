const fs = require('fs');

function fixFetchError(file) {
  let code = fs.readFileSync(file, 'utf8');
  
  const replacement = `        if (!res.ok) {
          let errMsg = 'Failed to generate content.';
          try {
            const errData = await res.json();
            if (errData.error) errMsg = errData.error;
          } catch (e) {}
          throw new Error(errMsg);
        }`;
        
  code = code.replace(/        if \(!res\.ok\) \{[\s\S]*?throw new Error\(.*?\);\n        \}/, replacement);
  fs.writeFileSync(file, code);
}

fixFetchError('app/dashboard/roleplay/RolePlayClient.tsx');
fixFetchError('app/dashboard/literature/LiteratureClient.tsx');
