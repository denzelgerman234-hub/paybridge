import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    const { disbursement_id, worker_id, proof_url } = await req.json();

    const { data: disbursement } = await supabase
      .from('worker_disbursements')
      .select('id, status')
      .eq('id', disbursement_id)
      .single();

    if (!disbursement) return new Response(JSON.stringify({ error: 'Disbursement not found' }), { status: 404 });

    await supabase.from('disbursement_proofs').insert({
      disbursement_id,
      proof_url,
      uploaded_by: worker_id,
    });

    await supabase
      .from('worker_disbursements')
      .update({ status: 'sent', proof_url, sent_at: new Date().toISOString() })
      .eq('id', disbursement_id);

    return new Response(JSON.stringify({ success: true, message: 'Proof submitted' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
