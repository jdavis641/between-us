import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const rawName = body.nickname || body.username || body.anonymous_alias
    
    if (!rawName || typeof rawName !== 'string' || rawName.trim() === '') {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 })
    }

    const cleanName = rawName.trim()

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Check if the requested nickname or anonymous_alias is already taken
    const { data: existingProfiles, error } = await supabaseAdmin
      .from('profiles')
      .select('nickname, anonymous_alias')
      .or(`nickname.ilike.${cleanName},anonymous_alias.ilike.${cleanName}`)
      .limit(1)

    if (error) {
      console.error('Error querying profiles:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    const isAvailable = !existingProfiles || existingProfiles.length === 0

    if (isAvailable) {
      return NextResponse.json({ available: true })
    }

    // If taken, generate 3 suggestions
    const suggestions: string[] = []
    let counter = 1
    
    while (suggestions.length < 3) {
      const suggestion = `${cleanName}${counter}`
      const { data: check } = await supabaseAdmin
        .from('profiles')
        .select('nickname, anonymous_alias')
        .or(`nickname.ilike.${suggestion},anonymous_alias.ilike.${suggestion}`)
        .limit(1)
        
      if (check && check.length === 0) {
        suggestions.push(suggestion)
      }
      counter++
      if (counter > 50) break;
    }

    return NextResponse.json({ available: false, suggestions })
  } catch (err) {
    console.error('Error in check-nickname:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
