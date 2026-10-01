const fs = require('fs');

let code = fs.readFileSync('src/components/GameList.tsx', 'utf8');

const replacement = `'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function GameList({ sections }: { sections: any[] }) {
  const [activeHash, setActiveHash] = useState('');

  useEffect(() => {
    const handleHashChange = () => setActiveHash(window.location.hash);
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const filteredSections = activeHash 
    ? sections.filter(s => '#' + s.id === activeHash)
    : sections;`;

code = code.replace(/'use client';\nimport Link from 'next\/link';\n\nexport default function GameList\(\{ sections \}: \{ sections: any\[\] \}\) \{/, replacement);
code = code.replace(/\{sections\.map\(/, '{filteredSections.map(');

fs.writeFileSync('src/components/GameList.tsx', code);
