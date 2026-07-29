import { useEffect, useMemo, useState } from 'react';
import { localDb } from '../lib/localDb';
import { supabase, supabaseConfig } from '../lib/supabase';
import { AdminNotification } from '../types/database';

export function useAdminNotifications() {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const isLocal = useMemo(() => supabaseConfig.isUsingMock || !supabaseConfig.hasSupabaseCredentials, []);

  function refreshFromLocal() {
    setNotifications(localDb.listAdminNotifications());
  }

  async function refreshFromSupabase(cancelledRef?: { current: boolean }) {
    const { data, error } = await supabase
      .from('admin_notifications')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[paybridge] Failed to load admin notifications', error);
      if (!cancelledRef?.current) setNotifications([]);
      return;
    }

    if (!cancelledRef?.current) setNotifications((data ?? []) as AdminNotification[]);
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
  }, [isLocal]);

  const unreadCount = useMemo(
    () => notifications.filter(notification => !notification.read).length,
    [notifications],
  );

  async function markRead(notificationId: string) {
    if (isLocal) {
      localDb.markAdminNotificationRead(notificationId);
      refreshFromLocal();
      return;
    }

    const { error } = await supabase
      .from('admin_notifications')
      .update({ read: true })
      .eq('id', notificationId);
    if (error) console.error('[paybridge] Failed to mark admin notification read', error);
    await refreshFromSupabase();
  }

  async function markAllRead() {
    if (isLocal) {
      localDb.markAllAdminNotificationsRead();
      refreshFromLocal();
      return;
    }

    const { error } = await supabase
      .from('admin_notifications')
      .update({ read: true })
      .eq('read', false);
    if (error) console.error('[paybridge] Failed to mark admin notifications read', error);
    await refreshFromSupabase();
  }

  return { notifications, unreadCount, markRead, markAllRead, refresh };
}