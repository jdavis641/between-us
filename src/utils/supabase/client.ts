import { createBrowserClient } from '@supabase/ssr'

declare global {
  interface Window {
    supabase: any;
  }
}

const defaultAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key');
const defaultOptions = {
  global: {
    headers: {
      apikey: defaultAnonKey,
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
      if (defaultAnonKey && !headers.has('apikey')) {
        headers.set('apikey', defaultAnonKey);
      }
      return fetch(url, { ...options, headers, cache: 'no-store' });
    }
  }
};

export function createClient(options?: any) {
  const mergedOptions = {
    ...defaultOptions,
    ...options,
    global: {
      ...defaultOptions.global,
      ...options?.global
    }
  };

  if (typeof window === 'undefined') {
    return createBrowserClient(
      (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'),
      (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'),
      mergedOptions
    );
  }
  
  if (options) {
    return createBrowserClient(
      (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'),
      (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'),
      mergedOptions
    );
  }

  if (!window.supabase) {
    window.supabase = createBrowserClient(
      (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'),
      (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'),
      mergedOptions
    );
  }
  
  return window.supabase;
}
