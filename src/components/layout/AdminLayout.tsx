import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAdminStore } from '../../stores/adminStore';
import { PBNav, PBMark } from '../brand/Logo';
import {
  LayoutDashboard, Users, Briefcase, DollarSign, Shield,
  Activity, FileText, LogOut, Menu, Bell, CheckCheck, Inbox, Circle, MessageSquare, X, Calendar
} from 'lucide-react';
import { useAdminNotifications } from '../../hooks/useAdminNotifications';
import { Link } from 'react-router-dom';

const navItems = [
  { to: '/admin',               icon: LayoutDashboard, label: 'Overview',     exact: true },
  { to: '/admin/applications',  icon: FileText,        label: 'Applications' },
  { to: '/admin/interviews',    icon: Calendar,        label: 'Interviews' },
  { to: '/admin/workers',       icon: Users,           label: 'Workers' },
  { to: '/admin/gigs',          icon: Briefcase,       label: 'Gigs' },
  { to: '/admin/disbursements', icon: DollarSign,      label: 'Disbursements' },
  { to: '/admin/inbox',         icon: Inbox,           label: 'Inbox' },
  { to: '/admin/operations',    icon: MessageSquare,   label: 'Operations' },
  { to: '/admin/commissions',   icon: Activity,        label: 'Worker Fees' },
  { to: '/admin/compliance',    icon: Shield,          label: 'Compliance' },
];

const BG      = '#0D1632';
const BG_DARK = '#0B132F';
const BORDER  = 'rgba(241,240,218,0.08)';
const CREAM   = '#F1F0DA';
const DIM     = 'rgba(241,240,218,0.45)';
const GOLD    = '#C9A84C';

export function AdminLayout() {
  const { adminUser, adminLogout } = useAdminStore();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  
  const { notifications, unreadCount, markRead, markAllRead } = useAdminNotifications();

  function handleLogout() {
    adminLogout();
    navigate('/admin/login');
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full" style={{ background: BG }}>
      {/* Logo */}
      <div className="px-5 py-4 border-b" style={{ borderColor: BORDER }}>
        <PBNav color={CREAM} />
        <div
          className="mt-2 text-xs font-bold uppercase tracking-widest"
          style={{ color: GOLD, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '0.12em' }}
        >
          Admin Console
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {navItems.map(({ to, icon: Icon, label, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors duration-100 border-l-2 ${
                isActive
                  ? 'border-gold bg-gold/8 text-gold'
                  : 'border-transparent text-cream-dim hover:text-cream hover:bg-cream/4'
              }`
            }
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            <Icon size={14} strokeWidth={1.5} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="p-4 border-t" style={{ borderColor: BORDER }}>
        <div
          className="flex items-center gap-3 mb-3 p-2.5 rounded"
          style={{ background: 'rgba(241,240,218,0.04)' }}
        >
          <div
            className="w-7 h-7 rounded-sm flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{ background: GOLD, color: '#0B132F', fontFamily: "'Space Grotesk', sans-serif" }}
          >
            A
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold truncate" style={{ color: CREAM, fontFamily: "'Space Grotesk', sans-serif" }}>
              {adminUser?.name}
            </p>
            <p className="text-xs truncate" style={{ color: DIM }}>{adminUser?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-2 text-xs font-semibold uppercase tracking-wider rounded transition-colors"
          style={{ color: '#C8523D', fontFamily: "'Space Grotesk', sans-serif" }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(200,82,61,0.08)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <LogOut size={13} strokeWidth={1.5} /> Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex w-full max-w-full overflow-x-hidden" style={{ background: BG_DARK }}>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-56 border-r fixed left-0 top-0 bottom-0 z-30" style={{ borderColor: BORDER }}>
        <SidebarContent />
      </aside>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <>
          <div className="fixed inset-0 z-20 bg-black/70" onClick={() => setSidebarOpen(false)} />
          <div className="fixed inset-y-0 left-0 z-30 w-[min(19rem,86vw)] border-r shadow-2xl" style={{ borderColor: BORDER }}>
            <SidebarContent />
          </div>
        </>
      )}

      {/* Main */}
      <div className="flex-1 min-w-0 max-w-full lg:ml-56 flex flex-col min-h-screen overflow-x-hidden">
        {/* Top bar */}
        <header
          className="min-h-14 border-b flex items-center justify-between gap-3 px-3 sm:px-5 sticky top-0 z-10"
          style={{ background: BG, borderColor: BORDER }}
        >
          <button
            aria-label={sidebarOpen ? 'Close admin navigation menu' : 'Open admin navigation menu'}
            className="lg:hidden flex h-11 w-11 flex-shrink-0 items-center justify-center rounded border transition-colors"
            style={{
              color: sidebarOpen ? GOLD : CREAM,
              background: sidebarOpen ? 'rgba(201,168,76,0.12)' : 'rgba(241,240,218,0.07)',
              borderColor: sidebarOpen ? 'rgba(201,168,76,0.35)' : 'rgba(241,240,218,0.14)',
            }}
            onClick={() => setSidebarOpen(value => !value)}
          >
            {sidebarOpen ? <X size={24} strokeWidth={2.2} /> : <Menu size={24} strokeWidth={2.2} />}
          </button>
          <div className="min-w-0 flex-1" />
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <div
              className="hidden px-3 py-1 text-xs font-bold uppercase tracking-widest rounded-sm sm:block"
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                background: 'rgba(200,82,61,0.1)',
                border: '1px solid rgba(200,82,61,0.25)',
                color: '#C8523D',
              }}
            >
              Admin Mode
            </div>
            <div className="relative">
              <button 
                className="relative flex h-10 w-10 items-center justify-center rounded transition-colors"
                style={{ color: showNotifications ? CREAM : DIM, background: showNotifications ? 'rgba(241,240,218,0.08)' : 'transparent' }}
                onClick={() => setShowNotifications(!showNotifications)}
                onMouseEnter={e => {
                  if (!showNotifications) {
                    e.currentTarget.style.color = CREAM;
                    e.currentTarget.style.background = 'rgba(241,240,218,0.04)';
                  }
                }}
                onMouseLeave={e => {
                  if (!showNotifications) {
                    e.currentTarget.style.color = DIM;
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                <Bell size={18} strokeWidth={1.7} />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full border-2 border-[#0D1632]" style={{ background: '#C8523D' }} />
                )}
              </button>

              {showNotifications && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowNotifications(false)} />
                  <div
                    className="fixed left-3 right-3 top-16 z-20 overflow-hidden animate-slide-up shadow-2xl sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:mt-1 sm:w-96"
                    style={{ background: BG, border: `1px solid ${BORDER}`, borderRadius: 6 }}
                  >
                    <div className="flex items-center justify-between gap-3 px-4 py-3 border-b" style={{ borderColor: BORDER }}>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: CREAM, fontFamily: "'Space Grotesk', sans-serif" }}>Admin Alerts</p>
                        <p className="text-[11px]" style={{ color: DIM }}>{unreadCount} unread</p>
                      </div>
                      <button
                        type="button"
                        className="px-2 py-1 text-[11px] rounded transition-colors flex items-center gap-1.5 font-semibold"
                        style={{ color: unreadCount > 0 ? GOLD : DIM }}
                        disabled={unreadCount === 0}
                        onClick={markAllRead}
                      >
                        <CheckCheck size={13} /> Mark read
                      </button>
                    </div>

                    {notifications.length === 0 ? (
                      <div className="px-5 py-8 text-center">
                        <Inbox size={28} strokeWidth={1.5} style={{ color: 'rgba(201,168,76,0.35)', margin: '0 auto 10px' }} />
                        <p className="text-sm font-bold" style={{ color: CREAM, fontFamily: "'Space Grotesk', sans-serif" }}>No alerts</p>
                        <p className="text-xs mt-1" style={{ color: DIM }}>System and worker alerts will appear here.</p>
                      </div>
                    ) : (
                      <div className="max-h-96 overflow-y-auto py-1">
                        {notifications.slice(0, 10).map(notification => (
                          <Link
                            key={notification.id}
                            to={notification.href || '/admin'}
                            onClick={() => {
                              markRead(notification.id);
                              setShowNotifications(false);
                            }}
                            className="flex gap-3 px-4 py-3 transition-colors hover:bg-white/5"
                            style={{ background: notification.read ? 'transparent' : 'rgba(201,168,76,0.06)' }}
                          >
                            <span
                              className="mt-1 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-sm"
                              style={{ background: notification.read ? 'rgba(241,240,218,0.05)' : 'rgba(201,168,76,0.14)' }}
                            >
                              {notification.read ? <Bell size={13} color={DIM} /> : <Circle size={8} fill={GOLD} color={GOLD} />}
                            </span>
                            <span className="min-w-0 flex-1">
                              <p className="text-xs font-bold truncate mb-0.5" style={{ color: CREAM, fontFamily: "'Space Grotesk', sans-serif" }}>{notification.title}</p>
                              <p className="text-xs leading-relaxed" style={{ color: DIM }}>{notification.body}</p>
                            </span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 min-w-0 max-w-full overflow-x-hidden p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

