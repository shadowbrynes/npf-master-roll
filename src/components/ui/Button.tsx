'use client';

import React from 'react';
import { Loader2, Check } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  loadingText?: string;
  isSuccess?: boolean;
  successText?: string;
  icon?: React.ElementType;
  iconPosition?: 'left' | 'right';
  breathing?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  loadingText,
  isSuccess = false,
  successText,
  icon: Icon,
  iconPosition = 'left',
  breathing = false,
  className = '',
  disabled,
  children,
  ...props
}) => {
  // Base styling
  const baseClasses = 'inline-flex items-center justify-center font-mono font-bold uppercase tracking-wider transition-all duration-200 select-none cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none active:scale-[0.97] hover:scale-[1.02] hover:-translate-y-0.5';

  // Size variants
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-[11px] rounded-xl gap-1.5',
    md: 'px-4 py-2.5 text-xs rounded-xl gap-2',
    lg: 'px-6 py-3 text-sm rounded-2xl gap-2.5'
  }[size];

  // Color variants
  const variantClasses = {
    primary: `bg-gradient-to-r from-cyan-600 via-teal-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white border border-cyan-400/40 shadow-lg shadow-cyan-950/50 ${
      breathing ? 'animate-[button-breathing_3.2s_infinite_ease-in-out]' : ''
    }`,
    secondary: 'bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-800 shadow-md',
    success: 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white border border-emerald-400/40 shadow-lg shadow-emerald-950/50',
    warning: `bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-black border border-amber-400/50 shadow-lg shadow-amber-950/50 ${
      breathing ? 'animate-[button-warning-pulse_3s_infinite_ease-in-out]' : ''
    }`,
    danger: 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white border border-rose-400/40 shadow-lg shadow-rose-950/50',
    ghost: 'bg-transparent hover:bg-slate-800/60 text-slate-400 hover:text-white border border-transparent'
  }[variant];

  return (
    <button
      disabled={disabled || isLoading}
      className={`${baseClasses} ${sizeClasses} ${variantClasses} ${className}`}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
          <span>{loadingText || 'Processing...'}</span>
        </>
      ) : isSuccess ? (
        <>
          <Check className="w-4 h-4 text-emerald-300 shrink-0" />
          <span>{successText || '✓ Saved'}</span>
        </>
      ) : (
        <>
          {Icon && iconPosition === 'left' && <Icon className="w-4 h-4 shrink-0" />}
          <span>{children}</span>
          {Icon && iconPosition === 'right' && <Icon className="w-4 h-4 shrink-0" />}
        </>
      )}
    </button>
  );
};

export default Button;
