import { useEffect, useState } from 'react';
import { localDb } from '../../lib/localDb';
import { formatCurrency } from '../../lib/utils';
import {
  RiGroupLine, RiBriefcaseLine, RiMoneyDollarCircleLine, RiLineChartLine,
  RiTimeLine, RiAlertLine, RiCheckboxCircleLine, RiArrowRightLine,
} from 'react-icons/ri';
import { Link } from 'react-router-dom';

const CREAM  = '#F1F0DA';
const DIM    = 'rgba(241,240,218,0.45)';
const GOLD   = '#C9A84C';
const SAGE   = '#7DC99A';
const TERRA  = '#C8523D';
const BORDER = 'rgba(241,240,218,0.09)';
const NAVY9  = '#0D1632';

export function AdminOverview() {
  const [state, setState] = useState(() => localDb.snapshot());

  useEffect(() => {
    const refresh = () => setState(localDb.snapshot());
    refresh();
    return localDb.subscribe(refresh);
  }, []);

  const pendingApps     = state.gig_applications.filter(a => ['submitted', 'under_review'].includes(a.status)).length;
  const totalWorkers    = state.workers.length;
  const openGigs        = state.gigs.filter(g => g.status === 'open').length;
  const activeGigs      = state.gigs.filter(g => ['accepted','funded','in_progress'].includes(g.status)).length;
  const totalDisbursed  = state.worker_disbursements.filter(d => d.status === 'verified').reduce((s, d) => s + d.amount, 0);
  const totalWorkerFee  = state.commission_ledger.filter(c => ['earned', 'settled'].includes(c.status)).reduce((s, c) => s + Number(c.amount), 0);
  const unfundedGigs    = state.gigs.filter(g => ['accepted','in_progress'].includes(g.status) && !g.funded);
  const warningWorkers  = state.workers.filter(w => w.account_health !== 'healthy');
  const pendingWorkerFees = state.commission_ledger.filter(c => c.status === 'earned').reduce((s, c) => s + Number(c.amount), 0);

  const stats = [
    { label: 'Total Workers',        value: totalWorkers,                   sub: `${state.workers.filter(w=>w.onboarding_completed).length} active`, Icon: RiGroupLine,              accent: GOLD },
    { label: 'Pending Applications', value: pendingApps,                    sub: 'Awaiting review',                                                     Icon: RiTimeLine,              accent: GOLD },
    { label: 'Active Gigs',          value: activeGigs,                     sub: `${openGigs} open, unassigned`,                                        Icon: RiBriefcaseLine,         accent: SAGE },
    { label: 'Total Disbursed',      value: formatCurrency(totalDisbursed), sub: 'All-time completed',                                                  Icon: RiMoneyDollarCircleLine, accent: GOLD },
  ];

  const AlertCard = ({ color, Icon, title, sub, to, linkLabel }: {
    color: string; Icon: React.ElementType; title: string; sub: string; to: string; linkLabel: string;
  }) => (
    <div className="p-5" style={{ background: NAVY9, border: `1px solid ${color}30`, borderLeft: `3px solid ${color}`, borderRadius: 6 }}>
      <div className="flex items-start gap-3 mb-4">
        <Icon style={{ color, fontSize: 17, flexShrink: 0, marginTop: 2 }} />
        <div>
          <p className="font-bold text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif", color: CREAM }}>{title}</p>
          <p className="text-xs mt-0.5" style={{ color: DIM }}>{sub}</p>
        </div>
      </div>
      <Link to={to} className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider transition-colors" style={{ color, fontFamily: "'Space Grotesk', sans-serif" }}>
        {linkLabel} <RiArrowRightLine />
      </Link>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <p className="section-label mb-1">Admin Console</p>
        <h1 className="text-2xl font-black" style={{ fontFamily: "'Space Grotesk', sans-serif", color: CREAM }}>Overview</h1>
        <p className="text-xs mt-0.5" style={{ color: DIM }}>Platform health at a glance</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map(({ label, value, sub, Icon, accent }) => (
          <div key={label} className="stat-card p-5">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(241,240,218,0.06)', borderRadius: 4 }}>
                <Icon style={{ color: accent, fontSize: 16 }} />
              </div>
            </div>
            <p className="text-2xl font-black" style={{ fontFamily: "'Space Grotesk', sans-serif", color: CREAM }}>{value}</p>
            <p className="text-xs font-semibold mt-0.5" style={{ color: DIM }}>{label}</p>
            <p className="text-xs mt-1" style={{ color: 'rgba(241,240,218,0.25)' }}>{sub}</p>
          </div>
        ))}
      </div>

      {/* Alert cards */}
      {(pendingApps > 0 || unfundedGigs.length > 0 || warningWorkers.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {pendingApps > 0 && (
            <AlertCard color={GOLD} Icon={RiTimeLine} title={`${pendingApps} Applications Pending`} sub="Require review and decision" to="/admin/applications" linkLabel="Review Now" />
          )}
          {unfundedGigs.length > 0 && (
            <AlertCard color={TERRA} Icon={RiAlertLine} title={`${unfundedGigs.length} Gig${unfundedGigs.length > 1 ? 's' : ''} Not Funded`} sub="Workers cannot disburse until funded" to="/admin/gigs" linkLabel="Fund Gigs" />
          )}
          {warningWorkers.length > 0 && (
            <AlertCard color={GOLD} Icon={RiAlertLine} title={`${warningWorkers.length} Account${warningWorkers.length > 1 ? 's' : ''} Flagged`} sub={warningWorkers.map(w => w.full_name).join(', ')} to="/admin/workers" linkLabel="Review Workers" />
          )}
        </div>
      )}

      {/* Recent gigs table */}
      <div className="overflow-hidden" style={{ background: NAVY9, border: `1px solid ${BORDER}`, borderRadius: 6 }}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: BORDER }}>
          <h2 className="font-bold text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif", color: CREAM }}>Recent Gigs</h2>
          <Link to="/admin/gigs" className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider" style={{ color: GOLD, fontFamily: "'Space Grotesk', sans-serif" }}>
            View All <RiArrowRightLine />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b" style={{ borderColor: BORDER }}>
                {['Client', 'Worker', 'Principal', 'Worker Fee', 'Status', 'Funded', ''].map(h => (
                  <th key={h} className="table-header">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {state.gigs.slice(0, 6).map(gig => {
                const worker = state.workers.find(w => w.id === gig.worker_id);
                return (
                  <tr key={gig.id} className="table-row">
                    <td className="table-cell">
                      <p className="font-semibold text-xs" style={{ color: CREAM, fontFamily: "'Space Grotesk', sans-serif" }}>{gig.client_name}</p>
                      <p className="text-xs" style={{ color: DIM }}>{gig.client_contact}</p>
                    </td>
                    <td className="table-cell text-xs" style={{ color: DIM }}>
                      {worker ? worker.full_name : <span style={{ color: GOLD }} className="font-bold text-xs">Unassigned</span>}
                    </td>
                    <td className="table-cell font-bold text-xs" style={{ color: CREAM }}>{formatCurrency(gig.total_principal)}</td>
                    <td className="table-cell font-bold text-xs" style={{ color: GOLD }}>{formatCurrency(gig.commission_amount)}</td>
                    <td className="table-cell"><span className={`status-${gig.status}`}>{gig.status.replace(/_/g, ' ')}</span></td>
                    <td className="table-cell">
                      {gig.funded
                        ? <span className="flex items-center gap-1 text-xs font-bold" style={{ color: SAGE }}><RiCheckboxCircleLine /> Funded</span>
                        : <span className="flex items-center gap-1 text-xs font-bold" style={{ color: GOLD }}><RiTimeLine /> Pending</span>}
                    </td>
                    <td className="table-cell">
                      <Link to="/admin/gigs" className="text-xs font-bold uppercase tracking-wider flex items-center gap-1" style={{ color: GOLD, fontFamily: "'Space Grotesk', sans-serif" }}>
                        Manage <RiArrowRightLine />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Financial summary */}
      <div className="p-5" style={{ background: NAVY9, border: `1px solid ${BORDER}`, borderRadius: 6 }}>
        <div className="flex items-center gap-2 mb-5">
          <RiLineChartLine style={{ color: GOLD, fontSize: 16 }} />
          <h2 className="font-bold text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif", color: CREAM }}>Financial Summary</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
          {[
            { label: 'Total Principal Disbursed', value: formatCurrency(totalDisbursed),   accent: CREAM },
            { label: 'Total Worker Fees Settled',    value: formatCurrency(totalWorkerFee),  accent: GOLD  },
            { label: 'Open Principal (unfunded)', value: formatCurrency(state.gigs.filter(g=>!g.funded).reduce((s,g)=>s+g.total_principal,0)), accent: GOLD },
            { label: 'Pending Worker Fees',       value: formatCurrency(pendingWorkerFees), accent: GOLD },
          ].map(({ label, value, accent }) => (
            <div key={label}>
              <p className="label-caps mb-1">{label}</p>
              <p className="text-xl font-black" style={{ fontFamily: "'Space Grotesk', sans-serif", color: accent }}>{value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
