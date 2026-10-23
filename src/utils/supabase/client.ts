import { createBrowserClient } from '@supabase/ssr'

declare global {
  interface Window {
    supabase: any;
  }
}

const defaultAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key');
const defaultSupabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co');

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
      if (defaultAnonKey && defaultAnonKey !== 'placeholder-anon-key' && !headers.has('apikey')) {
        headers.set('apikey', defaultAnonKey);
      }
      return fetch(url, { ...options, headers, cache: 'no-store' });
    }
  }
};

export function createClient(options?: any) {
  const customFetch = options?.global?.fetch;
  const wrappedFetch = (url: any, opts: any = {}) => {
    let headers: Headers;
    if (opts.headers instanceof Headers) {
      headers = new Headers(opts.headers);
    } else if (opts.headers) {
      headers = new Headers(opts.headers);
    } else {
      headers = new Headers();
    }
    if (defaultAnonKey && defaultAnonKey !== 'placeholder-anon-key' && !headers.has('apikey')) {
      headers.set('apikey', defaultAnonKey);
    }
    const finalOpts = { ...opts, headers };
    return customFetch ? customFetch(url, finalOpts) : fetch(url, { ...finalOpts, cache: 'no-store' });
  };

  const mergedOptions = {
    ...defaultOptions,
    ...options,
    global: {
      ...defaultOptions.global,
      ...options?.global,
      headers: {
        ...defaultOptions.global.headers,
        ...options?.global?.headers,
        ...(defaultAnonKey ? { apikey: defaultAnonKey } : {})
      },
      fetch: wrappedFetch
    }
  };

  if (typeof window === 'undefined') {
    return createBrowserClient(
      defaultSupabaseUrl,
      defaultAnonKey,
      mergedOptions
    );
  }
  
  if (options) {
    return createBrowserClient(
      defaultSupabaseUrl,
      defaultAnonKey,
      mergedOptions
    );
  }

  if (!window.supabase) {
    window.supabase = createBrowserClient(
      defaultSupabaseUrl,
      defaultAnonKey,
      mergedOptions
    );
  }
  
  return window.supabase;
}
