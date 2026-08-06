import { useAuth } from '../../hooks/useAuth';
import { useGigs } from '../../hooks/useGigs';
import { useWallet } from '../../hooks/useWallet';
import { Card } from '../../components/ui/Card';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { BadgeProgress } from '../../components/ui/Badge';
import { BADGE_TIERS } from '../../lib/constants';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { FundingBanner } from '../../components/ui/FundingBanner';
import { formatCurrency, formatRelativeTime } from '../../lib/utils';
import { isActiveWorkerGig, isAvailableGig } from '../../lib/gigFilters';
import { ChevronRight, ArrowRight } from 'lucide-react';
import {
  RiBriefcaseLine,
  RiArchiveLine,
  RiLineChartLine,
  RiStarLine,
} from 'react-icons/ri';
import { Link } from 'react-router-dom';

const CREAM  = '#F1F0DA';
const DIM    = 'rgba(241,240,218,0.45)';
const GOLD   = '#C9A84C';

const TIER_CONFIG: Record<string, { lottie: string; color: string }> = {
  trainee:   { lottie: 'https://lottie.host/abae5e48-f61e-40a9-b036-9f53dc6925dd/rLcq4jHz0v.json', color: '#94A3B8' },
  associate: { lottie: 'https://lottie.host/79284adf-b2e9-4e4f-a1fb-a36e5950b95d/Aux94JXsHk.json', color: '#C9A84C' },
  senior:    { lottie: 'https://lottie.host/3fbc1cc6-3799-49a1-93c3-cc08f854fe5e/hoajdTyb4O.json', color: '#38BDF8' },
  expert:    { lottie: 'https://lottie.host/7be765e0-8d97-4ff4-b30c-ce9c32b630fc/5LKKVe0Cnh.json', color: '#C084FC' },
  master:    { lottie: 'https://lottie.host/4e02bc91-cd71-41b8-993e-dcb859516e18/5TCEI22mGm.json', color: '#F1F0DA' },
};
const SAGE   = '#7DC99A';
const BORDER = 'rgba(241,240,218,0.09)';
const NAVY8  = '#12203F';



export function DashboardPage() {
  const { profile, isLoading } = useAuth();
  const { gigs, loading: gigsLoading } = useGigs(profile?.id);
  const { totalEarned, availableBalance } = useWallet(profile?.id);

  if (isLoading || gigsLoading) return <LoadingSpinner text="Loading dashboard..." />;
  if (!profile) return null;

  const activeGigs = gigs.filter(g => isActiveWorkerGig(g, profile.id));
  const openGigs   = gigs.filter(g => isAvailableGig(g, profile.id));
  const primaryGig = activeGigs[0];

  const stats = [
    { label: 'Active Gigs',       value: String(activeGigs.length),          Icon: RiBriefcaseLine,  accent: GOLD },
    { label: 'Recorded Fees', value: formatCurrency(availableBalance),    Icon: RiArchiveLine,    accent: SAGE },
    { label: 'Total Earned',      value: formatCurrency(totalEarned),         Icon: RiLineChartLine, accent: GOLD },
    { label: 'Rating',            value: `${profile.rating || 0} / 5`,       Icon: RiStarLine,       accent: GOLD },
  ];

  const SectionHeader = ({ title, to, linkLabel }: { title: string; to: string; linkLabel: string }) => (
    <div className="flex items-center justify-between mb-4">
      <h2 className="font-bold text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif", color: CREAM, letterSpacing: '0.04em' }}>
        {title}
      </h2>
      <Link
        to={to}
        className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider transition-colors"
        style={{ fontFamily: "'Space Grotesk', sans-serif", color: GOLD }}
      >
        {linkLabel} <ChevronRight size={12} />
      </Link>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="section-label mb-1">Dashboard</p>
          <h1 className="text-2xl font-black" style={{ fontFamily: "'Space Grotesk', sans-serif", color: CREAM }}>
            Welcome, {profile.full_name.split(' ')[0]}
          </h1>
          <p className="text-xs mt-0.5" style={{ color: DIM }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map(({ label, value, Icon, accent }) => (
          <div
            key={label}
            className="stat-card p-4"
          >
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(241,240,218,0.06)', borderRadius: 4 }}
              >
                <Icon style={{ color: accent, fontSize: 16 }} />
              </div>
              <div className="min-w-0">
                <p className="font-black text-base leading-tight truncate" style={{ color: CREAM, fontFamily: "'Space Grotesk', sans-serif" }}>
                  {value}
                </p>
                <p className="text-xs truncate" style={{ color: DIM }}>{label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Badge progress */}
      <Card padding="md">
        <SectionHeader title="Badge Progression" to="/badges" linkLabel="Details" />
        <BadgeProgress tier={profile.badge} gigsCompleted={profile.total_gigs_completed} />
        {/* Naked badge: Lottie + tier label, no pill/outline */}
        {(() => {
          const cfg = TIER_CONFIG[profile.badge] ?? TIER_CONFIG.trainee;
          const tier = BADGE_TIERS.find(b => b.id === profile.badge);
          return (
            <div className="flex items-center gap-2 mt-3">
              <DotLottieReact src={cfg.lottie} loop autoplay style={{ width: 30, height: 30, flexShrink: 0 }} />
              <span style={{ color: cfg.color, fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                {tier?.label}
              </span>
            </div>
          );
        })()}
        <div className="divider my-4" />
        <div className="grid grid-cols-3 gap-4 text-center">
          {[
            { label: 'Gigs Completed',  value: String(profile.total_gigs_completed) },
            { label: 'Total Disbursed', value: formatCurrency(profile.total_disbursed) },
            { label: 'Total Earned',    value: formatCurrency(profile.total_earned) },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="font-black text-sm" style={{ color: CREAM, fontFamily: "'Space Grotesk', sans-serif" }}>{value}</p>
              <p className="text-xs mt-0.5" style={{ color: DIM }}>{label}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Primary active gig */}
      {primaryGig && (
        <Card padding="md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif", color: CREAM }}>
              Active Gig
            </h2>
            <span className={`status-${primaryGig.status}`}>{primaryGig.status.replace(/_/g, ' ')}</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {[
              { label: 'Client',     value: primaryGig.client_name },
              { label: 'Principal',  value: formatCurrency(primaryGig.total_principal) },
              { label: 'Worker Fee', value: formatCurrency(primaryGig.commission_amount) },
              { label: 'Deadline',   value: formatRelativeTime(primaryGig.deadline) },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="label-caps mb-0.5">{label}</p>
                <p className="font-bold text-sm" style={{ color: CREAM }}>{value}</p>
              </div>
            ))}
          </div>
          <FundingBanner totalPrincipal={primaryGig.total_principal} funded={primaryGig.funded} />
          <Link to={`/gigs/${primaryGig.id}#operations`} className="block mt-4">
            <button className="btn-primary w-full flex items-center gap-2">
              Open Operations Room <ArrowRight size={14} />
            </button>
          </Link>
        </Card>
      )}

      {/* Active gigs + Available gigs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Active */}
        <Card padding="md">
          <SectionHeader title="Active Gigs" to="/gigs/active" linkLabel="View All" />
          {activeGigs.length === 0 ? (
            <p className="text-xs text-center py-8" style={{ color: DIM }}>No active gigs. Apply for available gigs to get started.</p>
          ) : (
            <div className="space-y-1.5">
              {activeGigs.slice(0, 4).map(g => (
                <Link key={g.id} to={`/gigs/${g.id}#operations`}>
                  <div
                    className="flex items-center justify-between p-3 rounded transition-colors"
                    style={{ border: `1px solid ${BORDER}` }}
                    onMouseEnter={e => (e.currentTarget.style.background = NAVY8)}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div>
                      <p className="font-semibold text-xs" style={{ color: CREAM, fontFamily: "'Space Grotesk', sans-serif" }}>{g.client_name}</p>
                      <p className="text-xs" style={{ color: DIM }}>{formatCurrency(g.total_principal)} · {g.recipient_count} recipients</p>
                    </div>
                    <span className={`status-${g.status}`}>{g.status.replace(/_/g, ' ')}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>

        {/* Available */}
        <Card padding="md">
          <SectionHeader title="Available Gigs" to="/gigs/available" linkLabel="Browse" />
          {openGigs.length === 0 ? (
            <p className="text-xs text-center py-8" style={{ color: DIM }}>No gigs available right now. Check back soon.</p>
          ) : (
            <div className="space-y-1.5">
              {openGigs.slice(0, 4).map(g => (
                <Link key={g.id} to={`/gigs/${g.id}`}>
                  <div
                    className="flex items-center justify-between p-3 rounded transition-colors"
                    style={{ border: `1px solid ${BORDER}` }}
                    onMouseEnter={e => (e.currentTarget.style.background = NAVY8)}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div>
                      <p className="font-semibold text-xs" style={{ color: CREAM, fontFamily: "'Space Grotesk', sans-serif" }}>{g.client_name}</p>
                      <p className="text-xs" style={{ color: DIM }}>{formatCurrency(g.total_principal)} · Due {formatRelativeTime(g.deadline)}</p>
                    </div>
                    <span className="text-xs font-black" style={{ color: GOLD, fontFamily: "'Space Grotesk', sans-serif" }}>{g.commission_rate}%</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}



