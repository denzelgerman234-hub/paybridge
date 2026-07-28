import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
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

interface DashboardStats {
  pendingApps: number;
  totalWorkers: number;
  activeWorkers: number;
  openGigs: number;
  activeGigs: number;
  totalDisbursed: number;
  totalWorkerFee: number;
  unfundedGigsCount: number;
  unfundedGigsAmount: number;
  pendingWorkerFees: number;
  warningWorkers: string[];
  recentGigs: any[];
}

export function AdminOverview() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [
          { count: pendingApps },
          { count: totalWorkers },
          { count: activeWorkers },
          { count: openGigs },
          { count: activeGigs },
          { data: disbs },
          { data: fees },
          { data: unfundedGigs },
          { data: warningWorkers },
          { data: recentGigs }
        ] = await Promise.all([
          supabase.from('worker_applications').select('id', { count: 'exact', head: true }).in('status', ['pending', 'in_review']),
          supabase.from('worker_profiles').select('id', { count: 'exact', head: true }),
          supabase.from('worker_profiles').select('id', { count: 'exact', head: true }).eq('onboarding_completed', true),
          supabase.from('worker_gigs').select('id', { count: 'exact', head: true }).eq('status', 'open'),
          supabase.from('worker_gigs').select('id', { count: 'exact', head: true }).in('status', ['accepted', 'funded', 'in_progress']),
          supabase.from('worker_disbursements').select('amount').eq('status', 'verified'),
          supabase.from('commission_ledger').select('amount, status').in('status', ['earned', 'settled']),
          supabase.from('worker_gigs').select('id, total_principal').in('status', ['accepted', 'in_progress']).eq('funded', false),
          supabase.from('worker_profiles').select('full_name').neq('account_health', 'healthy'),
          supabase.from('worker_gigs').select('*, worker_profiles(full_name)').order('created_at', { ascending: false }).limit(6)
        ]);

        const disbursedSum = (disbs || []).reduce((s: number, d: any) => s + Number(d.amount), 0);
        const feesSum = (fees || []).reduce((s: number, f: any) => s + Number(f.amount), 0);
        const pendingFeesSum = (fees || []).filter((f: any) => f.status === 'earned').reduce((s: number, f: any) => s + Number(f.amount), 0);
        const unfundedAmount = (unfundedGigs || []).reduce((s: number, g: any) => s + Number(g.total_principal), 0);

        setStats({
          pendingApps: pendingApps || 0,
          totalWorkers: totalWorkers || 0,
          activeWorkers: activeWorkers || 0,
          openGigs: openGigs || 0,
          activeGigs: activeGigs || 0,
          totalDisbursed: disbursedSum,
          totalWorkerFee: feesSum,
          unfundedGigsCount: unfundedGigs?.length || 0,
          unfundedGigsAmount: unfundedAmount,
          pendingWorkerFees: pendingFeesSum,
          warningWorkers: (warningWorkers || []).map((w: any) => w.full_name),
          recentGigs: recentGigs || []
        });
      } catch (err) {
        console.error('Failed to load dashboard stats', err);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

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

  if (loading) {
    return <div className="p-10 text-center text-cream/50 animate-fade-in">Loading dashboard...</div>;
  }

  if (!stats) return null;

  const statCards = [
    { label: 'Total Workers',        value: stats.totalWorkers,                   sub: `${stats.activeWorkers} active`, Icon: RiGroupLine,              accent: GOLD },
    { label: 'Pending Applications', value: stats.pendingApps,                    sub: 'Awaiting review',               Icon: RiTimeLine,              accent: GOLD },
    { label: 'Active Gigs',          value: stats.activeGigs,                     sub: `${stats.openGigs} open, unassigned`, Icon: RiBriefcaseLine,         accent: SAGE },
    { label: 'Total Disbursed',      value: formatCurrency(stats.totalDisbursed), sub: 'All-time completed',            Icon: RiMoneyDollarCircleLine, accent: GOLD },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <p className="section-label mb-1">Admin Console</p>
        <h1 className="text-2xl font-black" style={{ fontFamily: "'Space Grotesk', sans-serif", color: CREAM }}>Overview</h1>
        <p className="text-xs mt-0.5" style={{ color: DIM }}>Platform health at a glance</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map(({ label, value, sub, Icon, accent }) => (
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
      {(stats.pendingApps > 0 || stats.unfundedGigsCount > 0 || stats.warningWorkers.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {stats.pendingApps > 0 && (
            <AlertCard color={GOLD} Icon={RiTimeLine} title={`${stats.pendingApps} Applications Pending`} sub="Require review and decision" to="/admin/applications" linkLabel="Review Now" />
          )}
          {stats.unfundedGigsCount > 0 && (
            <AlertCard color={TERRA} Icon={RiAlertLine} title={`${stats.unfundedGigsCount} Gig${stats.unfundedGigsCount > 1 ? 's' : ''} Not Funded`} sub="Workers cannot disburse until funded" to="/admin/gigs" linkLabel="Fund Gigs" />
          )}
          {stats.warningWorkers.length > 0 && (
            <AlertCard color={GOLD} Icon={RiAlertLine} title={`${stats.warningWorkers.length} Account${stats.warningWorkers.length > 1 ? 's' : ''} Flagged`} sub={stats.warningWorkers.join(', ')} to="/admin/workers" linkLabel="Review Workers" />
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
              {stats.recentGigs.length === 0 ? (
                 <tr><td colSpan={7} className="px-5 py-10 text-center text-cream/50">No recent gigs</td></tr>
              ) : stats.recentGigs.map(gig => (
                <tr key={gig.id} className="table-row">
                  <td className="table-cell">
                    <p className="font-semibold text-xs" style={{ color: CREAM, fontFamily: "'Space Grotesk', sans-serif" }}>{gig.client_name}</p>
                    <p className="text-xs" style={{ color: DIM }}>{gig.client_contact}</p>
                  </td>
                  <td className="table-cell text-xs" style={{ color: DIM }}>
                    {gig.worker_profiles?.full_name ? gig.worker_profiles.full_name : <span style={{ color: GOLD }} className="font-bold text-xs">Unassigned</span>}
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
              ))}
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
            { label: 'Total Principal Disbursed', value: formatCurrency(stats.totalDisbursed),   accent: CREAM },
            { label: 'Total Worker Fees Settled',    value: formatCurrency(stats.totalWorkerFee),  accent: GOLD  },
            { label: 'Open Principal (unfunded)', value: formatCurrency(stats.unfundedGigsAmount), accent: GOLD },
            { label: 'Pending Worker Fees',       value: formatCurrency(stats.pendingWorkerFees), accent: GOLD },
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
