import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { json, readJson, requireAdmin, requirePost, requiredString, serviceClient } from '../_shared/auth.ts';

serve(async (req) => {
  try {
    const methodError = await requirePost(req);
    if (methodError) return methodError;

    const supabase = serviceClient();
    const auth = await requireAdmin(req, supabase);
    if ('response' in auth) return auth.response;

    const body = await readJson(req);
    const worker_id = requiredString(body.worker_id, 'worker_id');

    const { data: profile } = await supabase
      .from('worker_profiles')
      .select('id, account_health')
      .eq('id', worker_id)
      .single();

    if (!profile) return json({ error: 'Worker not found' }, 404);

    const { data: healthCheck } = await supabase
      .from('account_health_checks')
      .select('*')
      .eq('worker_id', worker_id)
      .single();

    let status = 'healthy';
    if (healthCheck?.status === 'warning' || healthCheck?.status === 'flagged') {
      status = healthCheck.status;
    }

    await supabase
      .from('worker_profiles')
      .update({ account_health: status })
      .eq('id', worker_id);

    return json({ status, healthCheck });
  } catch (err) {
    return json({ error: err.message }, err.message?.includes('required') ? 400 : 500);
  }
});
