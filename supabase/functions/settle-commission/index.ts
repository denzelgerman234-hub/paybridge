import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    const { worker_id, gig_id } = await req.json();

    const { data: entries } = await supabase
      .from('commission_ledger')
      .select('id, amount')
      .eq('worker_id', worker_id)
      .eq('gig_id', gig_id)
      .in('status', ['earned', 'pending_settlement']);

    if (!entries || entries.length === 0) {
      return new Response(JSON.stringify({ error: 'No pending commissions found' }), { status: 404 });
    }

    const ids = entries.map(e => e.id);
    const { error } = await supabase
      .from('commission_ledger')
      .update({ status: 'settled', settled_at: new Date().toISOString() })
      .in('id', ids);

    if (error) throw error;

    const totalAmount = entries.reduce((s, e) => s + Number(e.amount), 0);

    return new Response(JSON.stringify({ success: true, total_settled: totalAmount }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
