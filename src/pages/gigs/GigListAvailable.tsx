import { useGigs, GigWithApplication } from '../../hooks/useGigs';
import { useAuth } from '../../hooks/useAuth';
import { BadgeIcon } from '../../components/ui/Badge';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { formatCurrency, formatRelativeTime } from '../../lib/utils';
import { isAvailableGig } from '../../lib/gigFilters';
import { Link } from 'react-router-dom';
import { RiSearchLine, RiBriefcaseLine, RiArrowRightLine } from 'react-icons/ri';
import { useState } from 'react';

const CREAM  = '#F1F0DA';
const DIM    = 'rgba(241,240,218,0.45)';
const GOLD   = '#C9A84C';
const BORDER = 'rgba(241,240,218,0.09)';
const NAVY9  = '#0D1632';
const NAVY8  = '#12203F';

interface GigListAvailableProps {
  showHeader?: boolean;
  /** Pre-fetched gigs from a parent that already called useGigs — avoids a duplicate hook instance */
  gigs?: GigWithApplication[];
  loading?: boolean;
}

export function GigListAvailable({ showHeader = true, gigs: gigsProp, loading: loadingProp }: GigListAvailableProps) {
  const { profile } = useAuth();
  // Only call useGigs if the parent didn't supply data (standalone usage)
  const ownHook = useGigs(gigsProp === undefined ? profile?.id : undefined);
  const gigs = gigsProp ?? ownHook.gigs;
  const loading = loadingProp ?? ownHook.loading;
  const [search, setSearch] = useState('');

  if (loading) return <LoadingSpinner text="Loading gigs..." />;

  const available = gigs
    .filter(g => isAvailableGig(g, profile?.id))
    .filter(g => !search || g.client_name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-5 animate-fade-in">
      {showHeader && (
        <div className="flex items-start justify-between">
          <div>
            <p className="section-label mb-1">Marketplace</p>
            <h1 className="text-2xl font-black" style={{ fontFamily: "'Space Grotesk', sans-serif", color: CREAM }}>Available Gigs</h1>
            <p className="text-xs mt-0.5" style={{ color: DIM }}>{available.length} gig{available.length !== 1 ? 's' : ''} open for applications</p>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <RiSearchLine style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: DIM, fontSize: 14 }} />
        <input
          className="input-dark pl-10"
          placeholder="Search by client name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {available.length === 0 ? (
        <div className="p-10 text-center" style={{ background: NAVY9, border: `1px solid ${BORDER}`, borderRadius: 6 }}>
          <RiBriefcaseLine style={{ fontSize: 36, color: 'rgba(201,168,76,0.25)', margin: '0 auto 12px' }} />
          <p className="font-bold text-sm mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif", color: CREAM }}>
            {search ? 'No matches found' : 'No gigs available'}
          </p>
          <p className="text-xs" style={{ color: DIM }}>
            {search ? 'Try a different search term.' : 'Check back soon — new gigs are posted regularly.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {available.map(gig => (
            <div
              key={gig.id}
              className="p-5 transition-colors duration-150"
              style={{ background: NAVY9, border: `1px solid ${BORDER}`, borderRadius: 6 }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(201,168,76,0.3)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = BORDER)}
            >
              {/* Top */}
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h2 className="font-bold text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif", color: CREAM }}>{gig.client_name}</h2>
                  {gig.client_contact && <p className="text-xs mt-0.5" style={{ color: DIM }}>{gig.client_contact}</p>}
                </div>
                <span className="status-open flex-shrink-0">Open</span>
              </div>

              {/* Meta grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                {[
                  { label: 'Principal',   value: formatCurrency(gig.total_principal) },
                  { label: `Worker Fee (${gig.commission_rate}%)`, value: formatCurrency(gig.commission_amount) },
                  { label: 'Recipients',  value: `${gig.recipient_count} people` },
                  { label: 'Deadline',    value: formatRelativeTime(gig.deadline) },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="label-caps mb-0.5">{label}</p>
                    <p className="font-semibold text-sm" style={{ color: CREAM }}>{value}</p>
                  </div>
                ))}
              </div>

              {gig.notes && (
                <p className="text-xs mb-4 p-3 rounded" style={{ color: DIM, background: NAVY8, border: `1px solid ${BORDER}` }}>
                  {gig.notes}
                </p>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3 flex-wrap">
                  {gig.badge_required && (
                    <div className="flex items-center gap-1.5 text-xs" style={{ color: DIM }}>
                      Requires: <BadgeIcon tier={gig.badge_required} size="xs" />
                    </div>
                  )}
                  <div className="flex gap-1.5 flex-wrap">
                    {gig.disbursement_methods.map(m => (
                      <span
                        key={m}
                        className="text-xs px-2 py-0.5"
                        style={{ background: NAVY8, border: `1px solid ${BORDER}`, borderRadius: 3, color: DIM, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '0.04em' }}
                      >
                        {m.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
                <Link to={`/gigs/${gig.id}`}>
                  <button className="btn-primary flex items-center gap-1.5">
                    {gig.application ? gig.application.status.replace(/_/g, ' ') : 'View & Apply'} <RiArrowRightLine />
                  </button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}



