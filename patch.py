import sys
with open('app/dashboard/page.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

c = c.replace('<Link href="/dashboard/settings">', '<Link href="/dashboard/partnerinvite">')

with open('app/dashboard/page.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
