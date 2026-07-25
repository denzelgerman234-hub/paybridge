import { useEffect, useState } from 'react';
import { localDb } from '../lib/localDb';
import { CommissionLedger, CommissionPayout, FundingEvent, LocalAuditEvent, StorageObjectRecord } from '../types/database';
import { MOCK_USER_ID } from '../lib/mockData';

export function useWallet(workerId = MOCK_USER_ID) {
  const [commissions, setCommissions] = useState<CommissionLedger[]>([]);
  const [fundingEvents, setFundingEvents] = useState<FundingEvent[]>([]);
  const [auditEvents, setAuditEvents] = useState<LocalAuditEvent[]>([]);
  const [storageObjects, setStorageObjects] = useState<StorageObjectRecord[]>([]);
  const [loading, setLoading] = useState(true);

  function refreshRecords() {
    const state = localDb.snapshot();
    setCommissions(state.commission_ledger.filter(c => c.worker_id === workerId));
    setFundingEvents(state.funding_events.filter(f => f.worker_id === workerId));
    setAuditEvents(state.audit_events.filter(a => !a.worker_id || a.worker_id === workerId));
    setStorageObjects(state.storage_objects.filter(o => o.owner_id === workerId));
    setLoading(false);
  }

  useEffect(() => {
    refreshRecords();
    return localDb.subscribe(refreshRecords);
  }, [workerId]);

  const totalEarned = commissions.reduce((sum, c) => sum + Number(c.amount), 0);
  const recordedFees = commissions.filter(c => c.status === 'earned' || c.status === 'settled')
    .reduce((sum, c) => sum + Number(c.amount), 0);
  const totalFunded = fundingEvents.filter(f => f.type === 'deposit')
    .reduce((sum, f) => sum + Number(f.amount), 0);

  return {
    commissions,
    payouts: [] as CommissionPayout[],
    fundingEvents,
    auditEvents,
    storageObjects,
    loading,
    totalEarned,
    totalSettled: recordedFees,
    pendingPayout: 0,
    availableBalance: recordedFees,
    totalFunded,
    refetch: refreshRecords,
  };
}

