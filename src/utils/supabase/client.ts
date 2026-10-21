import { createBrowserClient } from '@supabase/ssr'

declare global {
  interface Window {
    supabase: any;
  }
}

const defaultOptions = {
  global: {
    fetch: (url: any, options: any = {}) => fetch(url, { ...options, cache: 'no-store' })
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
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      mergedOptions
    );
  }
  
  if (options) {
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      mergedOptions
    );
  }

  if (!window.supabase) {
    window.supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      mergedOptions
    );
  }
  
  return window.supabase;
}
