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
    const gig_id = requiredString(body.gig_id, 'gig_id');

    const { data: gig, error: gigError } = await supabase
      .from('worker_gigs')
      .select('id, worker_id, funded, funding_status')
      .eq('id', gig_id)
      .maybeSingle();

    if (gigError) throw gigError;
    if (!gig) return json({ error: 'Gig not found' }, 404);
    if (gig.worker_id !== auth.user.id) return json({ error: 'Not assigned to this gig' }, 403);
    if (!gig.funded || gig.funding_status !== 'funded') {
      return json({ error: 'Funding is not ready to confirm' }, 400);
    }

    const { error } = await supabase
      .from('worker_gigs')
      .update({ funding_status: 'funding_confirmed', status: 'in_progress' })
      .eq('id', gig_id);

    if (error) throw error;

    return json({ success: true, message: 'Funding confirmed' });
  } catch (err) {
    return json({ error: err.message }, err.message?.includes('required') ? 400 : 500);
  }
});