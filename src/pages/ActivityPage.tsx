import { useState } from 'react';
import { useWallet } from '../hooks/useWallet';
import { useAuth } from '../hooks/useAuth';
import { useGigs } from '../hooks/useGigs';
import { Card } from '../components/ui/Card';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { formatCurrency, formatDate } from '../lib/utils';
import {
  RiExchangeDollarLine,
  RiArrowDownLine,
  RiBriefcaseLine,
  RiPulseLine,
} from 'react-icons/ri';

const CREAM  = '#F1F0DA';
const DIM    = 'rgba(241,240,218,0.45)';
const GOLD   = '#C9A84C';
const SAGE   = '#7DC99A';
const BORDER = 'rgba(241,240,218,0.09)';
const NAVY8  = '#12203F';

type ActivityFilter = 'all' | 'commission' | 'funding' | 'gig';

const filters: { value: ActivityFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'commission', label: 'Worker Fees' },
  { value: 'funding', label: 'Funding' },
  { value: 'gig', label: 'Completed Gigs' },
];

export function ActivityPage() {
  const { profile, isLoading: authLoading } = useAuth();
  const { commissions, fundingEvents, loading: walletLoading } = useWallet(profile?.id);
  const { gigs, loading: gigsLoading } = useGigs(profile?.id);
  const [filter, setFilter] = useState<ActivityFilter>('all');

  if (authLoading || walletLoading || gigsLoading) return <LoadingSpinner text="Loading activity..." />;

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

  const filteredEvents = filter === 'all' ? events : events.filter(event => event.type === filter);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="section-label mb-1">History</p>
          <h1 className="text-2xl font-black" style={{ fontFamily: "'Space Grotesk', sans-serif", color: CREAM }}>Activity Log</h1>
          <p className="text-xs mt-0.5" style={{ color: DIM }}>Full transaction and audit history</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {filters.map(option => (
            <button
              key={option.value}
              type="button"
              onClick={() => setFilter(option.value)}
              className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-colors"
              style={{
                borderRadius: 4,
                border: `1px solid ${filter === option.value ? 'rgba(201,168,76,0.45)' : BORDER}`,
                background: filter === option.value ? 'rgba(201,168,76,0.12)' : 'transparent',
                color: filter === option.value ? GOLD : DIM,
                fontFamily: "'Space Grotesk', sans-serif",
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {filteredEvents.length === 0 ? (
        <Card padding="lg">
          <div className="text-center py-8">
            <RiPulseLine style={{ fontSize: 40, color: 'rgba(201,168,76,0.25)', margin: '0 auto 12px' }} />
            <p className="font-bold text-sm mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif", color: CREAM }}>No activity found</p>
            <p className="text-xs" style={{ color: DIM }}>Try another filter or check back after your next gig update.</p>
          </div>
        </Card>
      ) : (
        <Card padding="none">
          <div>
            {filteredEvents.map((ev, i) => (
              <div
                key={ev.id}
                className="flex items-center gap-4 p-4 transition-colors"
                style={{ borderBottom: i < filteredEvents.length - 1 ? `1px solid ${BORDER}` : 'none' }}
                onMouseEnter={e => (e.currentTarget.style.background = NAVY8)}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <div className="w-8 h-8 flex items-center justify-center flex-shrink-0" style={{ background: `${ev.accent}15`, borderRadius: 4 }}>
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
