import { useEffect, useMemo, useState } from 'react';
import { localDb } from '../lib/localDb';
import { supabase, supabaseConfig } from '../lib/supabase';
import { LocalNotification } from '../types/database';

function useLocalNotifications() {
  return supabaseConfig.isUsingMock || !supabaseConfig.hasSupabaseCredentials;
}

export function useNotifications(workerId?: string) {
  const [notifications, setNotifications] = useState<LocalNotification[]>([]);
  const isLocal = useMemo(useLocalNotifications, []);

  async function refreshFromSupabase(cancelledRef?: { current: boolean }) {
    if (!workerId) {
      setNotifications([]);
      return;
    }

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('worker_id', workerId)
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
      refreshFromLocal();
      return localDb.subscribe(refreshFromLocal);
    }

    void refreshFromSupabase(cancelledRef);
    return () => { cancelledRef.current = true; };
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

  return { notifications, unreadCount, markRead, markAllRead, refresh };
}
