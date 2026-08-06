import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { json, readJson, requireAdmin, requirePost, requiredPositiveNumber, requiredString, serviceClient } from '../_shared/auth.ts';

serve(async (req) => {
  try {
    const methodError = await requirePost(req);
    if (methodError) return methodError;

    const supabase = serviceClient();
    const auth = await requireAdmin(req, supabase);
    if ('response' in auth) return auth.response;

    const body = await readJson(req);
    const gig_id = requiredString(body.gig_id, 'gig_id');
    const amount = requiredPositiveNumber(body.amount, 'amount');
    const reference = requiredString(body.reference, 'reference');

    const { data: gig } = await supabase
      .from('worker_gigs')
      .select('id, worker_id, total_principal, status')
      .eq('id', gig_id)
      .single();

    if (!gig) return json({ error: 'Gig not found' }, 404);
    if (!gig.worker_id) return json({ error: 'Gig is not assigned to a worker' }, 400);
    if (!['accepted', 'funded', 'in_progress'].includes(gig.status)) {
      return json({ error: 'Gig cannot be funded in this state' }, 400);
    }

    const { error: eventError } = await supabase.from('funding_events').insert({
      gig_id,
      worker_id: gig.worker_id,
      amount,
      type: 'deposit',
      reference,
      confirmed: false,
    });

    if (eventError) throw eventError;

    // Send a system message to the operations room
    const { data: thread } = await supabase
      .from('operation_threads')
      .select('id')
      .eq('gig_id', gig_id)
      .maybeSingle();
      
    if (thread) {
      await supabase.from('operation_messages').insert({
        thread_id: thread.id,
        sender_role: 'operations',
        sender_name: 'System',
        body: `Funding of ${amount} has been deposited to the dedicated account. Worker, please confirm receipt of funds.`,
      });
    }

    return json({ success: true, message: 'Funding event recorded, pending confirmation' });
  } catch (err) {
    return json({ error: err.message }, err.message?.includes('required') ? 400 : 500);
  }
});
