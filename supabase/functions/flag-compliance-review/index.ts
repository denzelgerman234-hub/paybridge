import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { json, readJson, requireAdmin, requirePost, requiredString, serviceClient } from '../_shared/auth.ts';

const COMPLIANCE_ACTIONS = new Set(['warning', 'flag', 'suspension', 'termination', 'clearance']);

serve(async (req) => {
  try {
    const methodError = await requirePost(req);
    if (methodError) return methodError;

    const supabase = serviceClient();
    const auth = await requireAdmin(req, supabase);
    if ('response' in auth) return auth.response;

    const body = await readJson(req);
    const worker_id = requiredString(body.worker_id, 'worker_id');
    const action = requiredString(body.action, 'action');
    const reason = requiredString(body.reason, 'reason');
    const notes = typeof body.notes === 'string' ? body.notes.trim() : null;

    if (!COMPLIANCE_ACTIONS.has(action)) {
      return json({ error: 'Invalid compliance action' }, 400);
    }

    const { error: reviewError } = await supabase.from('compliance_reviews').insert({
      worker_id,
      action,
      reason,
      notes,
      reviewed_by: auth.user.id,
    });

    if (reviewError) throw reviewError;

    let accountHealth = 'healthy';
    if (action === 'warning') accountHealth = 'warning';
    else if (action === 'flag') accountHealth = 'flagged';
    else if (action === 'suspension' || action === 'termination') accountHealth = 'suspended';

    await supabase
      .from('worker_profiles')
      .update({ account_health: accountHealth })
      .eq('id', worker_id);

    return json({ success: true, account_health: accountHealth });
  } catch (err) {
    return json({ error: err.message }, err.message?.includes('required') ? 400 : 500);
  }
});
