'use client';

import React, { useState, useEffect } from 'react';

export type AvatarFrameType = 
  | 'none'
  | 'default'
  | 'neon_pulse'
  | 'cyber_glitch'
  | 'spikes_crown'
  | 'holo_orbit'
  | 'stealth_carbon'
  | 'pixel_katana'
  | 'demon_horns';

interface AvatarWithDecorationProps {
  src: string;
  alt?: string;
  frame?: AvatarFrameType | string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'custom';
  customSizeClass?: string;
  className?: string;
  showBadge?: boolean;
}

const SIZE_MAP = {
  xs: { box: 'w-7 h-7', rounded: 'rounded-lg', stroke: 1.5 },
  sm: { box: 'w-9 h-9', rounded: 'rounded-xl', stroke: 2 },
  md: { box: 'w-11 h-11', rounded: 'rounded-xl', stroke: 2 },
  lg: { box: 'w-16 h-16', rounded: 'rounded-2xl', stroke: 2.5 },
  xl: { box: 'w-24 h-24', rounded: 'rounded-2xl', stroke: 3 },
  '2xl': { box: 'w-28 h-28 sm:w-32 sm:h-32', rounded: 'rounded-3xl', stroke: 3.5 },
  custom: { box: '', rounded: 'rounded-2xl', stroke: 2 },
};

export const AVATAR_FRAMES_CATALOG = [
  {
    id: 'none',
    name: 'Standard Clean',
    nameAr: 'بدون إطار (افتراضي)',
    descAr: 'المظهر الكلاسيكي النظيف بدون أي زينة إضافية.',
    isFree: true,
  },
  {
    id: 'neon_pulse',
    name: 'Neon Pulse Aura',
    nameAr: 'إطار النيون النبضي المتوهج',
    descAr: 'هالة نيون بيضاء نقية تتنفس بنبضات متزامنة مع توهج هيدروجيني فائق.',
    isFree: false,
  },
  {
    id: 'cyber_glitch',
    name: 'Cyber Glitch Scan',
    nameAr: 'إطار السايبر جليتش الرقمي',
    descAr: 'حواف تكتيكية ميكانيكية مع خطوط مسح رقمية وتشوهات جليتش متقطعة.',
    isFree: false,
  },
  {
    id: 'spikes_crown',
    name: 'Spikes & Crown',
    nameAr: 'تاج الأشواك المظلمة الملكي',
    descAr: 'أشواك هندسية حادة تعلو الرأس كتاج ملكي هجومي يعكس هيبة المقاتل.',
    isFree: false,
  },
  {
    id: 'holo_orbit',
    name: 'Holo Tech Orbit',
    nameAr: 'المدار التكنولوجي الهولوغرافي',
    descAr: 'حلقات مدارية متعاكسة الدوران مع مؤشرات استهداف رادارية HUD.',
    isFree: false,
  },
  {
    id: 'stealth_carbon',
    name: 'Stealth Carbon Hex',
    nameAr: 'دروع الكربون الأسود السداسية',
    descAr: 'ألياف كربونية مصفحة مع مشابك تيتانيوم مصقولة وزوايا حادة مفرغة.',
    isFree: false,
  },
  {
    id: 'pixel_katana',
    name: 'Pixel Katana Duel',
    nameAr: 'سيوف الكاتانا البكسلية 8-Bit',
    descAr: 'سيوف ساموراي متقاطعة بأسلوب بكسل ريترو مع لمعان زوايا متلألئ.',
    isFree: false,
  },
  {
    id: 'demon_horns',
    name: 'Obsidian Cyber Horns',
    nameAr: 'قرون السايبر الأوبسيديان',
    descAr: 'قرون شياطين حادة بتصميم مستقبلي مظلم يحيط بالأفاتار بأسلوب هجومي.',
    isFree: false,
  },
];

export function AvatarWithDecoration({
  src,
  alt = 'Avatar',
  frame = 'none',
  size = 'md',
  customSizeClass = '',
  className = '',
  showBadge = false,
}: AvatarWithDecorationProps) {
  const currentSize = SIZE_MAP[size] || SIZE_MAP.md;
  const normalizedFrame = (frame === 'neon' ? 'neon_pulse' : frame) as AvatarFrameType;

  const [hasError, setHasError] = useState(false);
  const fallbackUrl = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300';

  useEffect(() => {
    setHasError(false);
  }, [src]);

  const activeSrc = (!hasError && src) ? src : fallbackUrl;
  const initialLetter = alt?.trim() ? alt.trim().charAt(0).toUpperCase() : 'U';

  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 aspect-square ${customSizeClass || currentSize.box} ${className}`}>
      {/* Base Avatar Container */}
      <div className={`relative overflow-hidden bg-black border border-white/15 shadow-md shrink-0 aspect-square flex items-center justify-center w-full h-full ${currentSize.rounded}`}>
        <img
          key={activeSrc}
          src={activeSrc}
          alt={alt}
          referrerPolicy="no-referrer"
          crossOrigin="anonymous"
          onError={() => setHasError(true)}
          className="w-full h-full object-cover select-none shrink-0 aspect-square"
        />
        {hasError && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#18181b] text-white font-black text-xs select-none">
            {initialLetter}
          </div>
        )}
        <div className="absolute inset-0 ring-1 ring-inset ring-white/10 pointer-events-none rounded-[inherit]" />
      </div>

      {/* --- DECORATIONS --- */}

      {/* 1. NEON PULSE */}
      {normalizedFrame === 'neon_pulse' && (
        <>
          <div className={`absolute inset-0 pointer-events-none ${currentSize.rounded} border-2 border-white shadow-[0_0_20px_rgba(255,255,255,0.9),inset_0_0_10px_rgba(255,255,255,0.4)] animate-pulse`} />
          <div className={`absolute -inset-1 pointer-events-none ${currentSize.rounded} border border-white/40 shadow-[0_0_12px_rgba(255,255,255,0.5)]`} />
        </>
      )}

      {/* 2. CYBER GLITCH */}
      {normalizedFrame === 'cyber_glitch' && (
        <div className="absolute -inset-1.5 pointer-events-none flex items-center justify-center">
          {/* Tech Corner Brackets */}
          <div className="absolute top-0 right-0 w-3.5 h-3.5 border-t-2 border-r-2 border-white shadow-[0_0_8px_white]" />
          <div className="absolute top-0 left-0 w-3.5 h-3.5 border-t-2 border-l-2 border-white shadow-[0_0_8px_white]" />
          <div className="absolute bottom-0 right-0 w-3.5 h-3.5 border-b-2 border-r-2 border-white shadow-[0_0_8px_white]" />
          <div className="absolute bottom-0 left-0 w-3.5 h-3.5 border-b-2 border-l-2 border-white shadow-[0_0_8px_white]" />
          {/* Scanline Sweep */}
          <div className="absolute inset-1 border border-white/30 overflow-hidden">
            <div className="w-full h-1 bg-gradient-to-b from-white to-transparent opacity-80 animate-[scanline_2s_linear_infinite]" />
          </div>
        </div>
      )}

      {/* 3. SPIKES & DARK CROWN */}
      {normalizedFrame === 'spikes_crown' && (
        <div className="absolute -inset-2 pointer-events-none">
          {/* Crown Spikes Top */}
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 flex items-end justify-center gap-1 z-20">
            <div className="w-1 h-3 bg-white shadow-[0_0_6px_white] rotate-[-20deg]" />
            <div className="w-1.5 h-5 bg-white shadow-[0_0_8px_white]" />
            <div className="w-1 h-3 bg-white shadow-[0_0_6px_white] rotate-[20deg]" />
          </div>
          {/* Angular Base Border */}
          <div className={`w-full h-full border-2 border-white/70 shadow-[0_0_15px_rgba(255,255,255,0.4)] ${currentSize.rounded}`} />
        </div>
      )}

      {/* 4. HOLO TECH ORBIT */}
      {normalizedFrame === 'holo_orbit' && (
        <div className="absolute -inset-2 pointer-events-none flex items-center justify-center">
          {/* Outer Orbiting Ring */}
          <div className="absolute inset-0 rounded-full border border-dashed border-white/50 animate-[spin_8s_linear_infinite]" />
          {/* Counter Orbiting Ring */}
          <div className="absolute inset-1 rounded-full border border-dotted border-white/80 animate-[spin_5s_linear_infinite_reverse]" />
          {/* Radar Blip */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_white] animate-ping" />
        </div>
      )}

      {/* 5. STEALTH CARBON HEX */}
      {normalizedFrame === 'stealth_carbon' && (
        <div className="absolute -inset-1 pointer-events-none">
          <div className={`w-full h-full border-2 border-white/60 bg-black/40 backdrop-blur-[1px] ${currentSize.rounded} shadow-[0_0_10px_rgba(255,255,255,0.25)]`} />
          {/* Carbon Fiber Rivets */}
          <div className="absolute top-1 left-1 w-1 h-1 rounded-full bg-white" />
          <div className="absolute top-1 right-1 w-1 h-1 rounded-full bg-white" />
          <div className="absolute bottom-1 left-1 w-1 h-1 rounded-full bg-white" />
          <div className="absolute bottom-1 right-1 w-1 h-1 rounded-full bg-white" />
        </div>
      )}

      {/* 6. PIXEL KATANA DUEL */}
      {normalizedFrame === 'pixel_katana' && (
        <div className="absolute -inset-2 pointer-events-none flex items-center justify-center">
          {/* Pixel Crosshair corners */}
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-white shadow-[0_0_4px_white]" />
          <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-white shadow-[0_0_4px_white]" />
          <div className={`w-full h-full border-2 border-dashed border-white/70 ${currentSize.rounded}`} />
        </div>
      )}

      {/* 7. OBSIDIAN CYBER HORNS */}
      {normalizedFrame === 'demon_horns' && (
        <div className="absolute -inset-2 pointer-events-none">
          {/* Horn Left */}
          <div className="absolute -top-3.5 left-1 w-2 h-5 bg-white border border-black shadow-[0_0_8px_white] rotate-[-30deg] rounded-t-full" />
          {/* Horn Right */}
          <div className="absolute -top-3.5 right-1 w-2 h-5 bg-white border border-black shadow-[0_0_8px_white] rotate-[30deg] rounded-t-full" />
          <div className={`w-full h-full border-2 border-white/50 ${currentSize.rounded} shadow-[0_0_12px_rgba(255,255,255,0.3)]`} />
        </div>
      )}

      {/* Mini Frame Name Badge (optional) */}
      {showBadge && normalizedFrame !== 'none' && normalizedFrame !== 'default' && (
        <span className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 px-1.5 py-0.2 rounded-md bg-white text-black text-[8px] font-black tracking-wider uppercase shadow-md whitespace-nowrap z-20">
          {normalizedFrame.replace('_', ' ')}
        </span>
      )}
    </div>
  );
}
