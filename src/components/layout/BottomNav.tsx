import { NavLink } from 'react-router-dom';
import { Home, Briefcase, Archive, Award, User } from 'lucide-react';
import { cn } from '../../lib/utils';

const items = [
  { to: '/dashboard', icon: Home, label: 'Home' },
  { to: '/gigs/available', icon: Briefcase, label: 'Gigs' },
  { to: '/records', icon: Archive, label: 'Records' },
  { to: '/badges', icon: Award, label: 'Badges' },
  { to: '/account', icon: User, label: 'Account' },
];

export function BottomNav() {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
      <div className="flex items-center justify-around h-16">
        {items.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn('flex flex-col items-center gap-0.5 px-3 py-1 text-xs transition-colors', isActive ? 'text-primary-600' : 'text-gray-500 hover:text-gray-700')
            }
          >
            <Icon size={20} />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

