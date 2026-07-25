import { useEffect, useMemo, useState } from 'react';
import { localDb } from '../lib/localDb';
import { AdminNotification } from '../types/database';

export function useAdminNotifications() {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);

  function refresh() {
    setNotifications(localDb.listAdminNotifications());
  }

  useEffect(() => {
    refresh();
    return localDb.subscribe(refresh);
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter(notification => !notification.read).length,
    [notifications],
  );

  function markRead(notificationId: string) {
    localDb.markAdminNotificationRead(notificationId);
    refresh();
  }

  function markAllRead() {
    localDb.markAllAdminNotificationsRead();
    refresh();
  }

  return { notifications, unreadCount, markRead, markAllRead, refresh };
}
