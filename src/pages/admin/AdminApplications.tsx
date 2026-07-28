import { useEffect, useState } from 'react';
import { ApplicationStatus, WorkerApplication } from '../../lib/adminMockData';
import { localDb } from '../../lib/localDb';
import { formatDate } from '../../lib/utils';
import toast from 'react-hot-toast';
import { RiCheckboxCircleLine, RiCloseCircleLine, RiEyeLine, RiSearchLine, RiTimeLine } from 'react-icons/ri';

const STATUS_COLORS: Record<ApplicationStatus, string> = {
  pending: 'status-pending',
  in_review: 'status-accepted',
  approved: 'status-verified',
  rejected: 'status-failed',
};

export function AdminApplications() {
  const [apps, setApps] = useState<WorkerApplication[]>(() => localDb.listWorkerApplications('all'));
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<ApplicationStatus | 'all'>('all');
  const [selected, setSelected] = useState<WorkerApplication | null>(null);
  const [note, setNote] = useState('');

  function refresh() {
    const next = localDb.listWorkerApplications('all');
    setApps(next);
    setSelected(current => current ? next.find(application => application.id === current.id) ?? null : null);
  }

  useEffect(() => {
    refresh();
    return localDb.subscribe(refresh);
  }, []);

  const filtered = apps
    .filter(application => filter === 'all' || application.status === filter)
    .filter(application => !search || application.full_name.toLowerCase().includes(search.toLowerCase()) || application.email.toLowerCase().includes(search.toLowerCase()));

  function updateStatus(id: string, status: ApplicationStatus) {
    try {
      localDb.reviewWorkerApplication(id, status, note);
      refresh();
      toast.success(status === 'approved' ? 'Account verified and application approved' : status === 'rejected' ? 'Application rejected' : 'Application updated');
      setSelected(null);
      setNote('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Application update failed');
    }
  }

  const counts: Record<string, number> = {
    all: apps.length,
    pending: apps.filter(application => application.status === 'pending').length,
    in_review: apps.filter(application => application.status === 'in_review').length,
    approved: apps.filter(application => application.status === 'approved').length,
    rejected: apps.filter(application => application.status === 'rejected').length,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-black text-cream">Applications</h1>
          <p className="text-cream/50 mt-1">{apps.length} total - {counts.pending} pending account verification</p>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {(['all', 'pending', 'in_review', 'approved', 'rejected'] as const).map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-1.5 rounded text-xs font-semibold border transition-all duration-200 ${
              filter === status
                ? 'bg-gold/15 border-primary-500/40 text-gold/80'
                : 'border-white/8 text-cream/50 hover:border-primary-500/25 hover:text-cream'
            }`}
          >
            {status === 'all' ? 'All' : status.replace('_', ' ')} ({counts[status]})
          </button>
        ))}
      </div>

      <div className="relative">
        <RiSearchLine style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(241,240,218,0.45)', fontSize: 14 }} />
        <input className="input-dark pl-10" placeholder="Search by name or email..." value={search} onChange={event => setSearch(event.target.value)} />
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                {['Applicant', 'Location', 'Bank', 'Methods', 'Submitted', 'Status', 'Actions'].map(heading => (
                  <th key={heading} className="px-5 py-3.5 text-xs font-semibold text-cream/50 uppercase tracking-wide">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-cream/50">No applications found</td>
                </tr>
              ) : filtered.map(application => (
                <tr key={application.id} className="border-b hover:bg-white/3 transition-colors" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                  <td className="px-5 py-4">
                    <p className="font-semibold text-cream">{application.full_name}</p>
                    <p className="text-xs text-cream/50">{application.email}</p>
                    <p className="text-xs text-cream/50">{application.phone}</p>
                  </td>
                  <td className="px-5 py-4 text-cream/50 text-xs">{application.country} - {application.city}</td>
                  <td className="px-5 py-4 text-cream/50 text-xs">{application.bank}</td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-1">
                      {application.methods.map(method => (
                        <span key={method} className="text-xs px-1.5 py-0.5 rounded text-cream/50" style={{ background: 'rgba(255,255,255,0.05)' }}>
                          {method.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-xs text-cream/50">{formatDate(application.submitted_at)}</td>
                  <td className="px-5 py-4">
                    <span className={STATUS_COLORS[application.status]}>{application.status.replace('_', ' ')}</span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => { setSelected(application); setNote(application.notes || ''); }}
                        className="p-1.5 rounded-lg hover:bg-white/8 text-cream/50 hover:text-cream transition-colors"
                        title="Review"
                      >
                        <RiEyeLine style={{ fontSize: 14 }} />
                      </button>
                      {application.status !== 'approved' && (
                        <button onClick={() => updateStatus(application.id, 'approved')} className="p-1.5 rounded-lg hover:bg-sage-500/15 text-sage transition-colors" title="Approve and verify account">
                          <RiCheckboxCircleLine style={{ fontSize: 14 }} />
                        </button>
                      )}
                      {application.status !== 'rejected' && (
                        <button onClick={() => updateStatus(application.id, 'rejected')} className="p-1.5 rounded-lg hover:bg-red-500/15 text-red-400 transition-colors" title="Reject">
                          <RiCloseCircleLine style={{ fontSize: 14 }} />
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

      {selected && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/60" onClick={() => setSelected(null)} />
          <div className="w-full max-w-md border-l flex flex-col animate-slide-in-right" style={{ background: '#0f0e17', borderColor: 'rgba(255,255,255,0.08)' }}>
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <h2 className="font-bold text-cream">Account Verification</h2>
              <button onClick={() => setSelected(null)} className="text-cream/50 hover:text-cream p-1"><RiCloseCircleLine style={{ fontSize: 18 }} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              <div className="space-y-3 text-sm">
                {[
                  ['Full Name', selected.full_name],
                  ['Email', selected.email],
                  ['Phone', selected.phone],
                  ['Location', `${selected.city}, ${selected.country}`],
                  ['Occupation', selected.occupation],
                  ['Primary Bank', selected.bank],
                  ['Methods', selected.methods.join(', ')],
                  ['Status', selected.status.replace('_', ' ')],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between border-b pb-2" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                    <span className="text-cream/50 text-xs">{label}</span>
                    <span className="text-cream font-medium text-xs text-right max-w-[210px]">{value}</span>
                  </div>
                ))}
              </div>

              <div>
                <p className="text-xs text-cream/50 mb-2 font-semibold uppercase tracking-wide">Why They Want to Join</p>
                <p className="text-sm text-cream leading-relaxed p-3 rounded" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  {selected.why}
                </p>
              </div>

              {selected.notes && (
                <div>
                  <p className="text-xs text-cream/50 mb-2 font-semibold uppercase tracking-wide">Application Notes</p>
                  <p className="text-sm text-cream/70 leading-relaxed p-3 rounded" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    {selected.notes}
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-cream/50 uppercase tracking-wide mb-2">Review Notes</label>
                <textarea value={note} onChange={event => setNote(event.target.value)} className="input-dark resize-none w-full" rows={3} placeholder="Add internal notes..." />
              </div>
            </div>

            <div className="p-5 border-t flex gap-3" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <button onClick={() => updateStatus(selected.id, 'rejected')} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded text-sm font-semibold text-red-400 border border-red-500/30 hover:bg-red-500/10 transition-colors">
                <RiCloseCircleLine style={{ fontSize: 15 }} /> Reject
              </button>
              <button onClick={() => updateStatus(selected.id, 'in_review')} className="px-4 py-2.5 rounded text-sm font-semibold text-amber-400 border border-amber-500/30 hover:bg-amber-500/10 transition-colors">
                In Review
              </button>
              <button onClick={() => updateStatus(selected.id, 'approved')} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded text-sm font-semibold text-sage border border-emerald-500/30 hover:bg-sage-500/10 transition-colors">
                <RiCheckboxCircleLine style={{ fontSize: 15 }} /> Verify
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

