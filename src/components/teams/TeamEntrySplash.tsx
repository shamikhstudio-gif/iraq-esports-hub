'use client';

import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface SplashConfig {
  text?: string;
  font?: string;
  text_gradient?: string[];
  image_url?: string | null;
  animation_type?: 'zoom' | 'glitch' | 'scanline' | 'flip' | 'fade';
  backdrop_type?: 'blur' | 'color' | 'gradient';
  backdrop_color?: string;
  backdrop_blur?: number;
  duration?: number;
}

interface TeamEntrySplashProps {
  config: SplashConfig;
  teamName: string;
  teamLogo?: string | null;
}

export function TeamEntrySplash({ config, teamName, teamLogo }: TeamEntrySplashProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  useEffect(() => {
    const duration = (config.duration || 4) * 1000;
    const timer = setTimeout(() => {
      handleDismiss();
    }, duration);
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setIsAnimatingOut(true);
    setTimeout(() => setIsVisible(false), 600);
  };

  if (!isVisible) return null;

  const animationClass = (() => {
    if (isAnimatingOut) return 'animate-[fadeOut_0.5s_ease-in_forwards]';
    switch (config.animation_type) {
      case 'zoom': return 'animate-[zoomBlast_0.6s_cubic-bezier(0.16,1,0.3,1)_forwards]';
      case 'glitch': return 'animate-[glitchIn_0.5s_steps(4)_forwards]';
      case 'flip': return 'animate-[flipIn_0.7s_cubic-bezier(0.23,1,0.32,1)_forwards]';
      case 'scanline': return 'animate-[scanlineIn_0.8s_ease-out_forwards]';
      default: return 'animate-[fadeIn_0.5s_ease-out_forwards]';
    }
  })();

  const backdropStyle = (() => {
    switch (config.backdrop_type) {
      case 'color': return { backgroundColor: config.backdrop_color || '#000000' };
      case 'gradient': return {
        background: `linear-gradient(135deg, ${config.backdrop_color || '#0a0a0a'}, #000000)`,
      };
      default: return {
        backgroundColor: 'rgba(0,0,0,0.85)',
        backdropFilter: `blur(${config.backdrop_blur || 16}px)`,
        WebkitBackdropFilter: `blur(${config.backdrop_blur || 16}px)`,
      };
    }
  })();

  const gradientStyle = config.text_gradient && config.text_gradient.length >= 2
    ? {
        background: `linear-gradient(135deg, ${config.text_gradient.join(', ')})`,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
      }
    : { color: '#ffffff' };

  const fontFamily = config.font === 'mono' ? 'font-mono'
    : config.font === 'serif' ? 'font-serif'
    : config.font === 'arabic' ? '' : 'font-sans';

  return (
    <>
      <style>{`
        @keyframes zoomBlast {
          from { opacity: 0; transform: scale(0.5); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes glitchIn {
          0% { opacity: 0; transform: translateX(-4px) skewX(-5deg); clip-path: inset(0 100% 0 0); }
          25% { transform: translateX(4px) skewX(5deg); }
          50% { transform: translateX(-2px); clip-path: inset(0 50% 0 0); }
          75% { transform: translateX(2px); }
          100% { opacity: 1; transform: translateX(0); clip-path: inset(0 0% 0 0); }
        }
        @keyframes flipIn {
          from { opacity: 0; transform: perspective(800px) rotateY(-90deg); }
          to { opacity: 1; transform: perspective(800px) rotateY(0deg); }
        }
        @keyframes scanlineIn {
          from { opacity: 0; transform: scaleY(0.05); filter: brightness(3); }
          60% { opacity: 1; transform: scaleY(1.05); }
          to { opacity: 1; transform: scaleY(1); filter: brightness(1); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeOut {
          from { opacity: 1; transform: scale(1); }
          to { opacity: 0; transform: scale(1.05); }
        }
      `}</style>

      <div
        className="fixed inset-0 z-[999] flex items-center justify-center cursor-pointer"
        style={backdropStyle}
        onClick={handleDismiss}
      >
        {/* Skip button */}
        <button
          className="absolute top-6 right-6 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-bold transition backdrop-blur-sm"
          onClick={handleDismiss}
        >
          <X className="w-3.5 h-3.5" />
          <span>تخطي</span>
        </button>

        {/* Content */}
        <div className={`flex flex-col items-center gap-6 text-center max-w-lg px-8 ${animationClass}`}>
          {/* Image/Logo */}
          {config.image_url ? (
            <img
              src={config.image_url}
              alt={teamName}
              className="max-w-[200px] max-h-[200px] object-contain drop-shadow-2xl"
            />
          ) : teamLogo ? (
            <img
              src={teamLogo}
              alt={teamName}
              className="w-28 h-28 rounded-3xl object-cover border-2 border-white/20 shadow-2xl"
            />
          ) : null}

          {/* Text */}
          {config.text && (
            <div
              className={`text-5xl font-black leading-tight tracking-tight ${fontFamily}`}
              style={gradientStyle}
            >
              {config.text}
            </div>
          )}

          {!config.text && (
            <div className="text-5xl font-black text-white tracking-tight drop-shadow-2xl">
              {teamName}
            </div>
          )}

          <div className="text-xs text-white/40 font-bold">انقر للمتابعة</div>
        </div>
      </div>
    </>
  );
}
