import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { subscribeToTableRefresh } from '../lib/realtime';
import { AdminNotification } from '../types/database';

export function useAdminNotifications() {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);

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
    void refreshFromSupabase();
  }

  useEffect(() => {
    const cancelledRef = { current: false };
    void refreshFromSupabase(cancelledRef);
    const unsubscribe = subscribeToTableRefresh(
      'admin-notifications',
      [{ table: 'admin_notifications' }],
      () => { void refreshFromSupabase(cancelledRef); },
    );
    return () => {
      cancelledRef.current = true;
      unsubscribe();
    };
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter(notification => !notification.read).length,
    [notifications],
  );

  async function markRead(notificationId: string) {
    const { error } = await supabase
      .from('admin_notifications')
      .update({ read: true })
      .eq('id', notificationId);
    if (error) console.error('[paybridge] Failed to mark admin notification read', error);
    await refreshFromSupabase();
  }

  async function markAllRead() {
    const { error } = await supabase
      .from('admin_notifications')
      .update({ read: true })
      .eq('read', false);
    if (error) console.error('[paybridge] Failed to mark admin notifications read', error);
    await refreshFromSupabase();
  }

  return { notifications, unreadCount, markRead, markAllRead, refresh };
}