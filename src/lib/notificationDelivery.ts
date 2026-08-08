import { supabase } from './supabase';
import { BadgeTier, NotificationPreference, WorkerGig, WorkerProfile } from '../types/database';

type NotificationPreferenceKey = keyof Omit<NotificationPreference, 'id' | 'worker_id'>;
type DeliveryChannel = 'email' | 'sms';

export type WorkerNotificationKind =
  | 'new_gig'
  | 'disbursement_update'
  | 'fee_record_update'
  | 'compliance_alert'
  | 'badge_update';

interface WorkerNotificationInput {
  workerId: string;
  kind: WorkerNotificationKind;
  title: string;
  body: string;
  href?: string;
}

interface ChannelRule {
  channel: 'push' | DeliveryChannel;
  preferenceKey: NotificationPreferenceKey;
}

const BADGE_ORDER: BadgeTier[] = ['trainee', 'associate', 'senior', 'expert', 'master'];

const DEFAULT_PREFERENCES: Omit<NotificationPreference, 'id' | 'worker_id'> = {
  email_new_gig: true,
  email_disbursement: true,
  email_fee_record: true,
  email_compliance: true,
  email_badge: true,
  sms_disbursement: false,
  push_new_gig: true,
  push_disbursement: true,
  push_compliance: true,
  push_badge: true,
};

const KIND_RULES: Record<WorkerNotificationKind, ChannelRule[]> = {
  new_gig: [
    { channel: 'push', preferenceKey: 'push_new_gig' },
    { channel: 'email', preferenceKey: 'email_new_gig' },
  ],
  disbursement_update: [
    { channel: 'push', preferenceKey: 'push_disbursement' },
    { channel: 'email', preferenceKey: 'email_disbursement' },
    { channel: 'sms', preferenceKey: 'sms_disbursement' },
  ],
  fee_record_update: [
    { channel: 'email', preferenceKey: 'email_fee_record' },
  ],
  compliance_alert: [
    { channel: 'push', preferenceKey: 'push_compliance' },
    { channel: 'email', preferenceKey: 'email_compliance' },
  ],
  badge_update: [
    { channel: 'push', preferenceKey: 'push_badge' },
    { channel: 'email', preferenceKey: 'email_badge' },
  ],
};

function throwIfError(error: any) {
  if (error) throw error;
}

function mergePreferences(preference: NotificationPreference | null | undefined) {
  return { ...DEFAULT_PREFERENCES, ...(preference ?? {}) } as NotificationPreference;
}

async function getWorkerPreferences(workerId: string) {
  const { data, error } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('worker_id', workerId);

  if (error) {
    console.error('[paybridge] Failed to load notification preferences; using defaults', error);
    return mergePreferences(null);
  }

  return mergePreferences(((data ?? []) as NotificationPreference[])[0] ?? null);
}

async function queueDelivery(input: WorkerNotificationInput, channel: DeliveryChannel, preferenceKey: NotificationPreferenceKey) {
  const { error } = await supabase.from('notification_delivery_events').insert({
    worker_id: input.workerId,
    channel,
    preference_key: preferenceKey,
    title: input.title,
    body: input.body,
    href: input.href ?? null,
    status: 'queued',
  });

  if (error) console.error('[paybridge] Failed to queue notification delivery', error);
}

export async function sendWorkerNotification(input: WorkerNotificationInput) {
  try {
    const preferences = await getWorkerPreferences(input.workerId);
    const rules = KIND_RULES[input.kind];
    const pushRule = rules.find(rule => rule.channel === 'push');

    if (pushRule && preferences[pushRule.preferenceKey]) {
      const { error } = await supabase.from('notifications').insert({
        worker_id: input.workerId,
        title: input.title,
        body: input.body,
        href: input.href ?? '/',
      });
      if (error) console.error('[paybridge] Failed to create in-app notification', error);
    }

    await Promise.all(
      rules
        .filter((rule): rule is ChannelRule & { channel: DeliveryChannel } => rule.channel === 'email' || rule.channel === 'sms')
        .filter(rule => preferences[rule.preferenceKey])
        .map(rule => queueDelivery(input, rule.channel, rule.preferenceKey)),
    );
  } catch (error) {
    console.error('[paybridge] Worker notification skipped after unexpected error', error);
  }
}

function badgeMeetsRequirement(workerBadge: BadgeTier, required: BadgeTier | null | undefined) {
  if (!required) return true;
  return BADGE_ORDER.indexOf(workerBadge) >= BADGE_ORDER.indexOf(required);
}

export async function notifyEligibleWorkersOfNewGig(gig: WorkerGig) {
  const { data, error } = await supabase
    .from('worker_profiles')
    .select('id,badge,onboarding_completed,account_health');

  if (error) {
    console.error('[paybridge] Failed to load eligible workers for gig notification', error);
    return;
  }

  const workers = ((data ?? []) as Pick<WorkerProfile, 'id' | 'badge' | 'onboarding_completed' | 'account_health'>[])
    .filter(worker => worker.onboarding_completed)
    .filter(worker => worker.account_health === 'healthy')
    .filter(worker => badgeMeetsRequirement(worker.badge, gig.badge_required));

  await Promise.all(workers.map(worker => sendWorkerNotification({
    workerId: worker.id,
    kind: 'new_gig',
    title: 'New gig available',
    body: `${gig.client_name} is open for eligible workers. Review the principal, deadline, and disbursement methods before applying.`,
    href: `/gigs/${gig.id}`,
  })));
}