import { Outlet, Link } from 'react-router-dom';
import { PBLogo } from '../brand/Logo';

export function AuthLayout() {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: '#0B132F' }}
    >
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.4), transparent)' }}
      />

      <div className="w-full max-w-sm animate-fade-in">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <PBLogo size={30} />
          </Link>
          <p
            className="mt-2 text-xs tracking-widest uppercase"
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              color: 'rgba(241,240,218,0.3)',
              letterSpacing: '0.14em',
            }}
          >
            Move Money Safely
          </p>
        </div>

        <Outlet />

        <p className="text-center mt-6 text-xs" style={{ color: 'rgba(241,240,218,0.3)' }}>
          {/* Always navigate to the public landing page — never navigate(-1) */}
          <Link
            to="/"
            className="hover:text-cream transition-colors"
            style={{ color: 'inherit' }}
          >
            Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
