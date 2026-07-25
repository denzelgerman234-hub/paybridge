import { useEffect, useState } from 'react';
import { localDb } from '../lib/localDb';
import { GigApplication, OperationMessage, OperationThread, WorkerDisbursement, WorkerGig } from '../types/database';

export type GigWithApplication = WorkerGig & { application?: GigApplication | null };

export interface GigDetailRecord {
  gig: WorkerGig;
  application: GigApplication | null;
  disbursements: WorkerDisbursement[];
  thread: OperationThread | null;
  messages: OperationMessage[];
}

export function useGigs(workerId?: string) {
  const [gigs, setGigs] = useState<GigWithApplication[]>([]);
  const [loading, setLoading] = useState(true);

  function refresh() {
    setGigs(localDb.listGigs(workerId));
    setLoading(false);
  }

  useEffect(() => {
    refresh();
    return localDb.subscribe(refresh);
  }, [workerId]);

  async function applyToGig(gigId: string, note: string) {
    if (!workerId) throw new Error('Worker profile required');
    localDb.applyToGig(gigId, workerId, note);
    refresh();
  }

  async function confirmFunding(gigId: string) {
    if (!workerId) throw new Error('Worker profile required');
    localDb.workerConfirmFunding(gigId, workerId);
    refresh();
  }

  async function sendMessage(threadId: string, senderName: string, body: string) {
    localDb.sendMessage(threadId, 'worker', senderName, body);
    refresh();
  }

  async function submitProof(disbursementId: string, txid: string, file?: File | null) {
    if (!workerId) throw new Error('Worker profile required');
    localDb.submitDisbursementProof(disbursementId, workerId, txid, file);
    refresh();
  }

  function getGigDetails(gigId: string): GigDetailRecord | null {
    return localDb.getGig(gigId, workerId);
  }

  return { gigs, loading, applyToGig, confirmFunding, sendMessage, submitProof, getGigDetails, refetch: refresh };
}