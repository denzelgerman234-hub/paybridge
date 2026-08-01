import {
  AccountHealthStatus,
  BadgeTier,
  DisbursementStatus,
  GigApplication,
  GigApplicationStatus,
  WorkerApplication,
  WorkerApplicationStatus,
  GigStatus,
  LegalDocumentType,
  LocalAuditEvent,
  LocalNotification,
  NotificationPreference,
  OperationMessage,
  OperationThread,
  CommissionLedger,
  FundingEvent,
  StorageObjectRecord,
  WorkerKycSubmission,
  WorkerBankAccount,
  WorkerSecuritySetting,
  WorkerSignedDocument,
  WorkerDisbursement,
  WorkerGig,
  AdminNotification,
  SupportChatMessage,
  SupportChatThread,
  SupportTicket,
  WorkerProfile,
} from '../types/database';
import { MOCK_USER_ID } from './mockData';

const STORAGE_KEY = 'paybridge.local.operational.v1';
const DB_CHANGE_EVENT = 'paybridge-local-db-change';
const KYC_REMINDER_HOURS = 12;

const now = () => new Date().toISOString();
const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 3600 * 1000).toISOString();
const daysAhead = (n: number) => new Date(Date.now() + n * 24 * 3600 * 1000).toISOString();
const id = (prefix: string) => `${prefix}-${crypto.randomUUID()}`;
const BADGE_ORDER: BadgeTier[] = ['trainee', 'associate', 'senior', 'expert', 'master'];

type CreateGigBeneficiary = Pick<WorkerDisbursement, 'recipient_name' | 'amount' | 'method' | 'destination'>;
type CreateGigInput = Omit<WorkerGig, 'id' | 'worker_id' | 'commission_amount' | 'status' | 'accepted_at' | 'funded_at' | 'completed_at' | 'funded' | 'funding_status' | 'operations_specialist' | 'created_at' | 'updated_at'> & {
  beneficiaries?: CreateGigBeneficiary[];
};

type WorkerApplicationInput = Omit<WorkerApplication, 'id' | 'worker_id' | 'status' | 'submitted_at' | 'reviewed_at' | 'reviewed_by'> & {
  worker_id?: string | null;
};

export interface LocalWorkerSummary {
  id: string;
  full_name: string;
  email: string;
  badge: BadgeTier;
  account_health: AccountHealthStatus;
  onboarding_completed: boolean;
}

interface LocalDbState {
  schema_version: number;
  workers: LocalWorkerSummary[];
  worker_applications: WorkerApplication[];
  gigs: WorkerGig[];
  gig_applications: GigApplication[];
  worker_disbursements: WorkerDisbursement[];
  operation_threads: OperationThread[];
  operation_messages: OperationMessage[];
  notifications: LocalNotification[];
  notification_preferences: NotificationPreference[];
  audit_events: LocalAuditEvent[];
  commission_ledger: CommissionLedger[];
  funding_events: FundingEvent[];
  storage_objects: StorageObjectRecord[];
  kyc_submissions: WorkerKycSubmission[];
  bank_accounts: WorkerBankAccount[];
  security_settings: WorkerSecuritySetting[];
  signed_documents: WorkerSignedDocument[];
  admin_notifications: AdminNotification[];
  support_tickets: SupportTicket[];
  support_chat_threads: SupportChatThread[];
  support_chat_messages: SupportChatMessage[];
}

const workers: LocalWorkerSummary[] = [
  {
    id: MOCK_USER_ID,
    full_name: 'Alex Johnson',
    email: 'alex.johnson@example.com',
    badge: 'associate',
    account_health: 'healthy',
    onboarding_completed: true,
  },
  {
    id: 'worker-002',
    full_name: 'Maya Carter',
    email: 'maya.carter@example.com',
    badge: 'senior',
    account_health: 'healthy',
    onboarding_completed: true,
  },
];

function defaultNotificationPreferences(workerId: string): NotificationPreference {
  return {
    id: `notif-pref-${workerId}`,
    worker_id: workerId,
    email_new_gig: true,
    email_disbursement: true,
    email_fee_record: true,
    email_compliance: true,
    sms_disbursement: false,
    push_new_gig: true,
    push_disbursement: true,
  };
}

function defaultSecuritySetting(workerId: string): WorkerSecuritySetting {
  return {
    id: `security-${workerId}`,
    worker_id: workerId,
    two_factor_enabled: false,
    two_factor_method: null,
    two_factor_enabled_at: null,
    updated_at: now(),
  };
}

function seedState(): LocalDbState {
  const gigs: WorkerGig[] = [
    {
      id: 'gig-brightpath-stipends',
      worker_id: null,
      client_name: 'BrightPath Community Fund',
      client_contact: 'ops@brightpath.org',
      total_principal: 8500,
      commission_rate: 10,
      commission_amount: 850,
      recipient_count: 5,
      disbursement_methods: ['bank_transfer', 'zelle'],
      badge_required: null,
      status: 'open',
      deadline: daysAhead(10),
      accepted_at: null,
      funded_at: null,
      completed_at: null,
      funded: false,
      funding_status: 'unfunded',
      operations_specialist: null,
      notes: 'US volunteer stipend batch. Worker must wait for Operations funding confirmation before sending.',
      created_at: daysAgo(1),
      updated_at: daysAgo(1),
    },
    {
      id: 'gig-meridian-payroll',
      worker_id: null,
      client_name: 'Meridian Health Partners',
      client_contact: 'payroll@meridianhealth.com',
      total_principal: 22000,
      commission_rate: 10,
      commission_amount: 2200,
      recipient_count: 11,
      disbursement_methods: ['bank_transfer', 'zelle'],
      badge_required: 'associate',
      status: 'open',
      deadline: daysAhead(14),
      accepted_at: null,
      funded_at: null,
      completed_at: null,
      funded: false,
      funding_status: 'unfunded',
      operations_specialist: null,
      notes: 'Bi-weekly US payroll support. Requires clean account health and completed onboarding.',
      created_at: daysAgo(2),
      updated_at: daysAgo(2),
    },
    {
      id: 'gig-redwood-referrals',
      worker_id: MOCK_USER_ID,
      client_name: 'Redwood Capital',
      client_contact: 'ops@redwoodcapital.com',
      total_principal: 5000,
      commission_rate: 10,
      commission_amount: 500,
      recipient_count: 3,
      disbursement_methods: ['bank_transfer'],
      badge_required: 'trainee',
      status: 'funded',
      deadline: daysAhead(3),
      accepted_at: daysAgo(2),
      funded_at: daysAgo(1),
      completed_at: null,
      funded: true,
      funding_status: 'funded',
      operations_specialist: 'Jordan Lee',
      notes: 'Referral bonus disbursement. Operations has confirmed deposit; worker still needs to confirm funds are visible.',
      created_at: daysAgo(4),
      updated_at: daysAgo(1),
    },
  ];

  const worker_disbursements: WorkerDisbursement[] = [
    {
      id: 'disb-redwood-001',
      gig_id: 'gig-redwood-referrals',
      worker_id: MOCK_USER_ID,
      recipient_name: 'Nora Ellis',
      amount: 1800,
      method: 'bank_transfer',
      destination: 'Checking ending 7442',
      status: 'pending',
      transaction_id: null,
      proof_url: null,
      proof_file_name: null,
      notes: 'Await worker confirmation of funding before sending.',
      sent_at: null,
      verified_at: null,
      created_at: daysAgo(1),
    },
    {
      id: 'disb-redwood-002',
      gig_id: 'gig-redwood-referrals',
      worker_id: MOCK_USER_ID,
      recipient_name: 'Caleb Stone',
      amount: 1600,
      method: 'bank_transfer',
      destination: 'Checking ending 1839',
      status: 'pending',
      transaction_id: null,
      proof_url: null,
      proof_file_name: null,
      notes: null,
      sent_at: null,
      verified_at: null,
      created_at: daysAgo(1),
    },
    {
      id: 'disb-redwood-003',
      gig_id: 'gig-redwood-referrals',
      worker_id: MOCK_USER_ID,
      recipient_name: 'Avery Brooks',
      amount: 1600,
      method: 'bank_transfer',
      destination: 'Checking ending 5098',
      status: 'pending',
      transaction_id: null,
      proof_url: null,
      proof_file_name: null,
      notes: null,
      sent_at: null,
      verified_at: null,
      created_at: daysAgo(1),
    },
  ];

  const operation_threads: OperationThread[] = [
    {
      id: 'thread-redwood-referrals',
      gig_id: 'gig-redwood-referrals',
      worker_id: MOCK_USER_ID,
      specialist_name: 'Jordan Lee',
      status: 'open',
      created_at: daysAgo(2),
      updated_at: daysAgo(1),
    },
  ];

  const operation_messages: OperationMessage[] = [
    {
      id: 'msg-redwood-001',
      thread_id: 'thread-redwood-referrals',
      sender_role: 'operations',
      sender_name: 'Jordan Lee',
      body: 'You have been accepted for Redwood Capital. I will coordinate funding status, recipient instructions, and proof review here.',
      created_at: daysAgo(2),
    },
    {
      id: 'msg-redwood-002',
      thread_id: 'thread-redwood-referrals',
      sender_role: 'operations',
      sender_name: 'Jordan Lee',
      body: 'Status update: principal deposit has been sent to your dedicated disbursement account. Confirm once funds are visible before sending.',
      created_at: daysAgo(1),
    },
  ];

  return {
    schema_version: 1,
    workers,
    worker_applications: [],
    gigs,
    gig_applications: [],
    worker_disbursements,
    operation_threads,
    operation_messages,
    notifications: [
      {
        id: 'notif-redwood-accepted',
        worker_id: MOCK_USER_ID,
        title: 'Gig accepted',
        body: 'Redwood Capital accepted your application. Chat with your Operations Specialist before taking action.',
        href: '/gigs/gig-redwood-referrals',
        read: false,
        created_at: daysAgo(2),
      },
    ],
    notification_preferences: workers.map(worker => defaultNotificationPreferences(worker.id)),
    audit_events: [
      {
        id: 'audit-seed-001',
        worker_id: MOCK_USER_ID,
        event_type: 'gig_application_accepted',
        entity_type: 'worker_gig',
        entity_id: 'gig-redwood-referrals',
        summary: 'Operations accepted worker for Redwood Capital and opened an operations thread.',
        created_at: daysAgo(2),
      },
      {
        id: 'audit-seed-002',
        worker_id: MOCK_USER_ID,
        event_type: 'principal_funded',
        entity_type: 'worker_gig',
        entity_id: 'gig-redwood-referrals',
        summary: 'Operations confirmed principal funding deposit was sent.',
        created_at: daysAgo(1),
      },
    ],
    commission_ledger: [],
    funding_events: [
      {
        id: 'fund-redwood-001',
        gig_id: 'gig-redwood-referrals',
        worker_id: MOCK_USER_ID,
        amount: 5000,
        type: 'deposit',
        reference: 'FUND-LOCAL-0001',
        confirmed: true,
        confirmed_at: daysAgo(1),
        created_at: daysAgo(1),
      },
    ],
    storage_objects: [],
    kyc_submissions: [],
    bank_accounts: [
      {
        id: 'bank-acct-alex-001',
        worker_id: MOCK_USER_ID,
        bank_name: 'Chase',
        account_label: 'Dedicated Disbursement Checking',
        account_type: 'checking',
        account_last4: '4286',
        routing_last4: '0210',
        is_primary: true,
        status: 'verified',
        created_at: daysAgo(26),
        updated_at: daysAgo(26),
      },
    ],
    support_tickets: [],
    support_chat_threads: [],
    support_chat_messages: [],
    admin_notifications: [],
    security_settings: workers.map(worker => defaultSecuritySetting(worker.id)),
    signed_documents: [
      { id: 'signed-001', worker_id: MOCK_USER_ID, document_type: 'worker_agreement',   document_version: '1.0', signed_at: daysAgo(30), signature: 'Alex Johnson' },
      { id: 'signed-002', worker_id: MOCK_USER_ID, document_type: 'aml_acknowledgment', document_version: '1.0', signed_at: daysAgo(28), signature: 'Alex Johnson' },
      { id: 'signed-003', worker_id: MOCK_USER_ID, document_type: 'ofac_compliance',    document_version: '1.0', signed_at: daysAgo(28), signature: 'Alex Johnson' },
      { id: 'signed-004', worker_id: MOCK_USER_ID, document_type: 'code_of_conduct',    document_version: '1.0', signed_at: daysAgo(28), signature: 'Alex Johnson' },
    ] as WorkerSignedDocument[],
  };
}

function canUseStorage() {
  return typeof window !== 'undefined' && Boolean(window.localStorage);
}

function load(): LocalDbState {
  if (!canUseStorage()) return seedState();
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const seeded = seedState();
    save(seeded);
    return seeded;
  }
  try {
    const parsed = JSON.parse(raw) as Partial<LocalDbState>;
    if (parsed.schema_version !== 1) return seedState();
    return {
      ...seedState(),
      ...parsed,
      worker_applications: parsed.worker_applications ?? seedState().worker_applications,
      commission_ledger: parsed.commission_ledger ?? [],
      funding_events: parsed.funding_events ?? [],
      storage_objects: parsed.storage_objects ?? [],
      kyc_submissions: parsed.kyc_submissions ?? [],
      bank_accounts: parsed.bank_accounts ?? seedState().bank_accounts,
      security_settings: parsed.security_settings ?? seedState().security_settings,
      notification_preferences: parsed.notification_preferences ?? seedState().notification_preferences,
      signed_documents: parsed.signed_documents ?? seedState().signed_documents,
      admin_notifications: parsed.admin_notifications ?? [],
      support_tickets: parsed.support_tickets ?? [],
      support_chat_threads: parsed.support_chat_threads ?? [],
      support_chat_messages: parsed.support_chat_messages ?? [],
    } as LocalDbState;
  } catch {
    const seeded = seedState();
    save(seeded);
    return seeded;
  }
}

function save(state: LocalDbState) {
  if (canUseStorage()) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function notifyLocalDbChange() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(DB_CHANGE_EVENT));
}

function mutate(mutator: (state: LocalDbState) => void): LocalDbState {
  const state = load();
  mutator(state);
  save(state);
  notifyLocalDbChange();
  return state;
}

function addAudit(state: LocalDbState, event: Omit<LocalAuditEvent, 'id' | 'created_at'>) {
  state.audit_events.unshift({ id: id('audit'), created_at: now(), ...event });
}

function addNotification(state: LocalDbState, event: Omit<LocalNotification, 'id' | 'created_at' | 'read'>) {
  state.notifications.unshift({ id: id('notif'), created_at: now(), read: false, cleared_at: null, ...event });
}

function addPreferredNotification(
  state: LocalDbState,
  event: Omit<LocalNotification, 'id' | 'created_at' | 'read'>,
  preferenceKey: 'push_new_gig' | 'push_disbursement',
) {
  const preference = state.notification_preferences.find(item => item.worker_id === event.worker_id)
    ?? defaultNotificationPreferences(event.worker_id);
  if (!preference[preferenceKey]) return;
  addNotification(state, event);
}

function addAdminNotification(state: LocalDbState, event: Omit<AdminNotification, 'id' | 'created_at' | 'read'>) {
  state.admin_notifications.unshift({ id: id('anotif'), created_at: now(), read: false, ...event });
}

function ensureThread(state: LocalDbState, gig: WorkerGig, workerId: string, specialistName = 'Jordan Lee') {
  let thread = state.operation_threads.find(t => t.gig_id === gig.id && t.worker_id === workerId);
  const existingThread = thread ?? state.operation_threads.find(t => t.gig_id === gig.id) ?? null;
  if (!thread && existingThread) {
    thread = existingThread;
    thread.worker_id = workerId;
    thread.specialist_name = specialistName;
    thread.status = 'open';
    thread.updated_at = now();
  }
  if (!thread) {
    thread = {
      id: id('thread'),
      gig_id: gig.id,
      worker_id: workerId,
      specialist_name: specialistName,
      status: 'open',
      created_at: now(),
      updated_at: now(),
    };
    state.operation_threads.unshift(thread);
    state.operation_messages.push({
      id: id('msg'),
      thread_id: thread.id,
      sender_role: 'operations',
      sender_name: specialistName,
      body: `Your ${gig.client_name} gig is approved. Use this thread for funding status, recipient instructions, and proof review.`,
      created_at: now(),
    });
  }
  return thread;
}

export const localDb = {
  subscribe(callback: () => void) {
    if (typeof window === 'undefined') return () => undefined;
    const handleLocalChange = () => callback();
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) callback();
    };
    window.addEventListener(DB_CHANGE_EVENT, handleLocalChange);
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener(DB_CHANGE_EVENT, handleLocalChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  },

  reset() {
    save(seedState());
    notifyLocalDbChange();
  },

  snapshot() {
    return load();
  },

  ensureWorker(profile: WorkerProfile, email?: string | null) {
    return mutate(state => {
      const existing = state.workers.find(worker => worker.id === profile.id);
      const worker: LocalWorkerSummary = {
        id: profile.id,
        full_name: profile.full_name,
        email: email ?? existing?.email ?? '',
        badge: profile.badge,
        account_health: profile.account_health,
        onboarding_completed: profile.onboarding_completed,
      };

      if (existing) {
        Object.assign(existing, worker);
      } else {
        state.workers.unshift(worker);
      }

      if (!state.notification_preferences.some(item => item.worker_id === profile.id)) {
        state.notification_preferences.push(defaultNotificationPreferences(profile.id));
      }
      if (!state.security_settings.some(item => item.worker_id === profile.id)) {
        state.security_settings.push(defaultSecuritySetting(profile.id));
      }
    });
  },

  listNotifications(workerId?: string) {
    const state = load();
    return state.notifications
      .filter(notification => (!workerId || notification.worker_id === workerId) && !notification.cleared_at)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  },

  ensureKycReminder(workerId: string) {
    return mutate(state => {
      const latestSubmission = state.kyc_submissions
        .filter(item => item.worker_id === workerId)
        .sort((a, b) => b.submitted_at.localeCompare(a.submitted_at))[0] ?? null;

      if (latestSubmission && ['submitted', 'in_review', 'verified'].includes(latestSubmission.status)) return;

      const reminderTitles = ['Complete your KYC to unlock gigs', 'KYC updates required', 'KYC needs updates'];
      const latestKycNotice = state.notifications
        .filter(notification => notification.worker_id === workerId && reminderTitles.includes(notification.title))
        .sort((a, b) => b.created_at.localeCompare(a.created_at))[0] ?? null;
      const anchor = latestSubmission?.reviewed_at ?? latestKycNotice?.created_at ?? null;
      const nextAllowedAt = anchor ? new Date(anchor).getTime() + KYC_REMINDER_HOURS * 60 * 60 * 1000 : 0;

      if (Date.now() < nextAllowedAt) return;

      if (latestSubmission?.status === 'rejected') {
        addNotification(state, {
          worker_id: workerId,
          title: 'KYC updates required',
          body: 'Your KYC package needs updated documents before you can receive gigs. Please review the feedback and resubmit from Account > KYC.',
          href: '/account',
        });
        return;
      }

      addNotification(state, {
        worker_id: workerId,
        title: 'Complete your KYC to unlock gigs',
        body: 'Please submit your identity document and tax details so Operations can verify your account. Verified workers can receive gig assignments and payouts.',
        href: '/account',
      });
    });
  },

  listAdminNotifications() {
    return load().admin_notifications.sort((a, b) => b.created_at.localeCompare(a.created_at));
  },

  listSupportTickets(status?: SupportTicket['status'] | 'all') {
    const state = load();
    return state.support_tickets
      .filter(ticket => !status || status === 'all' || ticket.status === status)
      .map(ticket => ({
        ...ticket,
        worker: state.workers.find(worker => worker.id === ticket.worker_id) ?? null,
        gig: ticket.related_gig_id ? state.gigs.find(gig => gig.id === ticket.related_gig_id) ?? null : null,
      }))
      .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
  },

  updateSupportTicketStatus(ticketId: string, status: SupportTicket['status']) {
    return mutate(state => {
      const ticket = state.support_tickets.find(item => item.id === ticketId);
      if (ticket) {
        ticket.status = status;
        ticket.updated_at = now();
      }
    });
  },

  listSupportChatThreads() {
    const state = load();
    return state.support_chat_threads
      .map(thread => ({
        ...thread,
        worker: state.workers.find(worker => worker.id === thread.worker_id) ?? null,
        messages: state.support_chat_messages
          .filter(message => message.thread_id === thread.id)
          .sort((a, b) => a.created_at.localeCompare(b.created_at)),
      }))
      .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
  },

  getSupportChat(workerId: string) {
    const state = load();
    const thread = state.support_chat_threads.find(item => item.worker_id === workerId) ?? null;
    return {
      thread,
      messages: thread
        ? state.support_chat_messages
            .filter(message => message.thread_id === thread.id)
            .sort((a, b) => a.created_at.localeCompare(b.created_at))
        : [],
    };
  },

  sendSupportChatMessage(workerId: string, senderRole: SupportChatMessage['sender_role'], senderName: string, body: string) {
    return mutate(state => {
      const worker = state.workers.find(item => item.id === workerId);
      let thread = state.support_chat_threads.find(item => item.worker_id === workerId && item.status === 'open');
      if (!thread) {
        thread = {
          id: id('support-thread'),
          worker_id: workerId,
          status: 'open',
          unread_for_admin: false,
          unread_for_worker: false,
          created_at: now(),
          updated_at: now(),
        };
        state.support_chat_threads.unshift(thread);
        state.support_chat_messages.push({
          id: id('support-msg'),
          thread_id: thread.id,
          sender_role: 'support',
          sender_name: 'PayBridge Support',
          body: 'Hello. How can we help today?',
          created_at: now(),
        });
      }
      state.support_chat_messages.push({
        id: id('support-msg'),
        thread_id: thread.id,
        sender_role: senderRole,
        sender_name: senderName,
        body,
        created_at: now(),
      });
      thread.updated_at = now();
      thread.unread_for_admin = senderRole === 'worker';
      thread.unread_for_worker = senderRole === 'support';
      if (senderRole === 'worker') {
        addAdminNotification(state, {
          title: 'New Support Chat',
          body: `${worker?.full_name ?? 'Worker'} sent a message to Support.`,
          href: '/admin/inbox',
        });
      } else {
        addNotification(state, {
          worker_id: workerId,
          title: 'Support replied',
          body: 'A support specialist replied to your chat.',
          href: '/support',
        });
      }
    });
  },

  markSupportChatReadForAdmin(threadId: string) {
    return mutate(state => {
      const thread = state.support_chat_threads.find(item => item.id === threadId);
      if (thread) thread.unread_for_admin = false;
    });
  },

  listOperationRooms() {
    const state = load();
    return state.operation_threads
      .map(thread => {
        const gig = state.gigs.find(item => item.id === thread.gig_id) ?? null;
        const worker = state.workers.find(item => item.id === thread.worker_id) ?? null;
        const messages = state.operation_messages
          .filter(message => message.thread_id === thread.id)
          .sort((a, b) => a.created_at.localeCompare(b.created_at));
        const disbursements = state.worker_disbursements.filter(item => item.gig_id === thread.gig_id);
        return { ...thread, gig, worker, messages, disbursements };
      })
      .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
  },

  listDisbursements() {
    const state = load();
    return state.worker_disbursements
      .map(disbursement => ({
        ...disbursement,
        worker: state.workers.find(worker => worker.id === disbursement.worker_id) ?? null,
        gig: state.gigs.find(gig => gig.id === disbursement.gig_id) ?? null,
      }))
      .sort((a, b) => (b.sent_at ?? b.created_at).localeCompare(a.sent_at ?? a.created_at));
  },

  markAdminNotificationRead(notificationId: string) {
    return mutate(state => {
      const notif = state.admin_notifications.find(n => n.id === notificationId);
      if (notif) notif.read = true;
    });
  },

  markAllAdminNotificationsRead() {
    return mutate(state => {
      state.admin_notifications.forEach(n => (n.read = true));
    });
  },

  getNotificationPreferences(workerId: string) {
    const state = load();
    const existing = state.notification_preferences.find(preference => preference.worker_id === workerId);
    return existing ?? defaultNotificationPreferences(workerId);
  },

  updateNotificationPreference(workerId: string, key: keyof Omit<NotificationPreference, 'id' | 'worker_id'>, enabled: boolean) {
    return mutate(state => {
      let preference = state.notification_preferences.find(item => item.worker_id === workerId);
      if (!preference) {
        preference = defaultNotificationPreferences(workerId);
        state.notification_preferences.push(preference);
      }
      preference[key] = enabled;
    });
  },

  getSecuritySetting(workerId: string) {
    const state = load();
    return state.security_settings.find(setting => setting.worker_id === workerId) ?? defaultSecuritySetting(workerId);
  },

  setTwoFactorEnabled(workerId: string, enabled: boolean) {
    return mutate(state => {
      let setting = state.security_settings.find(item => item.worker_id === workerId);
      if (!setting) {
        setting = defaultSecuritySetting(workerId);
        state.security_settings.push(setting);
      }
      setting.two_factor_enabled = enabled;
      setting.two_factor_method = enabled ? 'totp' : null;
      setting.two_factor_enabled_at = enabled ? now() : null;
      setting.updated_at = now();
      addAudit(state, {
        worker_id: workerId,
        event_type: enabled ? 'two_factor_enabled' : 'two_factor_disabled',
        entity_type: 'worker_security_setting',
        entity_id: setting.id,
        summary: `Worker ${enabled ? 'enabled' : 'disabled'} two-factor authentication.`,
      });
    });
  },

  getKycSubmission(workerId: string) {
    const state = load();
    return state.kyc_submissions
      .filter(item => item.worker_id === workerId)
      .sort((a, b) => b.submitted_at.localeCompare(a.submitted_at))[0] ?? null;
  },

  submitKyc(input: {
    workerId: string;
    idDocumentType: WorkerKycSubmission['id_document_type'];
    idDocumentFile: File;
    taxIdType: WorkerKycSubmission['tax_id_type'];
    taxIdNumber: string;
    storagePath?: string;
  }) {
    return mutate(state => {
      const worker = state.workers.find(w => w.id === input.workerId);
      if (!worker) throw new Error('Worker not found');

      const cleanTaxId = input.taxIdNumber.replace(/\D/g, '');
      const storagePath = input.storagePath ?? `${input.workerId}/${Date.now()}-${input.idDocumentFile.name}`;
      const existing = state.kyc_submissions.find(item => item.worker_id === input.workerId);
      const submission: WorkerKycSubmission = {
        id: existing?.id ?? id('kyc'),
        worker_id: input.workerId,
        id_document_type: input.idDocumentType,
        id_document_file_name: input.idDocumentFile.name,
        id_document_url: storagePath,
        tax_id_type: input.taxIdType,
        tax_id_last4: cleanTaxId.slice(-4),
        status: 'submitted',
        submitted_at: now(),
        reviewed_at: null,
        review_note: 'Awaiting manual Operations review.',
      };

      if (existing) {
        Object.assign(existing, submission);
      } else {
        state.kyc_submissions.unshift(submission);
      }

      state.storage_objects.unshift({
        id: id('storage'),
        bucket: 'kyc-documents',
        path: storagePath,
        owner_id: input.workerId,
        file_name: input.idDocumentFile.name,
        file_type: input.idDocumentFile.type || 'application/octet-stream',
        size: input.idDocumentFile.size,
        entity_type: 'worker_profile',
        entity_id: input.workerId,
        created_at: now(),
      });

      addNotification(state, {
        worker_id: input.workerId,
        title: 'KYC received',
        body: 'Your documents have been submitted successfully. Operations will review them before gig access is enabled.',
        href: '/account',
      });
      addAdminNotification(state, {
        title: 'KYC Submission',
        body: `New KYC submitted by ${worker.full_name}`,
        href: '/admin/compliance',
      });
      addAudit(state, {
        worker_id: input.workerId,
        event_type: 'worker_kyc_submitted',
        entity_type: 'worker_kyc_submission',
        entity_id: submission.id,
        summary: `${worker.full_name} submitted ID and tax information for manual review.`,
      });
    });
  },

  listKycSubmissions(status?: WorkerKycSubmission['status'] | 'all') {
    const state = load();
    return state.kyc_submissions
      .filter(submission => !status || status === 'all' || submission.status === status)
      .map(submission => ({
        ...submission,
        worker: state.workers.find(worker => worker.id === submission.worker_id) ?? null,
      }))
      .sort((a, b) => b.submitted_at.localeCompare(a.submitted_at));
  },

  reviewKycSubmission(
    submissionId: string,
    status: Extract<WorkerKycSubmission['status'], 'in_review' | 'verified' | 'rejected'>,
    reviewNote: string,
    reviewerName = 'Operations',
  ) {
    return mutate(state => {
      const submission = state.kyc_submissions.find(item => item.id === submissionId);
      if (!submission) throw new Error('KYC submission not found');
      const worker = state.workers.find(item => item.id === submission.worker_id);

      submission.status = status;
      submission.reviewed_at = now();
      submission.review_note = reviewNote || (
        status === 'verified'
          ? 'Approved after manual Operations review.'
          : status === 'rejected'
            ? 'Needs updated information before approval.'
            : 'Operations started manual review.'
      );

      addNotification(state, {
        worker_id: submission.worker_id,
        title: status === 'verified' ? 'KYC approved' : status === 'rejected' ? 'KYC needs updates' : 'KYC under review',
        body: status === 'verified'
          ? 'Your KYC has been approved. You are eligible to receive gig assignments and payouts.'
          : status === 'rejected'
            ? submission.review_note + ' Please upload the corrected documents from Account > KYC.'
            : 'Operations has started reviewing your KYC package. We will notify you when a decision is made.',
        href: '/account',
      });
      addAudit(state, {
        worker_id: submission.worker_id,
        event_type: `worker_kyc_${status}`,
        entity_type: 'worker_kyc_submission',
        entity_id: submission.id,
        summary: `${reviewerName} marked ${worker?.full_name ?? 'worker'} KYC as ${status.replace('_', ' ')}.`,
      });
    });
  },

  listBankAccounts(workerId: string) {
    const state = load();
    return state.bank_accounts
      .filter(account => account.worker_id === workerId)
      .sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || b.created_at.localeCompare(a.created_at));
  },

  addBankAccount(input: {
    workerId: string;
    bankName: string;
    accountLabel: string;
    accountType: WorkerBankAccount['account_type'];
    accountNumber: string;
    routingNumber: string;
    makePrimary?: boolean;
  }) {
    return mutate(state => {
      const worker = state.workers.find(w => w.id === input.workerId);
      if (!worker) throw new Error('Worker not found');
      const cleanAccountNumber = input.accountNumber.replace(/\D/g, '');
      const cleanRoutingNumber = input.routingNumber.replace(/\D/g, '');
      if (cleanAccountNumber.length < 4) throw new Error('Enter a valid account number');
      if (cleanRoutingNumber.length < 4) throw new Error('Enter a valid routing number');
      const existingForWorker = state.bank_accounts.filter(account => account.worker_id === input.workerId);
      const makePrimary = input.makePrimary ?? existingForWorker.length === 0;
      if (makePrimary) existingForWorker.forEach(account => { account.is_primary = false; });
      const account: WorkerBankAccount = {
        id: id('bank-acct'),
        worker_id: input.workerId,
        bank_name: input.bankName,
        account_label: input.accountLabel.trim() || `${input.bankName} account`,
        account_type: input.accountType,
        account_last4: cleanAccountNumber.slice(-4),
        routing_last4: cleanRoutingNumber.slice(-4),
        is_primary: makePrimary,
        status: 'verified',
        created_at: now(),
        updated_at: now(),
      };
      state.bank_accounts.unshift(account);
      addAudit(state, {
        worker_id: input.workerId,
        event_type: 'bank_account_added',
        entity_type: 'worker_bank_account',
        entity_id: account.id,
        summary: `${worker.full_name} added ${account.account_label} at ${account.bank_name}.`,
      });
    });
  },

  updateBankAccount(accountId: string, workerId: string, updates: {
    bankName: string;
    accountLabel: string;
    accountType: WorkerBankAccount['account_type'];
    makePrimary?: boolean;
  }) {
    return mutate(state => {
      const account = state.bank_accounts.find(item => item.id === accountId && item.worker_id === workerId);
      if (!account) throw new Error('Bank account not found');
      if (updates.makePrimary) {
        state.bank_accounts
          .filter(item => item.worker_id === workerId)
          .forEach(item => { item.is_primary = item.id === accountId; });
      }
      account.bank_name = updates.bankName;
      account.account_label = updates.accountLabel.trim() || account.account_label;
      account.account_type = updates.accountType;
      account.updated_at = now();
      addAudit(state, {
        worker_id: workerId,
        event_type: 'bank_account_updated',
        entity_type: 'worker_bank_account',
        entity_id: account.id,
        summary: `${account.account_label} was updated.`,
      });
    });
  },

  deleteBankAccount(accountId: string, workerId: string) {
    return mutate(state => {
      const index = state.bank_accounts.findIndex(account => account.id === accountId && account.worker_id === workerId);
      if (index === -1) throw new Error('Bank account not found');
      const [removed] = state.bank_accounts.splice(index, 1);
      const remaining = state.bank_accounts.filter(account => account.worker_id === workerId);
      if (removed.is_primary && remaining.length > 0) {
        remaining
          .sort((a, b) => b.updated_at.localeCompare(a.updated_at))[0]
          .is_primary = true;
      }
      addAudit(state, {
        worker_id: workerId,
        event_type: 'bank_account_deleted',
        entity_type: 'worker_bank_account',
        entity_id: removed.id,
        summary: `${removed.account_label} was removed from worker bank accounts.`,
      });
    });
  },

  getSignedDocuments(workerId: string): WorkerSignedDocument[] {
    const state = load();
    return state.signed_documents.filter(d => d.worker_id === workerId);
  },

  signDocument(input: {
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
    return mutate(state => {
      const worker = state.workers.find(w => w.id === input.workerId);
      // Upsert - one record per worker per document type
      const existing = state.signed_documents.find(
        d => d.worker_id === input.workerId && d.document_type === input.documentType,
      );
      const record: WorkerSignedDocument = {
        id: existing?.id ?? id('signed-doc'),
        worker_id: input.workerId,
        document_type: input.documentType,
        document_version: input.documentVersion ?? '1.0',
        signed_at: now(),
        signature: input.signature,
        ...(input.w9 ? {
          w9_name: input.w9.name,
          w9_business_name: input.w9.businessName ?? null,
          w9_tax_classification: input.w9.taxClassification,
          w9_address: input.w9.address,
          w9_city_state_zip: input.w9.cityStateZip,
          w9_tax_id_type: input.w9.taxIdType,
          w9_tax_id_last4: input.w9.taxIdLast4,
        } : {}),
      };
      if (existing) {
        Object.assign(existing, record);
      } else {
        state.signed_documents.unshift(record);
      }
      addAdminNotification(state, {
        title: 'Document Signed',
        body: `Worker ${worker?.full_name ?? 'unknown'} signed ${input.documentType.replace(/_/g, ' ')}`,
        href: '/admin/compliance',
      });
      addAudit(state, {
        worker_id: input.workerId,
        event_type: 'document_signed',
        entity_type: 'worker_signed_document',
        entity_id: record.id,
        summary: `Worker signed ${input.documentType}`,
      });
    });
  },

  submitSupportTicket(workerId: string, subject: string, message: string) {
    return mutate(state => {
      const worker = state.workers.find(w => w.id === workerId);
      const ticket: SupportTicket = {
        id: id('support-ticket'),
        worker_id: workerId,
        subject,
        message,
        type: 'general',
        status: 'open',
        priority: 'normal',
        related_gig_id: null,
        created_at: now(),
        updated_at: now(),
      };
      state.support_tickets.unshift(ticket);
      addAdminNotification(state, {
        title: 'New Support Ticket',
        body: `From ${worker?.full_name ?? 'Unknown Worker'}: ${subject}`,
        href: '/admin/inbox',
      });
      addAudit(state, {
        worker_id: workerId,
        event_type: 'support_ticket_submitted',
        entity_type: 'support_ticket',
        entity_id: ticket.id,
        summary: `${worker?.full_name ?? 'Worker'} submitted a support request.`,
      });
    });
  },

  submitIncident(workerId: string, gigId: string, description: string) {
    return mutate(state => {
      const worker = state.workers.find(w => w.id === workerId);
      const relatedGig = gigId ? state.gigs.find(g => g.id === gigId) : null;
      const ticket: SupportTicket = {
        id: id('support-ticket'),
        worker_id: workerId,
        subject: 'Emergency incident report',
        message: description,
        type: 'incident',
        status: 'open',
        priority: 'urgent',
        related_gig_id: relatedGig?.id ?? (gigId || null),
        created_at: now(),
        updated_at: now(),
      };
      state.support_tickets.unshift(ticket);
      addAdminNotification(state, {
        title: 'Incident Reported',
        body: `${worker?.full_name ?? 'Worker'} reported an urgent incident${relatedGig ? ` on ${relatedGig.client_name}` : ''}.`,
        href: '/admin/inbox',
      });
      addAudit(state, {
        worker_id: workerId,
        event_type: 'incident_report_submitted',
        entity_type: 'support_ticket',
        entity_id: ticket.id,
        summary: `${worker?.full_name ?? 'Worker'} submitted an incident report.`,
      });
    });
  },

  markNotificationRead(notificationId: string, workerId: string) {
    return mutate(state => {
      const notification = state.notifications.find(n => n.id === notificationId && n.worker_id === workerId);
      if (notification) notification.read = true;
    });
  },

  markAllNotificationsRead(workerId: string) {
    return mutate(state => {
      state.notifications.forEach(notification => {
        if (notification.worker_id === workerId) notification.read = true;
      });
    });
  },

  clearNotifications(workerId: string) {
    return mutate(state => {
      state.notifications.forEach(notification => {
        if (notification.worker_id === workerId && !notification.cleared_at) {
          notification.read = true;
          notification.cleared_at = now();
        }
      });
    });
  },

  listGigs(workerId?: string) {
    const state = load();
    return state.gigs.map(gig => ({
      ...gig,
      application: workerId ? state.gig_applications.find(a => a.gig_id === gig.id && a.worker_id === workerId) ?? null : null,
    }));
  },

  getGig(gigId: string, workerId?: string) {
    let state = load();
    let gig = state.gigs.find(g => g.id === gigId) ?? null;
    if (!gig) return null;

    if (workerId && gig.worker_id === workerId && !state.operation_threads.some(t => t.gig_id === gigId && t.worker_id === workerId)) {
      state = mutate(nextState => {
        const assignedGig = nextState.gigs.find(g => g.id === gigId && g.worker_id === workerId);
        if (assignedGig) {
          ensureThread(nextState, assignedGig, workerId, assignedGig.operations_specialist ?? 'Jordan Lee');
        }
      });
      gig = state.gigs.find(g => g.id === gigId) ?? gig;
    }

    const thread = workerId ? state.operation_threads.find(t => t.gig_id === gig.id && t.worker_id === workerId) ?? null : null;

    return {
      gig,
      application: workerId ? state.gig_applications.find(a => a.gig_id === gig.id && a.worker_id === workerId) ?? null : null,
      disbursements: state.worker_disbursements.filter(d => d.gig_id === gig.id && (!workerId || gig.funded || ['funded', 'funding_confirmed', 'disbursement_in_progress', 'proof_rejected', 'awaiting_verification', 'verified_complete', 'settled'].includes(gig.funding_status ?? 'unfunded'))),
      thread,
      messages: thread ? state.operation_messages.filter(m => m.thread_id === thread.id).sort((a, b) => a.created_at.localeCompare(b.created_at)) : [],
    };
  },

  applyToGig(gigId: string, workerId: string, note: string) {
    return mutate(state => {
      const gig = state.gigs.find(g => g.id === gigId);
      if (!gig) throw new Error('Gig not found');
      const existing = state.gig_applications.find(a => a.gig_id === gigId && a.worker_id === workerId);
      if (existing) {
        existing.note = note || existing.note;
        existing.updated_at = now();
        return;
      }
      state.gig_applications.unshift({
        id: id('gig-app'),
        gig_id: gigId,
        worker_id: workerId,
        worker_name: state.workers.find(w => w.id === workerId)?.full_name ?? 'Worker',
        status: 'submitted',
        note,
        review_note: null,
        reviewed_by: null,
        submitted_at: now(),
        reviewed_at: null,
        updated_at: now(),
      });
      addAudit(state, {
        worker_id: workerId,
        event_type: 'gig_application_submitted',
        entity_type: 'gig_application',
        entity_id: gigId,
        summary: `Worker applied for ${gig.client_name}.`,
      });
    });
  },

  listWorkers() {
    return load().workers;
  },

  updateWorkerAdminFields(workerId: string, fields: Partial<Pick<LocalWorkerSummary, 'badge' | 'account_health'>>) {
    return mutate(state => {
      const worker = state.workers.find(item => item.id === workerId);
      if (!worker) throw new Error('Worker not found');
      Object.assign(worker, fields);
    });
  },

  listWorkerApplications(status?: WorkerApplicationStatus | 'all') {
    const state = load();
    return state.worker_applications
      .filter(application => !status || status === 'all' || application.status === status)
      .sort((a, b) => b.submitted_at.localeCompare(a.submitted_at));
  },

  getWorkerApplicationForUser(workerId?: string | null, email?: string | null) {
    const normalizedEmail = email?.trim().toLowerCase();
    return load().worker_applications
      .filter(application =>
        Boolean(workerId && application.worker_id === workerId) ||
        Boolean(normalizedEmail && application.email.toLowerCase() === normalizedEmail),
      )
      .sort((a, b) => b.submitted_at.localeCompare(a.submitted_at))[0] ?? null;
  },

  submitWorkerApplication(input: WorkerApplicationInput) {
    return mutate(state => {
      const email = input.email.trim().toLowerCase();
      const existing = state.worker_applications.find(application => application.email.toLowerCase() === email);
      const record: WorkerApplication = {
        ...input,
        id: existing?.id ?? id('worker-app'),
        email,
        worker_id: input.worker_id ?? existing?.worker_id ?? null,
        status: 'pending',
        submitted_at: existing?.submitted_at ?? now(),
        reviewed_at: null,
        reviewed_by: null,
        notes: input.notes ?? existing?.notes ?? null,
      };

      if (existing) {
        Object.assign(existing, record);
      } else {
        state.worker_applications.unshift(record);
      }

      addAdminNotification(state, {
        title: 'Worker Application Submitted',
        body: `${record.full_name} submitted a worker application for account verification.`,
        href: '/admin/applications',
      });
      addAudit(state, {
        worker_id: record.worker_id ?? null,
        event_type: 'worker_application_submitted',
        entity_type: 'worker_application',
        entity_id: record.id,
        summary: `${record.full_name} submitted a worker application.`,
      });
    });
  },

  reviewWorkerApplication(applicationId: string, status: WorkerApplicationStatus, reviewNote: string) {
    return mutate(state => {
      const application = state.worker_applications.find(item => item.id === applicationId);
      if (!application) throw new Error('Application not found');

      application.status = status;
      application.notes = reviewNote || application.notes;
      application.reviewed_at = now();
      application.reviewed_by = 'admin-local';

      if (status === 'approved') {
        const workerId = application.worker_id || state.workers.find(worker => worker.email.toLowerCase() === application.email.toLowerCase())?.id || id('worker');
        let worker = state.workers.find(item => item.id === workerId || item.email.toLowerCase() === application.email.toLowerCase());
        if (!worker) {
          worker = {
            id: workerId,
            full_name: application.full_name,
            email: application.email,
            badge: 'trainee',
            account_health: 'healthy',
            onboarding_completed: false,
          };
          state.workers.unshift(worker);
        } else {
          worker.full_name = application.full_name;
          worker.email = application.email;
          worker.account_health = 'healthy';
        }
        application.worker_id = worker.id;

        if (!state.notification_preferences.some(item => item.worker_id === worker!.id)) {
          state.notification_preferences.push(defaultNotificationPreferences(worker.id));
        }
        if (!state.security_settings.some(item => item.worker_id === worker!.id)) {
          state.security_settings.push(defaultSecuritySetting(worker.id));
        }
      }

      if (application.worker_id) {
        addNotification(state, {
          worker_id: application.worker_id,
          title: status === 'approved' ? 'Application approved' : status === 'rejected' ? 'Application not approved' : 'Application under review',
          body: status === 'approved'
            ? 'Your PayBridge worker account has been verified. Continue onboarding to unlock gigs.'
            : status === 'rejected'
              ? (application.notes || 'Your application was not approved. Contact support if you need clarification.')
              : 'Your application is now under admin review.',
          href: status === 'approved' ? '/dashboard' : '/application-status',
        });
      }

      addAudit(state, {
        worker_id: application.worker_id ?? null,
        event_type: `worker_application_${status}`,
        entity_type: 'worker_application',
        entity_id: application.id,
        summary: `${application.full_name} application marked ${status.replace('_', ' ')}.`,
      });
    });
  },
  listGigApplications(status?: GigApplicationStatus | 'all') {
    const state = load();
    return state.gig_applications
      .filter(app => !status || status === 'all' || app.status === status)
      .map(app => ({ ...app, gig: state.gigs.find(g => g.id === app.gig_id) ?? null }))
      .sort((a, b) => b.submitted_at.localeCompare(a.submitted_at));
  },

  reviewGigApplication(applicationId: string, status: Extract<GigApplicationStatus, 'under_review' | 'accepted' | 'declined'>, reviewNote: string, specialistName = 'Jordan Lee') {
    return mutate(state => {
      const application = state.gig_applications.find(a => a.id === applicationId);
      if (!application) throw new Error('Application not found');
      const gig = state.gigs.find(g => g.id === application.gig_id);
      if (!gig) throw new Error('Gig not found');
      application.status = status;
      application.review_note = reviewNote || application.review_note;
      application.reviewed_by = 'admin-local';
      application.reviewed_at = now();
      application.updated_at = now();

      if (status === 'accepted') {
        gig.worker_id = application.worker_id;
        state.worker_disbursements.forEach(item => {
          if (item.gig_id === gig.id) item.worker_id = application.worker_id;
        });
        gig.status = 'accepted';
        gig.accepted_at = now();
        gig.operations_specialist = specialistName;
        gig.updated_at = now();
        const thread = ensureThread(state, gig, application.worker_id, specialistName);
        addPreferredNotification(state, {
          worker_id: application.worker_id,
          title: 'Gig application accepted',
          body: `${gig.client_name} is assigned to you. Chat with ${specialistName}, your Operations Specialist.`,
          href: `/gigs/${gig.id}`,
        }, 'push_disbursement');
        addAudit(state, {
          worker_id: application.worker_id,
          event_type: 'gig_application_accepted',
          entity_type: 'gig_application',
          entity_id: application.id,
          summary: `Application accepted and operations thread ${thread.id} opened for ${gig.client_name}.`,
        });
      } else {
        addAudit(state, {
          worker_id: application.worker_id,
          event_type: status === 'declined' ? 'gig_application_declined' : 'gig_application_reviewing',
          entity_type: 'gig_application',
          entity_id: application.id,
          summary: `${gig.client_name} application marked ${status.replace('_', ' ')}.`,
        });
      }
    });
  },

  createGig(input: CreateGigInput) {
    return mutate(state => {
      const { beneficiaries = [], ...gigInput } = input;
      const gig: WorkerGig = {
        ...gigInput,
        id: id('gig'),
        worker_id: null,
        commission_amount: input.total_principal * (input.commission_rate / 100),
        status: 'open',
        accepted_at: null,
        funded_at: null,
        completed_at: null,
        funded: false,
        funding_status: 'unfunded',
        operations_specialist: null,
        created_at: now(),
        updated_at: now(),
      };
      state.gigs.unshift(gig);
      state.workers
        .filter(worker => worker.onboarding_completed)
        .filter(worker => worker.account_health === 'healthy')
        .filter(worker => !gig.badge_required || BADGE_ORDER.indexOf(worker.badge) >= BADGE_ORDER.indexOf(gig.badge_required))
        .forEach(worker => {
          addPreferredNotification(state, {
            worker_id: worker.id,
            title: 'New gig available',
            body: `${gig.client_name} is open for eligible workers. Review the principal, deadline, and disbursement methods before applying.`,
            href: `/gigs/${gig.id}`,
          }, 'push_new_gig');
        });
      beneficiaries.slice(0, 5).forEach(beneficiary => {
        state.worker_disbursements.push({
          id: id('disb'),
          gig_id: gig.id,
          worker_id: '',
          recipient_name: beneficiary.recipient_name,
          amount: beneficiary.amount,
          method: beneficiary.method,
          destination: beneficiary.destination,
          status: 'pending',
          transaction_id: null,
          proof_url: null,
          proof_file_name: null,
          notes: null,
          sent_at: null,
          verified_at: null,
          created_at: now(),
        });
      });
      addAudit(state, {
        event_type: 'gig_created',
        entity_type: 'worker_gig',
        entity_id: gig.id,
        summary: `Admin created ${gig.client_name} for ${gig.recipient_count} recipients.`,
      });
    });
  },

  markFundingSent(gigId: string, reference: string, specialistName = 'Jordan Lee') {
    return mutate(state => {
      const gig = state.gigs.find(g => g.id === gigId);
      if (!gig || !gig.worker_id) throw new Error('Gig must be assigned before funding can be confirmed.');
      gig.funded = true;
      gig.funded_at = now();
      gig.status = 'funded';
      gig.funding_status = 'funded';
      gig.operations_specialist = gig.operations_specialist ?? specialistName;
      gig.updated_at = now();
      const thread = ensureThread(state, gig, gig.worker_id, gig.operations_specialist);
      state.operation_messages.push({
        id: id('msg'),
        thread_id: thread.id,
        sender_role: 'operations',
        sender_name: gig.operations_specialist,
        body: `Funding status: deposit sent and marked FUNDED. Reference: ${reference}. Confirm funds are visible before disbursing.`,
        created_at: now(),
      });
      addPreferredNotification(state, {
        worker_id: gig.worker_id,
        title: 'Principal funding marked sent',
        body: `${gig.client_name}: confirm funds are visible in your dedicated account before sending.`,
        href: `/gigs/${gig.id}`,
      }, 'push_disbursement');
      addAudit(state, {
        worker_id: gig.worker_id,
        event_type: 'principal_funded',
        entity_type: 'worker_gig',
        entity_id: gig.id,
        summary: `${gig.client_name} funding marked sent. Reference: ${reference}.`,
      });
      state.funding_events.unshift({
        id: id('funding'),
        gig_id: gig.id,
        worker_id: gig.worker_id,
        amount: gig.total_principal,
        type: 'deposit',
        reference,
        confirmed: true,
        confirmed_at: now(),
        created_at: now(),
      });
    });
  },

  workerConfirmFunding(gigId: string, workerId: string) {
    return mutate(state => {
      const gig = state.gigs.find(g => g.id === gigId && g.worker_id === workerId);
      if (!gig || !gig.funded) throw new Error('Funding must be marked sent first.');
      gig.status = 'in_progress';
      gig.funding_status = 'funding_confirmed';
      gig.updated_at = now();
      const thread = ensureThread(state, gig, workerId, gig.operations_specialist ?? 'Jordan Lee');
      state.operation_messages.push({
        id: id('msg'),
        thread_id: thread.id,
        sender_role: 'worker',
        sender_name: state.workers.find(w => w.id === workerId)?.full_name ?? 'Worker',
        body: 'I confirm the principal funds are visible in my dedicated disbursement account.',
        created_at: now(),
      });
      addAudit(state, {
        worker_id: workerId,
        event_type: 'worker_confirmed_funding',
        entity_type: 'worker_gig',
        entity_id: gig.id,
        summary: `Worker confirmed funding availability for ${gig.client_name}.`,
      });
    });
  },

  sendMessage(threadId: string, senderRole: OperationMessage['sender_role'], senderName: string, body: string) {
    return mutate(state => {
      const thread = state.operation_threads.find(t => t.id === threadId);
      if (!thread) throw new Error('Thread not found');
      const gig = state.gigs.find(g => g.id === thread.gig_id);
      const worker = state.workers.find(w => w.id === thread.worker_id);
      state.operation_messages.push({ id: id('msg'), thread_id: threadId, sender_role: senderRole, sender_name: senderName, body, created_at: now() });
      thread.updated_at = now();
      if (senderRole === 'worker') {
        addAdminNotification(state, {
          title: 'Operations Message',
          body: `${worker?.full_name ?? 'Worker'} messaged Operations${gig ? ` about ${gig.client_name}` : ''}.`,
          href: '/admin/operations',
        });
      } else if (senderRole === 'operations') {
        addNotification(state, {
          worker_id: thread.worker_id,
          title: 'Operations replied',
          body: `${senderName} sent an update${gig ? ` for ${gig.client_name}` : ''}.`,
          href: gig ? `/gigs/${gig.id}` : '/gigs/active',
        });
      }
    });
  },

  submitDisbursementProof(disbursementId: string, workerId: string, txid: string, file?: File | null) {
    return mutate(state => {
      const disbursement = state.worker_disbursements.find(d => d.id === disbursementId && d.worker_id === workerId);
      if (!disbursement) throw new Error('Recipient record not found');
      const gig = state.gigs.find(g => g.id === disbursement.gig_id);
      if (!gig || !['funding_confirmed', 'disbursement_in_progress', 'proof_rejected'].includes(gig.funding_status ?? 'unfunded')) {
        throw new Error('Funding must be confirmed before proof can be submitted.');
      }
      const storagePath = file ? `transaction-proofs/${workerId}/${gig.id}/${disbursement.id}/${file.name}` : null;
      disbursement.status = 'sent';
      disbursement.transaction_id = txid;
      disbursement.proof_file_name = file?.name ?? null;
      disbursement.proof_url = storagePath;
      disbursement.sent_at = now();
      disbursement.notes = 'Submitted by worker; awaiting Operations verification.';
      gig.funding_status = 'disbursement_in_progress';
      gig.status = 'in_progress';
      gig.updated_at = now();
      if (storagePath && file) {
        state.storage_objects.unshift({
          id: id('storage'),
          bucket: 'transaction-proofs',
          path: storagePath,
          owner_id: workerId,
          file_name: file.name,
          file_type: file.type || 'application/octet-stream',
          size: file.size,
          entity_type: 'worker_disbursement',
          entity_id: disbursement.id,
          created_at: now(),
        });
      }
      addNotification(state, {
        worker_id: workerId,
        title: 'Proof submitted',
        body: `${disbursement.recipient_name} proof is waiting for Operations review.`,
        href: `/gigs/${gig.id}`,
      });
      addAdminNotification(state, {
        title: 'Proof Submitted',
        body: `${disbursement.recipient_name} proof is ready for review on ${gig.client_name}.`,
        href: '/admin/disbursements',
      });
      addAudit(state, {
        worker_id: workerId,
        event_type: 'disbursement_proof_submitted',
        entity_type: 'worker_disbursement',
        entity_id: disbursement.id,
        summary: `${disbursement.recipient_name} proof submitted for ${gig.client_name}.`,
      });
    });
  },

  verifyDisbursement(disbursementId: string, verified: boolean, note: string) {
    return mutate(state => {
      const disbursement = state.worker_disbursements.find(d => d.id === disbursementId);
      if (!disbursement) throw new Error('Recipient record not found');
      const gig = state.gigs.find(g => g.id === disbursement.gig_id);
      disbursement.status = verified ? 'verified' : 'proof_rejected';
      disbursement.verified_at = verified ? now() : null;
      disbursement.notes = note || (verified ? 'Verified by Operations.' : 'Proof rejected; resubmission required.');
      addPreferredNotification(state, {
        worker_id: disbursement.worker_id,
        title: verified ? 'Disbursement proof verified' : 'Disbursement proof needs correction',
        body: verified
          ? `${disbursement.recipient_name} proof was verified by Operations.`
          : `${disbursement.recipient_name} proof needs correction before approval.`,
        href: `/gigs/${disbursement.gig_id}`,
      }, 'push_disbursement');
      if (gig) {
        const all = state.worker_disbursements.filter(d => d.gig_id === gig.id);
        if (all.length > 0 && all.every(d => d.status === 'verified')) {
          gig.status = 'completed';
          gig.completed_at = now();
          gig.funding_status = 'verified_complete';
          gig.updated_at = now();
          if (gig.worker_id) addPreferredNotification(state, {
            worker_id: gig.worker_id,
            title: 'Gig completed',
            body: `${gig.client_name} is complete. Your fee is included in the transaction records for this gig.`,
            href: `/gigs/${gig.id}`,
          }, 'push_disbursement');
          if (gig.worker_id && !state.commission_ledger.some(c => c.gig_id === gig.id)) {
            state.commission_ledger.unshift({
              id: id('fee'),
              worker_id: gig.worker_id,
              gig_id: gig.id,
              amount: gig.commission_amount,
              status: 'earned',
              settled_at: now(),
              created_at: now(),
            });
          }
        } else if (all.some(d => d.status === 'sent')) {
          gig.funding_status = 'awaiting_verification';
        }
      }
      addAudit(state, {
        worker_id: disbursement.worker_id,
        event_type: verified ? 'disbursement_verified' : 'proof_rejected',
        entity_type: 'worker_disbursement',
        entity_id: disbursement.id,
        summary: `${disbursement.recipient_name} ${verified ? 'verified' : 'proof rejected'}.`,
      });
    });
  },

  settleCommission(commissionId: string) {
    return mutate(state => {
      const commission = state.commission_ledger.find(item => item.id === commissionId);
      if (!commission) throw new Error('Worker fee record not found');
      commission.status = 'settled';
      commission.settled_at = now();
      addAudit(state, {
        worker_id: commission.worker_id,
        event_type: 'worker_fee_settled',
        entity_type: 'commission_ledger',
        entity_id: commission.id,
        summary: 'Worker fee marked as settled.',
      });
    });
  },
};
