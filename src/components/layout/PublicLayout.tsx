import { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { ArrowLeft, Menu, X } from 'lucide-react';
import { PBNav, PBMark } from '../brand/Logo';
import { PLATFORM_FINCEN } from '../../lib/constants';
import { useAuth } from '../../hooks/useAuth';
import { useSmartBack } from '../../hooks/useSmartBack';

const NAV_BG = '#0D1632';
const BORDER = 'rgba(241,240,218,0.08)';
const CREAM = '#F1F0DA';
const CREAM_DIM = 'rgba(241,240,218,0.45)';

const navLink = `text-xs font-semibold uppercase tracking-widest transition-colors duration-150 hover:text-cream`;

export function PublicLayout() {
  const { isAuthenticated } = useAuth();
  const goBack = useSmartBack('/dashboard');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const closeNav = () => setMobileNavOpen(false);

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
              { to: '/faq', label: 'FAQ' },
              { to: '/training-preview', label: 'Training' },
              { to: '/contact', label: 'Contact' },
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
            <button
              onClick={() => setMobileNavOpen(true)}
              className="p-2 -mr-2 text-cream hover:bg-white/5 rounded-lg transition-colors"
            >
              <Menu size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Nav Drawer */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 flex justify-end md:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeNav} />
          <div className="relative w-64 h-full bg-[#0D1632] border-l border-white/10 shadow-2xl flex flex-col">
            <div className="h-14 flex items-center justify-end px-3 border-b border-white/5">
              <button onClick={closeNav} className="p-2 text-cream hover:bg-white/5 rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>
            <nav className="flex flex-col gap-1 p-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {[
                { to: '/', label: 'Home' },
                { to: '/terms', label: 'Terms' },
                { to: '/privacy', label: 'Privacy' },
                { to: '/code-of-conduct', label: 'Code of Conduct' },
                { to: '/faq', label: 'FAQ' },
                { to: '/contact', label: 'Contact' },
              ].map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={closeNav}
                  className="px-4 py-3 rounded-lg text-sm font-semibold uppercase tracking-widest text-cream/70 hover:text-cream hover:bg-white/5 transition-colors"
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}

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
              className="flex flex-col md:flex-row gap-x-8 gap-y-3 text-xs font-semibold uppercase tracking-widest"
              style={{ fontFamily: "'Space Grotesk', sans-serif", color: CREAM_DIM }}
            >
              <div className="flex flex-wrap gap-x-8 gap-y-3">
                <Link to="/terms" className="hover:text-gold transition-colors" style={{ color: 'inherit' }}>Terms</Link>
                <Link to="/privacy" className="hover:text-gold transition-colors" style={{ color: 'inherit' }}>Privacy</Link>
                <Link to="/code-of-conduct" className="hover:text-gold transition-colors" style={{ color: 'inherit' }}>Code of Conduct</Link>
              </div>
              <div className="flex flex-wrap gap-x-8 gap-y-3">
                <Link to="/faq" className="hover:text-gold transition-colors" style={{ color: 'inherit' }}>FAQ</Link>
                <Link to="/contact" className="hover:text-gold transition-colors" style={{ color: 'inherit' }}>Contact</Link>
              </div>
            </div>
          </div>

          {/* Bottom rule */}
          <div className="mt-8 pt-6 border-t flex flex-wrap md:flex-nowrap items-center justify-center md:justify-start gap-3 md:gap-4" style={{ borderColor: BORDER }}>
            <img src="/images/compliance/fincen-user.png" alt="FinCEN Registered" className="h-7 object-contain" title="FinCEN Registered Money Services Business" />
            <img src="/images/compliance/ofac-user.png" alt="OFAC" className="h-7 object-contain" title="OFAC Compliant" />
            <img src="/images/compliance/nacha-user.png" alt="NACHA Compliant" className="h-5 object-contain" title="NACHA — ACH Compliant" />
            <img src="/images/compliance/pcidss-user.png" alt="PCI DSS" className="h-6 object-contain" title="PCI DSS Compliant" />
            <img src="/images/compliance/soc2-user.png" alt="SOC 2" className="h-7 object-contain" title="SOC 2 Certified" />
            <img src="/images/compliance/iso27001-user.png" alt="ISO 27001" className="h-7 object-contain" title="ISO 27001 Certified" />
            <img src="/images/compliance/bbb-user.png" alt="BBB Accredited" className="h-6 object-contain" title="Better Business Bureau Accredited" />
          </div>
        </div>
      </footer>
    </div>
  );
}
