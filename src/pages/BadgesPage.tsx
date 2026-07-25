import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { useAuth } from '../hooks/useAuth';
import { Card } from '../components/ui/Card';
import { BadgeIcon, BadgeProgress } from '../components/ui/Badge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { BADGE_TIERS } from '../lib/constants';
import { formatCurrency } from '../lib/utils';
import { RiLockLine, RiCheckboxCircleLine } from 'react-icons/ri';

const CREAM  = '#F1F0DA';
const DIM    = 'rgba(241,240,218,0.45)';
const GOLD   = '#C9A84C';
const SAGE   = '#7DC99A';
const BORDER = 'rgba(241,240,218,0.09)';

// Lottie src + color per tier — mirrors Badge.tsx config
const TIER_CONFIG: Record<string, { lottie: string; color: string; bg: string; border: string }> = {
  trainee:   { lottie: 'https://lottie.host/abae5e48-f61e-40a9-b036-9f53dc6925dd/rLcq4jHz0v.json', color: '#94A3B8', bg: 'rgba(148,163,184,0.08)', border: 'rgba(148,163,184,0.22)' },
  associate: { lottie: 'https://lottie.host/79284adf-b2e9-4e4f-a1fb-a36e5950b95d/Aux94JXsHk.json', color: '#C9A84C', bg: 'rgba(201,168,76,0.10)',  border: 'rgba(201,168,76,0.30)'  },
  senior:    { lottie: 'https://lottie.host/3fbc1cc6-3799-49a1-93c3-cc08f854fe5e/hoajdTyb4O.json', color: '#38BDF8', bg: 'rgba(56,189,248,0.10)',  border: 'rgba(56,189,248,0.28)'  },
  expert:    { lottie: 'https://lottie.host/7be765e0-8d97-4ff4-b30c-ce9c32b630fc/5LKKVe0Cnh.json', color: '#C084FC', bg: 'rgba(192,132,252,0.10)', border: 'rgba(192,132,252,0.28)' },
  master:    { lottie: 'https://lottie.host/4e02bc91-cd71-41b8-993e-dcb859516e18/5TCEI22mGm.json', color: '#F1F0DA', bg: 'rgba(241,240,218,0.10)', border: 'rgba(241,240,218,0.35)' },
};

export function BadgesPage() {
  const { profile, isLoading } = useAuth();
  if (isLoading || !profile) return <LoadingSpinner text="Loading badges..." />;

  const currentIdx  = BADGE_TIERS.findIndex(b => b.id === profile.badge);
  const currentTier = BADGE_TIERS[currentIdx];
  const currentCfg  = TIER_CONFIG[profile.badge] ?? TIER_CONFIG.trainee;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <p className="section-label mb-1">Progression</p>
        <h1 className="text-2xl font-black" style={{ fontFamily: "'Space Grotesk', sans-serif", color: CREAM }}>Badge Tiers</h1>
        <p className="text-xs mt-0.5" style={{ color: DIM }}>Your level unlocks higher worker fees and better gigs.</p>
      </div>

      {/* Current badge hero card */}
      <div
        className="p-6"
        style={{
          background: '#0D1632',
          border: `1px solid ${currentCfg.border}`,
          borderLeft: `4px solid ${currentCfg.color}`,
          borderRadius: 6,
        }}
      >
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          {/* Large Lottie badge animation — no container */}
          <DotLottieReact
            src={currentCfg.lottie}
            loop
            autoplay
            style={{ width: 126, height: 126, flexShrink: 0 }}
          />

          <div className="flex-1">
            <p className="label-caps mb-1">Current Badge</p>
            <h2 className="text-3xl font-black mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif", color: currentCfg.color }}>
              {currentTier.label}
            </h2>
            <p className="text-xs mb-4" style={{ color: DIM }}>{currentTier.description}</p>
            <BadgeProgress tier={profile.badge} gigsCompleted={profile.total_gigs_completed} />
          </div>

          <div className="text-right flex-shrink-0">
            <p className="label-caps mb-1">Worker Fee Rate</p>
            <p className="text-4xl font-black" style={{ fontFamily: "'Space Grotesk', sans-serif", color: currentCfg.color }}>
              {currentTier.commission}%
            </p>
          </div>
        </div>
      </div>

      {/* All tiers */}
      <div className="space-y-2">
        <h2 className="font-bold text-sm mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif", color: CREAM }}>All Badge Tiers</h2>
        {BADGE_TIERS.map((tier, i) => {
          const isCurrent  = tier.id === profile.badge;
          const isUnlocked = i <= currentIdx;
          const cfg        = TIER_CONFIG[tier.id] ?? TIER_CONFIG.trainee;

          return (
            <div
              key={tier.id}
              className="p-4 flex items-center gap-4 transition-colors duration-150"
              style={{
                background:  isCurrent ? `${cfg.bg}` : '#0D1632',
                border:      `1px solid ${isCurrent ? cfg.border : BORDER}`,
                borderRadius: 6,
                opacity:     isUnlocked ? 1 : 0.45,
              }}
            >
              {/* Lottie animation per tier — no container */}
              <DotLottieReact
                src={cfg.lottie}
                loop
                autoplay
                style={{ width: 63, height: 63, flexShrink: 0 }}
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="font-bold text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif", color: isUnlocked ? CREAM : DIM }}>
                    {tier.label}
                  </h3>
                  {isCurrent && (
                    <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5" style={{ background: `${cfg.color}22`, color: cfg.color, borderRadius: 3, fontFamily: "'Space Grotesk', sans-serif" }}>
                      Current
                    </span>
                  )}
                  {isUnlocked && !isCurrent && <RiCheckboxCircleLine style={{ color: SAGE, fontSize: 14 }} />}
                  {!isUnlocked && <RiLockLine style={{ color: DIM, fontSize: 14 }} />}
                </div>
                <p className="text-xs" style={{ color: DIM }}>
                  {tier.gigs[1] === Infinity ? `${tier.gigs[0]}+ gigs` : `${tier.gigs[0]}–${tier.gigs[1]} gigs`} · {tier.description}
                </p>
              </div>

              <div className="text-right flex-shrink-0">
                <p className="text-xl font-black" style={{ fontFamily: "'Space Grotesk', sans-serif", color: isCurrent ? cfg.color : isUnlocked ? SAGE : DIM }}>{tier.commission}%</p>
                <p className="text-xs" style={{ color: DIM }}>worker fee</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Stats */}
      <Card padding="md">
        <h2 className="font-bold text-sm mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif", color: CREAM }}>Your Progress</h2>
        <div className="grid grid-cols-3 gap-4 text-center">
          {[
            { label: 'Gigs Completed', value: String(profile.total_gigs_completed) },
            { label: 'Total Disbursed', value: formatCurrency(profile.total_disbursed) },
            { label: 'Total Earned',   value: formatCurrency(profile.total_earned) },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="font-black text-xl" style={{ fontFamily: "'Space Grotesk', sans-serif", color: CREAM }}>{value}</p>
              <p className="text-xs mt-0.5" style={{ color: DIM }}>{label}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
