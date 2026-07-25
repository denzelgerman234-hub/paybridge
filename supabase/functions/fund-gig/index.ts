import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    const { gig_id, worker_id, amount, reference } = await req.json();

    const { error: eventError } = await supabase.from('funding_events').insert({
      gig_id,
      worker_id,
      amount,
      type: 'deposit',
      reference,
      confirmed: false,
    });

    if (eventError) throw eventError;

    return new Response(JSON.stringify({ success: true, message: 'Funding event recorded, pending confirmation' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
