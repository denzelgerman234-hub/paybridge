import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { BADGE_TIERS } from '../../lib/constants';
import { BadgeTier } from '../../types/database';

// Tier color palette tailored for dark theme (#0D1632)
const BADGE_CONFIG: Record<string, {
  bg: string;
  color: string;
  border: string;
  lottie: string;
}> = {
  trainee:   {
    bg:     'rgba(148,163,184,0.08)',
    color:  '#94A3B8',
    border: 'rgba(148,163,184,0.22)',
    lottie: 'https://lottie.host/abae5e48-f61e-40a9-b036-9f53dc6925dd/rLcq4jHz0v.json',
  },
  associate: {
    bg:     'rgba(201,168,76,0.10)',
    color:  '#C9A84C',
    border: 'rgba(201,168,76,0.30)',
    lottie: 'https://lottie.host/79284adf-b2e9-4e4f-a1fb-a36e5950b95d/Aux94JXsHk.json',
  },
  senior:    {
    bg:     'rgba(56,189,248,0.10)',
    color:  '#38BDF8',
    border: 'rgba(56,189,248,0.28)',
    lottie: 'https://lottie.host/3fbc1cc6-3799-49a1-93c3-cc08f854fe5e/hoajdTyb4O.json',
  },
  expert:    {
    bg:     'rgba(192,132,252,0.10)',
    color:  '#C084FC',
    border: 'rgba(192,132,252,0.28)',
    lottie: 'https://lottie.host/7be765e0-8d97-4ff4-b30c-ce9c32b630fc/5LKKVe0Cnh.json',
  },
  master:    {
    bg:     'rgba(241,240,218,0.10)',
    color:  '#F1F0DA',
    border: 'rgba(241,240,218,0.35)',
    lottie: 'https://lottie.host/4e02bc91-cd71-41b8-993e-dcb859516e18/5TCEI22mGm.json',
  },
};

interface BadgeIconProps {
  tier: BadgeTier;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  naked?: boolean;
}

export function BadgeIcon({ tier, size = 'md', showLabel = true, naked = false }: BadgeIconProps) {
  const info   = BADGE_TIERS.find(b => b.id === tier) ?? BADGE_TIERS[0];
  const config = BADGE_CONFIG[tier] ?? BADGE_CONFIG.trainee;

  const sizing = {
    xs: { fontSize: 9,  px: 7,  py: 2,  lottieSize: 21, gap: 3 },
    sm: { fontSize: 10, px: 9,  py: 2,  lottieSize: 26, gap: 4 },
    md: { fontSize: 11, px: 10, py: 3,  lottieSize: 30, gap: 5 },
    lg: { fontSize: 13, px: 12, py: 4,  lottieSize: 39, gap: 6 },
  }[size];

  return (
    <span
      style={{
        display:       'inline-flex',
        alignItems:    'center',
        gap:           sizing.gap,
        color:         config.color,
        fontFamily:    "'Space Grotesk', system-ui, sans-serif",
        fontSize:      sizing.fontSize,
        fontWeight:    600,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        whiteSpace:    'nowrap',
      }}
    >
      <DotLottieReact
        src={config.lottie}
        loop
        autoplay
        style={{ width: sizing.lottieSize, height: sizing.lottieSize, flexShrink: 0 }}
      />
      {showLabel && <span>{info.label}</span>}
    </span>
  );
}

interface BadgeProgressProps {
  tier: BadgeTier;
  gigsCompleted: number;
}

export function BadgeProgress({ tier, gigsCompleted }: BadgeProgressProps) {
  const config     = BADGE_CONFIG[tier] ?? BADGE_CONFIG.trainee;
  const currentIdx = BADGE_TIERS.findIndex(b => b.id === tier);
  const current    = BADGE_TIERS[currentIdx];
  const next       = BADGE_TIERS[currentIdx + 1];
  const nextConfig = next ? BADGE_CONFIG[next.id] : null;

  const min = current.gigs[0];
  const max = next ? next.gigs[0] : current.gigs[1];
  const pct = next ? Math.min(100, Math.round(((gigsCompleted - min) / (max - min)) * 100)) : 100;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div />
        {next ? (
          <span className="text-xs" style={{ color: 'rgba(241,240,218,0.55)' }}>
            {gigsCompleted - min}/{max - min} gigs to{' '}
            <span style={{ color: nextConfig?.color ?? '#C9A84C' }}>{next.label}</span>
          </span>
        ) : (
          <span className="text-xs flex items-center gap-1.5" style={{ color: config.color }}>
            <span style={{ width: 16, height: 16, display: 'inline-flex', alignItems: 'center' }}>
              <DotLottieReact src={config.lottie} loop autoplay style={{ width: 16, height: 16 }} />
            </span>
            Max tier
          </span>
        )}
      </div>

      {/* Progress bar — tinted with current tier's color */}
      <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(241,240,218,0.07)' }}>
        <div
          className="h-full transition-all duration-700"
          style={{ width: `${pct}%`, background: config.color }}
        />
      </div>

      <div className="flex justify-between text-xs" style={{ color: 'rgba(241,240,218,0.45)' }}>
        <span>{current.commission}% worker fee</span>
        <span>{next ? `${next.commission}% at ${next.label}` : 'Max fee'}</span>
      </div>
    </div>
  );
}
