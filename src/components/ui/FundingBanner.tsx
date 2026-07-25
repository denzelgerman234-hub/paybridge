import { formatCurrency } from '../../lib/utils';
import { RiShieldCheckLine, RiTimeLine } from 'react-icons/ri';

interface FundingBannerProps {
  totalPrincipal: number;
  funded: boolean;
  fundedAmount?: number;
}

export function FundingBanner({ totalPrincipal, funded, fundedAmount = 0 }: FundingBannerProps) {
  if (funded) {
    return (
      <div
        className="p-4 flex items-start gap-3"
        style={{
          background: 'rgba(125,201,154,0.07)',
          border: '1px solid rgba(125,201,154,0.2)',
          borderRadius: 4,
          borderLeft: '3px solid #7DC99A',
        }}
      >
        <RiShieldCheckLine style={{ color: '#7DC99A', fontSize: 18, flexShrink: 0, marginTop: 1 }} />
        <div>
          <p
            className="font-bold text-xs uppercase tracking-wider mb-1"
            style={{ color: '#7DC99A', fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '0.08em' }}
          >
            Pre-Funded — Ready to Disburse
          </p>
          <p className="text-xs" style={{ color: 'rgba(241,240,218,0.5)', lineHeight: 1.5 }}>
            {formatCurrency(totalPrincipal)} deposited into your dedicated account before this gig.
            You never use your own money.
          </p>
          {fundedAmount > 0 && (
            <p className="text-xs mt-1" style={{ color: 'rgba(125,201,154,0.6)' }}>
              Disbursed so far: {formatCurrency(fundedAmount)} of {formatCurrency(totalPrincipal)}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="p-4 flex items-start gap-3"
      style={{
        background: 'rgba(201,168,76,0.07)',
        border: '1px solid rgba(201,168,76,0.2)',
        borderRadius: 4,
        borderLeft: '3px solid #C9A84C',
      }}
    >
      <RiTimeLine style={{ color: '#C9A84C', fontSize: 18, flexShrink: 0, marginTop: 1 }} />
      <div>
        <p
          className="font-bold text-xs uppercase tracking-wider mb-1"
          style={{ color: '#C9A84C', fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '0.08em' }}
        >
          Awaiting Principal Deposit
        </p>
        <p className="text-xs" style={{ color: 'rgba(241,240,218,0.5)', lineHeight: 1.5 }}>
          Do NOT disburse until {formatCurrency(totalPrincipal)} is confirmed in your dedicated account.
          You must never send your own money.
        </p>
      </div>
    </div>
  );
}
