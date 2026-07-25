import { BadgeTier } from '../types/database';

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(date));
}

export function formatRelativeTime(date: string | Date): string {
  const now  = new Date();
  const then = new Date(date);
  const diffMs   = then.getTime() - now.getTime(); // future-positive
  const absDiffMs = Math.abs(diffMs);
  const diffMins  = Math.floor(absDiffMs / 60000);

  if (diffMins < 1)   return diffMs > 0 ? 'in seconds' : 'just now';
  if (diffMins < 60)  return diffMs > 0 ? `in ${diffMins}m` : `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return diffMs > 0 ? `in ${diffHours}h` : `${diffHours}h ago`;
  const diffDays  = Math.floor(diffHours / 24);
  if (diffDays  < 30) return diffMs > 0 ? `in ${diffDays}d` : `${diffDays}d ago`;
  return formatDate(date);
}

export function getBadgeColor(badge: BadgeTier): string {
  const colors: Record<BadgeTier, string> = {
    trainee:   'text-gray-400',
    associate: 'text-emerald-400',
    senior:    'text-blue-400',
    expert:    'text-amber-400',
    master:    'text-purple-400',
  };
  return colors[badge] || colors.trainee;
}

export function getBadgeRequirements(badge: BadgeTier): { gigs: number } {
  const reqs: Record<BadgeTier, { gigs: number }> = {
    trainee:   { gigs: 0 },
    associate: { gigs: 5 },
    senior:    { gigs: 25 },
    expert:    { gigs: 100 },
    master:    { gigs: 500 },
  };
  return reqs[badge] || reqs.trainee;
}

export function getNextBadge(current: BadgeTier): BadgeTier | null {
  const order: BadgeTier[] = ['trainee', 'associate', 'senior', 'expert', 'master'];
  const idx = order.indexOf(current);
  return idx < order.length - 1 ? order[idx + 1] : null;
}

/**
 * Returns a CSS class string for status badges.
 * These are supplementary — the CSS status-* classes in index.css are preferred.
 */
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending:            'status-pending',
    sent:               'status-accepted',
    verified:           'status-verified',
    failed:             'status-failed',
    open:               'status-open',
    accepted:           'status-accepted',
    funded:             'status-funded',
    in_progress:        'status-in_progress',
    completed:          'status-completed',
    cancelled:          'status-cancelled',
    earned:             'status-earned',
    settled:            'status-settled',
    pending_settlement: 'status-pending',
    withdrawn:          'status-settled',
    processing:         'status-funded',
    confirmed:          'status-verified',
  };
  return colors[status] || 'status-pending';
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
