const fs = require('fs');

function fixFetchError(file) {
  let code = fs.readFileSync(file, 'utf8');
  
  const replacement = `        if (!res.ok) {
          let errMsg = 'Failed to generate content.';
          try {
            const errData = await res.json();
            if (errData.error) errMsg = errData.error;
          } catch (e) {}
          if (res.status === 401) errMsg = "Auth Rejected: " + errMsg;
          throw new Error(errMsg);
        }`;
        
  const parts = code.split('        if (!res.ok) {');
  if (parts.length > 1) {
    const endIdx = parts[1].indexOf('        const data = await res.json();');
    code = parts[0] + replacement + '\n' + parts[1].substring(endIdx);
    fs.writeFileSync(file, code);
  }
}

fixFetchError('app/dashboard/roleplay/RolePlayClient.tsx');
fixFetchError('app/dashboard/literature/LiteratureClient.tsx');
