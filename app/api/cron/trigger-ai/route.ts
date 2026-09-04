import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  
  // Secure the cron route with a secret token
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  // Logic to fetch all active users and trigger the content generation API route
  // Runs twice a week to build anticipation for the weekend encounter

  return NextResponse.json({ success: true, message: 'AI generation cycle executed.' })
}