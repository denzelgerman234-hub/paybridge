import { useWallet } from '../hooks/useWallet';
import { useGigs } from '../hooks/useGigs';
import { Card } from '../components/ui/Card';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { formatCurrency, formatDate } from '../lib/utils';
import {
  RiExchangeDollarLine,
  RiArrowUpLine,
  RiArrowDownLine,
  RiBriefcaseLine,
  RiPulseLine,
} from 'react-icons/ri';

const CREAM  = '#F1F0DA';
const DIM    = 'rgba(241,240,218,0.45)';
const GOLD   = '#C9A84C';
const SAGE   = '#7DC99A';
const TERRA  = '#C8523D';
const BORDER = 'rgba(241,240,218,0.09)';
const NAVY8  = '#12203F';

export function ActivityPage() {
  const { commissions, fundingEvents, loading: walletLoading } = useWallet();
  const { gigs, loading: gigsLoading } = useGigs();

  if (walletLoading || gigsLoading) return <LoadingSpinner text="Loading activity..." />;

  const events = [
    ...commissions.map(c => ({
      id: c.id, type: 'commission' as const, date: c.created_at,
      title: 'Worker Fee Recorded', amount: c.amount, detail: `Gig #${c.gig_id.slice(-4)}`,
      status: c.status, Icon: RiExchangeDollarLine, accent: SAGE,
    })),

    ...fundingEvents.map(f => ({
      id: f.id, type: 'funding' as const, date: f.created_at,
      title: 'Principal Funded', amount: f.amount, detail: `Ref: ${f.reference}`,
      status: f.confirmed ? 'confirmed' : 'pending', Icon: RiArrowDownLine, accent: GOLD,
    })),
    ...gigs.filter(g => g.completed_at).map(g => ({
      id: `gig-${g.id}`, type: 'gig' as const, date: g.completed_at!,
      title: 'Gig Completed', amount: g.commission_amount, detail: g.client_name,
      status: 'completed', Icon: RiBriefcaseLine, accent: SAGE,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <p className="section-label mb-1">History</p>
        <h1 className="text-2xl font-black" style={{ fontFamily: "'Space Grotesk', sans-serif", color: CREAM }}>Activity Log</h1>
        <p className="text-xs mt-0.5" style={{ color: DIM }}>Full transaction and audit history</p>
      </div>

      {events.length === 0 ? (
        <Card padding="lg">
          <div className="text-center py-8">
            <RiPulseLine style={{ fontSize: 40, color: 'rgba(201,168,76,0.25)', margin: '0 auto 12px' }} />
            <p className="font-bold text-sm mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif", color: CREAM }}>No activity yet</p>
            <p className="text-xs" style={{ color: DIM }}>Your transactions will appear here once you complete a gig.</p>
          </div>
        </Card>
      ) : (
        <Card padding="none">
          <div>
            {events.map((ev, i) => (
              <div
                key={ev.id}
                className="flex items-center gap-4 p-4 transition-colors"
                style={{ borderBottom: i < events.length - 1 ? `1px solid ${BORDER}` : 'none' }}
                onMouseEnter={e => (e.currentTarget.style.background = NAVY8)}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <div
                  className="w-8 h-8 flex items-center justify-center flex-shrink-0"
                  style={{ background: `${ev.accent}15`, borderRadius: 4 }}
                >
                  <ev.Icon style={{ color: ev.accent, fontSize: 15 }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-xs" style={{ color: CREAM, fontFamily: "'Space Grotesk', sans-serif" }}>{ev.title}</p>
                  <p className="text-xs truncate" style={{ color: DIM }}>{ev.detail}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-black text-sm" style={{ color: ev.type === 'commission' || ev.type === 'gig' ? GOLD : CREAM, fontFamily: "'Space Grotesk', sans-serif" }}>
                    {formatCurrency(ev.amount)}
                  </p>
                  <p className="text-xs" style={{ color: DIM }}>{formatDate(ev.date)}</p>
                </div>
                <span className={`status-${ev.status} hidden sm:inline-flex flex-shrink-0`}>{ev.status}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

