import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { json, readJson, requirePost, requireUser, requiredPositiveNumber, requiredString, serviceClient } from '../_shared/auth.ts';

const PAYOUT_METHODS = new Set(['paypal', 'bank_transfer', 'zelle', 'cashapp', 'wire']);

serve(async (req) => {
  try {
    const methodError = await requirePost(req);
    if (methodError) return methodError;

    const supabase = serviceClient();
    const auth = await requireUser(req, supabase);
    if ('response' in auth) return auth.response;

    const body = await readJson(req);
    const worker_id = auth.user.id;
    const amount = requiredPositiveNumber(body.amount, 'amount');
    const method = requiredString(body.method, 'method');
    const destination = requiredString(body.destination, 'destination');

    if (!PAYOUT_METHODS.has(method)) {
      return json({ error: 'Invalid payout method' }, 400);
    }

    const { data: ledger } = await supabase
      .from('commission_ledger')
      .select('amount')
      .eq('worker_id', worker_id)
      .in('status', ['settled']);

    const { data: payouts } = await supabase
      .from('commission_payouts')
      .select('amount')
      .eq('worker_id', worker_id)
      .in('status', ['pending', 'processing', 'completed']);

    const settled = (ledger || []).reduce((s, l) => s + Number(l.amount), 0);
    const alreadyRequested = (payouts || []).reduce((s, p) => s + Number(p.amount), 0);
    const available = settled - alreadyRequested;

    if (available < amount) {
      return json({ error: 'Insufficient balance' }, 400);
    }

    const reference = `PAY-${Date.now()}-${worker_id.slice(0, 8)}`;

    const { error: payoutError } = await supabase.from('commission_payouts').insert({
      worker_id,
      amount,
      method,
      destination,
      reference,
    });

    if (payoutError) throw payoutError;

    return json({ success: true, reference });
  } catch (err) {
    return json({ error: err.message }, err.message?.includes('required') ? 400 : 500);
  }
});
