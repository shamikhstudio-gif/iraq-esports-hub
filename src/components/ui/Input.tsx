'use client';

import React, { forwardRef, InputHTMLAttributes, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: ReactNode;
  isLtr?: boolean;
  actionButton?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      icon,
      isLtr,
      actionButton,
      className = '',
      type = 'text',
      placeholder,
      value,
      ...props
    },
    ref
  ) => {
    // Auto-detect LTR for URLs, mentions, webhooks, tags, emails
    const shouldBeLtr =
      isLtr !== undefined
        ? isLtr
        : type === 'url' ||
          type === 'email' ||
          type === 'number' ||
          type === 'password' ||
          (typeof placeholder === 'string' &&
            (placeholder.startsWith('http') ||
              placeholder.startsWith('@') ||
              placeholder.startsWith('#') ||
              placeholder.includes('discord.com'))) ||
          (typeof value === 'string' &&
            (value.startsWith('http') ||
              value.startsWith('@') ||
              value.startsWith('#') ||
              value.includes('discord.com')));

    return (
      <div className="w-full space-y-1.5 text-right" dir="rtl">
        {label && (
          <label className="block text-xs font-bold text-zinc-300 select-none">
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          {icon && (
            <div className="absolute right-3 z-10 text-zinc-400 pointer-events-none">
              {icon}
            </div>
          )}

          <input
            ref={ref}
            type={type}
            value={value}
            placeholder={placeholder}
            dir={shouldBeLtr ? 'ltr' : 'rtl'}
            className={`w-full text-xs py-3 rounded-xl bg-black border transition font-medium focus:outline-none ${
              shouldBeLtr ? 'text-left font-mono tracking-wide' : 'text-right'
            } ${icon ? 'pr-10' : 'px-3.5'} ${
              actionButton ? 'pl-24' : 'px-3.5'
            } ${
              error
                ? 'border-white/60 text-white focus:border-white focus:ring-1 focus:ring-white/20'
                : 'border-white/15 text-white hover:border-white/30 focus:border-white focus:ring-1 focus:ring-white/20'
            } ${className}`}
            {...props}
          />

          {actionButton && (
            <div className="absolute left-2 z-10">{actionButton}</div>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-1.5 text-[11px] text-zinc-300 font-bold animate-in fade-in">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 text-white" />
            <span>{error}</span>
          </div>
        )}

        {helperText && !error && (
          <p className="text-[10px] text-zinc-500 font-medium leading-relaxed">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
