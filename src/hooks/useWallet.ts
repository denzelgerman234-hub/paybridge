import { useEffect, useState } from 'react';
import { localDb } from '../lib/localDb';
import { supabase, supabaseConfig } from '../lib/supabase';
import { subscribeToTableRefresh } from '../lib/realtime';
import { CommissionLedger, CommissionPayout, FundingEvent, LocalAuditEvent, StorageObjectRecord } from '../types/database';
import { MOCK_USER_ID } from '../lib/mockData';

export function useWallet(workerId = MOCK_USER_ID) {
  const [commissions, setCommissions] = useState<CommissionLedger[]>([]);
  const [payouts, setPayouts] = useState<CommissionPayout[]>([]);
  const [fundingEvents, setFundingEvents] = useState<FundingEvent[]>([]);
  const [auditEvents, setAuditEvents] = useState<LocalAuditEvent[]>([]);
  const [storageObjects, setStorageObjects] = useState<StorageObjectRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const isLocal = supabaseConfig.isUsingMock || !supabaseConfig.hasSupabaseCredentials;

  function refreshRecords() {
    const state = localDb.snapshot();
    setCommissions(state.commission_ledger.filter(c => c.worker_id === workerId));
    setPayouts([]);
    setFundingEvents(state.funding_events.filter(f => f.worker_id === workerId));
    setAuditEvents(state.audit_events.filter(a => !a.worker_id || a.worker_id === workerId));
    setStorageObjects(state.storage_objects.filter(o => o.owner_id === workerId));
    setLoading(false);
  }

  async function refreshFromSupabase(cancelledRef?: { current: boolean }) {
    setLoading(true);
    try {
      const [commissionResult, payoutResult, fundingResult, auditResult, storageResult] = await Promise.all([
        supabase.from('commission_ledger').select('*').eq('worker_id', workerId).order('created_at', { ascending: false }),
        supabase.from('commission_payouts').select('*').eq('worker_id', workerId).order('requested_at', { ascending: false }),
        supabase.from('funding_events').select('*').eq('worker_id', workerId).order('created_at', { ascending: false }),
        supabase.from('audit_events').select('*').or(`worker_id.is.null,worker_id.eq.${workerId}`).order('created_at', { ascending: false }),
        supabase.from('storage_objects').select('*').eq('owner_id', workerId).order('created_at', { ascending: false }),
      ]);

      if (commissionResult.error) throw commissionResult.error;
      if (payoutResult.error) throw payoutResult.error;
      if (fundingResult.error) throw fundingResult.error;
      if (auditResult.error) throw auditResult.error;
      if (storageResult.error) throw storageResult.error;
      if (cancelledRef?.current) return;

      setCommissions(((commissionResult.data ?? []) as CommissionLedger[]).map(record => ({ ...record, amount: Number(record.amount) })));
      setPayouts(((payoutResult.data ?? []) as CommissionPayout[]).map(record => ({ ...record, amount: Number(record.amount) })));
      setFundingEvents(((fundingResult.data ?? []) as FundingEvent[]).map(record => ({ ...record, amount: Number(record.amount) })));
      setAuditEvents((auditResult.data ?? []) as LocalAuditEvent[]);
      setStorageObjects(((storageResult.data ?? []) as StorageObjectRecord[]).map(record => ({ ...record, size: Number(record.size) })));
    } catch (error) {
      console.error('[paybridge] Failed to load wallet records', error);
      if (!cancelledRef?.current) {
        setCommissions([]);
        setPayouts([]);
        setFundingEvents([]);
        setAuditEvents([]);
        setStorageObjects([]);
      }
    } finally {
      if (!cancelledRef?.current) setLoading(false);
    }
  }

  useEffect(() => {
    const cancelledRef = { current: false };
    if (isLocal) {
      refreshRecords();
      return localDb.subscribe(refreshRecords);
    }

    void refreshFromSupabase(cancelledRef);
    const unsubscribe = subscribeToTableRefresh(
      `worker-wallet:${workerId}`,
      [
        { table: 'funding_events', filter: `worker_id=eq.${workerId}` },
        { table: 'commission_ledger', filter: `worker_id=eq.${workerId}` },
        { table: 'commission_payouts', filter: `worker_id=eq.${workerId}` },
        { table: 'audit_events' },
        { table: 'storage_objects' },
      ],
      () => { void refreshFromSupabase(cancelledRef); }
    );

    return () => { 
      cancelledRef.current = true; 
      unsubscribe();
    };
  }, [workerId, isLocal]);

  const totalEarned = commissions.reduce((sum, c) => sum + Number(c.amount), 0);
  const recordedFees = commissions.filter(c => c.status === 'earned' || c.status === 'settled')
    .reduce((sum, c) => sum + Number(c.amount), 0);
  const totalSettled = commissions.filter(c => c.status === 'settled')
    .reduce((sum, c) => sum + Number(c.amount), 0);
  const paidOut = payouts.filter(p => p.status === 'pending' || p.status === 'processing' || p.status === 'completed')
    .reduce((sum, p) => sum + Number(p.amount), 0);
  const pendingPayout = payouts.filter(p => p.status === 'pending' || p.status === 'processing')
    .reduce((sum, p) => sum + Number(p.amount), 0);
  const totalFunded = fundingEvents.filter(f => f.type === 'deposit')
    .reduce((sum, f) => sum + Number(f.amount), 0);

  return {
    commissions,
    payouts,
    fundingEvents,
    auditEvents,
    storageObjects,
    loading,
    totalEarned,
    totalSettled,
    pendingPayout,
    availableBalance: Math.max(recordedFees - paidOut, 0),
    totalFunded,
    refetch: isLocal ? refreshRecords : refreshFromSupabase,
  };
}