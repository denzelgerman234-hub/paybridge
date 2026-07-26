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
    const event_id = requiredString(body.event_id, 'event_id');

    const { data: event, error: fetchError } = await supabase
      .from('funding_events')
      .select('*')
      .eq('id', event_id)
      .single();

    if (!event || fetchError) return json({ error: 'Event not found' }, 404);
    if (event.confirmed) return json({ error: 'Funding event is already confirmed' }, 400);
    if (event.type !== 'deposit') return json({ error: 'Only deposit events can be confirmed' }, 400);

    await supabase
      .from('funding_events')
      .update({ confirmed: true, confirmed_at: new Date().toISOString() })
      .eq('id', event_id);

    const { data: gig } = await supabase
      .from('worker_gigs')
      .select('total_principal')
      .eq('id', event.gig_id)
      .single();

    const { data: totalConfirmed } = await supabase
      .from('funding_events')
      .select('amount')
      .eq('gig_id', event.gig_id)
      .eq('confirmed', true);

    const totalFunded = (totalConfirmed || []).reduce((s, e) => s + Number(e.amount), 0);

    if (totalFunded >= Number(gig?.total_principal || 0)) {
      await supabase
        .from('worker_gigs')
        .update({ funded: true, funded_at: new Date().toISOString(), status: 'funded' })
        .eq('id', event.gig_id);
    }

    return json({ success: true, total_funded: totalFunded });
  } catch (err) {
    return json({ error: err.message }, err.message?.includes('required') ? 400 : 500);
  }
});
