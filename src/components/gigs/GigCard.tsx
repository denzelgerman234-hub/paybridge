import { Link } from 'react-router-dom';
import { WorkerGig } from '../../types/database';
import { BadgeIcon } from '../ui/Badge';
import { formatCurrency, formatRelativeTime } from '../../lib/utils';
import { ArrowRight, Clock, CheckCircle } from 'lucide-react';

const CREAM   = '#F1F0DA';
const DIM     = 'rgba(241,240,218,0.45)';
const GOLD    = '#C9A84C';
const SAGE    = '#7DC99A';
const BORDER  = 'rgba(241,240,218,0.09)';

interface GigCardProps { gig: WorkerGig; }

export function GigCard({ gig }: GigCardProps) {
  const detailTarget = gig.status === 'open' ? `/gigs/${gig.id}` : `/gigs/${gig.id}#operations`;

  return (
    <div
      className="group transition-colors duration-150"
      style={{ background: '#0D1632', border: `1px solid ${BORDER}`, borderRadius: 6 }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(201,168,76,0.3)')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = BORDER)}
    >
      {/* Top accent bar when funded */}
      {gig.funded && (
        <div style={{ height: 2, background: SAGE, borderRadius: '6px 6px 0 0' }} />
      )}

      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-bold text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif", color: CREAM }}>
              {gig.client_name}
            </h3>
            {gig.client_contact && <p className="text-xs mt-0.5" style={{ color: DIM }}>{gig.client_contact}</p>}
          </div>
          <span className={`status-${gig.status}`}>{gig.status.replace(/_/g, ' ')}</span>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <p className="label-caps mb-0.5">Principal</p>
            <p className="font-bold text-sm" style={{ color: CREAM }}>{formatCurrency(gig.total_principal)}</p>
          </div>
          <div>
            <p className="label-caps mb-0.5">Worker Fee ({gig.commission_rate}%)</p>
            <p className="font-bold text-sm" style={{ color: GOLD }}>{formatCurrency(gig.commission_amount)}</p>
          </div>
          <div>
            <p className="label-caps mb-0.5">Recipients</p>
            <p className="font-bold text-sm" style={{ color: CREAM }}>{gig.recipient_count}</p>
          </div>
          <div>
            <p className="label-caps mb-0.5">Deadline</p>
            <p className="font-bold text-sm flex items-center gap-1" style={{ color: CREAM }}>
              <Clock size={11} strokeWidth={1.5} style={{ color: GOLD }} />
              {formatRelativeTime(gig.deadline)}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {gig.badge_required && <BadgeIcon tier={gig.badge_required} size="xs" />}
            {gig.funded && (
              <span className="flex items-center gap-1 text-xs font-bold" style={{ color: SAGE, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '0.06em' }}>
                <CheckCircle size={11} strokeWidth={2} /> Pre-funded
              </span>
            )}
          </div>
          <Link to={detailTarget}>
            <button className="btn-secondary text-xs flex items-center gap-1.5 !py-1.5 !px-3">
              View <ArrowRight size={11} />
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
