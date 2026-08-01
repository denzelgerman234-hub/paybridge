import { useEffect, useMemo, useState } from 'react';
import { RiAlertLine, RiFlagLine, RiFileTextLine, RiCheckboxCircleLine, RiCloseLine } from 'react-icons/ri';
import { AdminKycReviewSubmission, listAdminKycSubmissions, reviewAdminKycSubmission } from '../../lib/adminComplianceData';
import { supabase } from '../../lib/supabase';
import { formatDate } from '../../lib/utils';
import { LocalAuditEvent, SupportTicket, WorkerProfile } from '../../types/database';
import toast from 'react-hot-toast';

type KycReviewSubmission = AdminKycReviewSubmission;
type FlaggedWorker = Pick<WorkerProfile, 'id' | 'full_name' | 'phone' | 'country' | 'account_health'> & { email?: string | null };
type IncidentRow = SupportTicket & { worker: FlaggedWorker | null; severity: 'medium' | 'high' };

const SEVERITY_STYLE: Record<IncidentRow['severity'], string> = {
  medium: 'text-amber-400 bg-amber-500/10 border-amber-500/25',
  high: 'text-orange-400 bg-orange-500/10 border-orange-500/25',
};

function throwIfError(error: any) {
  if (error) throw error;
}

function normalizeWorker(row: any): FlaggedWorker {
  return {
    id: row.id,
    full_name: row.full_name,
    phone: row.phone,
    country: row.country,
    account_health: row.account_health,
    email: row.email ?? null,
  };
}

function toIncident(ticket: SupportTicket, worker: FlaggedWorker | null): IncidentRow {
  return {
    ...ticket,
    worker,
    severity: ticket.priority === 'urgent' ? 'high' : 'medium',
  };
}

export function AdminCompliance() {
  const [incidents, setIncidents] = useState<IncidentRow[]>([]);
  const [flaggedWorkers, setFlaggedWorkers] = useState<FlaggedWorker[]>([]);
  const [auditLog, setAuditLog] = useState<LocalAuditEvent[]>([]);
  const [kycSubmissions, setKycSubmissions] = useState<KycReviewSubmission[]>([]);
  const [loadingCompliance, setLoadingCompliance] = useState(true);
  const [loadingKyc, setLoadingKyc] = useState(true);
  const [reviewingKycId, setReviewingKycId] = useState<string | null>(null);
  const [selected, setSelected] = useState<IncidentRow | null>(null);

  async function refreshComplianceData() {
    setLoadingCompliance(true);
    try {
      const [incidentsResult, workersResult, appsResult, auditResult] = await Promise.all([
        supabase
          .from('support_tickets')
          .select('*')
          .eq('type', 'incident')
          .order('updated_at', { ascending: false }),
        supabase
          .from('worker_profiles')
          .select('id,full_name,phone,country,account_health')
          .order('full_name'),
        supabase
          .from('worker_applications')
          .select('worker_id,email'),
        supabase
          .from('audit_events')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(25),
      ]);

      throwIfError(incidentsResult.error);
      throwIfError(workersResult.error);
      throwIfError(appsResult.error);
      throwIfError(auditResult.error);

      const emailByWorker = new Map(
        ((appsResult.data ?? []) as { worker_id: string | null; email: string }[])
          .filter(app => app.worker_id)
          .map(app => [app.worker_id as string, app.email]),
      );
      const workers = ((workersResult.data ?? []) as any[]).map(row => ({
        ...normalizeWorker(row),
        email: emailByWorker.get(row.id) ?? null,
      }));
      const workerById = new Map(workers.map(worker => [worker.id, worker]));

      setFlaggedWorkers(workers.filter(worker => worker.account_health !== 'healthy'));
      setIncidents(((incidentsResult.data ?? []) as SupportTicket[]).map(ticket => toIncident(ticket, workerById.get(ticket.worker_id) ?? null)));
      setAuditLog((auditResult.data ?? []) as LocalAuditEvent[]);
    } catch (error) {
      console.error('[paybridge] Failed to load compliance data', error);
      toast.error(error instanceof Error ? error.message : 'Could not load compliance data');
      setIncidents([]);
      setFlaggedWorkers([]);
      setAuditLog([]);
    } finally {
      setLoadingCompliance(false);
    }
  }

  async function refreshKycSubmissions() {
    setLoadingKyc(true);
    try {
      setKycSubmissions(await listAdminKycSubmissions());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not load KYC submissions');
    } finally {
      setLoadingKyc(false);
    }
  }

  useEffect(() => {
    void refreshComplianceData();
    void refreshKycSubmissions();
  }, []);

  async function resolve(id: string) {
    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({ status: 'resolved', updated_at: new Date().toISOString() })
        .eq('id', id);
      throwIfError(error);

      const incident = incidents.find(item => item.id === id);
      await supabase.from('audit_events').insert({
        worker_id: incident?.worker_id ?? null,
        event_type: 'incident_resolved',
        entity_type: 'support_ticket',
        entity_id: id,
        summary: `Compliance incident resolved${incident?.subject ? `: ${incident.subject}` : ''}.`,
      });

      await refreshComplianceData();
      toast.success('Incident marked resolved');
      setSelected(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not resolve incident');
    }
  }

  async function reviewKyc(id: string, status: 'in_review' | 'verified' | 'rejected') {
    const note = status === 'verified'
      ? 'Approved after manual Operations review.'
      : status === 'rejected'
        ? 'Needs updated ID or tax information before approval.'
        : 'Operations started manual identity review.';

    setReviewingKycId(id);
    try {
      await reviewAdminKycSubmission(id, status, note);
      await Promise.all([refreshKycSubmissions(), refreshComplianceData()]);
      toast.success(status === 'verified' ? 'KYC approved' : status === 'rejected' ? 'KYC marked for update' : 'KYC marked in review');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not update KYC review');
    } finally {
      setReviewingKycId(null);
    }
  }

  const open = incidents.filter(i => i.status !== 'resolved').length;
  const pendingKyc = kycSubmissions.filter(item => item.status === 'submitted' || item.status === 'in_review');
  const selectedWorker = useMemo(() => selected?.worker ?? null, [selected]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-black text-cream">Compliance & Audit</h1>
        <p className="text-cream/50 mt-1">AML monitoring, incident management, and audit trail</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4">
        {[
          { label: 'Open Incidents', value: open, color: open > 0 ? 'text-red-400' : 'text-sage', icon: RiAlertLine },
          { label: 'Flagged Workers', value: flaggedWorkers.length, color: flaggedWorkers.length > 0 ? 'text-amber-400' : 'text-sage', icon: RiFlagLine },
          { label: 'KYC Reviews', value: pendingKyc.length, color: pendingKyc.length > 0 ? 'text-gold' : 'text-sage', icon: RiFileTextLine },
          { label: 'Total Audit Events', value: auditLog.length, color: 'text-gold', icon: RiFileTextLine },
          { label: 'Resolved Incidents', value: incidents.filter(i => i.status === 'resolved').length, color: 'text-sage', icon: RiCheckboxCircleLine },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="card p-5">
            <Icon size={18} className={`${color} mb-2`} />
            <p className={`text-2xl font-black ${color}`}>{value}</p>
            <p className="text-xs text-cream/50 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {flaggedWorkers.length > 0 && (
        <div className="card p-5 border border-amber-500/20">
          <h2 className="font-bold text-cream mb-3 flex items-center gap-2">
            <RiFlagLine size={16} className="text-amber-400" /> Flagged Accounts
          </h2>
          <div className="space-y-2">
            {flaggedWorkers.map(worker => (
              <div key={worker.id} className="flex items-center justify-between p-3 rounded border border-white/8">
                <div>
                  <p className="font-semibold text-cream text-sm">{worker.full_name}</p>
                  <p className="text-xs text-cream/50">{worker.email || worker.phone || worker.country || 'No contact on file'}</p>
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">{worker.account_health}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div>
            <h2 className="font-bold text-cream">KYC Manual Review</h2>
            <p className="text-xs text-cream/50 mt-0.5">Review worker ID uploads and tax ID last four before approval.</p>
          </div>
          <span className={pendingKyc.length > 0 ? 'status-pending' : 'status-verified'}>{pendingKyc.length} pending</span>
        </div>
        {loadingKyc ? (
          <div className="p-5 text-sm text-cream/50">Loading KYC submissions...</div>
        ) : kycSubmissions.length === 0 ? (
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
                    <p className="text-xs text-cream/50">{submission.worker ? `${submission.worker.phone || 'No phone'} - ${submission.worker.country || 'No country'}` : submission.worker_id}</p>
                    <div className="mt-3 grid gap-2 text-xs text-cream/50 sm:grid-cols-3">
                      <p><span className="text-cream/35">ID:</span> {submission.id_document_type.replace('_', ' ')}</p>
                      <p><span className="text-cream/35">File:</span> {submission.document_signed_url ? <a href={submission.document_signed_url} target="_blank" rel="noreferrer" className="text-gold hover:text-gold-light">{submission.id_document_file_name}</a> : submission.id_document_file_name}</p>
                      <p><span className="text-cream/35">Tax:</span> {submission.tax_id_type.toUpperCase()} ending {submission.tax_id_last4}</p>
                    </div>
                    {submission.review_note && <p className="mt-2 text-xs text-cream/40">{submission.review_note}</p>}
                  </div>
                  <div className="flex flex-wrap gap-2 lg:justify-end">
                    {(submission.status === 'submitted' || submission.status === 'rejected') && (
                      <button disabled={reviewingKycId === submission.id} onClick={() => reviewKyc(submission.id, 'in_review')} className="px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider border border-gold/30 text-gold hover:bg-gold/10 disabled:opacity-50 transition-colors">
                        Reviewing
                      </button>
                    )}
                    {submission.status !== 'verified' && (
                      <button disabled={reviewingKycId === submission.id} onClick={() => reviewKyc(submission.id, 'verified')} className="px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider border border-emerald-500/30 text-sage hover:bg-sage-500/10 disabled:opacity-50 transition-colors">
                        Approve
                      </button>
                    )}
                    {submission.status !== 'rejected' && (
                      <button disabled={reviewingKycId === submission.id} onClick={() => reviewKyc(submission.id, 'rejected')} className="px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider border border-red-500/30 text-red-400 hover:bg-red-500/10 disabled:opacity-50 transition-colors">
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

      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <h2 className="font-bold text-cream">Compliance Incidents</h2>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${open > 0 ? 'text-red-400 border-red-500/30 bg-red-500/10' : 'text-sage border-emerald-500/30 bg-sage-500/10'}`}>
            {open} open
          </span>
        </div>
        <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
          {loadingCompliance ? (
            <div className="p-5 text-sm text-cream/50">Loading compliance incidents...</div>
          ) : incidents.length === 0 ? (
            <div className="p-5 text-sm text-cream/50">No compliance incidents reported yet.</div>
          ) : incidents.map(incident => (
            <div key={incident.id} className="p-5 hover:bg-white/3 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded border ${SEVERITY_STYLE[incident.severity]}`}>
                      {incident.severity.toUpperCase()}
                    </span>
                    <span className="text-xs text-cream/50">{incident.subject}</span>
                    <span className={incident.status === 'resolved' ? 'status-verified' : 'status-pending'}>
                      {incident.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-sm text-cream mb-1">{incident.message}</p>
                  <p className="text-xs text-cream/50">
                    Worker: {incident.worker?.full_name ?? incident.worker_id} - {formatDate(incident.created_at)}
                    {incident.status === 'resolved' && ` - Resolved: ${formatDate(incident.updated_at)}`}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => setSelected(incident)} className="p-1.5 rounded-lg hover:bg-white/8 text-cream/50 hover:text-cream transition-colors" title="View details">
                    <RiFileTextLine size={14} className="text-cream/50" />
                  </button>
                  {incident.status !== 'resolved' && (
                    <button onClick={() => resolve(incident.id)} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg text-sage border border-emerald-500/30 hover:bg-sage-500/10 transition-colors">
                      <RiCheckboxCircleLine size={16} className="text-sage" /> Resolve
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <h2 className="font-bold text-cream">Admin Audit Trail</h2>
        </div>
        <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
          {loadingCompliance ? (
            <div className="p-5 text-sm text-cream/50">Loading audit trail...</div>
          ) : auditLog.length === 0 ? (
            <div className="p-5 text-sm text-cream/50">No audit events recorded yet.</div>
          ) : auditLog.map(entry => (
            <div key={entry.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-white/3 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-primary-400 flex-shrink-0" />
                <div>
                  <span className="text-sm font-medium text-cream">{entry.event_type.replace(/_/g, ' ')}</span>
                  <span className="text-xs text-cream/50 ml-2">- {entry.summary}</span>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs text-cream/50">{formatDate(entry.created_at)}</p>
                <p className="text-xs text-cream/50 opacity-60">{entry.entity_type}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

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
                {selected.severity.toUpperCase()} - {selected.subject}
              </span>
              <p className="text-sm text-cream leading-relaxed">{selected.message}</p>
              <div className="space-y-2 text-xs text-cream/50">
                <p>Worker: <span className="text-cream">{selectedWorker?.full_name ?? selected.worker_id}</span></p>
                <p>Reported: <span className="text-cream">{formatDate(selected.created_at)}</span></p>
                <p>Status: <span className={selected.status === 'resolved' ? 'text-sage' : 'text-amber-400'}>{selected.status.replace('_', ' ')}</span></p>
                {selected.status === 'resolved' && <p>Resolved: <span className="text-sage">{formatDate(selected.updated_at)}</span></p>}
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