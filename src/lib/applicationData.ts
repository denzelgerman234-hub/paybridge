/**
 * applicationData.ts
 * Supabase helpers for worker_applications table.
 */
import { supabase } from './supabase';
import type { WorkerApplication, WorkerApplicationStatus } from '../types/database';

// ─── Worker-side ─────────────────────────────────────────────────────────────

/** Fetch the calling user's own application (post-login). */
export async function getMyApplication(): Promise<WorkerApplication | null> {
  const { data, error } = await supabase
    .from('worker_applications')
    .select('*')
    .order('submitted_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('[paybridge] getMyApplication error', error);
    return null;
  }
  return data as WorkerApplication | null;
}

// ─── Admin-side ───────────────────────────────────────────────────────────────

/** List all applications (admin only). Optional status filter. */
export async function listApplications(
  status: WorkerApplicationStatus | 'all' = 'all',
): Promise<WorkerApplication[]> {
  let query = supabase
    .from('worker_applications')
    .select('*')
    .order('submitted_at', { ascending: false });

  if (status !== 'all') {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[paybridge] listApplications error', error);
    return [];
  }
  return (data ?? []) as WorkerApplication[];
}

/**
 * Update a worker application's review status (admin only).
 * Also stamps reviewed_at and the reviewing admin's id.
 */
export async function reviewApplication(
  id: string,
  status: WorkerApplicationStatus,
  notes?: string,
): Promise<{ error: any }> {
  const { data: { session } } = await supabase.auth.getSession();
  const reviewerId = session?.user?.id ?? null;

  const { error } = await supabase
    .from('worker_applications')
    .update({
      status,
      notes: notes ?? null,
      reviewed_at: new Date().toISOString(),
      reviewed_by: reviewerId,
    })
    .eq('id', id);

  if (error) {
    console.error('[paybridge] reviewApplication error', error);
  }
  return { error };
}
