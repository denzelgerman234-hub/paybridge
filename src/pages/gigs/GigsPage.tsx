import { Link } from 'react-router-dom';
import { Briefcase, ClipboardList } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useGigs } from '../../hooks/useGigs';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { GigListAvailable } from './GigListAvailable';
import { GigListActive } from './GigListActive';
import { isActiveWorkerGig, isAvailableGig } from '../../lib/gigFilters';

const CREAM = '#F1F0DA';
const DIM = 'rgba(241,240,218,0.45)';
const GOLD = '#C9A84C';
const BORDER = 'rgba(241,240,218,0.09)';
const NAVY8 = '#12203F';

type GigsTab = 'available' | 'active';

interface GigsPageProps {
  tab: GigsTab;
}

export function GigsPage({ tab }: GigsPageProps) {
  const { profile } = useAuth();
  const { gigs, loading } = useGigs(profile?.id);

  if (loading) return <LoadingSpinner text="Loading gigs..." />;

  const availableCount = gigs.filter(gig => isAvailableGig(gig, profile?.id)).length;
  const activeCount = gigs.filter(gig => isActiveWorkerGig(gig, profile?.id)).length;

  const tabs = [
    {
      id: 'available' as const,
      label: 'Available Gigs',
      count: availableCount,
      to: '/gigs/available',
      Icon: Briefcase,
    },
    {
      id: 'active' as const,
      label: 'Active Gigs',
      count: activeCount,
      to: '/gigs/active',
      Icon: ClipboardList,
    },
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <p className="section-label mb-1">Gigs</p>
        <h1 className="text-2xl font-black" style={{ fontFamily: "'Space Grotesk', sans-serif", color: CREAM }}>
          Gig Workspace
        </h1>
        <p className="text-xs mt-0.5" style={{ color: DIM }}>
          Switch between open marketplace gigs and work already assigned to you.
        </p>
      </div>

      <div
        className="grid grid-cols-2 gap-1 p-1"
        style={{ background: NAVY8, border: `1px solid ${BORDER}`, borderRadius: 6 }}
      >
        {tabs.map(({ id, label, count, to, Icon }) => {
          const isActive = tab === id;

          return (
            <Link
              key={id}
              to={to}
              className="flex min-h-11 items-center justify-center gap-2 px-3 text-xs font-bold uppercase tracking-wider transition-colors"
              style={{
                background: isActive ? 'rgba(201,168,76,0.14)' : 'transparent',
                border: `1px solid ${isActive ? 'rgba(201,168,76,0.28)' : 'transparent'}`,
                borderRadius: 4,
                color: isActive ? GOLD : DIM,
                fontFamily: "'Space Grotesk', sans-serif",
              }}
            >
              <Icon size={14} strokeWidth={1.8} />
              <span className="truncate">{label}</span>
              <span
                className="min-w-5 rounded-sm px-1.5 py-0.5 text-center text-[10px]"
                style={{
                  background: isActive ? 'rgba(201,168,76,0.18)' : 'rgba(241,240,218,0.06)',
                  color: isActive ? CREAM : DIM,
                }}
              >
                {count}
              </span>
            </Link>
          );
        })}
      </div>

      {tab === 'available'
        ? <GigListAvailable showHeader={false} gigs={gigs} loading={loading} />
        : <GigListActive showHeader={false} gigs={gigs} loading={loading} />}
    </div>
  );
}



