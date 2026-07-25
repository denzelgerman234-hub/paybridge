import { Link } from 'react-router-dom';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { HeroSection } from './HeroSection';
import { TrustBar } from './TrustBar';
import { HowItWorks } from './HowItWorks';
import { BadgeProgression } from './BadgeProgression';
import { Testimonials } from './Testimonials';
import { ArrowRight } from 'lucide-react';

const GOLD = [0.788, 0.659, 0.298, 1];
const GOLD_SOFT = [0.89, 0.76, 0.36, 1];
const CREAM = [0.945, 0.941, 0.855, 1];
const NAVY = [0.071, 0.125, 0.247, 1];

let faqLottieLayerIndex = 1;

const makeTransform = (position = [0, 0], scale = [100, 100, 100]) => ({
  ty: 'tr',
  p: { a: 0, k: position },
  a: { a: 0, k: [0, 0] },
  s: { a: 0, k: scale },
  r: { a: 0, k: 0 },
  o: { a: 0, k: 100 },
  sk: { a: 0, k: 0 },
  sa: { a: 0, k: 0 },
});

const makeLayer = (name: string, shapes: object[], position = [32, 32, 0], scale = [100, 100, 100]) => ({
  ddd: 0,
  ind: faqLottieLayerIndex++,
  ty: 4,
  nm: name,
  sr: 1,
  ks: {
    o: { a: 0, k: 100 },
    r: { a: 0, k: 0 },
    p: { a: 0, k: position },
    a: { a: 0, k: [0, 0, 0] },
    s: {
      a: 1,
      k: [
        { t: 0, s: [92, 92, 100], e: scale, i: { x: [0.42], y: [1] }, o: { x: [0.58], y: [0] } },
        { t: 35, s: scale, e: [92, 92, 100], i: { x: [0.42], y: [1] }, o: { x: [0.58], y: [0] } },
        { t: 70, s: [92, 92, 100] },
      ],
    },
  },
  ao: 0,
  shapes,
  ip: 0,
  op: 70,
  st: 0,
  bm: 0,
});

const ellipse = (size: number[], fill: number[], stroke = CREAM, strokeWidth = 2) => [
  { ty: 'el', p: { a: 0, k: [0, 0] }, s: { a: 0, k: size }, nm: 'ellipse' },
  { ty: 'fl', c: { a: 0, k: fill }, o: { a: 0, k: 100 }, r: 1, nm: 'fill' },
  { ty: 'st', c: { a: 0, k: stroke }, o: { a: 0, k: 80 }, w: { a: 0, k: strokeWidth }, lc: 2, lj: 2, bm: 0, nm: 'stroke' },
  makeTransform(),
];

const rect = (position: number[], size: number[], radius: number, fill: number[], stroke = CREAM, strokeWidth = 2) => [
  { ty: 'rc', d: 1, s: { a: 0, k: size }, p: { a: 0, k: position }, r: { a: 0, k: radius }, nm: 'rect' },
  { ty: 'fl', c: { a: 0, k: fill }, o: { a: 0, k: 100 }, r: 1, nm: 'fill' },
  { ty: 'st', c: { a: 0, k: stroke }, o: { a: 0, k: 80 }, w: { a: 0, k: strokeWidth }, lc: 2, lj: 2, bm: 0, nm: 'stroke' },
  makeTransform(),
];

const makeLottie = (name: string, layers: object[]) => ({
  v: '5.7.4',
  fr: 30,
  ip: 0,
  op: 70,
  w: 64,
  h: 64,
  nm: name,
  ddd: 0,
  assets: [],
  layers,
});

const FAQ_PREVIEW = [
  {
    q: "Do I ever use my own money?",
    a: "No. The principal amount is always deposited into your dedicated account by PayBridge before you initiate any disbursement.",
    lottie: makeLottie('Pre-funded account', [
      makeLayer('coin outer', ellipse([36, 36], GOLD, CREAM, 2), [32, 32, 0], [105, 105, 100]),
      makeLayer('coin inner', ellipse([18, 18], NAVY, GOLD_SOFT, 2), [32, 32, 0], [95, 95, 100]),
    ]),
  },
  {
    q: "What is a dedicated account?",
    a: "It is an account you open at one of our 29 partner banks, used strictly and exclusively for PayBridge disbursements. No personal funds should ever mix with this account.",
    lottie: makeLottie('Dedicated account', [
      makeLayer('bank base', rect([0, 8], [42, 12], 2, GOLD, CREAM, 2), [32, 42, 0], [100, 100, 100]),
      makeLayer('bank columns', [
        ...rect([-14, 0], [6, 22], 2, NAVY, GOLD_SOFT, 1.5),
        ...rect([0, 0], [6, 22], 2, NAVY, GOLD_SOFT, 1.5),
        ...rect([14, 0], [6, 22], 2, NAVY, GOLD_SOFT, 1.5),
      ], [32, 30, 0], [96, 96, 100]),
      makeLayer('bank top', rect([0, 0], [48, 8], 2, GOLD_SOFT, CREAM, 2), [32, 17, 0], [105, 105, 100]),
    ]),
  },
  {
    q: "How are worker fees recorded?",
    a: "Your 10-15% worker fee is recorded after a gig is successfully completed and verified. The fee is handled as part of the funded gig record, not through a platform balance.",
    lottie: makeLottie('Worker fee record', [
      makeLayer('fee record', rect([0, 4], [42, 28], 5, NAVY, GOLD_SOFT, 2.5), [30, 34, 0], [100, 100, 100]),
      makeLayer('record marker', ellipse([8, 8], GOLD, CREAM, 1.5), [43, 35, 0], [110, 110, 100]),
      makeLayer('fee marker', ellipse([20, 20], GOLD_SOFT, CREAM, 2), [43, 20, 0], [100, 100, 100]),
    ]),
  },
];

export function LandingPage() {
  return (
    <div>
      <HeroSection />
      <TrustBar />
      <HowItWorks />
      <BadgeProgression />
      <Testimonials />

      {/* FAQ Preview */}
      <section className="py-20" style={{ background: '#0B132F' }}>
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-black mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#F1F0DA' }}>
              Frequently Asked Questions
            </h2>
            <p style={{ color: 'rgba(241,240,218,0.5)', fontSize: 15 }}>Everything you need to know about working with PayBridge.</p>
          </div>
          <div className="space-y-4 mb-10">
            {FAQ_PREVIEW.map((faq, i) => (
              <div key={i} className="flex gap-5 p-6 transition-colors duration-150 items-start" style={{ background: '#0D1632', border: '1px solid rgba(241,240,218,0.09)', borderRadius: 6 }}>
                <div className="w-16 h-16 flex-shrink-0 flex items-center justify-center rounded-2xl" style={{ background: 'rgba(201,168,76,0.05)', border: '1px solid rgba(201,168,76,0.1)' }}>
                  <DotLottieReact data={faq.lottie} loop autoplay className="w-10 h-10" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-2 mt-1" style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#F1F0DA' }}>{faq.q}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'rgba(241,240,218,0.5)' }}>{faq.a}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center">
            <Link to="/faq">
              <button className="btn-secondary px-8 py-3.5 text-sm">View All FAQs <ArrowRight size={14} className="inline ml-2" /></button>
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24">
        <div className="max-w-3xl mx-auto text-center px-6">
          <div className="glass rounded-3xl p-12 relative overflow-hidden border-glow">
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: 'radial-gradient(circle at 50% 50%, rgba(201,168,76,0.15) 0%, transparent 70%)' }} />
            <h2 className="text-3xl md:text-4xl font-black text-cream mb-4 relative z-10">
              Ready to Start Earning?
            </h2>
            <p className="text-cream/50 text-lg mb-8 relative z-10">
              Join our network of verified workers. The application takes less than 20 minutes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10">
              <Link to="/apply">
                <button className="btn-primary text-base px-8 py-4">
                  Start Your Application <ArrowRight size={18} />
                </button>
              </Link>
              <Link to="/faq">
                <button className="btn-secondary text-base px-8 py-4">Read the FAQ</button>
              </Link>
            </div>
            <p className="text-xs text-cream/50 mt-6 relative z-10">
              No fees to apply. Workers are independent contractors (1099-NEC).
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
