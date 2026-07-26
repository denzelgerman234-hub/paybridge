import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { json, readJson, requirePost, requireUser, requiredString, serviceClient } from '../_shared/auth.ts';

const ACCOUNT_TYPES = new Set(['dedicated', 'shared', 'unknown']);

serve(async (req) => {
  try {
    const methodError = await requirePost(req);
    if (methodError) return methodError;

    const supabase = serviceClient();
    const auth = await requireUser(req, supabase);
    if ('response' in auth) return auth.response;

    const body = await readJson(req);
    const worker_id = auth.user.id;
    const account_type = requiredString(body.account_type, 'account_type');

    if (!ACCOUNT_TYPES.has(account_type)) {
      return json({ error: 'Invalid account type' }, 400);
    }

    const { data: existing } = await supabase
      .from('account_health_checks')
      .select('id')
      .eq('worker_id', worker_id)
      .single();

    if (existing) {
      await supabase
        .from('account_health_checks')
        .update({
          disbursement_account_type: account_type,
          last_verified: new Date().toISOString(),
          next_check: new Date(Date.now() + 7 * 86400000).toISOString(),
        })
        .eq('worker_id', worker_id);
    } else {
      await supabase.from('account_health_checks').insert({
        worker_id,
        disbursement_account_type: account_type,
      });
    }

    return json({ success: true, message: 'Disbursement account linked' });
  } catch (err) {
    return json({ error: err.message }, err.message?.includes('required') ? 400 : 500);
  }
});
