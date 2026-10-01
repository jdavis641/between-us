const fs = require('fs');

let code = fs.readFileSync('app/dashboard/partnerinvite/page.tsx', 'utf8');

const newSearchLogic = `  const handleSearch = async () => {
    if (!searchValue.trim()) return
    setIsSearching(true)
    
    let query = supabase.from('profiles').select('id, username, anonymous_alias, nickname')
    if (searchMethod === 'username') {
      query = query.eq('anonymous_alias', searchValue)
    } else if (searchMethod === 'email') {
      query = query.eq('email', searchValue)
    } else if (searchMethod === 'phone') {
      query = query.eq('phone', searchValue)
    }`;

code = code.replace(/  const handleSearch = async \(\) => \{[\s\S]*?\} else if \(searchMethod === 'phone'\) \{[\s\S]*?\n    \}/, newSearchLogic);

fs.writeFileSync('app/dashboard/partnerinvite/page.tsx', code);
