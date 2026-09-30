const fs = require('fs');
let code = fs.readFileSync('app/dashboard/pass/page.tsx', 'utf8');

const oldOnClick = /onClick=\{\(\) => \{\s*setLoading\(true\);\s*setLoading\(false\);\s*\}\}/;

const newOnClick = `onClick={async () => {
                  setLoading(true);
                  const { data: { session } } = await supabase.auth.getSession();
                  if (session) {
                    const payload = JSON.stringify({ tags: selectedTags, kinks: selectedKinks, instructions });
                    const { data: existing } = await supabase.from('intimacy_preferences').select('id').eq('user_id', session.user.id).eq('category_tag', 'Guest Pass Config').maybeSingle();
                    if (existing) {
                      await supabase.from('intimacy_preferences').update({ kinks_override: payload }).eq('id', existing.id);
                    } else {
                      await supabase.from('intimacy_preferences').insert({ user_id: session.user.id, category_tag: 'Guest Pass Config', preference_level: 'Definitely', kinks_override: payload });
                    }
                  }
                  setLoading(false);
                }}`;

code = code.replace(oldOnClick, newOnClick);

fs.writeFileSync('app/dashboard/pass/page.tsx', code);
