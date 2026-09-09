import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

export async function middleware(request: NextRequest) {
  // Bypass standard auth session updates for Stripe webhooks and auth callbacks
  if (
    request.nextUrl.pathname.startsWith('/api/webhooks/stripe') ||
    request.nextUrl.pathname.startsWith('/auth/callback') ||
    request.nextUrl.pathname.startsWith('/api/auth/confirm') ||
    request.nextUrl.pathname.startsWith('/onboarding')
  ) {
    return NextResponse.next();
  }
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
