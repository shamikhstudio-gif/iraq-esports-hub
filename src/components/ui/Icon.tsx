import React, { forwardRef } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

export type IconVariant = 'outlined' | 'rounded';

export interface IconProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** The Material 3 symbol name, e.g. 'sports_esports', 'emoji_events', 'search', 'bolt' */
  name: string;
  /** 'rounded' (Material 3 standard) or 'outlined' */
  variant?: IconVariant;
  /** Whether the symbol should be filled (FILL: 1) or outlined (FILL: 0) */
  filled?: boolean;
  /** Font weight: 100 to 700. Default is 400 */
  weight?: 100 | 200 | 300 | 400 | 500 | 600 | 700;
  /** Symbol grade: -25, 0, 200 */
  grade?: -25 | 0 | 200;
  /** Optical size: 20, 24, 40, 48 */
  opticalSize?: 20 | 24 | 40 | 48;
  /** Pixel size or CSS size, e.g. 18, 20, 24, '1.25rem' */
  size?: number | string;
}

export const Icon = forwardRef<HTMLSpanElement, IconProps>(
  (
    {
      name,
      variant = 'rounded',
      filled = false,
      weight = 400,
      grade = 0,
      opticalSize = 24,
      size,
      className,
      style,
      ...props
    },
    ref
  ) => {
    const variationSettings = `'FILL' ${filled ? 1 : 0}, 'wght' ${weight}, 'GRAD' ${grade}, 'opsz' ${opticalSize}`;

    const computedStyle: React.CSSProperties = {
      fontVariationSettings: variationSettings,
      ...(size !== undefined
        ? {
            fontSize: typeof size === 'number' ? `${size}px` : size,
            width: typeof size === 'number' ? `${size}px` : size,
            height: typeof size === 'number' ? `${size}px` : size,
          }
        : {}),
      ...style,
    };

    return (
      <span
        ref={ref}
        className={cn(
          variant === 'rounded' ? 'material-symbols-rounded' : 'material-symbols-outlined',
          'shrink-0 leading-none select-none inline-flex items-center justify-center',
          className
        )}
        style={computedStyle}
        aria-hidden="true"
        {...props}
      >
        {name}
      </span>
    );
  }
);

Icon.displayName = 'Icon';
