import { supabase } from './supabase';
import {
  LegalDocumentType,
  NotificationPreference,
  WorkerBankAccount,
  WorkerBankAccountType,
  WorkerKycSubmission,
  WorkerSecuritySetting,
  WorkerSignedDocument,
} from '../types/database';

type NotificationPreferenceKey = keyof Omit<NotificationPreference, 'id' | 'worker_id'>;

const nowIso = () => new Date().toISOString();

function cleanDigits(value: string) {
  return value.replace(/\D/g, '');
}

function throwIfError(error: any) {
  if (error) throw error;
}

export async function setWorkerOnboardingStep(workerId: string, step: string, completed?: boolean) {
  const updates: Record<string, unknown> = { onboarding_step: step };
  if (completed !== undefined) updates.onboarding_completed = completed;
  const { error } = await supabase.from('worker_profiles').update(updates).eq('id', workerId);
  throwIfError(error);
}

export async function saveWorkerProfile(
  workerId: string,
  data: { full_name: string; phone: string; country: string; avatar_url?: string; address_city?: string },
) {
  const { error } = await supabase
    .from('worker_profiles')
    .update({ ...data, onboarding_step: 'training' })
    .eq('id', workerId);
  throwIfError(error);
}

export async function completeTrainingModules(workerId: string, moduleIds: string[]) {
  const rows = moduleIds.map(moduleId => ({
    worker_id: workerId,
    module_id: moduleId,
    completed: true,
    completed_at: nowIso(),
  }));

  if (rows.length > 0) {
    const { error } = await supabase
      .from('training_progress')
      .upsert(rows, { onConflict: 'worker_id,module_id' });
    throwIfError(error);
  }

  await setWorkerOnboardingStep(workerId, 'quiz');
}

export async function recordQuizAttempt(workerId: string, score: number, passed: boolean) {
  const { error } = await supabase.from('quiz_attempts').insert({
    worker_id: workerId,
    score,
    passed,
    completed_at: nowIso(),
  });
  throwIfError(error);

  if (passed) await setWorkerOnboardingStep(workerId, 'interview');
}

export async function scheduleWorkerInterview(workerId: string, scheduledAt: string, format?: 'video' | 'chat') {
  const { error } = await supabase.from('interview_slots').insert({
    worker_id: workerId,
    scheduled_at: scheduledAt,
    status: 'scheduled',
    notes: format ? `Format: ${format === 'video' ? 'Video Call' : 'Live Chat'}` : null,
  });
  throwIfError(error);
  await setWorkerOnboardingStep(workerId, 'bank');
}

export async function listWorkerBankAccounts(workerId: string): Promise<WorkerBankAccount[]> {
  const { data, error } = await supabase
    .from('worker_bank_accounts')
    .select('*')
    .eq('worker_id', workerId)
    .order('is_primary', { ascending: false })
    .order('created_at', { ascending: false });
  throwIfError(error);
  return (data ?? []) as WorkerBankAccount[];
}

export async function addWorkerBankAccount(input: {
  workerId: string;
  bankName: string;
  accountLabel: string;
  accountType: WorkerBankAccountType;
  accountNumber: string;
  routingNumber: string;
  makePrimary?: boolean;
}) {
  const accountNumber = cleanDigits(input.accountNumber);
  const routingNumber = cleanDigits(input.routingNumber);
  if (accountNumber.length < 4) throw new Error('Enter a valid account number');
  if (routingNumber.length < 4) throw new Error('Enter a valid routing number');

  const current = await listWorkerBankAccounts(input.workerId);
  const makePrimary = input.makePrimary || current.length === 0;

  if (makePrimary && current.length > 0) {
    const { error } = await supabase
      .from('worker_bank_accounts')
      .update({ is_primary: false })
      .eq('worker_id', input.workerId);
    throwIfError(error);
  }

  const { error } = await supabase.from('worker_bank_accounts').insert({
    worker_id: input.workerId,
    bank_name: input.bankName,
    account_label: input.accountLabel.trim() || `${input.bankName} account`,
    account_type: input.accountType,
    account_last4: accountNumber.slice(-4),
    routing_last4: routingNumber.slice(-4),
    is_primary: makePrimary,
    status: 'pending_review',
  });
  throwIfError(error);
}

export async function updateWorkerBankAccount(
  accountId: string,
  workerId: string,
  updates: { bankName: string; accountLabel: string; accountType: WorkerBankAccountType; makePrimary?: boolean },
) {
  if (updates.makePrimary) {
    const { error } = await supabase
      .from('worker_bank_accounts')
      .update({ is_primary: false })
      .eq('worker_id', workerId);
    throwIfError(error);
  }

  const { error } = await supabase
    .from('worker_bank_accounts')
    .update({
      bank_name: updates.bankName,
      account_label: updates.accountLabel.trim(),
      account_type: updates.accountType,
      is_primary: Boolean(updates.makePrimary),
    })
    .eq('id', accountId)
    .eq('worker_id', workerId);
  throwIfError(error);
}

export async function deleteWorkerBankAccount(accountId: string, workerId: string) {
  const accounts = await listWorkerBankAccounts(workerId);
  const deleted = accounts.find(account => account.id === accountId);
  const { error } = await supabase
    .from('worker_bank_accounts')
    .delete()
    .eq('id', accountId)
    .eq('worker_id', workerId);
  throwIfError(error);

  if (deleted?.is_primary) {
    const remaining = accounts.filter(account => account.id !== accountId);
    if (remaining.length > 0 && !remaining.some(account => account.is_primary)) {
      const [nextPrimary] = remaining.sort((a, b) => b.updated_at.localeCompare(a.updated_at));
      const { error: primaryError } = await supabase
        .from('worker_bank_accounts')
        .update({ is_primary: true })
        .eq('id', nextPrimary.id)
        .eq('worker_id', workerId);
      throwIfError(primaryError);
    }
  }
}

export async function getNotificationPreferences(workerId: string): Promise<NotificationPreference | null> {
  const { data, error } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('worker_id', workerId);
  throwIfError(error);

  const existing = ((data ?? []) as NotificationPreference[])[0];
  if (existing) return existing;

  const { error: insertError } = await supabase.from('notification_preferences').insert({ worker_id: workerId });
  throwIfError(insertError);

  const { data: nextData, error: nextError } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('worker_id', workerId);
  throwIfError(nextError);
  return ((nextData ?? []) as NotificationPreference[])[0] ?? null;
}

export async function updateNotificationPreference(workerId: string, key: NotificationPreferenceKey, value: boolean) {
  const { error } = await supabase
    .from('notification_preferences')
    .update({ [key]: value })
    .eq('worker_id', workerId);
  throwIfError(error);
}

export async function getWorkerSecuritySetting(workerId: string): Promise<WorkerSecuritySetting | null> {
  const { data, error } = await supabase
    .from('worker_security_settings')
    .select('*')
    .eq('worker_id', workerId);
  throwIfError(error);

  const existing = ((data ?? []) as WorkerSecuritySetting[])[0];
  if (existing) return existing;

  const { error: insertError } = await supabase.from('worker_security_settings').insert({ worker_id: workerId });
  throwIfError(insertError);

  const { data: nextData, error: nextError } = await supabase
    .from('worker_security_settings')
    .select('*')
    .eq('worker_id', workerId);
  throwIfError(nextError);
  return ((nextData ?? []) as WorkerSecuritySetting[])[0] ?? null;
}

export async function setWorkerTwoFactorEnabled(workerId: string, enabled: boolean) {
  const { error } = await supabase
    .from('worker_security_settings')
    .update({
      two_factor_enabled: enabled,
      two_factor_method: enabled ? 'totp' : null,
      two_factor_enabled_at: enabled ? nowIso() : null,
    })
    .eq('worker_id', workerId);
  throwIfError(error);
}

export async function getLatestKycSubmission(workerId: string): Promise<WorkerKycSubmission | null> {
  const { data, error } = await supabase
    .from('worker_kyc_submissions')
    .select('*')
    .eq('worker_id', workerId)
    .order('submitted_at', { ascending: false });
  throwIfError(error);
  return ((data ?? []) as WorkerKycSubmission[])[0] ?? null;
}

export async function submitWorkerKyc(input: {
  workerId: string;
  idDocumentType: WorkerKycSubmission['id_document_type'];
  idDocumentFile: File;
  taxIdType: WorkerKycSubmission['tax_id_type'];
  taxIdNumber: string;
  storagePath: string;
}) {
  const cleanTaxId = cleanDigits(input.taxIdNumber);
  if (cleanTaxId.length < 4) throw new Error('Enter a valid SSN or tax ID number');

  const { error: submissionError } = await supabase.from('worker_kyc_submissions').insert({
    worker_id: input.workerId,
    id_document_type: input.idDocumentType,
    id_document_file_name: input.idDocumentFile.name,
    id_document_url: input.storagePath,
    tax_id_type: input.taxIdType,
    tax_id_last4: cleanTaxId.slice(-4),
    status: 'submitted',
    review_note: 'Awaiting manual Operations review.',
  });
  throwIfError(submissionError);

  const { error: storageError } = await supabase.from('storage_objects').insert({
    bucket: 'kyc-documents',
    path: input.storagePath,
    owner_id: input.workerId,
    file_name: input.idDocumentFile.name,
    file_type: input.idDocumentFile.type || 'application/octet-stream',
    size: input.idDocumentFile.size,
    entity_type: 'worker_profile',
    entity_id: input.workerId,
  });
  throwIfError(storageError);

  const [{ error: notificationError }, { error: auditError }] = await Promise.all([
    supabase.from('notifications').insert({
      worker_id: input.workerId,
      title: 'KYC received',
      body: 'Your documents have been submitted successfully. Operations will review them before gig access is enabled.',
      href: '/account',
    }),
    supabase.from('audit_events').insert({
      worker_id: input.workerId,
      event_type: 'worker_kyc_submitted',
      entity_type: 'worker_kyc_submission',
      summary: 'Worker submitted ID and tax information for manual review.',
    }),
  ]);
  if (notificationError) console.error('[paybridge] Failed to create KYC submission notification', notificationError);
  if (auditError) console.error('[paybridge] Failed to create KYC submission audit event', auditError);
}

export async function listWorkerSignedDocuments(workerId: string): Promise<WorkerSignedDocument[]> {
  const { data, error } = await supabase
    .from('worker_signed_documents')
    .select('*')
    .eq('worker_id', workerId)
    .order('signed_at', { ascending: false });
  throwIfError(error);
  return (data ?? []) as WorkerSignedDocument[];
}

export async function signWorkerDocument(input: {
  workerId: string;
  documentType: LegalDocumentType;
  signature: string;
  documentVersion?: string;
  w9?: {
    name: string;
    businessName?: string;
    taxClassification: string;
    address: string;
    cityStateZip: string;
    taxIdType: 'ssn' | 'ein';
    taxIdLast4: string;
  };
}) {
  const { error } = await supabase.from('worker_signed_documents').upsert({
    worker_id: input.workerId,
    document_type: input.documentType,
    document_version: input.documentVersion ?? '1.0',
    signed_at: nowIso(),
    signature: input.signature,
    w9_name: input.w9?.name ?? null,
    w9_business_name: input.w9?.businessName ?? null,
    w9_tax_classification: input.w9?.taxClassification ?? null,
    w9_address: input.w9?.address ?? null,
    w9_city_state_zip: input.w9?.cityStateZip ?? null,
    w9_tax_id_type: input.w9?.taxIdType ?? null,
    w9_tax_id_last4: input.w9?.taxIdLast4 ?? null,
  }, { onConflict: 'worker_id,document_type' });
  throwIfError(error);
}
