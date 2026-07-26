import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '../../lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
  suffix?: React.ReactNode;
}

export function Input({ label, error, hint, icon, suffix, className, id, type, ...props }: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  const isPassword = type === 'password';
  const [showPassword, setShowPassword] = useState(false);
  const effectiveType = isPassword && showPassword ? 'text' : type;
  const trailingControl = isPassword || suffix;

  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="label-caps mb-1.5 block">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-cream/50">
            {icon}
          </div>
        )}
        <input
          id={inputId}
          type={effectiveType}
          {...props}
          className={cn(
            'input-dark',
            icon ? 'pl-10' : undefined,
            trailingControl ? 'pr-12' : undefined,
            error ? '!border-terra/60 focus:!border-terra' : undefined,
            className,
          )}
        />
        {isPassword && (
          <button
            type="button"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            title={showPassword ? 'Hide password' : 'Show password'}
            onClick={() => setShowPassword(prev => !prev)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-cream/50 hover:text-cream transition-colors"
          >
            {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        )}
        {!isPassword && suffix && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-cream/50 text-sm">
            {suffix}
          </div>
        )}
      </div>
      {error && <p className="text-xs" style={{ color: '#C8523D' }}>{error}</p>}
      {hint && !error && <p className="text-xs" style={{ color: 'rgba(241,240,218,0.4)' }}>{hint}</p>}
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export function Select({ label, error, options, placeholder, className, id, ...props }: SelectProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-cream/50">
          {label}
        </label>
      )}
      <select
        id={inputId}
        {...props}
        className={cn(
          'input-dark appearance-none',
          error && '!border-red-500/60',
          className,
        )}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(o => (
          <option key={o.value} value={o.value} style={{ background: '#12203F' }}>{o.label}</option>
        ))}
      </select>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({ label, error, className, id, ...props }: TextareaProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-cream/50">
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        {...props}
        className={cn('input-dark resize-none', error && '!border-red-500/60', className)}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
