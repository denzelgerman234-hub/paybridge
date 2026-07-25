import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    const { worker_id, account_type } = await req.json();

    const { data: existing } = await supabase
      .from('account_health_checks')
      .select('id')
      .eq('worker_id', worker_id)
      .single();

    if (existing) {
      await supabase
        .from('account_health_checks')
        .update({
          disbursement_account_type: account_type,
          last_verified: new Date().toISOString(),
          next_check: new Date(Date.now() + 7 * 86400000).toISOString(),
        })
        .eq('worker_id', worker_id);
    } else {
      await supabase.from('account_health_checks').insert({
        worker_id,
        disbursement_account_type: account_type,
      });
    }

    return new Response(JSON.stringify({ success: true, message: 'Disbursement account linked' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
