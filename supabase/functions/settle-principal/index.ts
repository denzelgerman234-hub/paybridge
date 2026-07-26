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
    const gig_id = requiredString(body.gig_id, 'gig_id');

    const { data: gig } = await supabase
      .from('worker_gigs')
      .select('total_principal, funded, status, worker_id')
      .eq('id', gig_id)
      .single();

    if (!gig) return json({ error: 'Gig not found' }, 404);
    if (!gig.worker_id) return json({ error: 'Gig is not assigned to a worker' }, 400);
    if (!gig.funded) return json({ error: 'Gig not fully funded' }, 400);

    const worker_id = gig.worker_id;

    const { data: disbursements } = await supabase
      .from('worker_disbursements')
      .select('amount, status')
      .eq('gig_id', gig_id);

    const totalDisbursed = (disbursements || []).reduce((s, d) => s + Number(d.amount), 0);
    const allVerified = (disbursements || []).every(d => d.status === 'verified');

    if (!allVerified) {
      return json({ error: 'Not all disbursements verified' }, 400);
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

    return json({ success: true, total_disbursed: totalDisbursed, refund });
  } catch (err) {
    return json({ error: err.message }, err.message?.includes('required') ? 400 : 500);
  }
});
