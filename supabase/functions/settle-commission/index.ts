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

    const { data: entries } = await supabase
      .from('commission_ledger')
      .select('id, amount, worker_id')
      .eq('gig_id', gig_id)
      .in('status', ['earned', 'pending_settlement']);

    if (!entries || entries.length === 0) {
      return json({ error: 'No pending commissions found' }, 404);
    }

    const ids = entries.map(e => e.id);
    const { error } = await supabase
      .from('commission_ledger')
      .update({ status: 'settled', settled_at: new Date().toISOString() })
      .in('id', ids);

    if (error) throw error;

    const totalAmount = entries.reduce((s, e) => s + Number(e.amount), 0);

    return json({ success: true, total_settled: totalAmount });
  } catch (err) {
    return json({ error: err.message }, err.message?.includes('required') ? 400 : 500);
  }
});
