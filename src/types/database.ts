export type BadgeTier = 'trainee' | 'associate' | 'senior' | 'expert' | 'master';

export type DisbursementStatus = 'pending' | 'sent' | 'verified' | 'failed' | 'proof_rejected';

export type OnboardingStep = 'profile' | 'training' | 'quiz' | 'interview' | 'bank' | 'payout';

export type PayoutMethod = 'paypal' | 'bank_transfer' | 'zelle' | 'cashapp' | 'wire';

export type GigStatus = 'open' | 'accepted' | 'funded' | 'in_progress' | 'completed' | 'cancelled';

export type FundingStatus =
  | 'unfunded'
  | 'funding_pending'
  | 'funded'
  | 'funding_confirmed'
  | 'disbursement_in_progress'
  | 'awaiting_verification'
  | 'verified_complete'
  | 'settled'
  | 'funding_failed'
  | 'disbursement_failed'
  | 'proof_rejected'
  | 'compliance_hold'
  | 'disputed'
  | 'suspended';

export type AccountHealthStatus = 'healthy' | 'warning' | 'flagged' | 'suspended';

export type GigApplicationStatus = 'submitted' | 'under_review' | 'accepted' | 'declined';

export interface WorkerProfile {
  id: string;
  full_name: string;
  phone: string;
  country: string;
  avatar_url: string | null;
  badge: BadgeTier;
  total_gigs_completed: number;
  total_disbursed: number;
  total_earned: number;
  rating: number;
  onboarding_step: OnboardingStep;
  onboarding_completed: boolean;
  account_health: AccountHealthStatus;
  kyc_status?: 'not_started' | 'submitted' | 'in_review' | 'verified' | 'rejected';
  address_line1?: string | null;
  address_city?: string | null;
  address_state?: string | null;
  address_zip?: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkerGig {
  id: string;
  worker_id: string | null;
  client_name: string;
  client_contact: string | null;
  total_principal: number;
  commission_rate: number;
  commission_amount: number;
  recipient_count: number;
  disbursement_methods: string[];
  badge_required: BadgeTier | null;
  status: GigStatus;
  deadline: string;
  accepted_at: string | null;
  funded_at: string | null;
  completed_at: string | null;
  funded: boolean;
  funding_status?: FundingStatus;
  operations_specialist?: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface GigApplication {
  id: string;
  gig_id: string;
  worker_id: string;
  worker_name: string;
  status: GigApplicationStatus;
  note: string;
  review_note: string | null;
  reviewed_by: string | null;
  submitted_at: string;
  reviewed_at: string | null;
  updated_at: string;
}

export interface WorkerDisbursement {
  id: string;
  gig_id: string;
  worker_id: string;
  recipient_name: string;
  amount: number;
  method: string;
  destination: string;
  status: DisbursementStatus;
  transaction_id: string | null;
  proof_url: string | null;
  proof_file_name?: string | null;
  notes: string | null;
  sent_at: string | null;
  verified_at: string | null;
  created_at: string;
}

export interface OperationThread {
  id: string;
  gig_id: string;
  worker_id: string;
  specialist_name: string;
  status: 'open' | 'closed';
  created_at: string;
  updated_at: string;
}

export interface OperationMessage {
  id: string;
  thread_id: string;
  sender_role: 'worker' | 'operations' | 'system';
  sender_name: string;
  body: string;
  created_at: string;
}

export interface LocalNotification {
  id: string;
  worker_id: string;
  title: string;
  body: string;
  href: string;
  read: boolean;
  cleared_at?: string | null;
  created_at: string;
}

export interface AdminNotification {
  id: string;
  title: string;
  body: string;
  href: string;
  read: boolean;
  created_at: string;
}

export interface SupportTicket {
  id: string;
  worker_id: string;
  subject: string;
  message: string;
  type: 'general' | 'incident';
  status: 'open' | 'in_progress' | 'resolved';
  priority: 'normal' | 'urgent';
  related_gig_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface SupportChatThread {
  id: string;
  worker_id: string;
  status: 'open' | 'closed';
  unread_for_admin: boolean;
  unread_for_worker: boolean;
  created_at: string;
  updated_at: string;
}

/** A single file attachment stored in the chat-attachments bucket. */
export interface ChatAttachment {
  url: string;
  name: string;
  type: string; // MIME type e.g. "image/png"
}

export interface SupportChatMessage {
  id: string;
  thread_id: string;
  sender_role: 'worker' | 'support';
  sender_name: string;
  body: string;
  /** Uploaded file attachments. Empty array when there are none. */
  attachments: ChatAttachment[];
  created_at: string;
}

export interface LocalAuditEvent {
  id: string;
  worker_id?: string | null;
  event_type: string;
  entity_type: string;
  entity_id?: string | null;
  summary: string;
  created_at: string;
}

export interface StorageObjectRecord {
  id: string;
  bucket: 'kyc-documents' | 'transaction-proofs' | 'account-documents';
  path: string;
  owner_id: string;
  file_name: string;
  file_type: string;
  size: number;
  entity_type: 'worker_profile' | 'worker_disbursement' | 'worker_gig';
  entity_id: string;
  created_at: string;
}

export type KycStatus = 'not_started' | 'submitted' | 'in_review' | 'verified' | 'rejected';

export interface WorkerKycSubmission {
  id: string;
  worker_id: string;
  id_document_type: 'id_card' | 'drivers_license' | 'passport' | 'state_id';
  id_document_file_name: string;
  id_document_url: string | null;
  tax_id_type: 'ssn' | 'itin' | 'ein';
  tax_id_last4: string;
  status: KycStatus;
  submitted_at: string;
  reviewed_at: string | null;
  review_note: string | null;
}

export interface WorkerSecuritySetting {
  id: string;
  worker_id: string;
  two_factor_enabled: boolean;
  two_factor_method: 'totp' | null;
  two_factor_enabled_at: string | null;
  updated_at: string;
}

export type WorkerBankAccountType = 'checking' | 'savings' | 'business_checking';
export type WorkerBankAccountStatus = 'pending_review' | 'verified' | 'needs_attention';

export interface WorkerBankAccount {
  id: string;
  worker_id: string;
  bank_name: string;
  account_label: string;
  account_type: WorkerBankAccountType;
  account_last4: string;
  routing_last4: string;
  is_primary: boolean;
  status: WorkerBankAccountStatus;
  created_at: string;
  updated_at: string;
}

export interface CommissionLedger {
  id: string;
  worker_id: string;
  gig_id: string;
  amount: number;
  status: 'earned' | 'pending_settlement' | 'settled' | 'withdrawn';
  settled_at: string | null;
  created_at: string;
}

export interface CommissionPayout {
  id: string;
  worker_id: string;
  amount: number;
  method: PayoutMethod;
  destination: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  reference: string | null;
  requested_at: string;
  processed_at: string | null;
}

export interface FundingEvent {
  id: string;
  gig_id: string;
  worker_id: string;
  amount: number;
  type: 'deposit' | 'withdrawal' | 'refund';
  reference: string;
  confirmed: boolean;
  confirmed_at: string | null;
  created_at: string;
}

export interface QuizAttempt {
  id: string;
  worker_id: string;
  score: number;
  passed: boolean;
  completed_at: string;
}

export interface TrainingProgress {
  id: string;
  worker_id: string;
  module_id: string;
  completed: boolean;
  completed_at: string | null;
}

export interface InterviewSlot {
  id: string;
  worker_id: string;
  scheduled_at: string;
  status: 'scheduled' | 'live' | 'completed' | 'cancelled' | 'no_show';
  passed: boolean | null;
  format: 'chat';
  rejection_reason: string | null;
  notes: string | null;
  access_token?: string | null;
  created_at: string;
}

export interface InterviewMessage {
  id: string;
  slot_id: string;
  sender_role: 'worker' | 'admin';
  sender_name: string;
  body: string;
  created_at: string;
}

export interface NotificationPreference {
  id: string;
  worker_id: string;
  email_new_gig: boolean;
  email_disbursement: boolean;
  email_fee_record: boolean;
  email_compliance: boolean;
  sms_disbursement: boolean;
  push_new_gig: boolean;
  push_disbursement: boolean;
}

export type NotificationDeliveryChannel = 'email' | 'sms';
export type NotificationDeliveryStatus = 'queued' | 'sent' | 'failed' | 'skipped';

export interface NotificationDeliveryEvent {
  id: string;
  worker_id: string;
  channel: NotificationDeliveryChannel;
  preference_key: keyof Omit<NotificationPreference, 'id' | 'worker_id'>;
  title: string;
  body: string;
  href: string | null;
  status: NotificationDeliveryStatus;
  provider_message_id: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export type LegalDocumentType =
  | 'worker_agreement'
  | 'irs_w9'
  | 'aml_acknowledgment'
  | 'ofac_compliance'
  | 'code_of_conduct';

export interface WorkerSignedDocument {
  id: string;
  worker_id: string;
  document_type: LegalDocumentType;
  document_version: string;
  signed_at: string;
  /** Typed full name used as electronic signature */
  signature: string;
  /** W-9 specific - null for non-W9 documents */
  w9_name?: string | null;
  w9_business_name?: string | null;
  w9_tax_classification?: string | null;
  w9_address?: string | null;
  w9_city_state_zip?: string | null;
  w9_tax_id_type?: 'ssn' | 'ein' | null;
  w9_tax_id_last4?: string | null;
}

export type WorkerApplicationStatus = 'pending' | 'in_review' | 'approved' | 'rejected';

export interface WorkerApplication {
  id: string;
  worker_id: string | null;
  full_name: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  occupation: string;
  why: string;
  bank: string;
  methods: string[];
  status: WorkerApplicationStatus;
  submitted_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}
