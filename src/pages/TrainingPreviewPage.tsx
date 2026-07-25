import { TRAINING_MODULES, DISBURSEMENT_METHODS } from '../lib/constants';
import { Link } from 'react-router-dom';
import { RiTimeLine, RiArrowRightLine, RiCloseLine, RiBookOpenLine } from 'react-icons/ri';

const CREAM  = '#F1F0DA';
const DIM    = 'rgba(241,240,218,0.45)';
const GOLD   = '#C9A84C';
const TERRA  = '#C8523D';
const BORDER = 'rgba(241,240,218,0.09)';
const NAVY9  = '#0D1632';
const NAVY8  = '#12203F';

export function TrainingPreviewPage() {
  return (
    <div className="max-w-4xl mx-auto px-5 py-20">
      <div className="text-center mb-14">
        <p className="section-label mb-3">Curriculum</p>
        <h1 className="text-4xl md:text-5xl font-black mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif", color: CREAM }}>
          What You'll Learn
        </h1>
        <p className="text-base max-w-xl mx-auto" style={{ color: DIM, lineHeight: 1.7 }}>
          Our 4-module training takes ~15 minutes and prepares you to execute compliant, verified disbursements.
        </p>
      </div>

      {/* Modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-14">
        {TRAINING_MODULES.map((mod, i) => (
          <div
            key={mod.id}
            className="p-5 transition-colors duration-150"
            style={{ background: NAVY9, border: `1px solid ${BORDER}`, borderRadius: 6 }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(201,168,76,0.3)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = BORDER)}
          >
            <div className="flex items-start gap-4">
              <div
                className="w-10 h-10 flex items-center justify-center font-black text-sm flex-shrink-0"
                style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.25)', borderRadius: 4, color: GOLD, fontFamily: "'Space Grotesk', sans-serif" }}
              >
                0{i + 1}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif", color: CREAM }}>{mod.title}</h3>
                  <span className="flex items-center gap-1 text-xs" style={{ color: DIM }}>
                    <RiTimeLine style={{ fontSize: 11 }} /> {mod.duration}
                  </span>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: DIM }}>{mod.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Disbursement methods */}
      <div className="mb-14">
        <h2 className="text-xl font-black mb-6 text-center" style={{ fontFamily: "'Space Grotesk', sans-serif", color: CREAM }}>
          Disbursement Methods Supported
        </h2>
        <div className="flex flex-wrap gap-2 justify-center">
          {DISBURSEMENT_METHODS.map(m => (
            <div
              key={m.id}
              className="px-4 py-2 text-xs font-semibold"
              style={{ background: NAVY8, border: `1px solid ${BORDER}`, borderRadius: 3, color: DIM, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '0.04em' }}
            >
              {m.label}
            </div>
          ))}
        </div>
      </div>

      {/* What you won't do — compliance box */}
      <div
        className="p-6 mb-10"
        style={{ background: NAVY9, border: `1px solid rgba(200,82,61,0.25)`, borderLeft: `3px solid ${TERRA}`, borderRadius: 6 }}
      >
        <div className="flex items-center gap-2 mb-4">
          <RiBookOpenLine style={{ color: TERRA, fontSize: 16 }} />
          <h2 className="font-bold text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif", color: CREAM }}>
            What PayBridge Workers Never Do
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {[
            'Use personal funds for disbursements',
            'Accept payments directly from recipients',
            'Disburse before principal is confirmed',
            'Mix personal and disbursement accounts',
            'Act on unverified instructions',
            'Work outside the platform dashboard',
          ].map(item => (
            <div key={item} className="flex items-center gap-2.5 text-xs" style={{ color: DIM }}>
              <RiCloseLine style={{ color: TERRA, fontSize: 14, flexShrink: 0 }} /> {item}
            </div>
          ))}
        </div>
      </div>

      <div className="text-center">
        <Link to="/apply">
          <button className="btn-primary flex items-center gap-2 mx-auto !px-8 !py-3.5 !text-sm">
            Apply Now — It's Free <RiArrowRightLine style={{ fontSize: 15 }} />
          </button>
        </Link>
      </div>
    </div>
  );
}
