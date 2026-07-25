import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    const { worker_id } = await req.json();

    const { data: profile } = await supabase
      .from('worker_profiles')
      .select('id, account_health')
      .eq('id', worker_id)
      .single();

    if (!profile) return new Response(JSON.stringify({ error: 'Worker not found' }), { status: 404 });

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

    return new Response(JSON.stringify({ status, healthCheck }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
