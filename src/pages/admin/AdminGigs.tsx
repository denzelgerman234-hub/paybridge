import { useEffect, useState } from 'react';
import { RiAddLine, RiSearchLine, RiMoneyDollarCircleLine, RiUserAddLine, RiCloseLine, RiCheckLine } from 'react-icons/ri';
import { localDb } from '../../lib/localDb';
import { WorkerGig } from '../../types/database';
import { formatCurrency, formatDate, formatRelativeTime } from '../../lib/utils';
import toast from 'react-hot-toast';

import { DISBURSEMENT_METHODS, PARTNER_BANKS } from '../../lib/constants';

const EMPTY_GIG: Partial<WorkerGig> = {
  client_name: '', client_contact: '', total_principal: 0, commission_rate: 10,
  recipient_count: 0, disbursement_methods: [], badge_required: null,
  deadline: '', notes: '', funded: false,
};

export function AdminGigs() {
  const [gigs, setGigs]         = useState(localDb.listGigs());
  const [applications, setApplications] = useState(localDb.listGigApplications('all'));
  const [workers, setWorkers] = useState(localDb.listWorkers());
  const [search, setSearch]     = useState('');
  const [filter, setFilter]     = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [showFund, setShowFund]     = useState<WorkerGig | null>(null);
  const [showAssign, setShowAssign] = useState<WorkerGig | null>(null);
  const [form, setForm]         = useState({ ...EMPTY_GIG, methods: [] as string[] });
  const [fundRef, setFundRef]   = useState('');
  const [assignId, setAssignId] = useState('');

  function refresh() {
    setGigs(localDb.listGigs());
    setApplications(localDb.listGigApplications('all'));
    setWorkers(localDb.listWorkers());
  }

  useEffect(() => {
    refresh();
    return localDb.subscribe(refresh);
  }, []);

  const filtered = gigs
    .filter(g => filter === 'all' || g.status === filter)
    .filter(g => !search || g.client_name.toLowerCase().includes(search.toLowerCase()));

  const pendingApplications = applications.filter(app => app.status === 'submitted' || app.status === 'under_review');

  const commissionAmt = (form.total_principal || 0) * ((form.commission_rate || 10) / 100);

  function createGig() {
    if (!form.client_name || !form.total_principal || !form.deadline) {
      toast.error('Fill in required fields'); return;
    }
    localDb.createGig({
      client_name: form.client_name!,
      client_contact: form.client_contact || null,
      total_principal: Number(form.total_principal),
      commission_rate: Number(form.commission_rate) || 10,
      recipient_count: Number(form.recipient_count) || 1,
      disbursement_methods: form.methods,
      badge_required: (form.badge_required as any) || null,
      deadline: new Date(form.deadline!).toISOString(),
      notes: form.notes || null,
    });
    refresh();
    setForm({ ...EMPTY_GIG, methods: [] });
    setShowCreate(false);
    toast.success('Gig created');
  }

  function fundGig(gig: WorkerGig) {
    if (!fundRef) { toast.error('Enter a funding reference'); return; }
    try {
      localDb.markFundingSent(gig.id, fundRef);
      refresh();
      setShowFund(null);
      setFundRef('');
      toast.success(`${gig.client_name} funding recorded - ${formatCurrency(gig.total_principal)}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not record funding');
    }
  }

  function assignWorker(gig: WorkerGig) {
    if (!assignId) { toast.error('Select a worker'); return; }
    toast.error('Workers are assigned by accepting a gig application.');
  }

  function toggleMethod(m: string) {
    setForm(p => ({ ...p, methods: p.methods.includes(m) ? p.methods.filter(x => x !== m) : [...p.methods, m] }));
  }

  const statuses = ['all', 'open', 'accepted', 'funded', 'in_progress', 'completed', 'cancelled'];
  const counts   = Object.fromEntries(statuses.map(s => [s, s === 'all' ? gigs.length : gigs.filter(g => g.status === s).length]));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-black text-cream">Gig Management</h1>
          <p className="text-cream/50 mt-1">{gigs.length} total gigs - {gigs.filter(g=>!g.funded && g.status!=='completed').length} unfunded</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
          <RiAddLine size={16} /> Create Gig
        </button>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 flex-wrap">
        {statuses.map(s => counts[s] > 0 && (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded text-xs font-semibold border transition-all ${filter === s ? 'bg-gold/15 border-primary-500/40 text-gold/80' : 'border-white/8 text-cream/50 hover:border-primary-500/25 hover:text-cream'}`}>
            {s === 'all' ? 'All' : s.replace(/_/g, ' ')} ({counts[s]})
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <RiSearchLine size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-cream/50" />
        <input className="input-dark pl-10" placeholder="Search by client name..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      {/* Gig applications */}
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
                  <p className="font-semibold text-cream">{app.worker_name}</p>
                  <p className="text-xs text-cream/50 mt-0.5">{app.gig?.client_name ?? 'Unknown gig'} - submitted {formatRelativeTime(app.submitted_at)}</p>
                  {app.note && <p className="text-xs text-cream/50 mt-2 max-w-xl">{app.note}</p>}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button className="px-3 py-1.5 rounded text-xs font-semibold text-cream/70 border border-white/10 hover:border-primary-500/30" onClick={() => { localDb.reviewGigApplication(app.id, 'under_review', 'Moderator is reviewing this application.'); refresh(); toast.success('Application marked in review'); }}>
                    In Review
                  </button>
                  <button className="px-3 py-1.5 rounded text-xs font-semibold text-sage border border-emerald-500/30 hover:bg-sage-500/10" onClick={() => { localDb.reviewGigApplication(app.id, 'accepted', 'Worker matches requirements.'); refresh(); toast.success('Gig assigned and Operations room opened'); }}>
                    Accept
                  </button>
                  <button className="px-3 py-1.5 rounded text-xs font-semibold text-red-400 border border-red-500/30 hover:bg-red-500/10" onClick={() => { localDb.reviewGigApplication(app.id, 'declined', 'Worker does not match the current requirements.'); refresh(); toast.success('Application declined'); }}>
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Gigs table */}
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
                <tr><td colSpan={8} className="px-5 py-10 text-center text-cream/50">No gigs found</td></tr>
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
                        ? <span className="text-xs text-sage flex items-center gap-1"><span style={{color:"#7DC99A",fontSize:16}}>?</span> Yes</span>
                      : <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#C9A84C', fontFamily: "'Space Grotesk', sans-serif" }}>Pending</span>}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        {!gig.funded && (
                          <button onClick={() => setShowFund(gig)}
                            className="p-1.5 rounded-lg hover:bg-sage-500/15 text-sage transition-colors" title="Fund Gig">
                            <RiMoneyDollarCircleLine size={14} />
                          </button>
                        )}

                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* -- Create Gig Modal -- */}
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
                  <input className="input-dark" type="number" value={form.recipient_count||''} onChange={e=>setForm(p=>({...p,recipient_count:+e.target.value}))} placeholder="5" />
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

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-cream/50 uppercase tracking-wide">Notes</label>
                <textarea className="input-dark resize-none" rows={3} value={form.notes||''} onChange={e=>setForm(p=>({...p,notes:e.target.value}))} placeholder="Instructions for the worker..." />
              </div>

              <div className="flex gap-3 pt-2">
                <button className="btn-secondary flex-1" onClick={() => setShowCreate(false)}>Cancel</button>
                <button className="btn-primary flex-1" onClick={createGig}><RiAddLine size={15}/> Create Gig</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* -- Fund Gig Modal -- */}
      {showFund && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto px-4 py-6 sm:py-8">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowFund(null)} />
          <div className="relative w-full max-w-sm card p-6 max-h-[calc(100dvh-3rem)] overflow-y-auto">
            <h2 className="font-bold text-cream mb-1">Fund Gig</h2>
            <p className="text-xs text-cream/50 mb-4">{showFund.client_name} - {formatCurrency(showFund.total_principal)}</p>
            <div className="p-3 rounded mb-4 text-xs text-amber-400" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
              <span style={{color:"#C9A84C",fontSize:16}}>!</span>
              Confirm that <strong>{formatCurrency(showFund.total_principal)}</strong> has been deposited into the worker's dedicated disbursement account before marking as funded.
            </div>
            <input className="input-dark mb-4" value={fundRef} onChange={e => setFundRef(e.target.value)} placeholder="Funding reference (e.g. FUND-2026-0004)" />
            <div className="flex gap-3">
              <button className="btn-secondary flex-1" onClick={() => setShowFund(null)}>Cancel</button>
              <button className="btn-primary flex-1 flex items-center justify-center gap-2" onClick={() => fundGig(showFund)}>
                <RiMoneyDollarCircleLine size={15}/> Confirm Funding
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -- Assign Worker Modal -- */}
      {showAssign && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto px-4 py-6 sm:py-8">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowAssign(null)} />
          <div className="relative w-full max-w-sm card p-6 max-h-[calc(100dvh-3rem)] overflow-y-auto">
            <h2 className="font-bold text-cream mb-1">Assign Worker</h2>
            <p className="text-xs text-cream/50 mb-4">{showAssign.client_name} - {formatCurrency(showAssign.total_principal)}</p>
            <select className="input-dark appearance-none mb-4" value={assignId} onChange={e => setAssignId(e.target.value)}>
              <option value="">- Select a worker -</option>
              {workers.filter(w => w.onboarding_completed && w.account_health === 'healthy').map(w => (
                <option key={w.id} value={w.id} className="bg-[#1e1c35]">{w.full_name} ({w.badge})</option>
              ))}
            </select>
            <div className="flex gap-3">
              <button className="btn-secondary flex-1" onClick={() => setShowAssign(null)}>Cancel</button>
              <button className="btn-primary flex-1 flex items-center justify-center gap-2" onClick={() => assignWorker(showAssign)}>
                <RiUserAddLine size={15}/> Assign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}






