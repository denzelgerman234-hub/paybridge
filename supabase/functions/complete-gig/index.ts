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

    const { data: gig } = await supabase
      .from('worker_gigs')
      .select('*')
      .eq('id', gig_id)
      .single();

    if (!gig) return json({ error: 'Gig not found' }, 404);
    if (!gig.worker_id) return json({ error: 'Gig is not assigned to a worker' }, 400);
    if (gig.status === 'completed') return json({ error: 'Gig is already completed' }, 400);

    const worker_id = gig.worker_id;

    const { error: gigError } = await supabase
      .from('worker_gigs')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', gig_id);

    if (gigError) throw gigError;

    const commissionAmount = Number(gig.commission_amount);
    await supabase.from('commission_ledger').upsert({
      worker_id,
      gig_id,
      amount: commissionAmount,
      status: 'earned',
    }, {
      onConflict: 'worker_id,gig_id',
      ignoreDuplicates: true,
    });

    const { data: profile } = await supabase
      .from('worker_profiles')
      .select('total_gigs_completed, total_disbursed, total_earned')
      .eq('id', worker_id)
      .single();

    const { data: disbursements } = await supabase
      .from('worker_disbursements')
      .select('amount')
      .eq('gig_id', gig_id);

    const totalDisbursed = (disbursements || []).reduce((s, d) => s + Number(d.amount), 0);

    await supabase
      .from('worker_profiles')
      .update({
        total_gigs_completed: (profile?.total_gigs_completed || 0) + 1,
        total_disbursed: (profile?.total_disbursed || 0) + totalDisbursed,
        total_earned: (profile?.total_earned || 0) + commissionAmount,
      })
      .eq('id', worker_id);

    return json({ success: true, commission_amount: commissionAmount });
  } catch (err) {
    return json({ error: err.message }, err.message?.includes('required') ? 400 : 500);
  }
});
