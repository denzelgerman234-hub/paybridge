import { useEffect, useMemo, useState } from 'react';
import { localDb } from '../lib/localDb';
import { supabase, supabaseConfig } from '../lib/supabase';
import { LocalNotification, WorkerKycSubmission } from '../types/database';

const KYC_REMINDER_HOURS = 12;
const KYC_REMINDER_TITLES = ['Complete your KYC to unlock gigs', 'KYC updates required', 'KYC needs updates'];

function useLocalNotifications() {
  return supabaseConfig.isUsingMock || !supabaseConfig.hasSupabaseCredentials;
}

function reminderDue(anchor?: string | null) {
  if (!anchor) return true;
  return Date.now() >= new Date(anchor).getTime() + KYC_REMINDER_HOURS * 60 * 60 * 1000;
}

export function useNotifications(workerId?: string) {
  const [notifications, setNotifications] = useState<LocalNotification[]>([]);
  const isLocal = useMemo(useLocalNotifications, []);

  async function ensureKycReminderFromSupabase() {
    if (!workerId) return;

    const [{ data: submissions, error: submissionError }, { data: kycNotifications, error: notificationError }] = await Promise.all([
      supabase
        .from('worker_kyc_submissions')
        .select('*')
        .eq('worker_id', workerId)
        .order('submitted_at', { ascending: false })
        .limit(1),
      supabase
        .from('notifications')
        .select('id,title,created_at')
        .eq('worker_id', workerId)
        .in('title', KYC_REMINDER_TITLES)
        .order('created_at', { ascending: false })
        .limit(1),
    ]);

    if (submissionError || notificationError) {
      console.error('[paybridge] Failed to evaluate KYC reminder', submissionError || notificationError);
      return;
    }

    const latestSubmission = ((submissions ?? []) as WorkerKycSubmission[])[0] ?? null;
    if (latestSubmission && ['submitted', 'in_review', 'verified'].includes(latestSubmission.status)) return;

    const latestKycNotice = (kycNotifications ?? [])[0] as Pick<LocalNotification, 'title' | 'created_at'> | undefined;
    const anchor = latestSubmission?.reviewed_at ?? latestKycNotice?.created_at ?? null;
    if (!reminderDue(anchor)) return;

    const isRejected = latestSubmission?.status === 'rejected';
    const { error } = await supabase.from('notifications').insert({
      worker_id: workerId,
      title: isRejected ? 'KYC updates required' : 'Complete your KYC to unlock gigs',
      body: isRejected
        ? 'Your KYC package needs updated documents before you can receive gigs. Please review the feedback and resubmit from Account > KYC.'
        : 'Please submit your identity document and tax details so Operations can verify your account. Verified workers can receive gig assignments and payouts.',
      href: '/account',
    });
    if (error) console.error('[paybridge] Failed to create KYC reminder', error);
  }

  async function refreshFromSupabase(cancelledRef?: { current: boolean }) {
    if (!workerId) {
      setNotifications([]);
      return;
    }

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('worker_id', workerId)
      .is('cleared_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[paybridge] Failed to load notifications', error);
      if (!cancelledRef?.current) setNotifications([]);
      return;
    }

    if (!cancelledRef?.current) setNotifications((data ?? []) as LocalNotification[]);
  }

  function refreshFromLocal() {
    setNotifications(workerId ? localDb.listNotifications(workerId) : []);
  }

  function refresh() {
    if (isLocal) {
      refreshFromLocal();
      return;
    }
    void refreshFromSupabase();
  }

  useEffect(() => {
    const cancelledRef = { current: false };

    if (isLocal) {
      if (workerId) localDb.ensureKycReminder(workerId);
      refreshFromLocal();
      return localDb.subscribe(refreshFromLocal);
    }

    void (async () => {
      await ensureKycReminderFromSupabase();
      await refreshFromSupabase(cancelledRef);
    })();

    // Subscribe to real-time changes for this worker's notifications so the
    // UI updates automatically without requiring a page reload.
    let unsubscribeRealtime: (() => void) | undefined;
    if (workerId && typeof supabase.channel === 'function') {
      const channelName = `notifications-worker-${workerId}`;
      let channel = supabase.channel(channelName);
      channel = channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `worker_id=eq.${workerId}`,
        },
        () => { void refreshFromSupabase(cancelledRef); },
      );
      const subscribed = channel.subscribe();
      unsubscribeRealtime = () => { void supabase.removeChannel(subscribed); };
    }

    return () => {
      cancelledRef.current = true;
      unsubscribeRealtime?.();
    };
  }, [workerId, isLocal]);

  const unreadCount = useMemo(
    () => notifications.filter(notification => !notification.read).length,
    [notifications],
  );

  async function markRead(notificationId: string) {
    if (!workerId) return;
    if (isLocal) {
      localDb.markNotificationRead(notificationId, workerId);
      refreshFromLocal();
      return;
    }

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)
      .eq('worker_id', workerId);
    if (error) console.error('[paybridge] Failed to mark notification read', error);
    await refreshFromSupabase();
  }

  async function markAllRead() {
    if (!workerId) return;
    if (isLocal) {
      localDb.markAllNotificationsRead(workerId);
      refreshFromLocal();
      return;
    }

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('worker_id', workerId)
      .eq('read', false);
    if (error) console.error('[paybridge] Failed to mark notifications read', error);
    await refreshFromSupabase();
  }

  async function clearNotifications() {
    if (!workerId) return;
    if (isLocal) {
      localDb.clearNotifications(workerId);
      refreshFromLocal();
      return;
    }

    const { error } = await supabase
      .from('notifications')
      .update({ read: true, cleared_at: new Date().toISOString() })
      .eq('worker_id', workerId)
      .is('cleared_at', null);
    if (error) console.error('[paybridge] Failed to clear notifications', error);
    await refreshFromSupabase();
  }

  return { notifications, unreadCount, markRead, markAllRead, clearNotifications, refresh };
}
