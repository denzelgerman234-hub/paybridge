import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    const { worker_id, document_id } = await req.json();

    const { data: doc } = await supabase
      .from('worker_documents')
      .select('id, verified')
      .eq('id', document_id)
      .eq('worker_id', worker_id)
      .single();

    if (!doc) return new Response(JSON.stringify({ error: 'Document not found' }), { status: 404 });

    await supabase
      .from('worker_documents')
      .update({ verified: true })
      .eq('id', document_id);

    const { data: allDocs } = await supabase
      .from('worker_documents')
      .select('verified')
      .eq('worker_id', worker_id);

    const allVerified = (allDocs || []).every(d => d.verified);

    if (allVerified) {
      await supabase
        .from('worker_profiles')
        .update({ account_health: 'healthy' })
        .eq('id', worker_id);

      await supabase
        .from('account_health_checks')
        .upsert({
          worker_id,
          last_verified: new Date().toISOString(),
          next_check: new Date(Date.now() + 7 * 86400000).toISOString(),
          status: 'healthy',
        });
    }

    return new Response(JSON.stringify({ success: true, identity_verified: allVerified }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
