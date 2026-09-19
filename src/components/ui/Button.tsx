import React, { forwardRef } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

export type ButtonVariant = 
  | 'primary' 
  | 'secondary' 
  | 'outline' 
  | 'ghost' 
  | 'danger' 
  | 'glow';

export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'icon' | 'icon-sm' | 'icon-lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  icon?: React.ReactNode;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-white text-black hover:bg-zinc-200 active:scale-[0.98] shadow-md font-black border border-transparent',
  secondary: 'bg-[#0e0e0e] border border-white/15 text-white hover:bg-white/10 hover:border-white/30 active:scale-[0.98] font-bold shadow-sm',
  outline: 'bg-transparent border border-white/20 text-white hover:bg-white/10 hover:border-white/40 active:scale-[0.98] font-bold',
  ghost: 'bg-transparent text-zinc-400 hover:text-white hover:bg-white/5 active:scale-[0.98] font-medium border border-transparent',
  danger: 'bg-[#0a0a0a] border border-white/30 text-white hover:bg-white/10 hover:border-white/60 active:scale-[0.98] font-bold',
  glow: 'bg-white text-black font-black shadow-[0_0_20px_rgba(255,255,255,0.25)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] hover:bg-zinc-100 active:scale-[0.98] border border-transparent',
};

const sizeStyles: Record<ButtonSize, string> = {
  xs: 'px-3 py-1 text-[11px] gap-1.5 rounded-[var(--btn-radius,9999px)]',
  sm: 'px-4 py-1.5 text-xs gap-2 rounded-[var(--btn-radius,9999px)]',
  md: 'px-5 py-2.5 text-xs sm:text-sm gap-2.5 rounded-[var(--btn-radius,9999px)]',
  lg: 'px-6 py-3 text-sm sm:text-base gap-3 rounded-[var(--btn-radius,9999px)]',
  icon: 'w-10 h-10 p-0 flex items-center justify-center rounded-[var(--btn-radius,9999px)] shrink-0',
  'icon-sm': 'w-8 h-8 p-0 flex items-center justify-center rounded-[var(--btn-radius,9999px)] shrink-0',
  'icon-lg': 'w-12 h-12 p-0 flex items-center justify-center rounded-[var(--btn-radius,9999px)] shrink-0',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      icon,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      children,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const isIconButton = size.startsWith('icon');

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        data-icon-only={isIconButton ? 'true' : undefined}
        style={{
          borderRadius: 'var(--btn-radius, 9999px)',
          paddingTop: isIconButton ? undefined : 'var(--btn-py, 14px)',
          paddingBottom: isIconButton ? undefined : 'var(--btn-py, 14px)',
          ...props.style
        }}
        className={cn(
          'inline-flex items-center justify-center transition-all duration-200 cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-white/40 disabled:opacity-40 disabled:pointer-events-none disabled:cursor-not-allowed',
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <svg
              className="animate-spin h-4 w-4 text-current"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            {!isIconButton && children && <span>{children}</span>}
          </span>
        ) : (
          <>
            {(rightIcon || icon) && <span className="inline-flex shrink-0">{rightIcon || icon}</span>}
            {children}
            {leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
