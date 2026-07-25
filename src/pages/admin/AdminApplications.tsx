import { useState } from 'react';
import { MOCK_APPLICATIONS, WorkerApplication, ApplicationStatus } from '../../lib/adminMockData';
import { formatDate } from '../../lib/utils';
import toast from 'react-hot-toast';
import { RiCheckboxCircleLine, RiCloseCircleLine, RiEyeLine, RiSearchLine, RiTimeLine, RiArrowDownSLine } from 'react-icons/ri';

const STATUS_COLORS: Record<ApplicationStatus, string> = {
  pending:    'status-pending',
  in_review:  'status-accepted',
  approved:   'status-verified',
  rejected:   'status-failed',
};

export function AdminApplications() {
  const [apps, setApps]         = useState(MOCK_APPLICATIONS);
  const [search, setSearch]     = useState('');
  const [filter, setFilter]     = useState<ApplicationStatus | 'all'>('all');
  const [selected, setSelected] = useState<WorkerApplication | null>(null);
  const [note, setNote]         = useState('');

  const filtered = apps
    .filter(a => filter === 'all' || a.status === filter)
    .filter(a => !search || a.full_name.toLowerCase().includes(search.toLowerCase()) || a.email.toLowerCase().includes(search.toLowerCase()));

  function updateStatus(id: string, status: ApplicationStatus) {
    setApps(prev => prev.map(a => a.id === id ? { ...a, status, reviewed_at: new Date().toISOString(), notes: note || a.notes } : a));
    toast.success(`Application ${status === 'approved' ? 'approved' : status === 'rejected' ? 'rejected' : 'updated'}`);
    setSelected(null);
    setNote('');
  }

  const counts: Record<string, number> = {
    all:       apps.length,
    pending:   apps.filter(a => a.status === 'pending').length,
    in_review: apps.filter(a => a.status === 'in_review').length,
    approved:  apps.filter(a => a.status === 'approved').length,
    rejected:  apps.filter(a => a.status === 'rejected').length,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-black text-cream">Applications</h1>
          <p className="text-cream/50 mt-1">{apps.length} total · {counts.pending} pending review</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'pending', 'in_review', 'approved', 'rejected'] as const).map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-1.5 rounded text-xs font-semibold border transition-all duration-200 ${
              filter === s
                ? 'bg-gold/15 border-primary-500/40 text-gold/80'
                : 'border-white/8 text-cream/50 hover:border-primary-500/25 hover:text-cream'
            }`}
          >
            {s === 'all' ? 'All' : s.replace('_', ' ')} ({counts[s]})
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <RiSearchLine style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'rgba(241,240,218,0.45)', fontSize:14 }} />
        <input className="input-dark pl-10" placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                {['Applicant', 'Country', 'Bank', 'Methods', 'Submitted', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-5 py-3.5 text-xs font-semibold text-cream/50 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-cream/50">No applications found</td>
                </tr>
              ) : filtered.map(app => (
                <tr key={app.id} className="border-b hover:bg-white/3 transition-colors" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                  <td className="px-5 py-4">
                    <p className="font-semibold text-cream">{app.full_name}</p>
                    <p className="text-xs text-cream/50">{app.email}</p>
                    <p className="text-xs text-cream/50">{app.phone}</p>
                  </td>
                  <td className="px-5 py-4 text-cream/50 text-xs">{app.country} · {app.city}</td>
                  <td className="px-5 py-4 text-cream/50 text-xs">{app.bank}</td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-1">
                      {app.methods.map(m => (
                        <span key={m} className="text-xs px-1.5 py-0.5 rounded text-cream/50" style={{ background: 'rgba(255,255,255,0.05)' }}>
                          {m.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-xs text-cream/50">{formatDate(app.submitted_at)}</td>
                  <td className="px-5 py-4">
                    <span className={STATUS_COLORS[app.status]}>{app.status.replace('_', ' ')}</span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => { setSelected(app); setNote(app.notes || ''); }}
                        className="p-1.5 rounded-lg hover:bg-white/8 text-cream/50 hover:text-cream transition-colors"
                        title="Review"
                      >
                        <RiEyeLine style={{ fontSize:14 }} />
                      </button>
                      {app.status !== 'approved' && (
                        <button
                          onClick={() => updateStatus(app.id, 'approved')}
                          className="p-1.5 rounded-lg hover:bg-sage-500/15 text-sage transition-colors"
                          title="Approve"
                        >
                          <RiCheckboxCircleLine style={{ fontSize:14 }} />
                        </button>
                      )}
                      {app.status !== 'rejected' && (
                        <button
                          onClick={() => updateStatus(app.id, 'rejected')}
                          className="p-1.5 rounded-lg hover:bg-red-500/15 text-red-400 transition-colors"
                          title="Reject"
                        >
                          <RiCloseCircleLine style={{ fontSize:14 }} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/60" onClick={() => setSelected(null)} />
          <div className="w-full max-w-md border-l flex flex-col animate-slide-in-right"
            style={{ background: '#0f0e17', borderColor: 'rgba(255,255,255,0.08)' }}>
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <h2 className="font-bold text-cream">Application Review</h2>
              <button onClick={() => setSelected(null)} className="text-cream/50 hover:text-cream p-1"><RiCloseCircleLine style={{ fontSize:18 }} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              <div className="space-y-3 text-sm">
                {[
                  ['Full Name', selected.full_name],
                  ['Email', selected.email],
                  ['Phone', selected.phone],
                  ['Location', `${selected.city}, ${selected.country}`],
                  ['Occupation', selected.occupation],
                  ['Bank', selected.bank],
                  ['Methods', selected.methods.join(', ')],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between border-b pb-2" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                    <span className="text-cream/50 text-xs">{label}</span>
                    <span className="text-cream font-medium text-xs text-right max-w-[200px]">{value}</span>
                  </div>
                ))}
              </div>

              <div>
                <p className="text-xs text-cream/50 mb-2 font-semibold uppercase tracking-wide">Why They Want to Join</p>
                <p className="text-sm text-cream leading-relaxed p-3 rounded" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  {selected.why}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-cream/50 uppercase tracking-wide mb-2">Review Notes</label>
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  className="input-dark resize-none w-full"
                  rows={3}
                  placeholder="Add internal notes..."
                />
              </div>
            </div>

            <div className="p-5 border-t flex gap-3" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <button
                onClick={() => updateStatus(selected.id, 'rejected')}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded text-sm font-semibold text-red-400 border border-red-500/30 hover:bg-red-500/10 transition-colors"
              >
                <RiCloseCircleLine style={{ fontSize:15 }} /> Reject
              </button>
              <button
                onClick={() => updateStatus(selected.id, 'in_review')}
                className="px-4 py-2.5 rounded text-sm font-semibold text-amber-400 border border-amber-500/30 hover:bg-amber-500/10 transition-colors"
              >
                In Review
              </button>
              <button
                onClick={() => updateStatus(selected.id, 'approved')}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded text-sm font-semibold text-sage border border-emerald-500/30 hover:bg-sage-500/10 transition-colors"
              >
                <RiCheckboxCircleLine style={{ fontSize:15 }} /> Approve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
