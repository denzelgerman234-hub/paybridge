import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

const variants = {
  primary:   'btn-primary',
  secondary: 'btn-secondary',
  ghost:     'btn-ghost',
  danger:    'btn-danger',
  outline:   'inline-flex items-center justify-center gap-2 px-5 py-2.5 font-display font-bold text-xs tracking-widest uppercase text-cream border border-cream/20 hover:border-gold hover:text-gold transition-all duration-150 rounded',
};

const sizes = {
  sm: '!px-3 !py-1.5 !text-[10px]',
  md: '',
  lg: '!px-8 !py-3 !text-sm',
};

export function Button({ variant = 'primary', size = 'md', loading, icon, children, className, disabled, ...props }: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={cn(variants[variant], sizes[size], (disabled || loading) && 'opacity-50 cursor-not-allowed pointer-events-none', className)}
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : icon}
      {children}
    </button>
  );
}
