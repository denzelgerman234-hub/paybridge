import { Quote, User } from 'lucide-react';

const CREAM   = '#F1F0DA';
const DIM     = 'rgba(241,240,218,0.5)';
const GOLD    = '#C9A84C';
const BORDER  = 'rgba(241,240,218,0.09)';

const testimonials = [
  {
    text: 'I recorded $2,400 in worker fees my first month. I never used my own money. PayBridge deposited the funds, I sent them, Operations verified the gigs.',
    name: 'Marcus T.',
    role: 'Associate Worker',
    earned: '$2,400',
    initials: 'MT',
  },
  {
    text: 'The onboarding was smooth, the training was clear. I was disbursing my first gig within a week of applying.',
    name: 'Priya K.',
    role: 'Senior Worker',
    earned: '$5,800',
    initials: 'PK',
  },
  {
    text: 'Having the funds pre-loaded before I send anything gives me total peace of mind. The system works exactly as advertised.',
    name: 'James O.',
    role: 'Expert Worker',
    earned: '$12,200',
    initials: 'JO',
  },
];

export function Testimonials() {
  return (
    <section className="py-20 max-w-7xl mx-auto px-5">
      <div className="text-center mb-12">
        <p className="section-label mb-3">Worker Stories</p>
        <h2 className="text-3xl md:text-5xl font-black mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif", color: CREAM }}>
          Real Workers. Real Earnings.
        </h2>
        <p style={{ color: DIM, fontSize: 15 }}>No fronting money. Ever.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {testimonials.map(({ text, name, role, earned, initials }) => (
          <div
            key={name}
            className="p-6 transition-colors duration-150"
            style={{ background: '#0D1632', border: `1px solid ${BORDER}`, borderRadius: 6 }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(201,168,76,0.25)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = BORDER)}
          >
            <Quote size={20} strokeWidth={1} style={{ color: 'rgba(201,168,76,0.4)', marginBottom: 16 }} />
            <p className="leading-relaxed mb-6 text-sm" style={{ color: DIM }}>
              "{text}"
            </p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Monogram avatar */}
                <div
                  className="w-9 h-9 rounded-sm flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.25)', color: GOLD, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '0.05em' }}
                >
                  {initials}
                </div>
                <div>
                  <p className="font-bold text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif", color: CREAM }}>{name}</p>
                  <p className="text-xs" style={{ color: DIM }}>{role}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-wider" style={{ color: DIM, fontFamily: "'Space Grotesk', sans-serif", fontSize: 9 }}>Earned</p>
                <p className="font-black text-sm" style={{ color: GOLD, fontFamily: "'Space Grotesk', sans-serif" }}>{earned}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
