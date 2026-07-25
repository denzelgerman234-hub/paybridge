import { useGigs } from '../../hooks/useGigs';
import { useAuth } from '../../hooks/useAuth';
import { Card } from '../../components/ui/Card';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { FundingBanner } from '../../components/ui/FundingBanner';
import { formatCurrency, formatRelativeTime } from '../../lib/utils';
import { Link } from 'react-router-dom';
import { RiArrowRightLine, RiTimeLine, RiBriefcaseLine } from 'react-icons/ri';

const CREAM  = '#F1F0DA';
const DIM    = 'rgba(241,240,218,0.45)';
const GOLD   = '#C9A84C';

interface GigListActiveProps {
  showHeader?: boolean;
}

export function GigListActive({ showHeader = true }: GigListActiveProps) {
  const { profile } = useAuth();
  const { gigs, loading } = useGigs(profile?.id);
  if (loading) return <LoadingSpinner text="Loading active gigs..." />;

  const active = gigs.filter(g => ['accepted', 'funded', 'in_progress'].includes(g.status));

  return (
    <div className="space-y-5 animate-fade-in">
      {showHeader && (
        <div>
          <p className="section-label mb-1">My Work</p>
          <h1 className="text-2xl font-black" style={{ fontFamily: "'Space Grotesk', sans-serif", color: CREAM }}>
            Active Gigs
          </h1>
          <p className="text-xs mt-0.5" style={{ color: DIM }}>
            {active.length} gig{active.length !== 1 ? 's' : ''} in progress
          </p>
        </div>
      )}

      {active.length === 0 ? (
        <Card padding="lg">
          <div className="text-center py-8">
            <RiBriefcaseLine style={{ fontSize: 40, color: 'rgba(201,168,76,0.25)', margin: '0 auto 12px' }} />
            <p className="font-bold text-sm mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif", color: CREAM }}>No Active Gigs</p>
            <p className="text-xs mb-5" style={{ color: DIM }}>Apply for an available gig to get started.</p>
            <Link to="/gigs/available">
              <button className="btn-primary flex items-center gap-1.5 mx-auto">
                Browse Available Gigs <RiArrowRightLine />
              </button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {active.map(gig => (
            <Card key={gig.id} padding="md">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h2 className="font-bold text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif", color: CREAM }}>{gig.client_name}</h2>
                  <span className={`status-${gig.status} mt-1 inline-block`}>{gig.status.replace(/_/g, ' ')}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs flex-shrink-0" style={{ color: GOLD }}>
                  <RiTimeLine style={{ fontSize: 13 }} />
                  Due {formatRelativeTime(gig.deadline)}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                {[
                  { label: 'Principal',   value: formatCurrency(gig.total_principal), accent: CREAM },
                  { label: 'Worker Fee',  value: formatCurrency(gig.commission_amount), accent: GOLD },
                  { label: 'Recipients',  value: String(gig.recipient_count), accent: CREAM },
                ].map(({ label, value, accent }) => (
                  <div key={label}>
                    <p className="label-caps mb-0.5">{label}</p>
                    <p className="font-bold text-sm" style={{ color: accent }}>{value}</p>
                  </div>
                ))}
              </div>

              <FundingBanner totalPrincipal={gig.total_principal} funded={gig.funded} />

              <Link to={`/gigs/${gig.id}#operations`} className="block mt-4">
                <button className="btn-primary w-full flex items-center gap-1.5">
                  Open Operations Room <RiArrowRightLine />
                </button>
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
