import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from "@google/generative-ai"

export async function POST(request: Request) {
  try {
    const { userId, contentType } = await request.json()

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY! // Uses service role for secure backend generation
    )

    // 1. Fetch user profile, favorite tropes, and boundaries
    const { data: profile } = await supabase
      .from('profiles')
      .select('*, user_favorites(*)')
      .eq('id', userId)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // 2. Initialize Gemini API Client
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" })

    // 3. Construct the dynamic prompt based on user data and content type
    const prompt = `
      You are the AI Game Master for "Between Us", an intimacy and relationship-spicing application.
      Generate a ${contentType === 'midweek_story' ? 'mid-week serialized erotic fantasy story chapter' : 'weekend roleplay script including pre-experience tasks'} for a user.
      
      User Risk Tolerance: ${profile.tolerance || 'Playful'}
      User Sexual Orientation: ${profile.orientation || 'Straight'}
      Selected Literary Tropes: ${profile.favorite_tropes?.join(', ') || 'Slow burn, romantasy'}
      
      Ensure the narrative tone matches the intensity level, respects psychological safety, and builds powerful anticipation. Provide the response in clean JSON format with fields: title, body, and tasks (if applicable).
    `

    // 4. Call Gemini Pro
    const response = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" }
    })

    const generatedText = response.response.text()

    // 5. Save the generated text to the database
    const { data: savedContent, error } = await supabase
      .from('generated_content')
      .insert({
        user_id: userId,
        content_type: contentType,
        title: 'Generated Chapter',
        body: generatedText,
    })
    .select()
    .single()

    if (error) throw error

    return NextResponse.json({ success: true, content: savedContent })

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}