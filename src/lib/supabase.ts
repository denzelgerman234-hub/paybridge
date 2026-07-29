/**
 * Supabase client.
 *
 * Local dev without env vars uses mockSupabase so the app can run offline.
 * Deployed builds must have VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY;
 * otherwise auth calls return a clear configuration error instead of silently
 * creating mock users.
 */

import { createClient } from '@supabase/supabase-js';
import { supabase as mockSupabase } from './mockSupabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const hasSupabaseCredentials = Boolean(supabaseUrl && supabaseAnonKey);
const isDev = import.meta.env.DEV;
const isPublishableKey = supabaseAnonKey?.startsWith('sb_publishable_') ?? false;
const isUsingMock = !hasSupabaseCredentials && isDev;
const configError =
  'Supabase is not configured for this build. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel Production, then redeploy.';

export const supabaseConfig = {
  hasSupabaseCredentials,
  isPublishableKey,
  isUsingMock,
  mode: import.meta.env.MODE,
  urlHost: supabaseUrl ? new URL(supabaseUrl).host : null,
};

function createPublishableKeyFetch(apiKey: string): typeof fetch {
  return async (input, init) => {
    const headers = new Headers(init?.headers);
    const authorization = headers.get('Authorization');
    const bearerPrefix = 'Bearer ';

    if (
      authorization?.startsWith(bearerPrefix) &&
      authorization.slice(bearerPrefix.length) === apiKey &&
      headers.get('apikey') === apiKey
    ) {
      headers.delete('Authorization');
    }

    return fetch(input, { ...init, headers });
  };
}

function createMissingConfigClient() {
  const error = { message: configError, code: 'supabase_not_configured' };
  const fail = async () => ({ data: null, error });

  console.error(`[paybridge] ${configError}`);

  return {
    from: () => ({
      select: () => ({ eq: () => ({ single: fail }) }),
      insert: fail,
      update: () => ({ eq: fail }),
      upsert: () => ({ eq: fail }),
    }),
    auth: {
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => undefined } }, error: null }),
      getSession: async () => ({ data: { session: null }, error: null }),
      signInWithPassword: fail,
      signUp: fail,
      resend: fail,
      signOut: async () => ({ error: null }),
      verifyOtp: fail,
      exchangeCodeForSession: fail,
      resetPasswordForEmail: fail,
    },
    storage: {
      from: () => ({
        upload: fail,
        getPublicUrl: () => ({ data: { publicUrl: '' } }),
        createSignedUrl: fail,
      }),
    },
  };
}

if (isUsingMock) {
  console.warn(
    '[paybridge] Running in LOCAL MOCK mode - no Supabase credentials found.\n' +
    'Create a .env file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to connect to Supabase.'
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase: any = isUsingMock
  ? mockSupabase
  : hasSupabaseCredentials
    ? createClient(
        supabaseUrl!,
        supabaseAnonKey!,
        isPublishableKey ? { global: { fetch: createPublishableKeyFetch(supabaseAnonKey!) } } : undefined,
      )
    : createMissingConfigClient();

