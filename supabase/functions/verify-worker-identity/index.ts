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
    const worker_id = requiredString(body.worker_id, 'worker_id');
    const document_id = requiredString(body.document_id, 'document_id');

    const { data: doc } = await supabase
      .from('worker_documents')
      .select('id, verified')
      .eq('id', document_id)
      .eq('worker_id', worker_id)
      .single();

    if (!doc) return json({ error: 'Document not found' }, 404);
    if (doc.verified) return json({ error: 'Document is already verified' }, 400);

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

    return json({ success: true, identity_verified: allVerified });
  } catch (err) {
    return json({ error: err.message }, err.message?.includes('required') ? 400 : 500);
  }
});
