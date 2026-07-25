import { BADGE_TIERS } from '../../lib/constants';
import { RiAwardLine, RiMedalLine, RiStarLine, RiFireLine, RiVipCrownLine } from 'react-icons/ri';

const CREAM  = '#F1F0DA';
const DIM    = 'rgba(241,240,218,0.45)';
const GOLD   = '#C9A84C';
const BORDER = 'rgba(241,240,218,0.09)';
const NAVY9  = '#0D1632';

// One icon per tier — outline only
const TIER_ICONS = [RiAwardLine, RiMedalLine, RiStarLine, RiFireLine, RiVipCrownLine];

export function BadgeProgression() {
  return (
    <section className="py-20 border-y" style={{ borderColor: BORDER, background: NAVY9 }}>
      <div className="max-w-7xl mx-auto px-5">
        <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-8">
          <div className="text-left flex-1">
            <p className="section-label mb-3">Rewards</p>
            <h2 className="text-3xl md:text-5xl font-black mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif", color: CREAM }}>
              Badge Progression
            </h2>
            <p style={{ color: DIM, fontSize: 15 }}>Earn more as you complete more gigs. Your reliability is rewarded.</p>
          </div>
          <div className="flex-shrink-0">
             <img src="/images/rewards.png" alt="Rewards Badge" className="w-48 md:w-64 hover:scale-105 transition-transform duration-500 drop-shadow-2xl" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {BADGE_TIERS.map((tier, i) => {
            const Icon = TIER_ICONS[i] || RiAwardLine;
            const isElite = i === 4;
            const accent  = isElite ? GOLD : i >= 2 ? GOLD : 'rgba(201,168,76,0.6)';

            return (
              <div
                key={tier.id}
                className="p-5 text-center transition-colors duration-150"
                style={{
                  background: NAVY9,
                  border: `1px solid ${isElite ? 'rgba(201,168,76,0.3)' : BORDER}`,
                  borderRadius: 6,
                  borderTop: `2px solid ${accent}`,
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(201,168,76,0.3)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = isElite ? 'rgba(201,168,76,0.3)' : BORDER)}
              >
                {/* Icon */}
                <div
                  className="w-11 h-11 flex items-center justify-center mx-auto mb-4"
                  style={{ background: `${accent}15`, border: `1px solid ${accent}30`, borderRadius: 4 }}
                >
                  <Icon style={{ color: accent, fontSize: 22 }} />
                </div>

                <h3 className="font-black text-sm mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif", color: CREAM }}>
                  {tier.label}
                </h3>
                <p className="text-xs mb-4" style={{ color: DIM }}>
                  {tier.gigs[1] === Infinity ? `${tier.gigs[0]}+ gigs` : `${tier.gigs[0]}–${tier.gigs[1]} gigs`}
                </p>

                {/* Worker Fee rate */}
                <div className="py-2 px-3 mb-3" style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.18)', borderRadius: 3 }}>
                  <span className="text-2xl font-black" style={{ fontFamily: "'Space Grotesk', sans-serif", color: GOLD }}>{tier.commission}%</span>
                  <p className="text-xs mt-0.5" style={{ color: DIM }}>worker fee</p>
                </div>

                <p className="text-xs" style={{ color: DIM }}>{tier.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
