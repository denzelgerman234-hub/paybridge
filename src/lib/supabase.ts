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
const isUsingMock = !hasSupabaseCredentials && isDev;
const configError =
  'Supabase is not configured for this build. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel Production, then redeploy.';

export const supabaseConfig = {
  hasSupabaseCredentials,
  isUsingMock,
  mode: import.meta.env.MODE,
  urlHost: supabaseUrl ? new URL(supabaseUrl).host : null,
};

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
    ? createClient(supabaseUrl!, supabaseAnonKey!)
    : createMissingConfigClient();
