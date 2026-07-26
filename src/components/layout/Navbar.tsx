import { useEffect, useState } from 'react';
import { Link, useLocation, NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../hooks/useNotifications';
import { BadgeIcon } from '../ui/Badge';
import { PBNav } from '../brand/Logo';
import { formatRelativeTime } from '../../lib/utils';
import {
  LayoutDashboard, Briefcase, Archive, Award, BookOpen,
  Activity, Settings, HelpCircle, Bell, User, LogOut,
  ChevronDown, Menu, X, Shield, CheckCheck, Inbox, Circle,
} from 'lucide-react';

const navItems = [
  { to: '/dashboard',      icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/gigs',           icon: Briefcase,        label: 'Gigs' },
  { to: '/records',        icon: Archive,          label: 'Records' },
  { to: '/badges',         icon: Award,            label: 'Badges' },
  { to: '/training',       icon: BookOpen,         label: 'Training' },
  { to: '/activity',       icon: Activity,         label: 'Activity' },
  { to: '/account',        icon: Settings,         label: 'Account' },
  { to: '/support',        icon: HelpCircle,       label: 'Support' },
];

const NAV_BG    = '#0D1632';
const BORDER    = 'rgba(241,240,218,0.08)';
const CREAM     = '#F1F0DA';
const CREAM_DIM = 'rgba(241,240,218,0.45)';
const GOLD      = '#C9A84C';
const NAVY8     = '#12203F';
const TERRA     = '#C8523D';
const SAGE      = '#7DC99A';

export function Navbar() {
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications(profile?.id);
  const [showProfile, setShowProfile] = useState(false);
  const [showMobile, setShowMobile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    setShowProfile(false);
    setShowMobile(false);
    setShowNotifications(false);
  }, [location.pathname]);

  const isPublic = ['/', '/apply', '/faq', '/training-preview', '/contact', '/terms', '/privacy', '/code-of-conduct'].some(
    p => location.pathname === p,
  );
  if (isPublic) return null;

  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 z-40 border-b"
        style={{ background: NAV_BG, borderColor: BORDER }}
      >
        <div className="max-w-7xl mx-auto px-5">
          <div className="flex items-center justify-between h-14">
            <Link to="/dashboard">
              <PBNav color={CREAM} />
            </Link>

            <div className="hidden lg:flex items-center">
              {navItems.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold tracking-wider uppercase transition-colors duration-150 ${
                      isActive
                        ? 'text-gold border-b-2 border-gold'
                        : 'text-cream-dim hover:text-cream border-b-2 border-transparent'
                    }`
                  }
                  style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
                >
                  <Icon size={13} strokeWidth={2} />
                  {label}
                </NavLink>
              ))}
            </div>

            <div className="flex items-center gap-1">
              <div className="relative">
                <button
                  type="button"
                  aria-label="Notifications"
                  aria-expanded={showNotifications}
                  onClick={() => {
                    setShowNotifications(value => !value);
                    setShowProfile(false);
                  }}
                  className="relative p-2 rounded transition-colors duration-150"
                  style={{ color: showNotifications ? CREAM : CREAM_DIM, background: showNotifications ? 'rgba(241,240,218,0.05)' : 'transparent' }}
                  onMouseEnter={e => (e.currentTarget.style.color = CREAM)}
                  onMouseLeave={e => (e.currentTarget.style.color = showNotifications ? CREAM : CREAM_DIM)}
                >
                  <Bell size={16} strokeWidth={1.5} />
                  {unreadCount > 0 && (
                    <span
                      className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 flex items-center justify-center rounded-sm text-[9px] font-bold"
                      style={{ background: TERRA, color: CREAM, fontFamily: "'Space Grotesk', sans-serif" }}
                    >
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowNotifications(false)} />
                    <div
                      className="fixed left-4 right-4 top-16 z-20 mt-0 w-auto overflow-hidden animate-slide-up sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:mt-1 sm:w-96 sm:max-w-[calc(100vw-2rem)]"
                      style={{ background: NAV_BG, border: `1px solid ${BORDER}`, borderRadius: 6, boxShadow: '0 20px 60px rgba(0,0,0,0.45)' }}
                    >
                      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b" style={{ borderColor: BORDER }}>
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: CREAM, fontFamily: "'Space Grotesk', sans-serif" }}>Notifications</p>
                          <p className="text-[11px]" style={{ color: CREAM_DIM }}>{unreadCount} unread</p>
                        </div>
                        <button
                          type="button"
                          className="btn-ghost !px-2 !py-1 text-[11px]"
                          disabled={unreadCount === 0}
                          onClick={markAllRead}
                        >
                          <CheckCheck size={13} /> Mark read
                        </button>
                      </div>

                      {notifications.length === 0 ? (
                        <div className="px-5 py-8 text-center">
                          <Inbox size={28} strokeWidth={1.5} style={{ color: 'rgba(201,168,76,0.35)', margin: '0 auto 10px' }} />
                          <p className="text-sm font-bold" style={{ color: CREAM, fontFamily: "'Space Grotesk', sans-serif" }}>No notifications yet</p>
                          <p className="text-xs mt-1" style={{ color: CREAM_DIM }}>Gig updates and Operations alerts will appear here.</p>
                        </div>
                      ) : (
                        <div className="max-h-96 overflow-y-auto py-1">
                          {notifications.slice(0, 8).map(notification => (
                            <Link
                              key={notification.id}
                              to={notification.href || '/activity'}
                              onClick={() => {
                                markRead(notification.id);
                                setShowNotifications(false);
                              }}
                              className="flex gap-3 px-4 py-3 transition-colors"
                              style={{ background: notification.read ? 'transparent' : 'rgba(201,168,76,0.06)' }}
                              onMouseEnter={e => (e.currentTarget.style.background = NAVY8)}
                              onMouseLeave={e => (e.currentTarget.style.background = notification.read ? 'transparent' : 'rgba(201,168,76,0.06)')}
                            >
                              <span
                                className="mt-1 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-sm"
                                style={{ background: notification.read ? 'rgba(241,240,218,0.05)' : 'rgba(201,168,76,0.14)' }}
                              >
                                {notification.read ? <Bell size={13} color={CREAM_DIM} /> : <Circle size={8} fill={SAGE} color={SAGE} />}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="flex items-start justify-between gap-3">
                                  <span className="text-xs font-bold leading-snug" style={{ color: CREAM, fontFamily: "'Space Grotesk', sans-serif" }}>{notification.title}</span>
                                  <span className="text-[10px] flex-shrink-0" style={{ color: CREAM_DIM }}>{formatRelativeTime(notification.created_at)}</span>
                                </span>
                                <span className="mt-1 block text-xs leading-snug" style={{ color: CREAM_DIM }}>{notification.body}</span>
                              </span>
                            </Link>
                          ))}
                        </div>
                      )}

                      <div className="border-t px-4 py-2" style={{ borderColor: BORDER }}>
                        <Link
                          to="/activity"
                          onClick={() => setShowNotifications(false)}
                          className="flex items-center justify-center gap-2 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors"
                          style={{ color: GOLD, fontFamily: "'Space Grotesk', sans-serif" }}
                        >
                          <Activity size={13} /> View activity
                        </Link>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="relative">
                <button
                  onClick={() => {
                    setShowProfile(!showProfile);
                    setShowNotifications(false);
                  }}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded transition-colors duration-150"
                  style={{ color: CREAM_DIM }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(241,240,218,0.05)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="Profile" className="w-7 h-7 rounded-sm object-cover flex-shrink-0" />
                  ) : (
                    <div
                      className="w-7 h-7 flex items-center justify-center text-xs font-bold rounded-sm flex-shrink-0"
                      style={{
                        background: GOLD,
                        color: '#0B132F',
                        fontFamily: "'Space Grotesk', system-ui, sans-serif",
                        letterSpacing: '0.05em',
                      }}
                    >
                      {profile?.full_name?.[0] ?? 'W'}
                    </div>
                  )}
                  <div className="hidden sm:block text-left">
                    <p className="text-xs font-semibold leading-tight" style={{ color: CREAM, fontFamily: "'Space Grotesk', sans-serif" }}>
                      {profile?.full_name ?? 'Worker'}
                    </p>
                    {profile?.badge && <BadgeIcon tier={profile.badge} size="xs" showLabel={false} naked />}
                  </div>
                  <ChevronDown size={12} />
                </button>

                {showProfile && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowProfile(false)} />
                    <div
                      className="absolute right-0 mt-1 w-52 z-20 py-1"
                      style={{ background: '#0D1632', border: `1px solid ${BORDER}`, borderRadius: 6 }}
                    >
                      <div className="px-4 py-3 border-b" style={{ borderColor: BORDER }}>
                        <p className="text-xs font-bold" style={{ color: CREAM, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '0.04em' }}>
                          {profile?.full_name}
                        </p>
                        {profile?.badge && <div className="mt-1.5"><BadgeIcon tier={profile.badge} size="xs" naked /></div>}
                      </div>
                      {[
                        { to: '/account', icon: User,   label: 'Account' },
                        { to: '/records', icon: Archive, label: 'Records' },
                        { to: '/account', icon: Shield, label: 'Security' },
                      ].map(item => (
                        <Link
                          key={item.label}
                          to={item.to}
                          onClick={() => setShowProfile(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-xs transition-colors"
                          style={{ color: CREAM_DIM, fontFamily: "'Space Grotesk', sans-serif" }}
                          onMouseEnter={e => { e.currentTarget.style.color = CREAM; e.currentTarget.style.background = 'rgba(241,240,218,0.04)'; }}
                          onMouseLeave={e => { e.currentTarget.style.color = CREAM_DIM; e.currentTarget.style.background = 'transparent'; }}
                        >
                          <item.icon size={13} strokeWidth={1.5} /> {item.label}
                        </Link>
                      ))}
                      <div className="my-1" style={{ height: 1, background: BORDER }} />
                      <button
                        onClick={() => { setShowProfile(false); signOut(); }}
                        className="flex w-full items-center gap-2.5 px-4 py-2.5 text-xs transition-colors"
                        style={{ color: TERRA, fontFamily: "'Space Grotesk', sans-serif" }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(200,82,61,0.08)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <LogOut size={13} strokeWidth={1.5} /> Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>

              <button
                aria-label={showMobile ? 'Close navigation menu' : 'Open navigation menu'}
                className="lg:hidden flex h-11 w-11 items-center justify-center rounded border transition-colors"
                style={{
                  color: showMobile ? GOLD : CREAM,
                  background: showMobile ? 'rgba(201,168,76,0.12)' : 'rgba(241,240,218,0.07)',
                  borderColor: showMobile ? 'rgba(201,168,76,0.35)' : 'rgba(241,240,218,0.14)',
                }}
                onClick={() => setShowMobile(!showMobile)}
              >
                {showMobile ? <X size={24} strokeWidth={2.2} /> : <Menu size={24} strokeWidth={2.2} />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {showMobile && (
        <>
          <div className="fixed inset-0 z-30 bg-black/60" onClick={() => setShowMobile(false)} />
          <div
            className="fixed top-14 left-0 right-0 z-30 max-h-[calc(100dvh-3.5rem)] overflow-y-auto border-b py-2"
            style={{ background: '#0D1632', borderColor: BORDER }}
          >
            {navItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setShowMobile(false)}
                className={({ isActive }) =>
                  `flex min-h-12 items-center gap-3 px-5 py-3 text-sm font-semibold uppercase tracking-wider transition-colors ${
                    isActive ? 'text-gold border-l-2 border-gold bg-gold/5' : 'border-l-2 border-transparent'
                  }`
                }
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  color: undefined,
                }}
              >
                <Icon size={17} strokeWidth={1.7} /> {label}
              </NavLink>
            ))}
          </div>
        </>
      )}
    </>
  );
}
