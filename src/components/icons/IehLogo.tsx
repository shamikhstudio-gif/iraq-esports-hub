'use client';

import React from 'react';

export interface IehLogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
  textClassName?: string;
  glow?: boolean;
  variant?: 'white' | 'accent' | 'gold' | 'raw';
}

export function IehLogo({
  size = 28,
  className = '',
  showText = false,
  textClassName = '',
  glow = false,
  variant = 'white',
}: IehLogoProps) {
  const imgSrc = variant === 'raw' ? '/icons/logo.png' : '/icons/logo-white.png';
  const filterStyle =
    variant === 'accent'
      ? { filter: 'drop-shadow(0 0 8px rgba(0, 149, 246, 0.6))' }
      : variant === 'gold'
      ? { filter: 'invert(75%) sepia(85%) saturate(800%) hue-rotate(5deg) brightness(105%) contrast(105%)' }
      : undefined;

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <div
        className={`relative shrink-0 flex items-center justify-center transition-transform hover:scale-105 duration-200 ${
          glow ? 'drop-shadow-[0_0_12px_rgba(255,255,255,0.35)]' : ''
        }`}
        style={{ width: size, height: size }}
      >
        <img
          src={imgSrc}
          alt="IEH - Iraq Esports Hub Logo"
          className="w-full h-full object-contain pointer-events-none"
          style={filterStyle}
          loading="eager"
        />
      </div>

      {showText && (
        <div className="flex flex-col text-right leading-none">
          <span className={`text-base font-black tracking-wider text-white ${textClassName}`}>
            IEH
          </span>
          <span className="text-[9px] font-bold text-zinc-400 tracking-tight">
            IRAQ ESPORTS HUB
          </span>
        </div>
      )}
    </div>
  );
}

export default IehLogo;
