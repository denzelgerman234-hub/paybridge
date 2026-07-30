import { supabase } from './supabase';
import { KycStatus, WorkerKycSubmission, WorkerProfile } from '../types/database';

type ReviewStatus = Extract<KycStatus, 'in_review' | 'verified' | 'rejected'>;

type KycWorkerSummary = Pick<WorkerProfile, 'id' | 'full_name' | 'phone' | 'country' | 'kyc_status'>;

export interface AdminKycReviewSubmission extends WorkerKycSubmission {
  worker: KycWorkerSummary | null;
  document_signed_url: string | null;
}

function throwIfError(error: any) {
  if (error) throw error;
}

async function createKycDocumentUrl(path: string | null) {
  if (!path) return null;

  const { data, error } = await supabase
    .storage
    .from('kyc-documents')
    .createSignedUrl(path, 10 * 60);

  if (error) return null;
  return data?.signedUrl ?? null;
}

export async function listAdminKycSubmissions(): Promise<AdminKycReviewSubmission[]> {
  const [{ data: submissions, error: submissionsError }, { data: profiles, error: profilesError }] = await Promise.all([
    supabase
      .from('worker_kyc_submissions')
      .select('*')
      .order('submitted_at', { ascending: false }),
    supabase
      .from('worker_profiles')
      .select('id,full_name,phone,country,kyc_status'),
  ]);

  throwIfError(submissionsError);
  throwIfError(profilesError);

  const workerById = new Map(
    ((profiles ?? []) as KycWorkerSummary[]).map(worker => [worker.id, worker]),
  );

  return Promise.all(
    ((submissions ?? []) as WorkerKycSubmission[]).map(async submission => ({
      ...submission,
      worker: workerById.get(submission.worker_id) ?? null,
      document_signed_url: await createKycDocumentUrl(submission.id_document_url),
    })),
  );
}

export async function reviewAdminKycSubmission(
  submissionId: string,
  status: ReviewStatus,
  reviewNote: string,
) {
  const { data, error } = await supabase
    .from('worker_kyc_submissions')
    .update({
      status,
      reviewed_at: new Date().toISOString(),
      review_note: reviewNote,
    })
    .eq('id', submissionId)
    .select('id,worker_id')
    .single();

  throwIfError(error);
  if (!data) throw new Error('KYC submission was not updated. Check admin permissions.');

  const title = status === 'verified' ? 'KYC approved' : status === 'rejected' ? 'KYC needs updates' : 'KYC under review';
  const body = status === 'verified'
    ? 'Your KYC has been approved. You are eligible to receive gig assignments and payouts.'
    : status === 'rejected'
      ? `${reviewNote} Please upload the corrected documents from Account > KYC.`
      : 'Operations has started reviewing your KYC package. We will notify you when a decision is made.';

  const [{ error: notificationError }, { error: auditError }] = await Promise.all([
    supabase.from('notifications').insert({
      worker_id: data.worker_id,
      title,
      body,
      href: '/account',
    }),
    supabase.from('audit_events').insert({
      worker_id: data.worker_id,
      event_type: `worker_kyc_${status}`,
      entity_type: 'worker_kyc_submission',
      entity_id: data.id,
      summary: `Operations marked worker KYC as ${status.replace('_', ' ')}.`,
    }),
  ]);
  if (notificationError) console.error('[paybridge] Failed to create KYC review notification', notificationError);
  if (auditError) console.error('[paybridge] Failed to create KYC review audit event', auditError);
}
