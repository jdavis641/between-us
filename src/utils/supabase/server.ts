import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
                  process.env.SUPABASE_ANON_KEY || 
                  process.env.SUPABASE_SERVICE_ROLE_KEY || 
                  'placeholder-anon-key';

  return createServerClient(
    supabaseUrl,
    anonKey,
    {
      global: {
        headers: {
          apikey: anonKey,
        },
        fetch: (url: any, options: any = {}) => {
          let headers: Headers;
          if (options.headers instanceof Headers) {
            headers = new Headers(options.headers);
          } else if (options.headers) {
            headers = new Headers(options.headers);
          } else {
            headers = new Headers();
          }

          if (anonKey && anonKey !== 'placeholder-anon-key' && !headers.has('apikey')) {
            headers.set('apikey', anonKey);
          }

          return fetch(url, { ...options, headers });
        }
      },
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The setAll method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}
