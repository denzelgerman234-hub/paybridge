import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    const { disbursement_id, transaction_id } = await req.json();

    const { data: disbursement } = await supabase
      .from('worker_disbursements')
      .select('id, gig_id, worker_id, status')
      .eq('id', disbursement_id)
      .single();

    if (!disbursement) return new Response(JSON.stringify({ error: 'Disbursement not found' }), { status: 404 });

    await supabase
      .from('worker_disbursements')
      .update({
        status: 'verified',
        transaction_id: transaction_id || null,
        verified_at: new Date().toISOString(),
      })
      .eq('id', disbursement_id);

    const { data: allDisbursements } = await supabase
      .from('worker_disbursements')
      .select('status')
      .eq('gig_id', disbursement.gig_id);

    const allVerified = (allDisbursements || []).every(d => d.status === 'verified');

    if (allVerified) {
      await supabase
        .from('worker_gigs')
        .update({ status: 'in_progress' })
        .eq('id', disbursement.gig_id);
    }

    return new Response(JSON.stringify({ success: true, message: 'Disbursement verified' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
