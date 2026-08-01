import { useEffect, useState } from 'react';
import { RiDownloadLine, RiLineChartLine, RiCheckboxCircleLine, RiMoneyDollarCircleLine } from 'react-icons/ri';
import { supabase } from '../../lib/supabase';
import { formatCurrency, formatDate } from '../../lib/utils';
import { BadgeIcon } from '../../components/ui/Badge';
import { CommissionLedger, WorkerGig, WorkerProfile } from '../../types/database';
import { sendWorkerNotification } from '../../lib/notificationDelivery';
import toast from 'react-hot-toast';

type DisplayWorker = Partial<WorkerProfile> & { id: string; full_name: string; badge: WorkerProfile['badge']; email?: string | null };

type CommissionRow = CommissionLedger & { worker: DisplayWorker | null; gig: WorkerGig | null };

type WorkerRollup = {
  worker: DisplayWorker;
  earned: number;
  settled: number;
  pending: number;
  count: number;
};

function normalizeWorker(row: any): WorkerProfile {
  return {
    ...row,
    total_gigs_completed: Number(row.total_gigs_completed ?? 0),
    total_disbursed: Number(row.total_disbursed ?? 0),
    total_earned: Number(row.total_earned ?? 0),
    rating: Number(row.rating ?? 0),
  } as WorkerProfile;
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

function normalizeCommission(row: any): CommissionLedger {
  return {
    ...row,
    amount: Number(row.amount ?? 0),
  } as CommissionLedger;
}

export function AdminCommissions() {
  const [commissions, setCommissions] = useState<CommissionRow[]>([]);
  const [workerRollup, setWorkerRollup] = useState<WorkerRollup[]>([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  async function refreshFromSupabase() {
    setLoading(true);
    try {
      const [commissionsResult, workersResult, gigsResult] = await Promise.all([
        supabase.from('commission_ledger').select('*').order('created_at', { ascending: false }),
        supabase.from('worker_profiles').select('*'),
        supabase.from('worker_gigs').select('*'),
      ]);

      if (commissionsResult.error) throw commissionsResult.error;
      if (workersResult.error) throw workersResult.error;
      if (gigsResult.error) throw gigsResult.error;

      const workers = ((workersResult.data ?? []) as any[]).map(normalizeWorker);
      const gigs = ((gigsResult.data ?? []) as any[]).map(normalizeGig);
      const workerById = new Map(workers.map(worker => [worker.id, worker]));
      const gigById = new Map(gigs.map(gig => [gig.id, gig]));
      const rows: CommissionRow[] = ((commissionsResult.data ?? []) as any[]).map(row => {
        const commission = normalizeCommission(row);
        return {
          ...commission,
          worker: workerById.get(commission.worker_id) ?? null,
          gig: gigById.get(commission.gig_id) ?? null,
        };
      });

      const rollup = workers.map(worker => ({
        worker,
        earned: rows.filter(c => c.worker_id === worker.id).reduce((sum, c) => sum + Number(c.amount), 0),
        settled: rows.filter(c => c.worker_id === worker.id && c.status === 'settled').reduce((sum, c) => sum + Number(c.amount), 0),
        pending: rows.filter(c => c.worker_id === worker.id && c.status !== 'settled').reduce((sum, c) => sum + Number(c.amount), 0),
        count: rows.filter(c => c.worker_id === worker.id).length,
      })).filter(row => row.earned > 0);

      setCommissions(rows);
      setWorkerRollup(rollup);
    } catch (error) {
      console.error('[paybridge] Failed to load worker fees', error);
      toast.error(error instanceof Error ? error.message : 'Could not load worker fees');
      setCommissions([]);
      setWorkerRollup([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refreshFromSupabase();
  }, []);

  const filtered = commissions.filter(c => filter === 'all' || c.status === filter);

  const totalEarned = commissions.reduce((sum, c) => sum + Number(c.amount), 0);
  const totalSettled = commissions.filter(c => c.status === 'settled').reduce((sum, c) => sum + Number(c.amount), 0);
  const totalPending = commissions.filter(c => c.status !== 'settled').reduce((sum, c) => sum + Number(c.amount), 0);

  async function settle(id: string) {
    setBusyId(id);
    try {
      const { error } = await supabase
        .from('commission_ledger')
        .update({ status: 'settled', settled_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
      const commission = commissions.find(item => item.id === id);
      if (commission) {
        await sendWorkerNotification({
          workerId: commission.worker_id,
          kind: 'fee_record_update',
          title: 'Worker fee record updated',
          body: `${commission.gig?.client_name ?? 'A gig'} worker fee was marked settled for ${formatCurrency(commission.amount)}.`,
          href: '/wallet',
        });
      }
      await refreshFromSupabase();
      toast.success('Worker fee marked as settled');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not settle worker fee');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-cream sm:text-3xl">Worker Fees</h1>
          <p className="text-cream/50 mt-1">{loading ? 'Loading worker fee records...' : 'Worker fee records and settlement status'}</p>
        </div>
        <button className="btn-secondary flex w-full items-center justify-center gap-2 text-sm sm:w-auto">
          <RiDownloadLine size={15} /> Export
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {[
          { label: 'Total Worker Fees', value: formatCurrency(totalEarned), color: 'text-cream', icon: RiLineChartLine },
          { label: 'Settled', value: formatCurrency(totalSettled), color: 'text-sage', icon: RiCheckboxCircleLine },
          { label: 'Pending Settlement', value: formatCurrency(totalPending), color: 'text-amber-400', icon: RiMoneyDollarCircleLine },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="card p-4 flex items-start gap-3 sm:p-5 sm:gap-4">
            <div className="w-9 h-9 rounded flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(201,168,76,0.12)' }}>
              <Icon size={18} className={color} />
            </div>
            <div>
              <p className="text-xs text-cream/50">{label}</p>
              <p className={`text-xl font-black sm:text-2xl ${color}`}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <h2 className="font-bold text-cream">By Worker</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                {['Worker', 'Badge', 'Transactions', 'Total Earned', 'Settled', 'Pending'].map(h => (
                  <th key={h} className="px-5 py-3 text-xs font-semibold text-cream/50 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {workerRollup.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-cream/50">{loading ? 'Loading worker fees...' : 'No worker fees recorded yet'}</td></tr>
              )}
              {workerRollup.map(({ worker, earned, settled, pending, count }) => (
                <tr key={worker.id} className="border-b hover:bg-white/3 transition-colors" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                  <td className="px-5 py-4">
                    <p className="font-semibold text-cream">{worker.full_name}</p>
                    <p className="text-xs text-cream/50">{worker.country || worker.phone}</p>
                  </td>
                  <td className="px-5 py-4"><BadgeIcon tier={worker.badge} size="sm" /></td>
                  <td className="px-5 py-4 text-cream/50">{count}</td>
                  <td className="px-5 py-4 font-bold text-cream">{formatCurrency(earned)}</td>
                  <td className="px-5 py-4 font-bold text-sage">{formatCurrency(settled)}</td>
                  <td className="px-5 py-4 font-bold text-amber-400">{pending > 0 ? formatCurrency(pending) : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="flex flex-col gap-3 px-5 py-4 border-b sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <h2 className="font-bold text-cream">Worker Fee Ledger</h2>
          <div className="flex flex-wrap gap-2">
            {['all', 'earned', 'pending_settlement', 'settled'].map(status => (
              <button key={status} onClick={() => setFilter(status)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${filter === status ? 'bg-gold/15 text-gold/80' : 'text-cream/50 hover:text-cream'}`}>
                {status.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                {['Worker', 'Gig', 'Amount', 'Status', 'Date', 'Action'].map(h => (
                  <th key={h} className="px-5 py-3 text-xs font-semibold text-cream/50 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-cream/50">{loading ? 'Loading fee records...' : 'No worker fee records match'}</td></tr>
              )}
              {filtered.map(commission => (
                <tr key={commission.id} className="border-b hover:bg-white/3 transition-colors" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                  <td className="px-5 py-3.5 font-medium text-cream">{commission.worker?.full_name ?? commission.worker_id}</td>
                  <td className="px-5 py-3.5 text-xs text-cream/50">{commission.gig?.client_name ?? commission.gig_id}</td>
                  <td className="px-5 py-3.5 font-bold text-cream">{formatCurrency(Number(commission.amount))}</td>
                  <td className="px-5 py-3.5">
                    <span className={commission.status === 'settled' ? 'status-verified' : 'status-pending'}>
                      {commission.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-cream/50">{formatDate(commission.created_at)}</td>
                  <td className="px-5 py-3.5">
                    {commission.status !== 'settled' && (
                      <button onClick={() => settle(commission.id)} disabled={busyId === commission.id}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold text-sage border border-emerald-500/30 hover:bg-sage-500/10 transition-colors disabled:opacity-50">
                        <RiCheckboxCircleLine size={15} /> {busyId === commission.id ? 'Settling...' : 'Mark Settled'}
                      </button>
                    )}
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
