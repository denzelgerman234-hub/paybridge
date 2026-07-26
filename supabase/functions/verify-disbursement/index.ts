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
    const disbursement_id = requiredString(body.disbursement_id, 'disbursement_id');
    const transaction_id = typeof body.transaction_id === 'string' ? body.transaction_id.trim() : null;

    const { data: disbursement } = await supabase
      .from('worker_disbursements')
      .select('id, gig_id, worker_id, status')
      .eq('id', disbursement_id)
      .single();

    if (!disbursement) return json({ error: 'Disbursement not found' }, 404);
    if (disbursement.status !== 'sent') {
      return json({ error: 'Only sent disbursements can be verified' }, 400);
    }

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

    return json({ success: true, message: 'Disbursement verified' });
  } catch (err) {
    return json({ error: err.message }, err.message?.includes('required') ? 400 : 500);
  }
});
