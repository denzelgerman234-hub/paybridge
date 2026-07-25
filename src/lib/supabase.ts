/**
 * Supabase client — automatically uses a local mock when credentials are absent.
 *
 * LOCAL DEV (no .env):
 *   Falls back to mockSupabase.ts with in-memory data.
 *
 * PRODUCTION / STAGING:
 *   Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file
 *   and the real @supabase/supabase-js client will be used instead.
 *
 * TODO: Once Supabase is fully set up, you can optionally delete
 *       mockSupabase.ts and mockData.ts and simplify this file to
 *       just the createClient call.
 */

import { createClient } from '@supabase/supabase-js';
import { supabase as mockSupabase } from './mockSupabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isLocal = !supabaseUrl || !supabaseAnonKey;

if (isLocal) {
  console.warn(
    '[paybridge] Running in LOCAL MOCK mode — no Supabase credentials found.\n' +
    'Create a .env file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to connect to Supabase.'
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase: any = isLocal
  ? mockSupabase
  : createClient(supabaseUrl!, supabaseAnonKey!);
