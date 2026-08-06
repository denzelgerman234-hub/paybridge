import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type AppUser = {
  id: string;
  app_metadata?: Record<string, unknown>;
};

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

export function errorJson(err: unknown) {
  const message = err instanceof Error ? err.message : 'Internal server error';
  const status = message.includes('required') || message.includes('must be') || message.includes('Invalid JSON') ? 400 : 500;
  return json({ error: message }, status);
}

export function serviceClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
}

export async function requirePost(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }
  return null;
}

export async function requireUser(req: Request, supabase = serviceClient()): Promise<{ user: AppUser } | { response: Response }> {
  const authHeader = req.headers.get('Authorization') ?? '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();

  if (!token) {
    return { response: json({ error: 'Missing authorization token' }, 401) };
  }

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    return { response: json({ error: 'Invalid authorization token' }, 401) };
  }

  return { user: data.user as AppUser };
}

export async function requireAdmin(req: Request, supabase = serviceClient()): Promise<{ user: AppUser } | { response: Response }> {
  const result = await requireUser(req, supabase);
  if ('response' in result) return result;

  if (!isAdmin(result.user)) {
    return { response: json({ error: 'Admin access required' }, 403) };
  }

  return result;
}

export function isAdmin(user: AppUser) {
  const metadata = user.app_metadata ?? {};
  return metadata.role === 'admin' || metadata.admin === true;
}

export async function readJson(req: Request) {
  try {
    return await req.json();
  } catch {
    throw new Error('Invalid JSON body');
  }
}

export function requiredString(value: unknown, name: string) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${name} is required`);
  }
  return value.trim();
}

export function requiredPositiveNumber(value: unknown, name: string) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue) || numberValue <= 0) {
    throw new Error(`${name} must be greater than zero`);
  }
  return numberValue;
}
