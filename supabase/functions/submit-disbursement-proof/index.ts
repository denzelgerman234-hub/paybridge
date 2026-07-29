import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { json, readJson, requirePost, requireUser, requiredString, serviceClient } from '../_shared/auth.ts';

serve(async (req) => {
  try {
    const methodError = await requirePost(req);
    if (methodError) return methodError;

    const supabase = serviceClient();
    const auth = await requireUser(req, supabase);
    if ('response' in auth) return auth.response;

    const body = await readJson(req);
    const disbursement_id = requiredString(body.disbursement_id, 'disbursement_id');
    const proof_url = requiredString(body.proof_url, 'proof_url');
    const transaction_id = typeof body.transaction_id === 'string' ? body.transaction_id.trim() : null;
    const notes = typeof body.notes === 'string' ? body.notes.trim() : null;

    const { data: disbursement, error: disbursementError } = await supabase
      .from('worker_disbursements')
      .select('id, worker_id, status')
      .eq('id', disbursement_id)
      .maybeSingle();

    if (disbursementError) throw disbursementError;
    if (!disbursement) return json({ error: 'Disbursement not found' }, 404);
    if (disbursement.worker_id !== auth.user.id) return json({ error: 'Not assigned to this disbursement' }, 403);
    if (!['pending', 'failed', 'proof_rejected'].includes(disbursement.status)) {
      return json({ error: 'Proof cannot be submitted for this disbursement state' }, 400);
    }

    const { error: proofError } = await supabase.from('disbursement_proofs').insert({
      disbursement_id,
      worker_id: auth.user.id,
      proof_url,
      transaction_id,
      notes,
    });
    if (proofError) throw proofError;

    const { error: updateError } = await supabase
      .from('worker_disbursements')
      .update({ status: 'sent', proof_url, transaction_id, sent_at: new Date().toISOString() })
      .eq('id', disbursement_id);
    if (updateError) throw updateError;

    return json({ success: true, message: 'Proof submitted' });
  } catch (err) {
    return json({ error: err.message }, err.message?.includes('required') ? 400 : 500);
  }
});