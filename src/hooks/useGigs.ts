import { useEffect, useMemo, useState } from 'react';
import { localDb } from '../lib/localDb';
import { supabase, supabaseConfig } from '../lib/supabase';
import { GigApplication, OperationMessage, OperationThread, WorkerDisbursement, WorkerGig } from '../types/database';

export type GigWithApplication = WorkerGig & { application?: GigApplication | null };

export interface GigDetailRecord {
  gig: WorkerGig;
  application: GigApplication | null;
  disbursements: WorkerDisbursement[];
  thread: OperationThread | null;
  messages: OperationMessage[];
}

function useLocalGigs() {
  return supabaseConfig.isUsingMock || !supabaseConfig.hasSupabaseCredentials;
}

function normalizeGig(row: any): WorkerGig {
  return {
    ...row,
    total_principal: Number(row.total_principal ?? 0),
    commission_rate: Number(row.commission_rate ?? 0),
    commission_amount: Number(row.commission_amount ?? 0),
    recipient_count: Number(row.recipient_count ?? 0),
    disbursement_methods: Array.isArray(row.disbursement_methods) ? row.disbursement_methods : [],
    funded: Boolean(row.funded),
  } as WorkerGig;
}

function normalizeDisbursement(row: any): WorkerDisbursement {
  return {
    ...row,
    amount: Number(row.amount ?? 0),
  } as WorkerDisbursement;
}

function byCreatedDesc<T extends { created_at?: string; submitted_at?: string }>(a: T, b: T) {
  return (b.created_at ?? b.submitted_at ?? '').localeCompare(a.created_at ?? a.submitted_at ?? '');
}

export function useGigs(workerId?: string) {
  const [gigs, setGigs] = useState<GigWithApplication[]>([]);
  const [details, setDetails] = useState<Record<string, GigDetailRecord>>({});
  const [loading, setLoading] = useState(true);
  const isLocal = useMemo(useLocalGigs, []);

  async function refreshFromSupabase(cancelledRef?: { current: boolean }) {
    setLoading(true);

    const { data: gigRows, error: gigsError } = await supabase
      .from('worker_gigs')
      .select('*')
      .order('created_at', { ascending: false });

    if (gigsError) {
      console.error('[paybridge] Failed to load Supabase gigs', gigsError);
      if (!cancelledRef?.current) {
        setGigs([]);
        setDetails({});
        setLoading(false);
      }
      return;
    }

    const normalizedGigs = (gigRows ?? []).map(normalizeGig);
    const gigIds = normalizedGigs.map((gig: WorkerGig) => gig.id);

    let applications: GigApplication[] = [];
    if (workerId) {
      const { data, error } = await supabase
        .from('gig_applications')
        .select('*')
        .eq('worker_id', workerId);
      if (error) console.error('[paybridge] Failed to load gig applications', error);
      applications = (data ?? []) as GigApplication[];
    }

    let threads: OperationThread[] = [];
    if (workerId && gigIds.length > 0) {
      const { data, error } = await supabase
        .from('operation_threads')
        .select('*')
        .eq('worker_id', workerId)
        .in('gig_id', gigIds);
      if (error) console.error('[paybridge] Failed to load operation threads', error);
      threads = (data ?? []) as OperationThread[];
    }

    let messages: OperationMessage[] = [];
    const threadIds = threads.map(thread => thread.id);
    if (threadIds.length > 0) {
      const { data, error } = await supabase
        .from('operation_messages')
        .select('*')
        .in('thread_id', threadIds)
        .order('created_at', { ascending: true });
      if (error) console.error('[paybridge] Failed to load operation messages', error);
      messages = (data ?? []) as OperationMessage[];
    }

    let disbursements: WorkerDisbursement[] = [];
    if (workerId && gigIds.length > 0) {
      const { data, error } = await supabase
        .from('worker_disbursements')
        .select('*')
        .eq('worker_id', workerId)
        .in('gig_id', gigIds)
        .order('created_at', { ascending: true });
      if (error) console.error('[paybridge] Failed to load disbursements', error);
      disbursements = (data ?? []).map(normalizeDisbursement);
    }

    const applicationByGig = new Map(applications.map(application => [application.gig_id, application]));
    const threadByGig = new Map(threads.map(thread => [thread.gig_id, thread]));
    const messagesByThread = new Map<string, OperationMessage[]>();
    messages.forEach(message => {
      const group = messagesByThread.get(message.thread_id) ?? [];
      group.push(message);
      messagesByThread.set(message.thread_id, group);
    });
    const disbursementsByGig = new Map<string, WorkerDisbursement[]>();
    disbursements.forEach(disbursement => {
      const group = disbursementsByGig.get(disbursement.gig_id) ?? [];
      group.push(disbursement);
      disbursementsByGig.set(disbursement.gig_id, group);
    });

    const nextGigs = normalizedGigs
      .map((gig: WorkerGig) => ({ ...gig, application: applicationByGig.get(gig.id) ?? null }))
      .sort(byCreatedDesc);
    const nextDetails = Object.fromEntries(nextGigs.map((gig: GigWithApplication) => {
      const thread = threadByGig.get(gig.id) ?? null;
      return [gig.id, {
        gig,
        application: applicationByGig.get(gig.id) ?? null,
        disbursements: disbursementsByGig.get(gig.id) ?? [],
        thread,
        messages: thread ? messagesByThread.get(thread.id) ?? [] : [],
      } satisfies GigDetailRecord];
    }));

    if (!cancelledRef?.current) {
      setGigs(nextGigs);
      setDetails(nextDetails);
      setLoading(false);
    }
  }

  function refreshFromLocal() {
    const nextGigs = localDb.listGigs(workerId);
    setGigs(nextGigs);
    setDetails(Object.fromEntries(nextGigs.map(gig => [gig.id, localDb.getGig(gig.id, workerId)]).filter((entry): entry is [string, GigDetailRecord] => Boolean(entry[1]))));
    setLoading(false);
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

  async function applyToGig(gigId: string, note: string) {
    if (!workerId) throw new Error('Worker profile required');
    if (isLocal) {
      localDb.applyToGig(gigId, workerId, note);
      refreshFromLocal();
      return;
    }

    const gig = gigs.find(item => item.id === gigId);
    const { data: profile } = await supabase
      .from('worker_profiles')
      .select('full_name')
      .eq('id', workerId)
      .maybeSingle();
    const { error } = await supabase.from('gig_applications').upsert({
      gig_id: gigId,
      worker_id: workerId,
      worker_name: profile?.full_name || 'Worker',
      status: 'submitted',
      note,
      review_note: null,
      reviewed_by: null,
    }, { onConflict: 'gig_id,worker_id' });
    if (error) throw error;
    if (gig) await refreshFromSupabase();
  }

  async function confirmFunding(gigId: string) {
    if (!workerId) throw new Error('Worker profile required');
    if (isLocal) {
      localDb.workerConfirmFunding(gigId, workerId);
      refreshFromLocal();
      return;
    }

    const { error } = await supabase.functions.invoke('worker-confirm-funding', {
      body: { gig_id: gigId },
    });
    if (error) throw error;
    await refreshFromSupabase();
  }

  async function sendMessage(threadId: string, senderName: string, body: string) {
    if (isLocal) {
      localDb.sendMessage(threadId, 'worker', senderName, body);
      refreshFromLocal();
      return;
    }

    const { error } = await supabase.from('operation_messages').insert({
      thread_id: threadId,
      sender_role: 'worker',
      sender_name: senderName,
      body,
    });
    if (error) throw error;
    await refreshFromSupabase();
  }

  async function submitProof(disbursementId: string, txid: string, file?: File | null) {
    if (!workerId) throw new Error('Worker profile required');
    if (isLocal) {
      localDb.submitDisbursementProof(disbursementId, workerId, txid, file);
      refreshFromLocal();
      return;
    }

    let proofUrl = `manual-reference:${txid}`;
    if (file) {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const storagePath = `${workerId}/${disbursementId}/${Date.now()}-${safeName}`;
      const { error: uploadError } = await supabase.storage
        .from('transaction-proofs')
        .upload(storagePath, file, { upsert: true, contentType: file.type || undefined });
      if (uploadError) throw uploadError;
      proofUrl = storagePath;
    }

    const { error: functionError } = await supabase.functions.invoke('submit-disbursement-proof', {
      body: {
        disbursement_id: disbursementId,
        proof_url: proofUrl,
        transaction_id: txid,
        notes: file ? `Uploaded proof file: ${file.name}` : null,
      },
    });
    if (functionError) throw functionError;
    await refreshFromSupabase();
  }

  function getGigDetails(gigId: string): GigDetailRecord | null {
    if (isLocal) return localDb.getGig(gigId, workerId);
    return details[gigId] ?? null;
  }

  return { gigs, loading, applyToGig, confirmFunding, sendMessage, submitProof, getGigDetails, refetch: refresh };
}


