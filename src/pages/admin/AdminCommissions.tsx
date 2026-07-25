import { useEffect, useState } from 'react';
import { RiDownloadLine, RiLineChartLine, RiCheckboxCircleLine, RiMoneyDollarCircleLine } from 'react-icons/ri';
import { localDb } from '../../lib/localDb';
import { formatCurrency, formatDate } from '../../lib/utils';
import { BadgeIcon } from '../../components/ui/Badge';
import toast from 'react-hot-toast';

export function AdminCommissions() {
  const [state, setState] = useState(() => localDb.snapshot());
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const refresh = () => setState(localDb.snapshot());
    refresh();
    return localDb.subscribe(refresh);
  }, []);

  const commissions = state.commission_ledger;
  const filtered = commissions.filter(c => filter === 'all' || c.status === filter);

  const totalEarned  = commissions.reduce((s, c) => s + Number(c.amount), 0);
  const totalSettled = commissions.filter(c => c.status === 'settled').reduce((s, c) => s + Number(c.amount), 0);
  const totalPending = commissions.filter(c => c.status !== 'settled').reduce((s, c) => s + Number(c.amount), 0);

  function settle(id: string) {
    localDb.settleCommission(id);
    setState(localDb.snapshot());
    toast.success('Worker fee marked as settled');
  }

  const workerRollup = state.workers.map(w => ({
    worker: w,
    earned:  commissions.filter(c=>c.worker_id===w.id).reduce((s,c)=>s+Number(c.amount),0),
    settled: commissions.filter(c=>c.worker_id===w.id&&c.status==='settled').reduce((s,c)=>s+Number(c.amount),0),
    pending: commissions.filter(c=>c.worker_id===w.id&&c.status!=='settled').reduce((s,c)=>s+Number(c.amount),0),
    count:   commissions.filter(c=>c.worker_id===w.id).length,
  })).filter(r => r.earned > 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-cream sm:text-3xl">Worker Fees</h1>
          <p className="text-cream/50 mt-1">Worker fee records and settlement status</p>
        </div>
        <button className="btn-secondary flex w-full items-center justify-center gap-2 text-sm sm:w-auto">
          <RiDownloadLine size={15} /> Export
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {[
          { label: 'Total Worker Fees', value: formatCurrency(totalEarned), color: 'text-cream', icon: RiLineChartLine },
          { label: 'Settled',    value: formatCurrency(totalSettled), color: 'text-sage', icon: RiCheckboxCircleLine },
          { label: 'Pending Settlement',    value: formatCurrency(totalPending), color: 'text-amber-400', icon: RiMoneyDollarCircleLine },
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

      {/* Per-worker rollup */}
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
                <tr><td colSpan={6} className="px-5 py-10 text-center text-cream/50">No worker fees recorded yet</td></tr>
              )}
              {workerRollup.map(({ worker, earned, settled, pending, count }) => (
                <tr key={worker.id} className="border-b hover:bg-white/3 transition-colors" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                  <td className="px-5 py-4">
                    <p className="font-semibold text-cream">{worker.full_name}</p>
                    <p className="text-xs text-cream/50">{worker.email}</p>
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

      {/* Worker fee ledger */}
      <div className="card overflow-hidden">
        <div className="flex flex-col gap-3 px-5 py-4 border-b sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <h2 className="font-bold text-cream">Worker Fee Ledger</h2>
          <div className="flex flex-wrap gap-2">
            {['all', 'earned', 'settled'].map(s => (
              <button key={s} onClick={() => setFilter(s)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${filter === s ? 'bg-gold/15 text-gold/80' : 'text-cream/50 hover:text-cream'}`}>
                {s}
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
                <tr><td colSpan={6} className="px-5 py-10 text-center text-cream/50">No worker fee records match</td></tr>
              )}
              {filtered.map(c => {
                const worker = state.workers.find(w => w.id === c.worker_id);
                const gig    = state.gigs.find(g => g.id === c.gig_id);
                return (
                  <tr key={c.id} className="border-b hover:bg-white/3 transition-colors" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                    <td className="px-5 py-3.5 font-medium text-cream">{worker?.full_name ?? c.worker_id}</td>
                    <td className="px-5 py-3.5 text-xs text-cream/50">{gig?.client_name ?? c.gig_id}</td>
                    <td className="px-5 py-3.5 font-bold text-cream">{formatCurrency(Number(c.amount))}</td>
                    <td className="px-5 py-3.5">
                      <span className={c.status === 'settled' ? 'status-verified' : 'status-pending'}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-cream/50">{formatDate(c.created_at)}</td>
                    <td className="px-5 py-3.5">
                      {c.status !== 'settled' && (
                        <button onClick={() => settle(c.id)}
                          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold text-sage border border-emerald-500/30 hover:bg-sage-500/10 transition-colors">
                          <RiCheckboxCircleLine size={15} /> Mark Settled
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


