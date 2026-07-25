import { Outlet, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { PBNav, PBMark } from '../brand/Logo';
import { PLATFORM_FINCEN } from '../../lib/constants';
import { useAuth } from '../../hooks/useAuth';
import { useSmartBack } from '../../hooks/useSmartBack';

const NAV_BG    = '#0D1632';
const BORDER    = 'rgba(241,240,218,0.08)';
const CREAM     = '#F1F0DA';
const CREAM_DIM = 'rgba(241,240,218,0.45)';

const navLink = `text-xs font-semibold uppercase tracking-widest transition-colors duration-150 hover:text-cream`;

export function PublicLayout() {
  const { isAuthenticated } = useAuth();
  const goBack = useSmartBack('/dashboard');

  return (
    <div className="min-h-screen" style={{ background: '#0B132F' }}>
      {/* Header — flat, no blur */}
      <header
        className="fixed top-0 left-0 right-0 z-40 border-b"
        style={{ background: NAV_BG, borderColor: BORDER }}
      >
        <div className="max-w-7xl mx-auto px-5 h-14 flex items-center justify-between">
          <Link to={isAuthenticated ? "/dashboard" : "/"}>
            <PBNav color={CREAM} />
          </Link>

          <nav className="hidden md:flex items-center gap-6" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            {[
              { to: '/faq',              label: 'FAQ' },
              { to: '/training-preview', label: 'Training' },
              { to: '/contact',          label: 'Contact' },
            ].map(({ to, label }) => (
              <Link key={to} to={to} className={navLink} style={{ color: CREAM_DIM, fontFamily: 'inherit' }}>
                {label}
              </Link>
            ))}
            
            {isAuthenticated ? (
              <button onClick={goBack} className="btn-primary flex items-center gap-1.5">
                <ArrowLeft size={16} /> Back
              </button>
            ) : (
              <>
                <Link to="/login" className={navLink} style={{ color: CREAM_DIM, fontFamily: 'inherit' }}>
                  Log In
                </Link>
                <Link to="/apply">
                  <button className="btn-primary">Apply Now</button>
                </Link>
              </>
            )}
          </nav>

          {/* Mobile */}
          <div className="flex md:hidden items-center gap-3">
            {isAuthenticated ? (
              <button onClick={goBack} className="btn-primary px-3 py-1.5 text-xs flex items-center gap-1.5">
                <ArrowLeft size={14} /> Back
              </button>
            ) : (
              <>
                <Link to="/login" className="text-xs font-semibold uppercase tracking-widest" style={{ color: CREAM_DIM, fontFamily: "'Space Grotesk', sans-serif" }}>
                  Log In
                </Link>
                <Link to="/apply">
                  <button className="btn-primary">Apply</button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="pt-14">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t mt-16" style={{ borderColor: BORDER }}>
        <div className="max-w-7xl mx-auto px-5 py-10">
          <div className="flex flex-col md:flex-row justify-between gap-8">
            {/* Brand */}
            <div>
              <PBMark size={28} color={CREAM} />
              <p className="mt-3 text-xs" style={{ color: CREAM_DIM, maxWidth: 240 }}>
                Move Money Safely — FinCEN-registered MSB.<br />
                {PLATFORM_FINCEN}
              </p>
              <p className="mt-2 text-xs" style={{ color: 'rgba(241,240,218,0.25)' }}>
                © 2026 PayBridge LLC. All rights reserved.
              </p>
            </div>

            {/* Links */}
            <div
              className="flex flex-wrap gap-x-8 gap-y-3 text-xs font-semibold uppercase tracking-widest"
              style={{ fontFamily: "'Space Grotesk', sans-serif", color: CREAM_DIM }}
            >
              {[
                ['/terms',           'Terms'],
                ['/privacy',         'Privacy'],
                ['/code-of-conduct', 'Code of Conduct'],
                ['/faq',             'FAQ'],
                ['/contact',         'Contact'],
              ].map(([to, label]) => (
                <Link
                  key={to}
                  to={to}
                  className="hover:text-gold transition-colors"
                  style={{ color: 'inherit' }}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>

          {/* Bottom rule */}
          <div className="mt-8 pt-6 border-t flex items-center justify-between" style={{ borderColor: BORDER }}>
            <p className="text-xs" style={{ color: 'rgba(241,240,218,0.2)', fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '0.06em' }}>
              WORKERS NEVER FRONT THEIR OWN MONEY
            </p>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#7DC99A' }} />
              <span className="text-xs font-semibold" style={{ color: '#7DC99A', fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '0.06em' }}>
                LIVE
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
