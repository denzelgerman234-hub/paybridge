import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { RiCheckboxCircleLine, RiCloseCircleLine, RiDownloadLine, RiSearchLine } from 'react-icons/ri';
import { localDb } from '../../lib/localDb';
import { formatCurrency, formatDate } from '../../lib/utils';

type AdminDisbursement = ReturnType<typeof localDb.listDisbursements>[number];

const REVIEWABLE = ['sent', 'proof_rejected'];

export function AdminDisbursements() {
  const [disbursements, setDisbursements] = useState<AdminDisbursement[]>(() => localDb.listDisbursements());
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  function refresh() {
    setDisbursements(localDb.listDisbursements());
  }

  useEffect(() => {
    refresh();
    return localDb.subscribe(refresh);
  }, []);

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

  function verify(id: string, verified: boolean) {
    localDb.verifyDisbursement(id, verified, verified ? 'Proof verified by Operations.' : 'Proof needs correction before approval.');
    refresh();
    toast.success(verified ? 'Proof verified' : 'Proof returned for correction');
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-black text-cream">Disbursements</h1>
          <p className="text-cream/50 mt-1">{disbursements.length} total - {formatCurrency(totalSent)} sent</p>
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
                <tr><td colSpan={10} className="px-5 py-10 text-center text-cream/50">No disbursements match</td></tr>
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
                  <td className="px-5 py-3.5 text-xs text-cream/50">{d.transaction_id ?? '-'}</td>
                  <td className="px-5 py-3.5 text-xs text-cream/50">{d.sent_at ? formatDate(d.sent_at) : '-'}</td>
                  <td className="px-5 py-3.5"><span className={`status-${d.status}`}>{d.status.replace(/_/g, ' ')}</span></td>
                  <td className="px-5 py-3.5">
                    {d.proof_file_name
                      ? <span className="text-xs text-gold">{d.proof_file_name}</span>
                      : d.proof_url
                        ? <span className="text-xs text-gold">Proof attached</span>
                        : <span className="text-xs text-cream/50">-</span>}
                  </td>
                  <td className="px-5 py-3.5">
                    {REVIEWABLE.includes(d.status) ? (
                      <div className="flex items-center gap-2">
                        <button onClick={() => verify(d.id, true)} className="p-1.5 rounded hover:bg-sage-500/15 text-sage transition-colors" title="Verify proof">
                          <RiCheckboxCircleLine size={16} />
                        </button>
                        <button onClick={() => verify(d.id, false)} className="p-1.5 rounded hover:bg-red-500/15 text-red-400 transition-colors" title="Request correction">
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

