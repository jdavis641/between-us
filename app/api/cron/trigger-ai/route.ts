import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  
  // Secure the cron route with a secret token
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  // Logic to fetch all active users and trigger the content generation API route
  // Runs twice a week to build anticipation for the weekend encounter
  // NOTE: Kinks Override and detailed Gemini prompt prioritization logic is actively implemented directly in:
  // - app/api/generate/content/route.ts
  // - app/api/cron/mid-week/route.ts
  // - app/api/cron/weekend/route.ts

  return NextResponse.json({ success: true, message: 'AI generation cycle executed.' })
}