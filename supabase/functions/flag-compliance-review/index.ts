import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    const { worker_id, action, reason, notes } = await req.json();

    const { error: reviewError } = await supabase.from('compliance_reviews').insert({
      worker_id,
      action,
      reason,
      notes,
    });

    if (reviewError) throw reviewError;

    let accountHealth = 'healthy';
    if (action === 'warning') accountHealth = 'warning';
    else if (action === 'flag') accountHealth = 'flagged';
    else if (action === 'suspension' || action === 'termination') accountHealth = 'suspended';

    await supabase
      .from('worker_profiles')
      .update({ account_health: accountHealth })
      .eq('id', worker_id);

    return new Response(JSON.stringify({ success: true, account_health: accountHealth }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
