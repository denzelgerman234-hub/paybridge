import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    const { gig_id, worker_id } = await req.json();

    const { data: gig } = await supabase
      .from('worker_gigs')
      .select('total_principal, funded, status')
      .eq('id', gig_id)
      .single();

    if (!gig) return new Response(JSON.stringify({ error: 'Gig not found' }), { status: 404 });
    if (!gig.funded) return new Response(JSON.stringify({ error: 'Gig not fully funded' }), { status: 400 });

    const { data: disbursements } = await supabase
      .from('worker_disbursements')
      .select('amount, status')
      .eq('gig_id', gig_id);

    const totalDisbursed = (disbursements || []).reduce((s, d) => s + Number(d.amount), 0);
    const allVerified = (disbursements || []).every(d => d.status === 'verified');

    if (!allVerified) {
      return new Response(JSON.stringify({ error: 'Not all disbursements verified' }), { status: 400 });
    }

    const refund = Number(gig.total_principal) - totalDisbursed;

    if (refund > 0) {
      await supabase.from('funding_events').insert({
        gig_id,
        worker_id,
        amount: refund,
        type: 'refund',
        reference: `REFUND-${gig_id.slice(0, 8)}`,
        confirmed: true,
        confirmed_at: new Date().toISOString(),
      });
    }

    await supabase
      .from('worker_gigs')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', gig_id);

    return new Response(JSON.stringify({ success: true, total_disbursed: totalDisbursed, refund }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
