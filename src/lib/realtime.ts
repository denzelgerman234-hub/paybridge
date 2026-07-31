import { supabase } from './supabase';

type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

interface TableSubscription {
  table: string;
  event?: RealtimeEvent;
  filter?: string;
}

export function subscribeToTableRefresh(channelName: string, subscriptions: TableSubscription[], refresh: () => void) {
  if (typeof supabase.channel !== 'function' || typeof supabase.removeChannel !== 'function') {
    return () => undefined;
  }

  let channel = supabase.channel(channelName);
  subscriptions.forEach(subscription => {
    channel = channel.on(
      'postgres_changes',
      {
        event: subscription.event ?? '*',
        schema: 'public',
        table: subscription.table,
        ...(subscription.filter ? { filter: subscription.filter } : {}),
      },
      refresh,
    );
  });

  const subscribed = channel.subscribe();
  return () => {
    void supabase.removeChannel(subscribed);
  };
}
