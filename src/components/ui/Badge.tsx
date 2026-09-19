import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

export type BadgeVariant = 
  | 'default' 
  | 'outline' 
  | 'solid' 
  | 'live' 
  | 'streak' 
  | 'verified';

export type BadgeSize = 'xs' | 'sm' | 'md';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: React.ReactNode;
  color?: string;
}

export function isLightColor(color?: string): boolean {
  if (!color || !color.startsWith('#')) return true;
  const c = color.substring(1);
  const rgb = parseInt(c.length === 3 ? c.split('').map((x) => x + x).join('') : c, 16);
  if (isNaN(rgb)) return true;
  const r = (rgb >> 16) & 0xff;
  const g = (rgb >> 8) & 0xff;
  const b = (rgb >> 0) & 0xff;
  const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luma > 150;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-white/10 text-white border border-white/15',
  outline: 'bg-transparent text-zinc-300 border border-white/25',
  solid: 'bg-white text-black font-black border border-white',
  live: 'bg-white/10 text-white border border-white/30 tracking-wider uppercase font-black',
  streak: 'bg-white/10 text-white border border-white/20 font-mono font-bold',
  verified: 'bg-white text-black font-black border border-white',
};

const sizeStyles: Record<BadgeSize, string> = {
  xs: 'px-1.5 py-0.5 text-[10px] gap-1 rounded',
  sm: 'px-2.5 py-0.5 text-[11px] gap-1.5 rounded-md font-bold',
  md: 'px-3 py-1 text-xs gap-2 rounded-lg font-bold',
};

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'default',
  size = 'sm',
  icon,
  color,
  style,
  children,
  ...props
}) => {
  const isLight = color ? isLightColor(color) : true;
  const computedStyle: React.CSSProperties = color
    ? {
        backgroundColor: color,
        color: isLight ? '#000000' : '#ffffff',
        borderColor: isLight ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.25)',
        ...style,
      }
    : style || {};

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center select-none shrink-0 transition-colors',
        !color && variantStyles[variant],
        color && (isLight ? 'text-black !text-black font-black border shadow-xs' : 'text-white !text-white font-bold border shadow-xs'),
        sizeStyles[size],
        className
      )}
      style={computedStyle}
      {...props}
    >
      {variant === 'live' && (
        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shrink-0" />
      )}
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </span>
  );
};

Badge.displayName = 'Badge';
