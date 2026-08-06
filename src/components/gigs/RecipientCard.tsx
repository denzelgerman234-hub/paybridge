import { useState } from 'react';
import { WorkerDisbursement } from '../../types/database';
import { formatCurrency, formatDate } from '../../lib/utils';
import { RiCheckboxCircleLine, RiTimeLine, RiCloseCircleLine, RiSendPlaneLine, RiFileCopyLine, RiArrowDownSLine } from 'react-icons/ri';
import toast from 'react-hot-toast';

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

type CopyRow = {
  label: string;
  value: string;
  copyValue?: string;
};

async function copyText(label: string, value: string) {
  try {
    await navigator.clipboard.writeText(value);
    toast.success(`${label} copied`);
  } catch {
    toast.error('Could not copy. Select the text manually.');
  }
}

function DetailRow({ label, value, copyValue = value }: CopyRow) {
  return (
    <div className="flex items-center justify-between gap-3 border-t py-2 first:border-t-0" style={{ borderColor: BORDER }}>
      <div className="min-w-0">
        <p className="label-caps mb-0.5">{label}</p>
        <p className="select-text whitespace-pre-wrap break-words text-sm font-semibold" style={{ color: CREAM }}>{value}</p>
      </div>
      <button
        type="button"
        onClick={event => {
          event.stopPropagation();
          void copyText(label, copyValue);
        }}
        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded border border-cream/10 text-cream/55 transition-colors hover:border-gold/40 hover:text-gold"
        aria-label={`Copy ${label.toLowerCase()}`}
      >
        <RiFileCopyLine size={15} />
      </button>
    </div>
  );
}

export function RecipientCard({ disbursement: d }: RecipientCardProps) {
  const [expanded, setExpanded] = useState(false);
  const { Icon, color } = STATUS_ICON[d.status] ?? STATUS_ICON.pending;
  const method = d.method.replace(/_/g, ' ');
  const detailRows: CopyRow[] = [
    { label: 'Recipient', value: d.recipient_name },
    { label: 'Amount', value: formatCurrency(d.amount), copyValue: String(d.amount) },
    { label: 'Method', value: method },
    { label: 'Destination', value: d.destination },
    ...(d.transaction_id ? [{ label: 'Transaction ID', value: d.transaction_id }] : []),
    { label: 'Status', value: d.status.replace(/_/g, ' ') },
  ];

  return (
    <div
      role="button"
      tabIndex={0}
      aria-expanded={expanded}
      onClick={() => setExpanded(value => !value)}
      onKeyDown={event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          setExpanded(value => !value);
        }
      }}
      className="cursor-pointer transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-gold/40"
      style={{ border: `1px solid ${BORDER}`, borderRadius: 4, background: expanded ? NAVY8 : 'transparent' }}
      onMouseEnter={e => (e.currentTarget.style.background = NAVY8)}
      onMouseLeave={e => (e.currentTarget.style.background = expanded ? NAVY8 : 'transparent')}
    >
      <div className="flex items-center justify-between gap-3 p-4">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center font-bold text-xs"
            style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 3, color: GOLD, fontFamily: "'Space Grotesk', sans-serif" }}
          >
            {d.recipient_name[0].toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-bold" style={{ color: CREAM, fontFamily: "'Space Grotesk', sans-serif" }}>{d.recipient_name}</p>
            <p className="truncate text-xs" style={{ color: DIM }}>
              {method} - {d.destination}
            </p>
            {d.transaction_id && (
              <p className="mt-0.5 truncate font-mono text-xs" style={{ color: 'rgba(241,240,218,0.3)' }}>TXN: {d.transaction_id}</p>
            )}
          </div>
        </div>

        <div className="flex flex-shrink-0 items-center gap-2 sm:gap-3">
          <div className="text-right">
            <p className="text-sm font-black" style={{ color: GOLD, fontFamily: "'Space Grotesk', sans-serif" }}>{formatCurrency(d.amount)}</p>
            {d.sent_at && <p className="hidden text-xs sm:block" style={{ color: DIM }}>{formatDate(d.sent_at)}</p>}
          </div>
          <div className="flex items-center gap-1.5">
            <Icon style={{ color, fontSize: 16 }} />
            <span className={`status-${d.status} hidden sm:inline-flex`}>{d.status}</span>
          </div>
          <RiArrowDownSLine size={18} className={`text-cream/45 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4">
          <div className="rounded border border-cream/10 bg-black/10 px-3">
            {detailRows.map(row => <DetailRow key={row.label} {...row} />)}
          </div>
        </div>
      )}
    </div>
  );
}
