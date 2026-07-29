import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { RiCheckboxCircleLine, RiCloseCircleLine, RiDownloadLine, RiSearchLine } from 'react-icons/ri';
import { supabase } from '../../lib/supabase';
import { formatCurrency, formatDate } from '../../lib/utils';
import { WorkerDisbursement, WorkerGig, WorkerProfile } from '../../types/database';

type DisbursementProof = {
  id: string;
  disbursement_id: string;
  worker_id: string;
  proof_url: string;
  transaction_id: string | null;
  notes: string | null;
  submitted_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  accepted: boolean | null;
};

type AdminDisbursement = WorkerDisbursement & {
  worker: WorkerProfile | null;
  gig: WorkerGig | null;
  proof: DisbursementProof | null;
};

const REVIEWABLE = ['sent', 'proof_rejected'];

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

function normalizeWorker(row: any): WorkerProfile {
  return {
    ...row,
    total_gigs_completed: Number(row.total_gigs_completed ?? 0),
    total_disbursed: Number(row.total_disbursed ?? 0),
    total_earned: Number(row.total_earned ?? 0),
    rating: Number(row.rating ?? 0),
  } as WorkerProfile;
}

function normalizeDisbursement(row: any): WorkerDisbursement {
  return { ...row, amount: Number(row.amount ?? 0) } as WorkerDisbursement;
}

function throwIfError(error: any) {
  if (error) throw error;
}

export function AdminDisbursements() {
  const [disbursements, setDisbursements] = useState<AdminDisbursement[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    try {
      const [disbursementsResult, workersResult, gigsResult, proofsResult] = await Promise.all([
        supabase.from('worker_disbursements').select('*').order('created_at', { ascending: false }),
        supabase.from('worker_profiles').select('*'),
        supabase.from('worker_gigs').select('*'),
        supabase.from('disbursement_proofs').select('*').order('submitted_at', { ascending: false }),
      ]);

      throwIfError(disbursementsResult.error);
      throwIfError(workersResult.error);
      throwIfError(gigsResult.error);
      throwIfError(proofsResult.error);

      const workers: WorkerProfile[] = (workersResult.data ?? []).map((row: any) => normalizeWorker(row));
      const gigs: WorkerGig[] = (gigsResult.data ?? []).map((row: any) => normalizeGig(row));
      const workerById = new Map(workers.map(worker => [worker.id, worker]));
      const gigById = new Map(gigs.map(gig => [gig.id, gig]));
      const proofByDisbursementId = new Map<string, DisbursementProof>();
      ((proofsResult.data ?? []) as DisbursementProof[]).forEach(proof => {
        if (!proofByDisbursementId.has(proof.disbursement_id)) proofByDisbursementId.set(proof.disbursement_id, proof);
      });

      const next: AdminDisbursement[] = (disbursementsResult.data ?? [])
        .map((row: any) => normalizeDisbursement(row))
        .map((disbursement: WorkerDisbursement): AdminDisbursement => ({
          ...disbursement,
          worker: workerById.get(disbursement.worker_id) ?? null,
          gig: gigById.get(disbursement.gig_id) ?? null,
          proof: proofByDisbursementId.get(disbursement.id) ?? null,
        }))
        .sort((a: AdminDisbursement, b: AdminDisbursement) => (b.sent_at ?? b.created_at).localeCompare(a.sent_at ?? a.created_at));

      setDisbursements(next);
    } catch (error) {
      console.error('[paybridge] Failed to load disbursements', error);
      toast.error(error instanceof Error ? error.message : 'Could not load disbursements');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void refresh(); }, []);

  const filtered = disbursements
    .filter(d => filter === 'all' || d.status === filter)
    .filter(d => {
      const term = search.trim().toLowerCase();
      if (!term) return true;
      return [d.recipient_name, d.transaction_id, d.worker?.full_name, d.gig?.client_name]
        .filter(Boolean)
        .some(value => String(value).toLowerCase().includes(term));
    });

  const totalSent = disbursements.filter(d => ['sent', 'verified'].includes(d.status)).reduce((s, d) => s + Number(d.amount), 0);
  const totalVerified = disbursements.filter(d => d.status === 'verified').reduce((s, d) => s + Number(d.amount), 0);
  const awaitingReview = disbursements.filter(d => d.status === 'sent').length;

  async function syncGigAfterReview(disbursement: AdminDisbursement, verified: boolean) {
    const { data, error } = await supabase
      .from('worker_disbursements')
      .select('*')
      .eq('gig_id', disbursement.gig_id);
    throwIfError(error);

    const all: WorkerDisbursement[] = (data ?? []).map((row: any) => normalizeDisbursement(row)).map((item: WorkerDisbursement) => (
      item.id === disbursement.id
        ? { ...item, status: verified ? 'verified' : 'proof_rejected' }
        : item
    ));
    const now = new Date().toISOString();

    if (all.length > 0 && all.every((item: WorkerDisbursement) => item.status === 'verified')) {
      const { error: gigError } = await supabase
        .from('worker_gigs')
        .update({ status: 'completed', completed_at: now, funding_status: 'verified_complete' })
        .eq('id', disbursement.gig_id);
      throwIfError(gigError);

      if (disbursement.gig?.worker_id) {
        const { error: commissionError } = await supabase.from('commission_ledger').upsert({
          worker_id: disbursement.gig.worker_id,
          gig_id: disbursement.gig_id,
          amount: disbursement.gig.commission_amount,
          status: 'earned',
          settled_at: null,
        }, { onConflict: 'worker_id,gig_id' });
        throwIfError(commissionError);
      }
      return;
    }

    const hasRejected = all.some((item: WorkerDisbursement) => item.status === 'proof_rejected');
    const hasSent = all.some((item: WorkerDisbursement) => item.status === 'sent');
    const nextFundingStatus = hasRejected ? 'proof_rejected' : hasSent ? 'awaiting_verification' : 'disbursement_in_progress';
    const { error: gigError } = await supabase
      .from('worker_gigs')
      .update({ funding_status: nextFundingStatus })
      .eq('id', disbursement.gig_id);
    throwIfError(gigError);
  }

  async function verify(disbursement: AdminDisbursement, verified: boolean) {
    setBusyId(disbursement.id);
    try {
      const now = new Date().toISOString();
      const note = verified ? 'Proof verified by Operations.' : 'Proof needs correction before approval.';
      const { data: userData } = await supabase.auth.getUser();
      const reviewedBy = userData?.user?.id ?? null;

      const { error: updateError } = await supabase
        .from('worker_disbursements')
        .update({
          status: verified ? 'verified' : 'proof_rejected',
          verified_at: verified ? now : null,
          notes: note,
        })
        .eq('id', disbursement.id);
      throwIfError(updateError);

      if (disbursement.proof) {
        const { error: proofError } = await supabase
          .from('disbursement_proofs')
          .update({ accepted: verified, reviewed_at: now, reviewed_by: reviewedBy })
          .eq('id', disbursement.proof.id);
        throwIfError(proofError);
      }

      await syncGigAfterReview(disbursement, verified);
      await refresh();
      toast.success(verified ? 'Proof verified' : 'Proof returned for correction');
    } catch (error) {
      console.error('[paybridge] Failed to review disbursement proof', error);
      toast.error(error instanceof Error ? error.message : 'Could not review proof');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-black text-cream">Disbursements</h1>
          <p className="text-cream/50 mt-1">{loading ? 'Loading disbursements...' : `${disbursements.length} total - ${formatCurrency(totalSent)} sent`}</p>
        </div>
        <button className="btn-secondary flex items-center gap-2 text-sm">
          <RiDownloadLine size={15} /> Export CSV
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Total Sent', value: formatCurrency(totalSent), color: 'text-cream' },
          { label: 'Verified', value: formatCurrency(totalVerified), color: 'text-sage' },
          { label: 'Awaiting Review', value: `${awaitingReview} transactions`, color: 'text-amber-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card p-5">
            <p className="text-xs text-cream/50 mb-1">{label}</p>
            <p className={`text-2xl font-black ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-2 flex-wrap">
          {['all', 'sent', 'pending', 'verified', 'proof_rejected', 'failed'].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded text-xs font-semibold border transition-all ${filter === s ? 'bg-gold/15 border-primary-500/40 text-gold/80' : 'border-white/8 text-cream/50'}`}>
              {s === 'all' ? 'all' : s.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
        <div className="relative flex-1">
          <RiSearchLine size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-cream/50" />
          <input className="input-dark pl-9 text-sm" placeholder="Search recipient, worker, client, or reference..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                {['Recipient', 'Worker', 'Gig', 'Amount', 'Method', 'Reference', 'Sent', 'Status', 'Proof', 'Actions'].map(h => (
                  <th key={h} className="px-5 py-3.5 text-xs font-semibold text-cream/50 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={10} className="px-5 py-10 text-center text-cream/50">{loading ? 'Loading disbursements...' : 'No disbursements match'}</td></tr>
              )}
              {filtered.map(d => (
                <tr key={d.id} className="border-b hover:bg-white/3 transition-colors" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                  <td className="px-5 py-3.5">
                    <p className="font-semibold text-cream">{d.recipient_name}</p>
                    <p className="text-xs text-cream/50">{d.destination}</p>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-cream/50">{d.worker?.full_name ?? 'Unassigned'}</td>
                  <td className="px-5 py-3.5 text-xs text-cream/50">{d.gig?.client_name ?? 'Unknown gig'}</td>
                  <td className="px-5 py-3.5 font-bold text-cream">{formatCurrency(Number(d.amount))}</td>
                  <td className="px-5 py-3.5 text-xs text-cream/50 capitalize">{d.method.replace(/_/g, ' ')}</td>
                  <td className="px-5 py-3.5 text-xs text-cream/50">{d.transaction_id ?? d.proof?.transaction_id ?? '-'}</td>
                  <td className="px-5 py-3.5 text-xs text-cream/50">{d.sent_at ? formatDate(d.sent_at) : '-'}</td>
                  <td className="px-5 py-3.5"><span className={`status-${d.status}`}>{d.status.replace(/_/g, ' ')}</span></td>
                  <td className="px-5 py-3.5">
                    {d.proof_file_name
                      ? <span className="text-xs text-gold">{d.proof_file_name}</span>
                      : d.proof_url || d.proof?.proof_url
                        ? <span className="text-xs text-gold">Proof attached</span>
                        : <span className="text-xs text-cream/50">-</span>}
                  </td>
                  <td className="px-5 py-3.5">
                    {REVIEWABLE.includes(d.status) ? (
                      <div className="flex items-center gap-2">
                        <button disabled={busyId === d.id} onClick={() => verify(d, true)} className="p-1.5 rounded hover:bg-sage-500/15 text-sage transition-colors disabled:opacity-50" title="Verify proof">
                          <RiCheckboxCircleLine size={16} />
                        </button>
                        <button disabled={busyId === d.id} onClick={() => verify(d, false)} className="p-1.5 rounded hover:bg-red-500/15 text-red-400 transition-colors disabled:opacity-50" title="Request correction">
                          <RiCloseCircleLine size={16} />
                        </button>
                      </div>
                    ) : <span className="text-xs text-cream/35">-</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}