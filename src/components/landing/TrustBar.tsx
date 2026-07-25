import { PARTNER_BANKS } from '../../lib/constants';
import { RiBuildingLine } from 'react-icons/ri';
import { useState } from 'react';

const DIM    = 'rgba(241,240,218,0.4)';
const GOLD   = '#C9A84C';
const BORDER = 'rgba(241,240,218,0.09)';

const BANK_LOGOS: Record<(typeof PARTNER_BANKS)[number], string> = {
  'Wells Fargo': 'https://commons.wikimedia.org/wiki/Special:FilePath/Wells%20Fargo%20Logo%20%282020%29.svg',
  'Chase': 'https://logo.clearbit.com/chase.com',
  'Bank of America': 'https://commons.wikimedia.org/wiki/Special:FilePath/Bank%20of%20America%20logo.svg',
  'USAA': 'https://logo.clearbit.com/usaa.com',
  'Navy Federal': 'https://commons.wikimedia.org/wiki/Special:FilePath/Navy%20Federal%20Credit%20Union%20Logo.svg',
  'Citibank': 'https://commons.wikimedia.org/wiki/Special:FilePath/Citi%20logo%20March%202023.svg',
  'PNC Bank': 'https://logo.clearbit.com/pnc.com',
  'Capital One': 'https://commons.wikimedia.org/wiki/Special:FilePath/Capital%20One%20logo.svg',
  'TD Bank': 'https://commons.wikimedia.org/wiki/Special:FilePath/Toronto-Dominion%20Bank%20logo.svg',
  'US Bank': 'https://commons.wikimedia.org/wiki/Special:FilePath/US%20Bancorp%20logo%202023%20color.svg',
  'Ally Bank': 'https://commons.wikimedia.org/wiki/Special:FilePath/Ally%20Financial.svg',
  'SunTrust': 'https://logo.clearbit.com/suntrust.com',
  'Regions Bank': 'https://commons.wikimedia.org/wiki/Special:FilePath/Regions%20Financial%20Corp%20logo.svg',
  'Fifth Third': 'https://commons.wikimedia.org/wiki/Special:FilePath/Fifth%20Third%20Bank%202023%20logo-primary-shieldleft-fullcolor.svg',
  'KeyBank': 'https://commons.wikimedia.org/wiki/Special:FilePath/KeyBank.png',
  'Huntington': 'https://commons.wikimedia.org/wiki/Special:FilePath/Huntington%20Bancshares%20Inc.%20logo.svg',
  'Citizens Bank': 'https://commons.wikimedia.org/wiki/Special:FilePath/Citizens%20Financial%20Group%20logo.svg',
  'M&T Bank': 'https://commons.wikimedia.org/wiki/Special:FilePath/M%26T%20Bank%20wordmark.svg',
  'Synovus': 'https://commons.wikimedia.org/wiki/Special:FilePath/Synovus%20logo.png',
  'First Republic': 'https://logo.clearbit.com/firstrepublic.com',
  'BBVA': 'https://commons.wikimedia.org/wiki/Special:FilePath/BBVA%20logo%202025.svg',
  'Santander': 'https://commons.wikimedia.org/wiki/Special:FilePath/Banco%20Santander%20Logotipo.svg',
  'TIAA': 'https://logo.clearbit.com/tiaa.org',
  'Discover Bank': 'https://commons.wikimedia.org/wiki/Special:FilePath/Discover%20Card%20logo.svg',
  'Goldman Sachs (Marcus)': 'https://commons.wikimedia.org/wiki/Special:FilePath/Goldman%20Sachs.svg',
  'American Express': 'https://commons.wikimedia.org/wiki/Special:FilePath/American%20Express%20logo%20%282018%29.svg',
  'Barclays US': 'https://commons.wikimedia.org/wiki/Special:FilePath/Barclays%20logo.svg',
  'HSBC US': 'https://commons.wikimedia.org/wiki/Special:FilePath/HSBC%20logo%20%282018%29.svg',
  'Flagstar Bank': 'https://commons.wikimedia.org/wiki/Special:FilePath/Flagstar%20Bank%20logo.svg',
};

const LOGO_ROW = [...PARTNER_BANKS, ...PARTNER_BANKS];

function BankLogoTile({ bank, priority }: { bank: (typeof PARTNER_BANKS)[number]; priority: boolean }) {
  const [imageState, setImageState] = useState<'loading' | 'loaded' | 'error'>('loading');
  const showFallback = imageState !== 'loaded';

  return (
    <div
      className="flex-shrink-0 relative overflow-hidden"
      aria-label={bank}
      style={{
        alignItems: 'center',
        background: 'rgba(241,240,218,0.96)',
        border: `1px solid ${BORDER}`,
        borderRadius: 3,
        display: 'flex',
        height: 64,
        justifyContent: 'center',
        padding: '12px 20px',
        width: 168,
      }}
    >
      <span
        aria-hidden="true"
        className="absolute inset-0 flex items-center justify-center px-4 text-center text-[11px] font-bold uppercase leading-tight"
        style={{
          color: '#0D1632',
          fontFamily: "'Space Grotesk', sans-serif",
          opacity: showFallback ? 0.76 : 0,
          transition: 'opacity 160ms ease',
        }}
      >
        {bank}
      </span>

      {imageState !== 'error' && (
        <img
          src={BANK_LOGOS[bank]}
          alt=""
          loading="eager"
          decoding="async"
          fetchPriority={priority ? 'high' : 'low'}
          onLoad={() => setImageState('loaded')}
          onError={() => setImageState('error')}
          style={{
            display: 'block',
            maxHeight: 36,
            maxWidth: 128,
            objectFit: 'contain',
            opacity: imageState === 'loaded' ? 1 : 0,
            position: 'relative',
            transition: 'opacity 160ms ease',
            zIndex: 1,
          }}
        />
      )}
    </div>
  );
}

export function TrustBar() {
  return (
    <section className="py-14 border-y" style={{ borderColor: BORDER, background: '#0D1632' }}>
      <style>{`
        @keyframes partner-bank-marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }

        .partner-bank-marquee {
          animation: partner-bank-marquee 44s linear infinite;
          width: max-content;
        }

        .partner-bank-marquee:hover {
          animation-play-state: paused;
        }

        @media (prefers-reduced-motion: reduce) {
          .partner-bank-marquee {
            animation: none;
            flex-wrap: wrap;
            justify-content: center;
            width: 100%;
          }
        }
      `}</style>
      <div className="max-w-7xl mx-auto px-5">
        <div className="flex items-center justify-center gap-3 mb-8">
          <RiBuildingLine style={{ color: GOLD, fontSize: 14 }} />
          <p
            className="text-xs font-bold uppercase tracking-widest"
            style={{ fontFamily: "'Space Grotesk', sans-serif", color: DIM }}
          >
            Works with 29 Partner Financial Institutions
          </p>
        </div>

        <div className="relative overflow-hidden">
          {/* Fade masks */}
          <div className="absolute left-0 top-0 bottom-0 w-16 z-10 pointer-events-none" style={{ background: 'linear-gradient(to right, #0D1632, transparent)' }} />
          <div className="absolute right-0 top-0 bottom-0 w-16 z-10 pointer-events-none" style={{ background: 'linear-gradient(to left, #0D1632, transparent)' }} />

          <div className="partner-bank-marquee flex gap-4 pb-1" aria-label="Partner bank logos">
            {LOGO_ROW.map((bank, index) => (
              <BankLogoTile
                key={`${bank}-${index}`}
                bank={bank}
                priority={index < PARTNER_BANKS.length}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}