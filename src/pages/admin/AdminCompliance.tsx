import { useEffect, useState } from 'react';
import { RiAlertLine, RiFlagLine, RiFileTextLine, RiCheckboxCircleLine, RiCloseLine } from 'react-icons/ri';
import { MOCK_ALL_WORKERS } from '../../lib/adminMockData';
import { localDb } from '../../lib/localDb';
import { formatDate } from '../../lib/utils';
import toast from 'react-hot-toast';


type IncidentStatus = 'open' | 'investigating' | 'resolved';

type KycReviewSubmission = ReturnType<typeof localDb.listKycSubmissions>[number];

interface ComplianceIncident {
  id: string;
  worker_id: string;
  gig_id: string | null;
  type: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: IncidentStatus;
  reported_at: string;
  resolved_at: string | null;
}

const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 3600 * 1000).toISOString();

const INCIDENTS: ComplianceIncident[] = [
  { id: 'inc-001', worker_id: 'worker-004', gig_id: 'gig-003', type: 'Non-platform contact', description: 'Worker received disbursement instructions via personal WhatsApp from client.', severity: 'medium', status: 'investigating', reported_at: daysAgo(2), resolved_at: null },
  { id: 'inc-002', worker_id: 'mock-user-001', gig_id: null, type: 'Proof upload delay', description: 'Worker exceeded 24-hour proof upload window for 2 disbursements.', severity: 'low', status: 'resolved', reported_at: daysAgo(7), resolved_at: daysAgo(5) },
  { id: 'inc-003', worker_id: 'worker-004', gig_id: null, type: 'OFAC flag — false positive', description: 'Recipient name triggered OFAC watchlist partial match. Confirmed false positive after manual review.', severity: 'high', status: 'resolved', reported_at: daysAgo(14), resolved_at: daysAgo(12) },
];

const SEVERITY_STYLE: Record<string, string> = {
  low:      'text-sage bg-sage-500/10 border-emerald-500/25',
  medium:   'text-amber-400 bg-amber-500/10 border-amber-500/25',
  high:     'text-orange-400 bg-orange-500/10 border-orange-500/25',
  critical: 'text-red-400 bg-red-500/10 border-red-500/25',
};

const AUDIT_LOG = [
  { id: 'al-001', action: 'Application approved',         target: 'Sofia Reyes',    admin: 'admin-001', at: daysAgo(7) },
  { id: 'al-002', action: 'Application rejected',         target: 'Kwame Boateng',  admin: 'admin-001', at: daysAgo(12) },
  { id: 'al-003', action: 'Gig funded',                   target: 'Acme Corp',      admin: 'admin-001', at: daysAgo(29) },
  { id: 'al-004', action: 'Worker badge upgraded',        target: 'Alex Johnson',   admin: 'admin-001', at: daysAgo(15) },
  { id: 'al-005', action: 'Account health flagged',       target: 'Priya Sharma',   admin: 'admin-001', at: daysAgo(3) },
  { id: 'al-006', action: 'Worker fee marked settled',    target: 'James Okonkwo',  admin: 'admin-001', at: daysAgo(1) },
  { id: 'al-007', action: 'Incident opened',              target: 'inc-001',        admin: 'system',    at: daysAgo(2) },
];

export function AdminCompliance() {
  const [incidents, setIncidents] = useState(INCIDENTS);
  const [kycSubmissions, setKycSubmissions] = useState<KycReviewSubmission[]>(() => localDb.listKycSubmissions('all'));
  const [selected, setSelected]   = useState<ComplianceIncident | null>(null);

  useEffect(() => localDb.subscribe(() => {
    setKycSubmissions(localDb.listKycSubmissions('all'));
  }), []);

  function resolve(id: string) {
    setIncidents(prev => prev.map(i => i.id === id ? { ...i, status: 'resolved', resolved_at: new Date().toISOString() } : i));
    toast.success('Incident marked resolved');
    setSelected(null);
  }

  function reviewKyc(id: string, status: 'in_review' | 'verified' | 'rejected') {
    const note = status === 'verified'
      ? 'Approved after manual Operations review.'
      : status === 'rejected'
        ? 'Needs updated ID or tax information before approval.'
        : 'Operations started manual identity review.';
    localDb.reviewKycSubmission(id, status, note, 'admin-001');
    setKycSubmissions(localDb.listKycSubmissions('all'));
    toast.success(status === 'verified' ? 'KYC approved' : status === 'rejected' ? 'KYC marked for update' : 'KYC marked in review');
  }

  const open         = incidents.filter(i => i.status !== 'resolved').length;
  const flaggedWorkers = MOCK_ALL_WORKERS.filter(w => w.account_health !== 'healthy');
  const pendingKyc = kycSubmissions.filter(item => item.status === 'submitted' || item.status === 'in_review');

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-black text-cream">Compliance & Audit</h1>
        <p className="text-cream/50 mt-1">AML monitoring, incident management, and audit trail</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4">
        {[
          { label: 'Open Incidents',       value: open,               color: open > 0 ? 'text-red-400' : 'text-sage',  icon: RiAlertLine },
          { label: 'Flagged Workers',      value: flaggedWorkers.length, color: flaggedWorkers.length > 0 ? 'text-amber-400' : 'text-sage', icon: RiFlagLine },
          { label: 'KYC Reviews',          value: pendingKyc.length, color: pendingKyc.length > 0 ? 'text-gold' : 'text-sage', icon: RiFileTextLine },
          { label: 'Total Audit Events',   value: AUDIT_LOG.length,   color: 'text-gold', icon: RiFileTextLine },
          { label: 'Resolved Incidents',   value: incidents.filter(i=>i.status==='resolved').length, color: 'text-sage', icon: RiCheckboxCircleLine },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="card p-5">
            <Icon size={18} className={`${color} mb-2`} />
            <p className={`text-2xl font-black ${color}`}>{value}</p>
            <p className="text-xs text-cream/50 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Flagged workers */}
      {flaggedWorkers.length > 0 && (
        <div className="card p-5 border border-amber-500/20">
          <h2 className="font-bold text-cream mb-3 flex items-center gap-2">
            <RiFlagLine size={16} className="text-amber-400" /> Flagged Accounts
          </h2>
          <div className="space-y-2">
            {flaggedWorkers.map(w => (
              <div key={w.id} className="flex items-center justify-between p-3 rounded border border-white/8">
                <div>
                  <p className="font-semibold text-cream text-sm">{w.full_name}</p>
                  <p className="text-xs text-cream/50">{w.email}</p>
                </div>
                <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1" style={{ color: '#C9A84C', fontFamily: "'Space Grotesk', sans-serif" }}><span style={{color:"#C9A84C",fontSize:16}}>!</span> {w.account_health}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KYC review queue */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div>
            <h2 className="font-bold text-cream">KYC Manual Review</h2>
            <p className="text-xs text-cream/50 mt-0.5">Review worker ID uploads and tax ID last four before approval.</p>
          </div>
          <span className={pendingKyc.length > 0 ? 'status-pending' : 'status-verified'}>{pendingKyc.length} pending</span>
        </div>
        {kycSubmissions.length === 0 ? (
          <div className="p-5 text-sm text-cream/50">No KYC submissions yet.</div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
            {kycSubmissions.map(submission => (
              <div key={submission.id} className="p-5 hover:bg-white/3 transition-colors">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={submission.status === 'verified' ? 'status-verified' : submission.status === 'rejected' ? 'status-failed' : 'status-pending'}>
                        {submission.status.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-cream/50">{formatDate(submission.submitted_at)}</span>
                    </div>
                    <p className="font-semibold text-cream text-sm">{submission.worker?.full_name ?? 'Unknown worker'}</p>
                    <p className="text-xs text-cream/50">{submission.worker?.email ?? submission.worker_id}</p>
                    <div className="mt-3 grid gap-2 text-xs text-cream/50 sm:grid-cols-3">
                      <p><span className="text-cream/35">ID:</span> {submission.id_document_type.replace('_', ' ')}</p>
                      <p><span className="text-cream/35">File:</span> {submission.id_document_file_name}</p>
                      <p><span className="text-cream/35">Tax:</span> {submission.tax_id_type.toUpperCase()} ending {submission.tax_id_last4}</p>
                    </div>
                    {submission.review_note && <p className="mt-2 text-xs text-cream/40">{submission.review_note}</p>}
                  </div>
                  <div className="flex flex-wrap gap-2 lg:justify-end">
                    {(submission.status === 'submitted' || submission.status === 'rejected') && (
                      <button onClick={() => reviewKyc(submission.id, 'in_review')} className="px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider border border-gold/30 text-gold hover:bg-gold/10 transition-colors">
                        Reviewing
                      </button>
                    )}
                    {submission.status !== 'verified' && (
                      <button onClick={() => reviewKyc(submission.id, 'verified')} className="px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider border border-emerald-500/30 text-sage hover:bg-sage-500/10 transition-colors">
                        Approve
                      </button>
                    )}
                    {submission.status !== 'rejected' && (
                      <button onClick={() => reviewKyc(submission.id, 'rejected')} className="px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors">
                        Needs Update
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Incidents */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <h2 className="font-bold text-cream">Compliance Incidents</h2>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${open > 0 ? 'text-red-400 border-red-500/30 bg-red-500/10' : 'text-sage border-emerald-500/30 bg-sage-500/10'}`}>
            {open} open
          </span>
        </div>
        <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
          {incidents.map(inc => {
            const worker = MOCK_ALL_WORKERS.find(w => w.id === inc.worker_id);
            return (
              <div key={inc.id} className="p-5 hover:bg-white/3 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded border ${SEVERITY_STYLE[inc.severity]}`}>
                        {inc.severity.toUpperCase()}
                      </span>
                      <span className="text-xs text-cream/50">{inc.type}</span>
                      <span className={inc.status === 'resolved' ? 'status-verified' : 'status-pending'}>
                        {inc.status}
                      </span>
                    </div>
                    <p className="text-sm text-cream mb-1">{inc.description}</p>
                    <p className="text-xs text-cream/50">
                      Worker: {worker?.full_name} · {formatDate(inc.reported_at)}
                      {inc.resolved_at && ` · Resolved: ${formatDate(inc.resolved_at)}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => setSelected(inc)} className="p-1.5 rounded-lg hover:bg-white/8 text-cream/50 hover:text-cream transition-colors" title="View details">
                      <RiFileTextLine size={14} className="text-cream/50" />
                    </button>
                    {inc.status !== 'resolved' && (
                      <button onClick={() => resolve(inc.id)} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg text-sage border border-emerald-500/30 hover:bg-sage-500/10 transition-colors">
                        <RiCheckboxCircleLine size={16} className="text-sage" /> Resolve
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Audit trail */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <h2 className="font-bold text-cream">Admin Audit Trail</h2>
        </div>
        <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
          {AUDIT_LOG.map(entry => (
            <div key={entry.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-white/3 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-primary-400 flex-shrink-0" />
                <div>
                  <span className="text-sm font-medium text-cream">{entry.action}</span>
                  <span className="text-xs text-cream/50 ml-2">→ {entry.target}</span>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs text-cream/50">{formatDate(entry.at)}</p>
                <p className="text-xs text-cream/50 opacity-60">{entry.admin}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Incident detail panel */}
      {selected && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/60" onClick={() => setSelected(null)} />
          <div className="w-full max-w-sm border-l flex flex-col" style={{ background: '#0f0e17', borderColor: 'rgba(255,255,255,0.08)' }}>
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <h2 className="font-bold text-cream">Incident Detail</h2>
              <button onClick={() => setSelected(null)} className="text-cream/50 hover:text-cream"><RiCloseLine size={18} /></button>
            </div>
            <div className="p-5 space-y-4 flex-1 overflow-y-auto">
              <span className={`text-xs font-bold px-2.5 py-1 rounded border ${SEVERITY_STYLE[selected.severity]}`}>
                {selected.severity.toUpperCase()} — {selected.type}
              </span>
              <p className="text-sm text-cream leading-relaxed">{selected.description}</p>
              <div className="space-y-2 text-xs text-cream/50">
                <p>Worker: <span className="text-cream">{MOCK_ALL_WORKERS.find(w=>w.id===selected.worker_id)?.full_name}</span></p>
                <p>Reported: <span className="text-cream">{formatDate(selected.reported_at)}</span></p>
                <p>Status: <span className={selected.status==='resolved' ? 'text-sage' : 'text-amber-400'}>{selected.status}</span></p>
                {selected.resolved_at && <p>Resolved: <span className="text-sage">{formatDate(selected.resolved_at)}</span></p>}
              </div>
            </div>
            {selected.status !== 'resolved' && (
              <div className="p-5 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <button onClick={() => resolve(selected.id)} className="w-full flex items-center justify-center gap-2 py-2.5 rounded text-sm font-semibold text-sage border border-emerald-500/30 hover:bg-sage-500/10 transition-colors">
                  <RiCheckboxCircleLine size={16} className="text-sage" /> Mark Resolved
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
