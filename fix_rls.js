const fs = require('fs');
let code = fs.readFileSync('scripts/patch-rls.ts', 'utf8');

const sqlString = "`\n    ALTER TABLE public.intimacy_games ENABLE ROW LEVEL SECURITY;\n    CREATE POLICY \"Allow authenticated read intimacy_games\" ON public.intimacy_games FOR SELECT TO authenticated USING (true);\n    \n    ALTER TABLE public.generated_content ENABLE ROW LEVEL SECURITY;\n    CREATE POLICY \"Allow authenticated read generated_content\" ON public.generated_content FOR SELECT TO authenticated USING (true);\n    CREATE POLICY \"Allow authenticated insert generated_content\" ON public.generated_content FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);\n    CREATE POLICY \"Allow authenticated update generated_content\" ON public.generated_content FOR UPDATE TO authenticated USING (auth.uid() = user_id);\n  `";

code = code.replace(/ALTER TABLE public\.intimacy_games[\s\S]*?USING \(auth\.uid\(\) = user_id\);/g, sqlString);
fs.writeFileSync('scripts/patch-rls.ts', code);
