'use client';

import React, { useEffect, useRef } from 'react';

export type ProfileEffectType =
  | 'none'
  | 'matrix_rain'
  | 'cosmic_dust'
  | 'crt_scanlines'
  | 'lightning_pulse'
  | 'vortex_grid';

export const PROFILE_EFFECTS_CATALOG = [
  {
    id: 'none',
    name: 'Obsidian Calm',
    nameAr: 'بدون تأثير (افتراضي)',
    descAr: 'الخلفية الكلاسيكية الصافية بدون جزيئات أو وميض متحرك.',
    isFree: true,
  },
  {
    id: 'matrix_rain',
    name: 'Matrix Cyber Stream',
    nameAr: 'شفرات الماتريكس الرقمية المتساقطة',
    descAr: 'أمطار رقمية متساقطة من رموز الكود الثنائي الأبيض بتأثير هكر تكتيكي متطور.',
    isFree: false,
  },
  {
    id: 'cosmic_dust',
    name: 'Cosmic Stardust Motes',
    nameAr: 'الغبار الكوني والنجوم الأثيرية',
    descAr: 'جزيئات سديمية عائمة تسبح ببطء في فضاء البروفايل مع وميض نجوم دقيق.',
    isFree: false,
  },
  {
    id: 'lightning_pulse',
    name: 'Hyper Lightning Pulse',
    nameAr: 'صواعق البرق الكهربائي الخاطفة',
    descAr: 'تفريغات كهربائية بيضاء خاطفة تنبض عبر خلفية البطاقة بقوة تنافسية هائلة.',
    isFree: false,
  },
  {
    id: 'crt_scanlines',
    name: 'Tactical CRT Scanline',
    nameAr: 'شاشة الرادار والمسح التكتيكي CRT',
    descAr: 'خطوط مسح شاشات القتال التكتيكية مع وميض فوسفوري وتوهج سينمائي عميق.',
    isFree: false,
  },
  {
    id: 'vortex_grid',
    name: 'Cyber 3D Vortex Grid',
    nameAr: 'الشبكة الفضائية ثلاثية الأبعاد',
    descAr: 'شبكة أفقية ثلاثية الأبعاد تتحرك نحو الأفق بأسلوب سايبربانك سينثويف.',
    isFree: false,
  },
];

interface ProfileEffectOverlayProps {
  effect?: ProfileEffectType | string;
  className?: string;
}

export function ProfileEffectOverlay({ effect = 'none', className = '' }: ProfileEffectOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (effect !== 'matrix_rain' && effect !== 'cosmic_dust') return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 600);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 400);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener('resize', handleResize);

    if (effect === 'matrix_rain') {
      const chars = '0123456789ABCDEF<>/*+-~_#[]';
      const fontSize = 12;
      const columns = Math.floor(width / fontSize);
      const drops: number[] = Array.from({ length: columns }, () => Math.random() * -50);

      const render = () => {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
        ctx.fillRect(0, 0, width, height);

        ctx.fillStyle = '#ffffff';
        ctx.font = `${fontSize}px monospace`;

        for (let i = 0; i < drops.length; i++) {
          const text = chars[Math.floor(Math.random() * chars.length)];
          const x = i * fontSize;
          const y = drops[i] * fontSize;

          const alpha = Math.min(1, Math.max(0.15, Math.random()));
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
          ctx.fillText(text, x, y);

          if (y > height && Math.random() > 0.975) {
            drops[i] = 0;
          }
          drops[i]++;
        }
        animId = requestAnimationFrame(render);
      };
      render();
    } else if (effect === 'cosmic_dust') {
      const particles = Array.from({ length: 45 }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 1.6 + 0.5,
        speedY: Math.random() * 0.4 + 0.15,
        speedX: (Math.random() - 0.5) * 0.2,
        alpha: Math.random() * 0.7 + 0.2,
      }));

      const render = () => {
        ctx.clearRect(0, 0, width, height);
        particles.forEach((p) => {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`;
          ctx.shadowBlur = 8;
          ctx.shadowColor = '#ffffff';
          ctx.fill();

          p.y -= p.speedY;
          p.x += p.speedX;
          if (p.y < 0) {
            p.y = height;
            p.x = Math.random() * width;
          }
        });
        animId = requestAnimationFrame(render);
      };
      render();
    }

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [effect]);

  if (!effect || effect === 'none') return null;

  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden select-none z-0 ${className}`}>
      {/* 1. Canvas Based Effects (Matrix & Cosmic) */}
      {(effect === 'matrix_rain' || effect === 'cosmic_dust') && (
        <canvas ref={canvasRef} className="w-full h-full opacity-60 mix-blend-screen" />
      )}

      {/* 2. CRT SCANLINES */}
      {effect === 'crt_scanlines' && (
        <div className="absolute inset-0">
          <div className="w-full h-full bg-[linear-gradient(rgba(255,255,255,0)_50%,rgba(255,255,255,0.06)_50%)] bg-[length:100%_4px]" />
          <div className="absolute inset-0 bg-white/[0.02] animate-pulse pointer-events-none" />
          <div className="absolute top-0 left-0 right-0 h-1 bg-white/20 blur-[1px] animate-[scanline_4s_linear_infinite]" />
        </div>
      )}

      {/* 3. LIGHTNING PULSE */}
      {effect === 'lightning_pulse' && (
        <div className="absolute inset-0 animate-[lightningFlashes_6s_infinite] overflow-hidden">
          <svg className="w-full h-full opacity-40 mix-blend-screen" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path
              d="M 15,-10 L 25,35 L 18,45 L 35,70 L 28,75 L 45,110"
              stroke="#ffffff"
              strokeWidth="0.8"
              fill="none"
              strokeDasharray="100"
              className="animate-[pulse_1.8s_infinite]"
            />
            <path
              d="M 85,-10 L 75,30 L 82,42 L 68,65 L 75,70 L 60,110"
              stroke="#ffffff"
              strokeWidth="0.6"
              fill="none"
              strokeDasharray="100"
              className="animate-[pulse_2.4s_infinite]"
            />
          </svg>
        </div>
      )}

      {/* 4. VORTEX 3D GRID */}
      {effect === 'vortex_grid' && (
        <div className="absolute inset-0 overflow-hidden [perspective:500px]">
          <div 
            className="absolute -bottom-24 -left-1/4 -right-1/4 h-80 opacity-30 [transform:rotateX(65deg)]"
            style={{
              backgroundImage: `linear-gradient(to right, rgba(255, 255, 255, 0.25) 1px, transparent 1px),
                                linear-gradient(to bottom, rgba(255, 255, 255, 0.25) 1px, transparent 1px)`,
              backgroundSize: '36px 36px',
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black pointer-events-none" />
        </div>
      )}
    </div>
  );
}
