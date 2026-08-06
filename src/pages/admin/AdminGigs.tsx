import { useEffect, useState } from 'react';
import { RiAddLine, RiSearchLine, RiMoneyDollarCircleLine, RiCloseLine, RiCheckLine } from 'react-icons/ri';
import { supabase } from '../../lib/supabase';
import { GigApplication, WorkerDisbursement, WorkerGig, WorkerProfile } from '../../types/database';
import { formatCurrency, formatRelativeTime } from '../../lib/utils';
import toast from 'react-hot-toast';
import { DISBURSEMENT_METHODS } from '../../lib/constants';
import { BeneficiaryDestinationFields } from '../../components/admin/BeneficiaryDestinationFields';
import { hasRequiredDestinationFields } from '../../lib/beneficiaryDestination';
import { notifyEligibleWorkersOfNewGig, sendWorkerNotification } from '../../lib/notificationDelivery';

const EMPTY_GIG: Partial<WorkerGig> = {
  client_name: '', client_contact: '', total_principal: 0, commission_rate: 10,
  recipient_count: 0, disbursement_methods: [], badge_required: null,
  deadline: '', notes: '', funded: false,
};

const MAX_BENEFICIARIES = 5;
type BeneficiaryForm = Pick<WorkerDisbursement, 'recipient_name' | 'amount' | 'method' | 'destination'>;
type AdminWorker = WorkerProfile & { email?: string | null };
type AdminGigApplication = GigApplication & { gig?: WorkerGig | null; worker?: AdminWorker | null };
type GigBeneficiary = BeneficiaryForm & { id: string; gig_id: string; created_at: string };

function emptyBeneficiary(): BeneficiaryForm {
  return { recipient_name: '', amount: 0, method: 'bank_transfer', destination: '' };
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

function normalizeWorker(row: any): AdminWorker {
  return {
    ...row,
    total_gigs_completed: Number(row.total_gigs_completed ?? 0),
    total_disbursed: Number(row.total_disbursed ?? 0),
    total_earned: Number(row.total_earned ?? 0),
    rating: Number(row.rating ?? 0),
  } as AdminWorker;
}

function throwIfError(error: any) {
  if (error) throw error;
}

export function AdminGigs() {
  const [gigs, setGigs] = useState<WorkerGig[]>([]);
  const [applications, setApplications] = useState<AdminGigApplication[]>([]);
  const [workers, setWorkers] = useState<AdminWorker[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [showFund, setShowFund] = useState<WorkerGig | null>(null);
  const [form, setForm] = useState({ ...EMPTY_GIG, methods: [] as string[] });
  const [beneficiaries, setBeneficiaries] = useState<BeneficiaryForm[]>([]);
  const [fundRef, setFundRef] = useState('');
  const [busy, setBusy] = useState(false);
  // Post-funding beneficiary assignment
  const [showBeneficiaries, setShowBeneficiaries] = useState<WorkerGig | null>(null);
  const [beneficiariesForGig, setBeneficiariesForGig] = useState<BeneficiaryForm[]>([]);
  const [disbCountByGig, setDisbCountByGig] = useState<Map<string, number>>(new Map());

  async function refresh() {
    setLoading(true);
    try {
      const [gigsResult, appsResult, workersResult, workerAppsResult, disbResult] = await Promise.all([
        supabase.from('worker_gigs').select('*').order('created_at', { ascending: false }),
        supabase.from('gig_applications').select('*').order('submitted_at', { ascending: false }),
        supabase.from('worker_profiles').select('*').order('full_name', { ascending: true }),
        supabase.from('worker_applications').select('worker_id,email,status').eq('status', 'approved'),
        supabase.from('worker_disbursements').select('gig_id'),
      ]);

      throwIfError(gigsResult.error);
      throwIfError(appsResult.error);
      throwIfError(workersResult.error);
      throwIfError(workerAppsResult.error);

      const nextGigs: WorkerGig[] = (gigsResult.data ?? []).map(normalizeGig);
      const gigById = new Map(nextGigs.map(gig => [gig.id, gig]));
      const emailByWorkerId = new Map((workerAppsResult.data ?? []).map((item: any) => [item.worker_id, item.email]));
      const nextWorkers: AdminWorker[] = (workersResult.data ?? []).map((worker: any) => ({ ...normalizeWorker(worker), email: emailByWorkerId.get(worker.id) ?? null }));
      const workerById = new Map(nextWorkers.map(worker => [worker.id, worker]));
      const nextApplications = (appsResult.data ?? []).map((app: any) => ({
        ...app,
        gig: gigById.get(app.gig_id) ?? null,
        worker: workerById.get(app.worker_id) ?? null,
      })) as AdminGigApplication[];

      // Build disbursement counts per gig so we can gate the "Add Beneficiaries" button
      const nextDisbCount = new Map<string, number>();
      ((disbResult.data ?? []) as { gig_id: string }[]).forEach(row => {
        nextDisbCount.set(row.gig_id, (nextDisbCount.get(row.gig_id) ?? 0) + 1);
      });

      setGigs(nextGigs);
      setWorkers(nextWorkers);
      setApplications(nextApplications);
      setDisbCountByGig(nextDisbCount);
    } catch (error) {
      console.error('[paybridge] Failed to load admin gigs', error);
      toast.error(error instanceof Error ? error.message : 'Could not load gigs');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void refresh(); }, []);

  useEffect(() => {
    if (showCreate && beneficiaries.length === 0) setBeneficiaries([emptyBeneficiary()]);
  }, [showCreate, beneficiaries.length]);

  const filtered = gigs
    .filter(g => filter === 'all' || g.status === filter)
    .filter(g => !search || g.client_name.toLowerCase().includes(search.toLowerCase()));

  const pendingApplications = applications.filter(app => app.status === 'submitted' || app.status === 'under_review');
  const commissionAmt = (form.total_principal || 0) * ((form.commission_rate || 10) / 100);
  const cleanBeneficiaries = beneficiaries
    .map(item => ({ ...item, recipient_name: item.recipient_name.trim(), destination: item.destination.trim(), amount: Number(item.amount) || 0 }))
    .filter(item => item.recipient_name || item.destination || item.amount > 0);

  async function createGig() {
    if (!form.client_name || !form.total_principal || !form.deadline) {
      toast.error('Fill in required fields'); return;
    }
    if (cleanBeneficiaries.some(item => !item.recipient_name || !item.destination || !item.amount)) {
      toast.error('Complete each beneficiary or remove the blank rows'); return;
    }
    if (cleanBeneficiaries.some(item => !hasRequiredDestinationFields(item.method, item.destination))) {
      toast.error('Complete the required destination fields for each beneficiary'); return;
    }

    setBusy(true);
    try {
      const recipientCount = Math.min(MAX_BENEFICIARIES, Math.max(Number(form.recipient_count) || cleanBeneficiaries.length || 1, cleanBeneficiaries.length));
      const { data: gig, error } = await supabase
        .from('worker_gigs')
        .insert({
          client_name: form.client_name.trim(),
          client_contact: form.client_contact?.trim() || null,
          total_principal: Number(form.total_principal),
          commission_rate: Number(form.commission_rate) || 10,
          recipient_count: recipientCount,
          disbursement_methods: form.methods,
          badge_required: form.badge_required || null,
          deadline: new Date(form.deadline).toISOString(),
          notes: form.notes?.trim() || null,
          funded: false,
          funding_status: 'unfunded',
          status: 'open',
        })
        .select('*')
        .single();
      throwIfError(error);

      await notifyEligibleWorkersOfNewGig(gig as WorkerGig);

      if (cleanBeneficiaries.length > 0) {
        const { error: beneficiaryError } = await supabase.from('gig_beneficiaries').insert(
          cleanBeneficiaries.map(item => ({
            gig_id: gig.id,
            recipient_name: item.recipient_name,
            amount: item.amount,
            method: item.method,
            destination: item.destination,
          })),
        );
        throwIfError(beneficiaryError);
      }

      setForm({ ...EMPTY_GIG, methods: [] });
      setBeneficiaries([]);
      setShowCreate(false);
      await refresh();
      toast.success('Gig created');
    } catch (error) {
      console.error('[paybridge] Failed to create gig', error);
      toast.error(error instanceof Error ? error.message : 'Could not create gig');
    } finally {
      setBusy(false);
    }
  }

  async function fundGig(gig: WorkerGig) {
    if (!fundRef.trim()) { toast.error('Enter a funding reference'); return; }
    if (!gig.worker_id) { toast.error('Assign the gig before recording dedicated account funding'); return; }

    setBusy(true);
    try {
      const now = new Date().toISOString();
      const { error: gigError } = await supabase
        .from('worker_gigs')
        .update({ funded: true, funded_at: now, funding_status: 'funded', status: 'funded' })
        .eq('id', gig.id);
      throwIfError(gigError);

      const { error: fundingError } = await supabase.from('funding_events').insert({
        gig_id: gig.id,
        worker_id: gig.worker_id,
        amount: gig.total_principal,
        type: 'deposit',
        reference: fundRef.trim(),
        confirmed: true,
        confirmed_at: now,
      });
      throwIfError(fundingError);

      await sendWorkerNotification({
        workerId: gig.worker_id,
        kind: 'disbursement_update',
        title: 'Principal funding marked sent',
        body: `${gig.client_name}: confirm funds are visible in your dedicated account before sending.`,
        href: `/gigs/${gig.id}`,
      });

      setShowFund(null);
      setFundRef('');
      await refresh();
      toast.success(`${gig.client_name} funding recorded - ${formatCurrency(gig.total_principal)}`);
    } catch (error) {
      console.error('[paybridge] Failed to record funding', error);
      toast.error(error instanceof Error ? error.message : 'Could not record funding');
    } finally {
      setBusy(false);
    }
  }

  async function materializeBeneficiaries(gigId: string, workerId: string) {
    const { data: existing, error: existingError } = await supabase
      .from('worker_disbursements')
      .select('id')
      .eq('gig_id', gigId);
    throwIfError(existingError);
    if ((existing ?? []).length > 0) return;

    const { data: drafts, error: draftsError } = await supabase
      .from('gig_beneficiaries')
      .select('*')
      .eq('gig_id', gigId)
      .order('created_at', { ascending: true });
    throwIfError(draftsError);

    const rows = ((drafts ?? []) as GigBeneficiary[]).map(item => ({
      gig_id: gigId,
      worker_id: workerId,
      recipient_name: item.recipient_name,
      amount: Number(item.amount),
      method: item.method,
      destination: item.destination,
      status: 'pending',
      transaction_id: null,
      proof_url: null,
      notes: null,
    }));

    if (rows.length > 0) {
      const { error } = await supabase.from('worker_disbursements').insert(rows);
      throwIfError(error);
    }
  }

  async function reviewApplication(app: AdminGigApplication, status: 'under_review' | 'accepted' | 'declined') {
    setBusy(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const reviewedBy = userData?.user?.id ?? null;
      const now = new Date().toISOString();
      const reviewNote = status === 'accepted'
        ? 'Worker matches requirements.'
        : status === 'declined'
          ? 'Worker does not match the current requirements.'
          : 'Moderator is reviewing this application.';

      if (status === 'under_review' || status === 'declined') {
        const { error } = await supabase
          .from('gig_applications')
          .update({ status, review_note: reviewNote, reviewed_by: reviewedBy, reviewed_at: now })
          .eq('id', app.id);
        throwIfError(error);
        await refresh();
        toast.success(status === 'declined' ? 'Application declined' : 'Application marked in review');
        return;
      }

      const { error: gigError } = await supabase
        .from('worker_gigs')
        .update({
          worker_id: app.worker_id,
          status: 'accepted',
          accepted_at: now,
          operations_specialist: 'Operations',
        })
        .eq('id', app.gig_id);
      throwIfError(gigError);

      const { error: appError } = await supabase
        .from('gig_applications')
        .update({ status: 'accepted', review_note: reviewNote, reviewed_by: reviewedBy, reviewed_at: now })
        .eq('id', app.id);
      throwIfError(appError);

      const { error: declineError } = await supabase
        .from('gig_applications')
        .update({ status: 'declined', review_note: 'Gig assigned to another worker.', reviewed_by: reviewedBy, reviewed_at: now })
        .eq('gig_id', app.gig_id)
        .neq('id', app.id)
        .in('status', ['submitted', 'under_review']);
      throwIfError(declineError);

      const { data: thread, error: threadError } = await supabase
        .from('operation_threads')
        .upsert({
          gig_id: app.gig_id,
          worker_id: app.worker_id,
          specialist_name: 'Operations',
          status: 'open',
        }, { onConflict: 'gig_id,worker_id' })
        .select('*')
        .single();
      throwIfError(threadError);

      const { error: messageError } = await supabase.from('operation_messages').insert({
        thread_id: thread.id,
        sender_role: 'operations',
        sender_name: 'Operations',
        body: `You have been accepted for ${app.gig?.client_name ?? 'this gig'}. Operations will coordinate funding status, recipient instructions, and proof review here.`,
      });
      throwIfError(messageError);

      // Beneficiaries are NOT materialized here — admin fills them in after worker confirms funding receipt
      await sendWorkerNotification({
        workerId: app.worker_id,
        kind: 'disbursement_update',
        title: 'Gig application accepted',
        body: `${app.gig?.client_name ?? 'Your gig'} is assigned to you. Chat with Operations before taking action.`,
        href: `/gigs/${app.gig_id}`,
      });
      await refresh();
      toast.success('Gig assigned and Operations room opened');
    } catch (error) {
      console.error('[paybridge] Failed to review gig application', error);
      toast.error(error instanceof Error ? error.message : 'Could not review application');
    } finally {
      setBusy(false);
    }
  }

  function toggleMethod(m: string) {
    setForm(p => ({ ...p, methods: p.methods.includes(m) ? p.methods.filter(x => x !== m) : [...p.methods, m] }));
  }

  function addBeneficiary() {
    setBeneficiaries(prev => prev.length >= MAX_BENEFICIARIES ? prev : [...prev, emptyBeneficiary()]);
  }

  function updateBeneficiary(index: number, fields: Partial<BeneficiaryForm>) {
    setBeneficiaries(prev => prev.map((item, itemIndex) => itemIndex === index ? { ...item, ...fields } : item));
  }

  function updateBeneficiaryMethod(index: number, method: string) {
    updateBeneficiary(index, { method, destination: '' });
  }

  function removeBeneficiary(index: number) {
    setBeneficiaries(prev => {
      const next = prev.filter((_, itemIndex) => itemIndex !== index);
      return next.length > 0 ? next : [emptyBeneficiary()];
    });
  }

  // ── Post-funding beneficiary helpers ──────────────────────────────────────

  function addBeneficiaryForGig() {
    setBeneficiariesForGig(prev => prev.length >= MAX_BENEFICIARIES ? prev : [...prev, emptyBeneficiary()]);
  }

  function updateBeneficiaryForGig(index: number, fields: Partial<BeneficiaryForm>) {
    setBeneficiariesForGig(prev => prev.map((item, i) => i === index ? { ...item, ...fields } : item));
  }

  function updateBeneficiaryMethodForGig(index: number, method: string) {
    updateBeneficiaryForGig(index, { method, destination: '' });
  }

  function removeBeneficiaryForGig(index: number) {
    setBeneficiariesForGig(prev => {
      const next = prev.filter((_, i) => i !== index);
      return next.length > 0 ? next : [emptyBeneficiary()];
    });
  }

  async function openBeneficiariesModal(gig: WorkerGig) {
    // Pre-populate with any draft beneficiaries already saved for this gig
    const { data } = await supabase
      .from('gig_beneficiaries')
      .select('*')
      .eq('gig_id', gig.id)
      .order('created_at', { ascending: true });
    const drafts = (data ?? []) as GigBeneficiary[];
    setBeneficiariesForGig(
      drafts.length > 0
        ? drafts.map(d => ({ recipient_name: d.recipient_name, amount: d.amount, method: d.method, destination: d.destination }))
        : [emptyBeneficiary()]
    );
    setShowBeneficiaries(gig);
  }

  async function saveBeneficiaries() {
    const workerId = showBeneficiaries?.worker_id;
    if (!workerId) return;
    const gig = showBeneficiaries;

    const clean = beneficiariesForGig
      .map(b => ({ ...b, recipient_name: b.recipient_name.trim(), destination: b.destination.trim(), amount: Number(b.amount) || 0 }))
      .filter(b => b.recipient_name && b.destination && b.amount > 0);

    if (clean.length === 0) { toast.error('Add at least one complete beneficiary row'); return; }
    if (clean.some(b => !b.recipient_name || !b.destination || !b.amount)) {
      toast.error('Complete all fields for each beneficiary'); return;
    }
    if (clean.some(b => !hasRequiredDestinationFields(b.method, b.destination))) {
      toast.error('Complete the required destination fields for each beneficiary'); return;
    }

    setBusy(true);
    try {
      // 1. Replace any existing draft records for this gig in Supabase
      const { error: deleteError } = await supabase
        .from('gig_beneficiaries')
        .delete()
        .eq('gig_id', gig.id);
      throwIfError(deleteError);

      const { error: insertError } = await supabase.from('gig_beneficiaries').insert(
        clean.map(b => ({
          gig_id: gig.id,
          recipient_name: b.recipient_name,
          amount: b.amount,
          method: b.method,
          destination: b.destination,
        }))
      );
      throwIfError(insertError);

      // 2. Materialize into worker_disbursements (Supabase)
      await materializeBeneficiaries(gig.id, workerId);

      // 3. Advance funding status so worker can start submitting proofs
      const { error: gigError } = await supabase
        .from('worker_gigs')
        .update({ funding_status: 'disbursement_in_progress' })
        .eq('id', gig.id);
      throwIfError(gigError);

      // 4. Notify the worker
      await sendWorkerNotification({
        workerId: workerId,
        kind: 'disbursement_update',
        title: 'Disbursement recipients are ready',
        body: `${gig.client_name}: your recipient instructions are set. Open the gig to begin disbursements.`,
        href: `/gigs/${gig.id}`,
      });

      setShowBeneficiaries(null);
      setBeneficiariesForGig([]);
      await refresh();
      toast.success('Beneficiaries sent to worker');
    } catch (error) {
      console.error('[paybridge] Failed to save beneficiaries', error);
      toast.error(error instanceof Error ? error.message : 'Could not save beneficiaries');
    } finally {
      setBusy(false);
    }
  }

  const statuses = ['all', 'open', 'accepted', 'funded', 'in_progress', 'completed', 'cancelled'];
  const counts = Object.fromEntries(statuses.map(s => [s, s === 'all' ? gigs.length : gigs.filter(g => g.status === s).length]));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-black text-cream">Gig Management</h1>
          <p className="text-cream/50 mt-1">{loading ? 'Loading gigs...' : `${gigs.length} total gigs - ${gigs.filter(g=>!g.funded && g.status!=='completed').length} unfunded`}</p>
        </div>
        <button disabled={busy} onClick={() => { if (beneficiaries.length === 0) setBeneficiaries([emptyBeneficiary()]); setShowCreate(true); }} className="btn-primary flex items-center gap-2 disabled:opacity-50">
          <RiAddLine size={16} /> Create Gig
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {statuses.map(s => counts[s] > 0 && (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded text-xs font-semibold border transition-all ${filter === s ? 'bg-gold/15 border-primary-500/40 text-gold/80' : 'border-white/8 text-cream/50 hover:border-primary-500/25 hover:text-cream'}`}>
            {s === 'all' ? 'All' : s.replace(/_/g, ' ')} ({counts[s]})
          </button>
        ))}
      </div>

      <div className="relative">
        <RiSearchLine size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-cream/50" />
        <input className="input-dark pl-10" placeholder="Search by client name..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {pendingApplications.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <h2 className="font-bold text-cream">Gig Applications</h2>
            <p className="text-xs text-cream/50 mt-1">Review worker requests before assigning gigs.</p>
          </div>
          <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
            {pendingApplications.map(app => (
              <div key={app.id} className="p-5 flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-cream">{app.worker?.full_name ?? app.worker_name}</p>
                  <p className="text-xs text-cream/50 mt-0.5">{app.gig?.client_name ?? 'Unknown gig'} - submitted {formatRelativeTime(app.submitted_at)}</p>
                  {app.note && <p className="text-xs text-cream/50 mt-2 max-w-xl">{app.note}</p>}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button disabled={busy} className="px-3 py-1.5 rounded text-xs font-semibold text-cream/70 border border-white/10 hover:border-primary-500/30 disabled:opacity-50" onClick={() => reviewApplication(app, 'under_review')}>
                    In Review
                  </button>
                  <button disabled={busy} className="px-3 py-1.5 rounded text-xs font-semibold text-sage border border-emerald-500/30 hover:bg-sage-500/10 disabled:opacity-50" onClick={() => reviewApplication(app, 'accepted')}>
                    Accept
                  </button>
                  <button disabled={busy} className="px-3 py-1.5 rounded text-xs font-semibold text-red-400 border border-red-500/30 hover:bg-red-500/10 disabled:opacity-50" onClick={() => reviewApplication(app, 'declined')}>
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                {['Client', 'Worker', 'Principal', 'Worker Fee', 'Deadline', 'Status', 'Funded', 'Actions'].map(h => (
                  <th key={h} className="px-5 py-3.5 text-xs font-semibold text-cream/50 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="px-5 py-10 text-center text-cream/50">{loading ? 'Loading gigs...' : 'No gigs found'}</td></tr>
              )}
              {filtered.map(gig => {
                const worker = workers.find(w => w.id === gig.worker_id);
                return (
                  <tr key={gig.id} className="border-b hover:bg-white/3 transition-colors" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-cream">{gig.client_name}</p>
                      <p className="text-xs text-cream/50">{gig.client_contact}</p>
                    </td>
                    <td className="px-5 py-4 text-xs text-cream/50">
                      {worker ? worker.full_name : <span className="text-amber-400">Unassigned</span>}
                    </td>
                    <td className="px-5 py-4 font-semibold text-cream">{formatCurrency(gig.total_principal)}</td>
                    <td className="px-5 py-4 text-sage font-semibold">{formatCurrency(gig.commission_amount)}</td>
                    <td className="px-5 py-4 text-xs text-cream/50">{formatRelativeTime(gig.deadline)}</td>
                    <td className="px-5 py-4"><span className={`status-${gig.status}`}>{gig.status.replace(/_/g, ' ')}</span></td>
                    <td className="px-5 py-4">
                      {gig.funded
                        ? <span className="text-xs text-sage flex items-center gap-1"><span style={{color:'#7DC99A',fontSize:16}}>✓</span> Yes</span>
                        : <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#C9A84C', fontFamily: "'Space Grotesk', sans-serif" }}>Pending</span>}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        {gig.worker_id && !gig.funded && (
                          <button disabled={busy} onClick={() => setShowFund(gig)}
                            className="p-1.5 rounded-lg hover:bg-sage-500/15 text-sage transition-colors disabled:opacity-50" title="Record Funding">
                            <RiMoneyDollarCircleLine size={14} />
                          </button>
                        )}
                        {/* Show "Add Beneficiaries" only after worker has confirmed they received funds and no disbursements exist yet */}
                        {gig.worker_id && gig.funding_status === 'funding_confirmed' && (disbCountByGig.get(gig.id) ?? 0) === 0 && (
                          <button
                            disabled={busy}
                            onClick={() => openBeneficiariesModal(gig)}
                            className="px-2.5 py-1 rounded text-xs font-bold border border-gold/40 text-gold hover:bg-gold/10 transition-colors disabled:opacity-50"
                            title="Add beneficiaries for disbursement"
                          >
                            Add Beneficiaries
                          </button>
                        )}
                        {!gig.worker_id && <span className="text-xs text-cream/35">Awaiting application</span>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto px-4 py-6 sm:py-8">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowCreate(false)} />
          <div className="relative w-full max-w-lg card p-6 max-h-[calc(100dvh-3rem)] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-cream text-lg">Create New Gig</h2>
              <button onClick={() => setShowCreate(false)} className="text-cream/50 hover:text-cream"><RiCloseLine size={18} /></button>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-cream/50 uppercase tracking-wide">Client Name *</label>
                <input className="input-dark" value={form.client_name} onChange={e => setForm(p=>({...p,client_name:e.target.value}))} placeholder="e.g. Acme Corp" />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-cream/50 uppercase tracking-wide">Client Contact</label>
                <input className="input-dark" value={form.client_contact||''} onChange={e => setForm(p=>({...p,client_contact:e.target.value}))} placeholder="hr@company.com" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-cream/50 uppercase tracking-wide">Principal (USD) *</label>
                  <input className="input-dark" type="number" value={form.total_principal||''} onChange={e=>setForm(p=>({...p,total_principal:+e.target.value}))} placeholder="10000" />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-cream/50 uppercase tracking-wide">Worker Fee %</label>
                  <input className="input-dark" type="number" value={form.commission_rate||10} onChange={e=>setForm(p=>({...p,commission_rate:+e.target.value}))} />
                </div>
              </div>

              {form.total_principal! > 0 && (
                <div className="p-3 rounded text-sm" style={{ background: 'rgba(125,201,154,0.08)', border: '1px solid rgba(125,201,154,0.2)' }}>
                  Worker fee: <strong className="text-sage">{formatCurrency(commissionAmt)}</strong>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-cream/50 uppercase tracking-wide">Recipients *</label>
                  <input className="input-dark" type="number" min={1} max={MAX_BENEFICIARIES} value={form.recipient_count||''} onChange={e=>setForm(p=>({...p,recipient_count:Math.min(MAX_BENEFICIARIES, Math.max(1, +e.target.value || 1))}))} placeholder="5" />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-cream/50 uppercase tracking-wide">Deadline *</label>
                  <input className="input-dark" type="date" value={form.deadline?.slice(0,10)||''} onChange={e=>setForm(p=>({...p,deadline:e.target.value}))} />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-cream/50 uppercase tracking-wide">Badge Required</label>
                <select className="input-dark appearance-none" value={form.badge_required||''} onChange={e=>setForm(p=>({...p,badge_required:(e.target.value || null) as any}))}>
                  <option value="">Any badge</option>
                  {['trainee','associate','senior','expert','master'].map(b => <option key={b} value={b} className="bg-[#1e1c35]">{b}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-cream/50 uppercase tracking-wide">Disbursement Methods</label>
                <div className="grid grid-cols-2 gap-2">
                  {DISBURSEMENT_METHODS.map(m => (
                    <label key={m.id} className={`flex items-center gap-2 p-2.5 rounded cursor-pointer border text-xs transition-all ${form.methods.includes(m.id) ? 'border-primary-500/40 bg-gold/10 text-cream' : 'border-white/8 text-cream/50'}`}>
                      <div className={`w-3.5 h-3.5 rounded flex items-center justify-center border flex-shrink-0 ${form.methods.includes(m.id) ? 'bg-primary-500 border-primary-400' : 'border-[#a8a4c4]'}`}>
                        {form.methods.includes(m.id) && <RiCheckLine size={12} />}
                      </div>
                      <input type="checkbox" className="hidden" checked={form.methods.includes(m.id)} onChange={() => toggleMethod(m.id)} />
                      {m.label}
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-3 rounded border border-white/8 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-cream/50 uppercase tracking-wide">Beneficiaries</label>
                    <p className="text-xs text-cream/45 mt-0.5">Stored as admin-only draft records until a worker is assigned.</p>
                  </div>
                  <button type="button" className="px-3 py-1.5 rounded text-xs font-bold border border-gold/30 text-gold hover:bg-gold/10 disabled:opacity-40" onClick={addBeneficiary} disabled={beneficiaries.length >= MAX_BENEFICIARIES}>
                    Add ({beneficiaries.length}/{MAX_BENEFICIARIES})
                  </button>
                </div>
                {beneficiaries.length > 0 && (
                  <div className="space-y-3">
                    {beneficiaries.map((beneficiary, index) => (
                      <div key={index} className="rounded border border-white/8 p-3 space-y-2">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-xs font-bold text-cream">Beneficiary {index + 1}</p>
                          <button type="button" className="text-cream/45 hover:text-cream" onClick={() => removeBeneficiary(index)} aria-label="Remove beneficiary">
                            <RiCloseLine size={15} />
                          </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input className="input-dark" value={beneficiary.recipient_name} onChange={e => updateBeneficiary(index, { recipient_name: e.target.value })} placeholder="Recipient name" />
                          <input className="input-dark" type="number" min={0} value={beneficiary.amount || ''} onChange={e => updateBeneficiary(index, { amount: +e.target.value })} placeholder="Amount" />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-[150px_1fr] gap-2">
                          <select className="input-dark appearance-none" value={beneficiary.method} onChange={e => updateBeneficiaryMethod(index, e.target.value)}>
                            {DISBURSEMENT_METHODS.map(method => <option key={method.id} value={method.id} className="bg-[#1e1c35]">{method.label}</option>)}
                          </select>
                          <BeneficiaryDestinationFields method={beneficiary.method} destination={beneficiary.destination} onChange={destination => updateBeneficiary(index, { destination })} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-cream/50 uppercase tracking-wide">Notes</label>
                <textarea className="input-dark resize-none" rows={3} value={form.notes||''} onChange={e=>setForm(p=>({...p,notes:e.target.value}))} placeholder="Instructions for the worker..." />
              </div>

              <div className="flex gap-3 pt-2">
                <button disabled={busy} className="btn-secondary flex-1 disabled:opacity-50" onClick={() => setShowCreate(false)}>Cancel</button>
                <button disabled={busy} className="btn-primary flex-1 disabled:opacity-50" onClick={createGig}><RiAddLine size={15}/> Create Gig</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showFund && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto px-4 py-6 sm:py-8">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowFund(null)} />
          <div className="relative w-full max-w-sm card p-6 max-h-[calc(100dvh-3rem)] overflow-y-auto">
            <h2 className="font-bold text-cream mb-1">Record Dedicated Account Funding</h2>
            <p className="text-xs text-cream/50 mb-4">{showFund.client_name} - {formatCurrency(showFund.total_principal)}</p>
            <div className="p-3 rounded mb-4 text-xs text-amber-400" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
              <span style={{color:'#C9A84C',fontSize:16}}>!</span>
              Confirm that <strong>{formatCurrency(showFund.total_principal)}</strong> has been deposited into the worker's dedicated disbursement account before marking as funded.
            </div>
            <input className="input-dark mb-4" value={fundRef} onChange={e => setFundRef(e.target.value)} placeholder="Funding reference (e.g. FUND-2026-0004)" />
            <div className="flex gap-3">
              <button disabled={busy} className="btn-secondary flex-1 disabled:opacity-50" onClick={() => setShowFund(null)}>Cancel</button>
              <button disabled={busy} className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50" onClick={() => fundGig(showFund)}>
                <RiMoneyDollarCircleLine size={15}/> Confirm Funding
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Beneficiaries Modal (shown after worker confirms funding receipt) ── */}
      {showBeneficiaries && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto px-4 py-6 sm:py-8">
          <div className="absolute inset-0 bg-black/70" onClick={() => { setShowBeneficiaries(null); setBeneficiariesForGig([]); }} />
          <div className="relative w-full max-w-lg card p-6 max-h-[calc(100dvh-3rem)] overflow-y-auto">
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-bold text-cream text-lg">Add Disbursement Recipients</h2>
              <button onClick={() => { setShowBeneficiaries(null); setBeneficiariesForGig([]); }} className="text-cream/50 hover:text-cream"><RiCloseLine size={18} /></button>
            </div>
            <p className="text-xs text-cream/50 mb-5">
              {showBeneficiaries.client_name} — worker has confirmed receipt of <strong className="text-gold">{formatCurrency(showBeneficiaries.total_principal)}</strong>. Add recipients below and submit to send instructions to the worker.
            </p>

            <div className="space-y-3 mb-5">
              {beneficiariesForGig.map((b, index) => (
                <div key={index} className="rounded border border-white/8 p-3 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-bold text-cream">Recipient {index + 1}</p>
                    <button type="button" className="text-cream/45 hover:text-cream" onClick={() => removeBeneficiaryForGig(index)} aria-label="Remove">
                      <RiCloseLine size={15} />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input className="input-dark" value={b.recipient_name} onChange={e => updateBeneficiaryForGig(index, { recipient_name: e.target.value })} placeholder="Recipient name" />
                    <input className="input-dark" type="number" min={0} value={b.amount || ''} onChange={e => updateBeneficiaryForGig(index, { amount: +e.target.value })} placeholder="Amount" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-[150px_1fr] gap-2">
                    <select className="input-dark appearance-none" value={b.method} onChange={e => updateBeneficiaryMethodForGig(index, e.target.value)}>
                      {DISBURSEMENT_METHODS.map(m => <option key={m.id} value={m.id} className="bg-[#1e1c35]">{m.label}</option>)}
                    </select>
                    <BeneficiaryDestinationFields method={b.method} destination={b.destination} onChange={destination => updateBeneficiaryForGig(index, { destination })} />
                  </div>
                </div>
              ))}

              <button
                type="button"
                className="w-full py-2 rounded border border-dashed border-white/15 text-xs font-semibold text-cream/50 hover:border-gold/40 hover:text-gold transition-colors disabled:opacity-40"
                onClick={addBeneficiaryForGig}
                disabled={beneficiariesForGig.length >= MAX_BENEFICIARIES}
              >
                + Add recipient ({beneficiariesForGig.length}/{MAX_BENEFICIARIES})
              </button>
            </div>

            <div className="flex gap-3">
              <button disabled={busy} className="btn-secondary flex-1 disabled:opacity-50" onClick={() => { setShowBeneficiaries(null); setBeneficiariesForGig([]); }}>Cancel</button>
              <button disabled={busy} className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50" onClick={saveBeneficiaries}>
                <RiCheckLine size={15} /> Send to Worker
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
