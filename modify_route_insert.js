const fs = require('fs');
const routePath = 'app/api/generate/content/route.ts';
let code = fs.readFileSync(routePath, 'utf8');

const oldInsert = `    // Record to generated_content
    await supabase.from('generated_content').insert({
      user_id: user.id,
      content_type: contentType,
      title: generatedContent.title,
      body: JSON.stringify(generatedContent),
      status: 'active'
    });`;

const newInsert = `    // Record to generated_content (if columns exist)
    const payload: any = {
      user_id: user.id,
      content_type: contentType,
      title: generatedContent.title,
      body: JSON.stringify(generatedContent),
      status: 'active'
    };
    
    // Add meta tags for inventory retrieval
    // Note: If these columns do not exist in the database, Supabase JS client will throw an error.
    // The instructions explicitly require these to be populated.
    payload.tolerance_tier = targetBoundary || baseTolerance || null;
    payload.play_mode = playMode;
    payload.theme_tags = theme || null;

    await supabase.from('generated_content').insert(payload);`;

code = code.replace(oldInsert, newInsert);
fs.writeFileSync(routePath, code);
console.log('Done fixing insert in route.ts');
