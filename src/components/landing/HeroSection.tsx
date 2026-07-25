import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Percent, Building2 } from 'lucide-react';
import { PBMark } from '../brand/Logo';
import { RiShieldCheckLine, RiMoneyDollarCircleLine, RiBankLine } from 'react-icons/ri';

const CREAM   = '#F1F0DA';
const DIM     = 'rgba(241,240,218,0.5)';
const GOLD    = '#C9A84C';
const BORDER  = 'rgba(241,240,218,0.09)';
const NAVY900 = '#0D1632';

const features = [
  {
    Icon:  RiShieldCheckLine,
    title: 'Pre-Funded — Always',
    text:  'Principal is deposited into your dedicated account BEFORE you disburse a single dollar. You never front your own money.',
  },
  {
    Icon:  RiMoneyDollarCircleLine,
    title: 'Earn 10–15%',
    text:  'Competitive worker-fee tiers. Higher badge rank unlocks higher-value gigs and increased fee rates.',
  },
  {
    Icon:  RiBankLine,
    title: '29 Partner Banks',
    text:  'Work through a network of top US financial institutions. Every gig is verified, structured, and compliant.',
  },
];

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex flex-col justify-center" style={{ background: '#0B132F' }}>
      {/* Subtle top gold rule */}
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)` }} />

      {/* Vertical center grid lines — graphic accent */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[25, 50, 75].map(p => (
          <div key={p} className="absolute top-0 bottom-0 w-px" style={{ left: `${p}%`, background: 'rgba(241,240,218,0.025)' }} />
        ))}
        {/* Horizontal rule at 60% */}
        <div className="absolute left-0 right-0 h-px" style={{ top: '62%', background: 'rgba(241,240,218,0.03)' }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-5 pt-20 pb-12 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div>
        {/* Eyebrow */}
        <div className="flex items-center gap-2.5 mb-5 animate-fade-in">
          <div className="w-4 h-px" style={{ background: GOLD }} />
          <span
            className="text-xs font-bold uppercase tracking-widest flex items-center gap-2"
            style={{ fontFamily: "'Space Grotesk', sans-serif", color: GOLD }}
          >
            <ShieldCheck size={12} strokeWidth={2} />
            FinCEN Registered Money Services Business
          </span>
        </div>

        {/* Main headline */}
        <h1
          className="text-4xl md:text-5xl lg:text-6xl font-black leading-[1.1] mb-5 animate-fade-in"
          style={{ fontFamily: "'Space Grotesk', sans-serif", color: CREAM, letterSpacing: '-0.02em' }}
        >
          Get Paid to<br />
          Disburse Funds<br />
          <span style={{ color: GOLD }}>Without Fronting</span><br />
          Your Own Money.
        </h1>

        <p className="text-base md:text-lg mb-8 max-w-xl animate-fade-in" style={{ color: DIM, lineHeight: 1.6 }}>
          PayBridge connects workers with organizations that need funds disbursed. We provide the principal.
          You execute. Your <strong style={{ color: CREAM }}>10-15% worker fee</strong> is recorded when the gig is verified.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 animate-fade-in">
          <Link to="/apply">
            <button className="btn-primary flex items-center gap-2 !px-8 !py-3.5 !text-sm">
              Apply Now <ArrowRight size={14} />
            </button>
          </Link>
          <a href="#how-it-works">
            <button className="btn-secondary !px-8 !py-3.5 !text-sm">
              How It Works
            </button>
          </a>
        </div>
        </div>
        
        {/* Right side illustration */}
        <div className="hidden md:flex justify-center animate-fade-in relative">
           <img src="/images/hero.png" alt="PayBridge Worker Illustration" className="w-full max-w-md drop-shadow-2xl hover:scale-105 transition-transform duration-500" />
        </div>
        
        {/* Feature cards — tight grid, flat */}
        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-3 mt-12">
          {features.map(({ Icon, title, text }) => (
            <div
              key={title}
              className="p-5 transition-colors duration-150"
              style={{ background: NAVY900, border: `1px solid ${BORDER}`, borderRadius: 6 }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(201,168,76,0.3)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = BORDER)}
            >
              {/* Icon row */}
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-9 h-9 flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(201,168,76,0.1)', border: `1px solid rgba(201,168,76,0.2)`, borderRadius: 4 }}
                >
                  <Icon style={{ color: GOLD, fontSize: 18 }} />
                </div>
                <h3 className="font-bold text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif", color: CREAM }}>
                  {title}
                </h3>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: DIM }}>{text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom mark watermark */}
      <div className="absolute bottom-8 right-8 opacity-5 pointer-events-none">
        <PBMark size={120} color={CREAM} />
      </div>
    </section>
  );
}
