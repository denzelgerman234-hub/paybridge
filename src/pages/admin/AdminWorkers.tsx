import { useEffect, useState } from 'react';
import { RiSearchLine, RiStarLine, RiShieldCrossLine, RiShieldCheckLine, RiLineChartLine, RiCloseLine, RiEyeLine } from 'react-icons/ri';
import { localDb, LocalWorkerSummary } from '../../lib/localDb';
import { AccountHealthStatus, BadgeTier } from '../../types/database';
import { BADGE_TIERS } from '../../lib/constants';
import { formatCurrency, formatDate } from '../../lib/utils';
import toast from 'react-hot-toast';

import { BadgeIcon } from '../../components/ui/Badge';

type LocalDbSnapshot = ReturnType<typeof localDb.snapshot>;

type AdminWorkerRow = LocalWorkerSummary & {
  phone: string | null;
  country: string | null;
  total_gigs_completed: number;
  total_disbursed: number;
  total_earned: number;
  rating: number | null;
  created_at: string | null;
  updated_at: string;
};

function earliestDate(dates: Array<string | null | undefined>) {
  const sorted = dates.filter(Boolean).sort((a, b) => new Date(a!).getTime() - new Date(b!).getTime());
  return sorted[0] ?? null;
}

function latestDate(dates: Array<string | null | undefined>) {
  const sorted = dates.filter(Boolean).sort((a, b) => new Date(b!).getTime() - new Date(a!).getTime());
  return sorted[0] ?? null;
}

function buildWorkerRows(state: LocalDbSnapshot): AdminWorkerRow[] {
  return state.workers
    .map(worker => {
      const workerGigs = state.gigs.filter(gig => gig.worker_id === worker.id);
      const completedGigs = workerGigs.filter(gig => gig.status === 'completed');
      const workerDisbursements = state.worker_disbursements.filter(item => item.worker_id === worker.id);
      const sentDisbursements = workerDisbursements.filter(item => item.status === 'sent' || item.status === 'verified');
      const workerCommissions = state.commission_ledger.filter(item => item.worker_id === worker.id);
      const earnedGigIds = new Set(workerCommissions.map(item => item.gig_id));
      const estimatedEarned = completedGigs
        .filter(gig => !earnedGigIds.has(gig.id))
        .reduce((sum, gig) => sum + gig.commission_amount, 0);
      const createdAt = earliestDate([
        ...workerGigs.map(gig => gig.accepted_at ?? gig.created_at),
        ...state.gig_applications.filter(app => app.worker_id === worker.id).map(app => app.submitted_at),
        ...workerDisbursements.map(item => item.created_at),
        ...state.audit_events.filter(event => event.worker_id === worker.id).map(event => event.created_at),
      ]);

      return {
        ...worker,
        phone: null,
        country: null,
        total_gigs_completed: completedGigs.length,
        total_disbursed: sentDisbursements.reduce((sum, item) => sum + item.amount, 0),
        total_earned: workerCommissions.reduce((sum, item) => sum + item.amount, 0) + estimatedEarned,
        rating: completedGigs.length > 0 ? 5 : null,
        created_at: createdAt,
        updated_at: latestDate(workerGigs.map(gig => gig.updated_at)) ?? createdAt ?? new Date().toISOString(),
      };
    })
    .sort((a, b) => a.full_name.localeCompare(b.full_name));
}

export function AdminWorkers() {
  const [state, setState] = useState(() => localDb.snapshot());
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const refresh = () => setState(localDb.snapshot());
    refresh();
    return localDb.subscribe(refresh);
  }, []);

  const workers = buildWorkerRows(state);
  const selected = selectedId ? workers.find(worker => worker.id === selectedId) ?? null : null;
  const filtered = workers.filter(w =>
    !search || w.full_name.toLowerCase().includes(search.toLowerCase()) || w.email.toLowerCase().includes(search.toLowerCase())
  );

  function updateWorker(id: string, fields: Partial<Pick<AdminWorkerRow, 'badge' | 'account_health'>>) {
    try {
      localDb.updateWorkerAdminFields(id, fields as Partial<Pick<LocalWorkerSummary, 'badge' | 'account_health'>>);
      setState(localDb.snapshot());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Worker update failed');
    }
  }

  function toggleHealth(worker: AdminWorkerRow) {
    const nextHealth: AccountHealthStatus = worker.account_health === 'healthy' ? 'warning' : 'healthy';
    updateWorker(worker.id, { account_health: nextHealth });
    toast.success('Account health updated');
  }

  function upgradeBadge(worker: AdminWorkerRow) {
    const order = BADGE_TIERS.map(b => b.id);
    const idx = order.indexOf(worker.badge);
    const next = order[Math.min(idx + 1, order.length - 1)] as BadgeTier;
    updateWorker(worker.id, { badge: next });
    toast.success('Badge upgraded');
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-black text-cream">Workers</h1>
        <p className="text-cream/50 mt-1">{workers.length} registered workers</p>
      </div>

      <div className="relative">
        <RiSearchLine size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-cream/50" />
        <input className="input-dark pl-10" placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                {['Worker', 'Badge', 'Gigs', 'Disbursed', 'Earned', 'Rating', 'Health', 'Actions'].map(h => (
                  <th key={h} className="px-5 py-3.5 text-xs font-semibold text-cream/50 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="px-5 py-10 text-center text-cream/50">No workers found</td></tr>
              )}
              {filtered.map(w => (
                <tr key={w.id} className="border-b hover:bg-white/3 transition-colors" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm text-white flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg,#C9A84C,#d946ef)' }}>
                        {w.full_name[0]}
                      </div>
                      <div>
                        <p className="font-semibold text-cream">{w.full_name}</p>
                        <p className="text-xs text-cream/50">{w.email || 'No email on file'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4"><BadgeIcon tier={w.badge} size="sm" /></td>
                  <td className="px-5 py-4 font-semibold text-cream">{w.total_gigs_completed}</td>
                  <td className="px-5 py-4 font-semibold text-cream">{formatCurrency(w.total_disbursed)}</td>
                  <td className="px-5 py-4 font-semibold text-sage">{formatCurrency(w.total_earned)}</td>
                  <td className="px-5 py-4">
                    <span className="flex items-center gap-1 text-cream text-xs font-semibold">
                      <RiStarLine size={12} className="text-amber-400" /> {w.rating ? w.rating.toFixed(1) : 'New'}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-xs font-semibold ${w.account_health === 'healthy' ? 'text-sage' : 'text-amber-400'}`}>
                      <span aria-hidden="true">&bull;</span> {w.account_health}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => setSelectedId(w.id)} className="p-1.5 rounded-lg hover:bg-white/8 text-cream/50 hover:text-cream transition-colors" title="View">
                        <RiEyeLine size={14} />
                      </button>
                      <button onClick={() => toggleHealth(w)} className={`p-1.5 rounded-lg transition-colors ${w.account_health === 'healthy' ? 'hover:bg-amber-500/15 text-amber-400' : 'hover:bg-sage-500/15 text-sage'}`} title={w.account_health === 'healthy' ? 'Flag' : 'Clear flag'}>
                        {w.account_health === 'healthy' ? <RiShieldCrossLine size={14} /> : <RiShieldCheckLine size={14} />}
                      </button>
                      <button onClick={() => upgradeBadge(w)} className="p-1.5 rounded-lg hover:bg-primary-500/15 text-gold transition-colors" title="Upgrade badge">
                        <RiLineChartLine size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/60" onClick={() => setSelectedId(null)} />
          <div className="w-full max-w-sm border-l flex flex-col" style={{ background: '#0f0e17', borderColor: 'rgba(255,255,255,0.08)' }}>
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <h2 className="font-bold text-cream">Worker Profile</h2>
              <button onClick={() => setSelectedId(null)} className="text-cream/50 hover:text-cream"><RiCloseLine size={16} /></button>
            </div>
            <div className="p-5 space-y-5 overflow-y-auto flex-1">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded flex items-center justify-center font-black text-xl text-white"
                  style={{ background: 'linear-gradient(135deg,#C9A84C,#d946ef)' }}>
                  {selected.full_name[0]}
                </div>
                <div>
                  <p className="font-bold text-cream">{selected.full_name}</p>
                  <p className="text-xs text-cream/50">{selected.email || 'No email on file'}</p>
                  <BadgeIcon tier={selected.badge} size="sm" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Gigs Completed', value: selected.total_gigs_completed },
                  { label: 'Rating', value: selected.rating ? `${selected.rating.toFixed(1)} / 5` : 'New' },
                  { label: 'Total Disbursed', value: formatCurrency(selected.total_disbursed) },
                  { label: 'Total Earned', value: formatCurrency(selected.total_earned) },
                ].map(({ label, value }) => (
                  <div key={label} className="card p-3">
                    <p className="text-xs text-cream/50">{label}</p>
                    <p className="font-bold text-cream mt-0.5">{value}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-2 text-sm">
                {[
                  ['Phone', selected.phone ?? 'Not provided'],
                  ['Country', selected.country ?? 'Not provided'],
                  ['Health', selected.account_health],
                  ['Joined', selected.created_at ? formatDate(selected.created_at) : 'Not available'],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-3 py-2 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                    <span className="text-xs text-cream/50">{label}</span>
                    <span className={`text-xs font-medium text-right ${label === 'Health' && value !== 'healthy' ? 'text-amber-400' : 'text-cream'}`}>{value}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <button onClick={() => toggleHealth(selected)} className="flex-1 py-2 rounded text-xs font-bold uppercase tracking-wider border border-amber-500/30 text-amber-400 hover:bg-amber-500/10 transition-colors" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  {selected.account_health === 'healthy' ? 'Flag Account' : 'Clear Flag'}
                </button>
                <button onClick={() => upgradeBadge(selected)} className="flex-1 py-2 rounded text-xs font-bold uppercase tracking-wider border border-gold/30 text-gold hover:bg-gold/8 transition-colors" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  Upgrade Badge
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

