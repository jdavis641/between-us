import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/proxy'

export async function proxy(request: NextRequest) {
  // Bypass middleware completely for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Bypass standard auth session updates for Stripe webhooks and auth callbacks
  if (
    request.nextUrl.pathname.startsWith('/auth/callback') ||
    request.nextUrl.pathname.startsWith('/onboarding') ||
    request.nextUrl.pathname.startsWith('/login')
  ) {
    return NextResponse.next();
  }
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
