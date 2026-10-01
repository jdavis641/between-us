const fs = require('fs');

let code = fs.readFileSync('app/api/generate/content/route.ts', 'utf8');

const replacement = `    // Record to generated_content
    await supabase.from('generated_content').insert({
      user_id: user.id,
      content_type: contentType,
      title: generatedContent.title,
      body: JSON.stringify(generatedContent),
      status: 'active'
    });

    // Record to Activity History
    await supabase.from('activity_history').insert({`;

code = code.replace(/    \/\/ Record to Activity History[\s\S]*?await supabase\.from\('activity_history'\)\.insert\(\{/, replacement);

fs.writeFileSync('app/api/generate/content/route.ts', code);
