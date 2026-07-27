import { useEffect, useState } from 'react';
import { RiShieldLine, RiMailLine, RiLockLine, RiEyeLine, RiEyeOffLine } from 'react-icons/ri';
import { useNavigate } from 'react-router-dom';
import { useAdminStore } from '../../stores/adminStore';
import { PBLogo, PBMark } from '../../components/brand/Logo';


const CREAM = '#F1F0DA';
const DIM   = 'rgba(241,240,218,0.45)';
const GOLD  = '#C9A84C';

export function AdminLogin() {
  const { adminLogin, initAdminSession, isAdminAuth } = useAdminStore();
  const navigate = useNavigate();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    initAdminSession();
  }, [initAdminSession]);

  useEffect(() => {
    if (isAdminAuth) navigate('/admin');
  }, [isAdminAuth, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await adminLogin(email, password);
      navigate('/admin');
    } catch (err) {
      const message = err instanceof Error && err.message === 'Admin access required'
        ? 'This account is not authorized for admin access.'
        : 'Invalid admin credentials';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: DIM,
    marginBottom: 6,
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#0B132F' }}>
      {/* Top gold rule */}
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)` }} />

      <div className="w-full max-w-sm animate-fade-in">
        {/* Logo + title */}
        <div className="text-center mb-8">
          <PBMark size={36} color={CREAM} />
          <h1
            className="mt-4 text-xl font-black"
            style={{ fontFamily: "'Space Grotesk', sans-serif", color: CREAM, letterSpacing: '0.04em' }}
          >
            PAYBRIDGE ADMIN
          </h1>
          <div className="flex items-center justify-center gap-2 mt-2">
            <RiShieldLine size={11} style={{ color: '#C8523D' }} />
            <p className="text-xs" style={{ color: DIM, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '0.08em' }}>
              RESTRICTED ACCESS
            </p>
          </div>
        </div>

        {/* Form card */}
        <div
          className="p-6"
          style={{ background: '#0D1632', border: '1px solid rgba(241,240,218,0.09)', borderRadius: 6 }}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label style={labelStyle}>Admin Email</label>
              <div className="relative">
                <RiMailLine size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: DIM }} strokeWidth={1.5} />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@paybridge.work"
                  className="input-dark pl-9"
                  required
                />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Password</label>
              <div className="relative">
                <RiLockLine size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: DIM }} strokeWidth={1.5} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="********"
                  className="input-dark pl-9 pr-12"
                  required
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  title={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword(prev => !prev)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: DIM }}
                >
                  {showPassword ? <RiEyeOffLine size={17} /> : <RiEyeLine size={17} />}
                </button>
              </div>
            </div>

            {error && (
              <div
                className="text-xs text-center p-3 rounded"
                style={{ background: 'rgba(200,82,61,0.08)', border: '1px solid rgba(200,82,61,0.2)', color: '#C8523D', fontFamily: "'Space Grotesk', sans-serif" }}
              >
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-3.5 h-3.5 rounded-sm border-2 animate-spin" style={{ borderColor: '#0B132F33', borderTopColor: '#0B132F' }} />
                  Authenticating...
                </span>
              ) : 'Sign In to Admin'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

