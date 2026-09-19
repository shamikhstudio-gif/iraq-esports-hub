'use client';

import React from 'react';

export type BannerFxType =
  | 'none'
  | 'cyber_grid'
  | 'laser_scan'
  | 'noise_grain'
  | 'stealth_vignette';

export const BANNER_FX_CATALOG = [
  {
    id: 'none',
    name: 'Clean Standard',
    nameAr: 'بدون زخرفة (افتراضي)',
    descAr: 'عرض صورة البانر الأصلية بنقائها الكامل بدون أي مؤثرات إضافية.',
    isFree: true,
  },
  {
    id: 'cyber_grid',
    name: 'Tactical Cyber Grid',
    nameAr: 'شبكة الإحداثيات التكتيكية',
    descAr: 'شبكة استهداف ثلاثية الأبعاد وخطوط هندسية عسكرية تغطي خلفية البانر.',
    isFree: false,
  },
  {
    id: 'laser_scan',
    name: 'Laser Horizon Sweep',
    nameAr: 'مسح الليزر الأفقي المتوهج',
    descAr: 'شعاع ليزر أبيض فائق التوهج يمسح البانر صعوداً وهبوطاً بشكل مستمر.',
    isFree: false,
  },
  {
    id: 'noise_grain',
    name: 'Cinematic Film Grain',
    nameAr: 'الحبيبات السينمائية 35mm',
    descAr: 'مظهر شاشات الأفلام التنافسية الكلاسيكية بطابع حبيبات سينمائية مميزة.',
    isFree: false,
  },
  {
    id: 'stealth_vignette',
    name: 'Stealth Spotlight Vignette',
    nameAr: 'الظلال التكتيكية المركزة (Vignette)',
    descAr: 'تعتيم سينمائي عميق لأطراف البانر لتركيز الإضاءة على هوية اللاعب.',
    isFree: false,
  },
];

interface BannerFxOverlayProps {
  fx?: BannerFxType | string;
  className?: string;
}

export function BannerFxOverlay({ fx = 'none', className = '' }: BannerFxOverlayProps) {
  if (!fx || fx === 'none') return null;

  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden select-none z-10 ${className}`}>
      {/* 1. CYBER GRID */}
      {fx === 'cyber_grid' && (
        <div 
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage: `linear-gradient(to right, rgba(255, 255, 255, 0.4) 1px, transparent 1px),
                              linear-gradient(to bottom, rgba(255, 255, 255, 0.4) 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60" />
        </div>
      )}

      {/* 2. LASER SCAN */}
      {fx === 'laser_scan' && (
        <div className="absolute inset-0 overflow-hidden">
          <div className="w-full h-1 bg-gradient-to-r from-transparent via-white to-transparent opacity-90 shadow-[0_0_15px_white] animate-[laserSweep_3s_ease-in-out_infinite]" />
        </div>
      )}

      {/* 3. NOISE GRAIN */}
      {fx === 'noise_grain' && (
        <div 
          className="absolute inset-0 opacity-20 mix-blend-overlay animate-[grainFlicker_0.2s_steps(2)_infinite]"
          style={{
            backgroundImage: `radial-gradient(rgba(255,255,255,0.2) 1px, transparent 0)`,
            backgroundSize: '3px 3px',
          }}
        />
      )}

      {/* 4. STEALTH VIGNETTE */}
      {fx === 'stealth_vignette' && (
        <div className="absolute inset-0 shadow-[inset_0_0_80px_rgba(0,0,0,0.9)] border-b border-white/20" />
      )}
    </div>
  );
}
