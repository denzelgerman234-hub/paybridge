import { WorkerDisbursement } from '../../types/database';
import { formatCurrency, formatDate } from '../../lib/utils';
import { RiCheckboxCircleLine, RiTimeLine, RiCloseCircleLine, RiSendPlaneLine } from 'react-icons/ri';

const CREAM  = '#F1F0DA';
const DIM    = 'rgba(241,240,218,0.45)';
const GOLD   = '#C9A84C';
const SAGE   = '#7DC99A';
const TERRA  = '#C8523D';
const BORDER = 'rgba(241,240,218,0.09)';
const NAVY8  = '#12203F';

const STATUS_ICON: Record<string, { Icon: React.ElementType; color: string }> = {
  verified: { Icon: RiCheckboxCircleLine, color: SAGE  },
  sent:     { Icon: RiSendPlaneLine,      color: GOLD  },
  pending:  { Icon: RiTimeLine,           color: GOLD  },
  failed:   { Icon: RiCloseCircleLine,    color: TERRA },
};

interface RecipientCardProps { disbursement: WorkerDisbursement; }

export function RecipientCard({ disbursement: d }: RecipientCardProps) {
  const { Icon, color } = STATUS_ICON[d.status] ?? STATUS_ICON.pending;

  return (
    <div
      className="flex items-center justify-between p-4 transition-colors duration-150"
      style={{ border: `1px solid ${BORDER}`, borderRadius: 4 }}
      onMouseEnter={e => (e.currentTarget.style.background = NAVY8)}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      <div className="flex items-center gap-3 min-w-0">
        {/* Monogram avatar */}
        <div
          className="w-8 h-8 flex items-center justify-center font-bold text-xs flex-shrink-0"
          style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 3, color: GOLD, fontFamily: "'Space Grotesk', sans-serif" }}
        >
          {d.recipient_name[0].toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="font-bold text-xs truncate" style={{ color: CREAM, fontFamily: "'Space Grotesk', sans-serif" }}>{d.recipient_name}</p>
          <p className="text-xs truncate" style={{ color: DIM }}>
            {d.method.replace(/_/g, ' ')} · {d.destination}
          </p>
          {d.transaction_id && (
            <p className="text-xs font-mono mt-0.5" style={{ color: 'rgba(241,240,218,0.3)' }}>TXN: {d.transaction_id}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="text-right">
          <p className="font-black text-sm" style={{ color: GOLD, fontFamily: "'Space Grotesk', sans-serif" }}>{formatCurrency(d.amount)}</p>
          {d.sent_at && <p className="text-xs" style={{ color: DIM }}>{formatDate(d.sent_at)}</p>}
        </div>
        <div className="flex items-center gap-1.5">
          <Icon style={{ color, fontSize: 16 }} />
          <span className={`status-${d.status} hidden sm:inline-flex`}>{d.status}</span>
        </div>
      </div>
    </div>
  );
}
