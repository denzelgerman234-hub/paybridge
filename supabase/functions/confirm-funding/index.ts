import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    const { event_id } = await req.json();

    const { data: event, error: fetchError } = await supabase
      .from('funding_events')
      .select('*')
      .eq('id', event_id)
      .single();

    if (!event || fetchError) return new Response(JSON.stringify({ error: 'Event not found' }), { status: 404 });

    await supabase
      .from('funding_events')
      .update({ confirmed: true, confirmed_at: new Date().toISOString() })
      .eq('id', event_id);

    const { data: gig } = await supabase
      .from('worker_gigs')
      .select('total_principal')
      .eq('id', event.gig_id)
      .single();

    const { data: totalConfirmed } = await supabase
      .from('funding_events')
      .select('amount')
      .eq('gig_id', event.gig_id)
      .eq('confirmed', true);

    const totalFunded = (totalConfirmed || []).reduce((s, e) => s + Number(e.amount), 0);

    if (totalFunded >= Number(gig?.total_principal || 0)) {
      await supabase
        .from('worker_gigs')
        .update({ funded: true, funded_at: new Date().toISOString(), status: 'funded' })
        .eq('id', event.gig_id);
    }

    return new Response(JSON.stringify({ success: true, total_funded: totalFunded }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
