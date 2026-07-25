import { useWallet } from '../hooks/useWallet';
import { useAuth } from '../hooks/useAuth';
import { Card } from '../components/ui/Card';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { formatCurrency, formatDate } from '../lib/utils';
import { RiArchiveLine, RiLineChartLine, RiTimeLine, RiMoneyDollarCircleLine, RiFileList3Line } from 'react-icons/ri';

const CREAM  = '#F1F0DA';
const DIM    = 'rgba(241,240,218,0.45)';
const GOLD   = '#C9A84C';
const SAGE   = '#7DC99A';
const BORDER = 'rgba(241,240,218,0.09)';
const NAVY8  = '#12203F';

export function WalletPage() {
  const { profile } = useAuth();
  const { commissions, fundingEvents, auditEvents, loading, totalEarned, totalFunded } = useWallet(profile?.id);

  if (loading) return <LoadingSpinner text="Loading records..." />;

  const stats = [
    { label: 'Recorded Worker Fees', value: formatCurrency(totalEarned), Icon: RiMoneyDollarCircleLine, accent: SAGE, note: 'Logged after verified gigs' },
    { label: 'Principal Funded', value: formatCurrency(totalFunded), Icon: RiLineChartLine, accent: GOLD, note: 'Dedicated-account deposits' },
    { label: 'Audit Events', value: String(auditEvents.length), Icon: RiArchiveLine, accent: GOLD, note: 'Secure activity trail' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <p className="section-label mb-1">Records</p>
          <h1 className="text-2xl font-black" style={{ fontFamily: "'Space Grotesk', sans-serif", color: CREAM }}>Transaction Records</h1>
          <p className="text-xs mt-0.5" style={{ color: DIM }}>Funding, worker fee, proof, and audit history</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {stats.map(({ label, value, Icon, accent, note }) => (
          <div key={label} className="stat-card p-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(241,240,218,0.06)', borderRadius: 4 }}>
                <Icon style={{ color: accent, fontSize: 18 }} />
              </div>
              <div>
                <p className="label-caps">{label}</p>
                <p className="text-xl font-black mt-0.5" style={{ fontFamily: "'Space Grotesk', sans-serif", color: CREAM }}>{value}</p>
                <p className="text-xs mt-0.5" style={{ color: DIM }}>{note}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Card padding="md">
        <h2 className="font-bold text-sm mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif", color: CREAM }}>Worker Fee Records</h2>
        {commissions.length === 0 ? (
          <div className="flex flex-col items-center py-10 gap-3">
            <RiMoneyDollarCircleLine style={{ fontSize: 32, color: 'rgba(201,168,76,0.3)' }} />
            <p className="text-xs" style={{ color: DIM }}>No worker fee records yet. Fees are logged after Operations verifies a completed gig.</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {commissions.map(c => (
              <div key={c.id} className="flex items-center justify-between p-3 rounded transition-colors" style={{ border: `1px solid ${BORDER}` }} onMouseEnter={e => (e.currentTarget.style.background = NAVY8)} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(201,168,76,0.1)', borderRadius: 3 }}>
                    <RiMoneyDollarCircleLine style={{ color: GOLD, fontSize: 14 }} />
                  </div>
                  <div>
                    <p className="font-bold text-sm" style={{ color: CREAM, fontFamily: "'Space Grotesk', sans-serif" }}>{formatCurrency(c.amount)}</p>
                    <p className="text-xs" style={{ color: DIM }}>Gig #{c.gig_id.slice(-4)} · {formatDate(c.created_at)}</p>
                  </div>
                </div>
                <span className={`status-${c.status}`}>{c.status.replace(/_/g, ' ')}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card padding="md">
        <h2 className="font-bold text-sm mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif", color: CREAM }}>Funding Records</h2>
        {fundingEvents.length === 0 ? (
          <div className="flex flex-col items-center py-10 gap-3">
            <RiTimeLine style={{ fontSize: 32, color: 'rgba(201,168,76,0.3)' }} />
            <p className="text-xs" style={{ color: DIM }}>No funding records yet.</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {fundingEvents.map(f => (
              <div key={f.id} className="flex items-center justify-between p-3 rounded" style={{ border: `1px solid ${BORDER}` }}>
                <div>
                  <p className="font-bold text-sm" style={{ color: CREAM, fontFamily: "'Space Grotesk', sans-serif" }}>
                    {formatCurrency(f.amount)} <span className="font-normal text-xs" style={{ color: DIM }}>{f.type}</span>
                  </p>
                  <p className="text-xs" style={{ color: DIM }}>{f.reference} · {formatDate(f.created_at)}</p>
                </div>
                <span className={`status-${f.confirmed ? 'verified' : 'pending'}`}>{f.confirmed ? 'confirmed' : 'pending'}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card padding="md">
        <h2 className="font-bold text-sm mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif", color: CREAM }}>Audit Trail</h2>
        {auditEvents.length === 0 ? (
          <div className="flex flex-col items-center py-10 gap-3">
            <RiFileList3Line style={{ fontSize: 32, color: 'rgba(201,168,76,0.3)' }} />
            <p className="text-xs" style={{ color: DIM }}>No audit events yet.</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {auditEvents.map(event => (
              <div key={event.id} className="p-3 rounded" style={{ border: `1px solid ${BORDER}` }}>
                <div className="flex items-center justify-between gap-3">
                  <p className="font-bold text-xs" style={{ color: CREAM, fontFamily: "'Space Grotesk', sans-serif" }}>{event.event_type.replace(/_/g, ' ')}</p>
                  <p className="text-xs" style={{ color: DIM }}>{formatDate(event.created_at)}</p>
                </div>
                <p className="text-xs mt-1" style={{ color: DIM }}>{event.summary}</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
