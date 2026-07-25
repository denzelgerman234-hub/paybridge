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
      .select('*')
      .eq('id', gig_id)
      .single();

    if (!gig) return new Response(JSON.stringify({ error: 'Gig not found' }), { status: 404 });
    if (gig.worker_id !== worker_id) return new Response(JSON.stringify({ error: 'Not assigned' }), { status: 403 });

    const { error: gigError } = await supabase
      .from('worker_gigs')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', gig_id);

    if (gigError) throw gigError;

    const commissionAmount = Number(gig.commission_amount);
    await supabase.from('commission_ledger').insert({
      worker_id,
      gig_id,
      amount: commissionAmount,
      status: 'earned',
    });

    const { data: profile } = await supabase
      .from('worker_profiles')
      .select('total_gigs_completed, total_disbursed, total_earned')
      .eq('id', worker_id)
      .single();

    const { data: disbursements } = await supabase
      .from('worker_disbursements')
      .select('amount')
      .eq('gig_id', gig_id);

    const totalDisbursed = (disbursements || []).reduce((s, d) => s + Number(d.amount), 0);

    await supabase
      .from('worker_profiles')
      .update({
        total_gigs_completed: (profile?.total_gigs_completed || 0) + 1,
        total_disbursed: (profile?.total_disbursed || 0) + totalDisbursed,
        total_earned: (profile?.total_earned || 0) + commissionAmount,
      })
      .eq('id', worker_id);

    return new Response(JSON.stringify({ success: true, commission_amount: commissionAmount }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
