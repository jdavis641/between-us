import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    const { nickname } = await request.json()
    
    if (!nickname) {
      return NextResponse.json({ error: 'Nickname is required' }, { status: 400 })
    }

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

    // Check if the requested nickname is already taken
    const { data: existingProfiles, error } = await supabaseAdmin
      .from('profiles')
      .select('nickname')
      .ilike('nickname', nickname)
      .limit(1)

    if (error) {
      console.error('Error querying profiles:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    const isAvailable = existingProfiles.length === 0

    if (isAvailable) {
      return NextResponse.json({ available: true })
    }

    // If taken, generate suggestions
    const suggestions: string[] = []
    let counter = 1
    
    while (suggestions.length < 3) {
      const suggestion = `${nickname}${counter}`
      const { data: check } = await supabaseAdmin
        .from('profiles')
        .select('nickname')
        .ilike('nickname', suggestion)
        .limit(1)
        
      if (check && check.length === 0) {
        suggestions.push(suggestion)
      }
      counter++
      // Safety limit
      if (counter > 50) break;
    }

    return NextResponse.json({ available: false, suggestions })
  } catch (err) {
    console.error('Error in check-nickname:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
