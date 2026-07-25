import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    const { worker_id, amount, method, destination } = await req.json();

    const { data: ledger } = await supabase
      .from('commission_ledger')
      .select('amount')
      .eq('worker_id', worker_id)
      .in('status', ['settled']);

    const available = (ledger || []).reduce((s, l) => s + Number(l.amount), 0);

    if (available < amount) {
      return new Response(JSON.stringify({ error: 'Insufficient balance' }), { status: 400 });
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

    return new Response(JSON.stringify({ success: true, reference }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
