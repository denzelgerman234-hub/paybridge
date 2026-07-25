import { useEffect, useMemo, useState } from 'react';
import { localDb } from '../lib/localDb';
import { LocalNotification } from '../types/database';

export function useNotifications(workerId?: string) {
  const [notifications, setNotifications] = useState<LocalNotification[]>([]);

  function refresh() {
    setNotifications(workerId ? localDb.listNotifications(workerId) : []);
  }

  useEffect(() => {
    refresh();
    return localDb.subscribe(refresh);
  }, [workerId]);

  const unreadCount = useMemo(
    () => notifications.filter(notification => !notification.read).length,
    [notifications],
  );

  function markRead(notificationId: string) {
    if (!workerId) return;
    localDb.markNotificationRead(notificationId, workerId);
    refresh();
  }

  function markAllRead() {
    if (!workerId) return;
    localDb.markAllNotificationsRead(workerId);
    refresh();
  }

  return { notifications, unreadCount, markRead, markAllRead, refresh };
}
