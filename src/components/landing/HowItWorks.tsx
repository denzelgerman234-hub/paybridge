import { RiUserAddLine, RiBankLine, RiMoneyDollarCircleLine, RiSendPlaneLine, RiCoinLine } from 'react-icons/ri';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

const CREAM  = '#F1F0DA';
const DIM    = 'rgba(241,240,218,0.5)';
const GOLD   = '#C9A84C';
const BORDER = 'rgba(241,240,218,0.09)';
const NAVY9  = '#0D1632';

const steps = [
  {
    lottie: "https://lottie.host/128710d4-3833-4010-a2a5-c7cfe0356164/0DKeS32Dv4.json",
    n: '01',
    title: 'Apply & Verify',
    desc: 'Submit your info, complete manual identity review, and finish our 15-minute training course.',
  },
  {
    lottie: "https://lottie.host/1fb3f8af-44f9-4964-b250-49e5103784f6/se6mJF8TtP.json",
    n: '02',
    title: 'Connect Your Dedicated Account',
    desc: 'Link a bank account at one of 29 partner institutions. Used exclusively for authorized disbursements.',
  },
  {
    lottie: "https://lottie.host/68bcd595-ad64-4c45-9931-e3abbd2a8c28/2OfYTyNmeY.json",
    n: '03',
    title: 'Get Funded',
    desc: 'After Operations accepts your application, PayBridge deposits the full principal into your dedicated account BEFORE you send a dollar.',
  },
  {
    lottie: "https://lottie.host/9aed556b-774e-4f0b-a615-94124a90ad29/FAEw3e9gHn.json",
    n: '04',
    title: 'Execute & Verify',
    desc: 'Send funds to recipients from the pre-deposited principal. Upload proof. We verify. Gig complete.',
  },
  {
    lottie: "https://lottie.host/8e0174c0-9c0d-494a-9e3f-94423f8cc0bd/ehbiHNN5r0.json",
    n: '05',
    title: 'Record Your Worker Fee',
    desc: 'Your 10-15% worker fee is recorded after Operations verifies the completed gig.',
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 max-w-7xl mx-auto px-5">
      <div className="text-center mb-14">
        <p className="section-label mb-3">Process</p>
        <h2 className="text-3xl md:text-5xl font-black mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif", color: CREAM }}>
          How It Works
        </h2>
        <p style={{ color: DIM, fontSize: 15 }}>A transparent, pre-funded process designed to protect you.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
        <div className="flex justify-center relative">
          <img src="/images/network.png" alt="Secure Network Flow" className="w-full max-w-[20rem] sm:max-w-sm lg:max-w-lg hover:scale-105 transition-transform duration-500 drop-shadow-2xl" />
        </div>
        <div className="relative">
        {/* Gold vertical connector — desktop only */}
        <div
          className="absolute hidden md:block"
          style={{ left: 20, top: 32, bottom: 32, width: 1, background: `linear-gradient(to bottom, transparent, ${GOLD}40, transparent)` }}
        />

        <div className="space-y-4">
          {steps.map(({ n, title, desc, lottie }, i) => (
            <div key={n} className="flex items-start gap-5 group">
              {/* Step number + icon */}
              <div className="flex-shrink-0 flex flex-col items-center gap-2" style={{ minWidth: 40 }}>
                <div
                  className="w-10 h-10 flex items-center justify-center flex-shrink-0 transition-colors duration-150 overflow-hidden"
                  style={{
                    background: 'rgba(201,168,76,0.1)',
                    border: `1px solid rgba(201,168,76,0.25)`,
                    borderRadius: 4,
                  }}
                >
                  <DotLottieReact src={lottie} loop autoplay className={`opacity-90 mix-blend-screen ${i === 0 || i === 3 ? 'w-10 h-10 scale-125' : 'w-8 h-8'}`} style={{ filter: 'brightness(1.5) sepia(1) hue-rotate(5deg) saturate(1.5)' }} />
                </div>
              </div>

              {/* Content */}
              <div
                className="flex-1 p-5 transition-colors duration-150"
                style={{ background: NAVY9, border: `1px solid ${BORDER}`, borderRadius: 6 }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(201,168,76,0.25)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = BORDER)}
              >
                <div className="flex items-start gap-3">
                  <span
                    className="text-xs font-black flex-shrink-0 mt-0.5"
                    style={{ fontFamily: "'Space Grotesk', sans-serif", color: 'rgba(201,168,76,0.5)', letterSpacing: '0.06em' }}
                  >
                    {n}
                  </span>
                  <div>
                    <h3 className="font-bold text-sm mb-1.5" style={{ fontFamily: "'Space Grotesk', sans-serif", color: CREAM }}>{title}</h3>
                    <p className="text-xs leading-relaxed" style={{ color: DIM }}>{desc}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        </div>
      </div>
    </section>
  );
}


