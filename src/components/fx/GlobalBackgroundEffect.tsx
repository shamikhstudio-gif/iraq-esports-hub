'use client';

import React, { useEffect, useRef } from 'react';
import { 
  useAppBackground, 
  GlobalBackgroundEffectType, 
  BackgroundIntensityType,
  BackgroundSpeedType
} from '@/context/BackgroundContext';

interface GlobalBackgroundEffectProps {
  overrideEffect?: GlobalBackgroundEffectType;
  overrideIntensity?: BackgroundIntensityType;
  overrideSpeed?: BackgroundSpeedType;
  className?: string;
  isContainerRelative?: boolean;
}

const INTENSITY_OPACITY_MAP: Record<BackgroundIntensityType, { canvas: number; overlay: string }> = {
  low: { canvas: 0.22, overlay: 'opacity-25' },
  medium: { canvas: 0.45, overlay: 'opacity-50' },
  high: { canvas: 0.78, overlay: 'opacity-85' },
};

const SPEED_FACTOR_MAP: Record<BackgroundSpeedType, { factor: number; cssDuration: string }> = {
  slow: { factor: 0.5, cssDuration: '24s' },
  normal: { factor: 1.0, cssDuration: '12s' },
  fast: { factor: 1.8, cssDuration: '6s' },
};

export function GlobalBackgroundEffect({
  overrideEffect,
  overrideIntensity,
  overrideSpeed,
  className = '',
  isContainerRelative = false,
}: GlobalBackgroundEffectProps) {
  const context = useAppBackground();
  const effect = overrideEffect || context.effect;
  const intensity = overrideIntensity || context.intensity;
  const speed = overrideSpeed || context.speed;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const isCanvasEffect = 
    effect === 'matrix_rain' || 
    effect === 'cosmic_dust' || 
    effect === 'neural_plexus' || 
    effect === 'hyperspace_warp' ||
    effect === 'audio_waveform';

  useEffect(() => {
    if (!isCanvasEffect) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let isTabActive = !document.hidden;

    const onVisibilityChange = () => {
      isTabActive = !document.hidden;
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    const updateDimensions = () => {
      if (!canvas) return;
      const targetParent = isContainerRelative ? canvas.parentElement : null;
      const w = targetParent ? targetParent.clientWidth : window.innerWidth;
      const h = targetParent ? targetParent.clientHeight : window.innerHeight;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.scale(dpr, dpr);
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);

    const opacityFactor = INTENSITY_OPACITY_MAP[intensity]?.canvas || 0.45;
    const speedFactor = SPEED_FACTOR_MAP[speed]?.factor || 1.0;

    // ==========================================
    // 1. NEURAL CYBER PLEXUS ENGINE (Interactive nodes & links)
    // ==========================================
    if (effect === 'neural_plexus') {
      let width = isContainerRelative ? (canvas.parentElement?.clientWidth || 600) : window.innerWidth;
      let height = isContainerRelative ? (canvas.parentElement?.clientHeight || 800) : window.innerHeight;

      const nodeCount = Math.min(55, Math.floor((width * height) / 18000));
      const nodes = Array.from({ length: nodeCount }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.7 * speedFactor,
        vy: (Math.random() - 0.5) * 0.7 * speedFactor,
        radius: Math.random() * 1.5 + 1.2,
      }));

      const maxDistance = 120;

      const renderPlexus = () => {
        if (!isTabActive) {
          animId = requestAnimationFrame(renderPlexus);
          return;
        }

        width = isContainerRelative ? (canvas.parentElement?.clientWidth || 600) : window.innerWidth;
        height = isContainerRelative ? (canvas.parentElement?.clientHeight || 800) : window.innerHeight;

        ctx.clearRect(0, 0, width, height);

        // Move nodes
        for (let i = 0; i < nodes.length; i++) {
          const n = nodes[i];
          n.x += n.vx;
          n.y += n.vy;

          if (n.x < 0) { n.x = 0; n.vx *= -1; }
          if (n.x > width) { n.x = width; n.vx *= -1; }
          if (n.y < 0) { n.y = 0; n.vy *= -1; }
          if (n.y > height) { n.y = height; n.vy *= -1; }

          // Draw node dot
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${opacityFactor * 0.9})`;
          ctx.shadowBlur = 4;
          ctx.shadowColor = '#ffffff';
          ctx.fill();

          // Connect with nearby nodes
          for (let j = i + 1; j < nodes.length; j++) {
            const n2 = nodes[j];
            const dx = n.x - n2.x;
            const dy = n.y - n2.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < maxDistance) {
              const alpha = (1 - dist / maxDistance) * opacityFactor * 0.6;
              ctx.beginPath();
              ctx.moveTo(n.x, n.y);
              ctx.lineTo(n2.x, n2.y);
              ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
              ctx.lineWidth = 0.7;
              ctx.stroke();
            }
          }
        }

        animId = requestAnimationFrame(renderPlexus);
      };

      animId = requestAnimationFrame(renderPlexus);
    }

    // ==========================================
    // 2. HYPERSPACE WARP SPEED 3D ENGINE
    // ==========================================
    if (effect === 'hyperspace_warp') {
      let width = isContainerRelative ? (canvas.parentElement?.clientWidth || 600) : window.innerWidth;
      let height = isContainerRelative ? (canvas.parentElement?.clientHeight || 800) : window.innerHeight;

      const starCount = Math.min(160, Math.floor((width * height) / 8000));
      const stars = Array.from({ length: starCount }, () => ({
        x: (Math.random() - 0.5) * width * 2,
        y: (Math.random() - 0.5) * height * 2,
        z: Math.random() * width,
        pz: Math.random() * width,
      }));

      const renderWarp = () => {
        if (!isTabActive) {
          animId = requestAnimationFrame(renderWarp);
          return;
        }

        width = isContainerRelative ? (canvas.parentElement?.clientWidth || 600) : window.innerWidth;
        height = isContainerRelative ? (canvas.parentElement?.clientHeight || 800) : window.innerHeight;

        // Soft trail persistence
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fillRect(0, 0, width, height);

        const cx = width / 2;
        const cy = height / 2;
        const warpSpeed = 14 * speedFactor;

        for (let i = 0; i < stars.length; i++) {
          const s = stars[i];
          s.pz = s.z;
          s.z -= warpSpeed;

          if (s.z <= 0) {
            s.z = width;
            s.pz = width;
            s.x = (Math.random() - 0.5) * width * 2;
            s.y = (Math.random() - 0.5) * height * 2;
          }

          const k = 180 / s.z;
          const px = s.x * k + cx;
          const py = s.y * k + cy;

          const pk = 180 / s.pz;
          const ppx = s.x * pk + cx;
          const ppy = s.y * pk + cy;

          if (px >= 0 && px <= width && py >= 0 && py <= height) {
            const alpha = Math.min(1, (1 - s.z / width) * opacityFactor * 1.5);
            ctx.beginPath();
            ctx.moveTo(ppx, ppy);
            ctx.lineTo(px, py);
            ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.lineWidth = Math.max(0.6, (1 - s.z / width) * 2);
            ctx.stroke();
          }
        }

        animId = requestAnimationFrame(renderWarp);
      };

      animId = requestAnimationFrame(renderWarp);
    }

    // ==========================================
    // 3. MATRIX CYBER RAIN ENGINE
    // ==========================================
    if (effect === 'matrix_rain') {
      const chars = '0123456789ABCDEF<>/~#[]{}+=*';
      const fontSize = 14;
      let width = isContainerRelative ? (canvas.parentElement?.clientWidth || 600) : window.innerWidth;
      let height = isContainerRelative ? (canvas.parentElement?.clientHeight || 800) : window.innerHeight;
      let columns = Math.floor(width / fontSize);
      let drops: number[] = Array.from({ length: columns }, () => Math.random() * -50);

      const renderMatrix = () => {
        if (!isTabActive) {
          animId = requestAnimationFrame(renderMatrix);
          return;
        }

        width = isContainerRelative ? (canvas.parentElement?.clientWidth || 600) : window.innerWidth;
        height = isContainerRelative ? (canvas.parentElement?.clientHeight || 800) : window.innerHeight;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.14)';
        ctx.fillRect(0, 0, width, height);

        ctx.font = `${fontSize}px monospace`;

        for (let i = 0; i < drops.length; i++) {
          const char = chars[Math.floor(Math.random() * chars.length)];
          const x = i * fontSize;
          const y = drops[i] * fontSize;

          const baseAlpha = Math.min(1, Math.max(0.12, Math.random())) * opacityFactor;
          if (Math.random() > 0.92) {
            ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(1, opacityFactor * 1.5)})`;
          } else {
            ctx.fillStyle = `rgba(255, 255, 255, ${baseAlpha})`;
          }

          ctx.fillText(char, x, y);

          if (y > height && Math.random() > 0.975) {
            drops[i] = 0;
          }
          drops[i] += speedFactor;
        }

        animId = requestAnimationFrame(renderMatrix);
      };

      animId = requestAnimationFrame(renderMatrix);
    }

    // ==========================================
    // 4. COSMIC STARDUST PARTICLES ENGINE
    // ==========================================
    if (effect === 'cosmic_dust') {
      let width = isContainerRelative ? (canvas.parentElement?.clientWidth || 600) : window.innerWidth;
      let height = isContainerRelative ? (canvas.parentElement?.clientHeight || 800) : window.innerHeight;

      const particleCount = Math.min(75, Math.floor((width * height) / 14000));
      const particles = Array.from({ length: particleCount }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 1.8 + 0.4,
        speedY: (Math.random() * 0.35 + 0.12) * speedFactor,
        speedX: (Math.random() - 0.5) * 0.18 * speedFactor,
        alpha: (Math.random() * 0.6 + 0.2) * opacityFactor,
        twinkleSpeed: (Math.random() * 0.02 + 0.005) * speedFactor,
      }));

      const renderCosmic = () => {
        if (!isTabActive) {
          animId = requestAnimationFrame(renderCosmic);
          return;
        }

        width = isContainerRelative ? (canvas.parentElement?.clientWidth || 600) : window.innerWidth;
        height = isContainerRelative ? (canvas.parentElement?.clientHeight || 800) : window.innerHeight;

        ctx.clearRect(0, 0, width, height);

        particles.forEach((p) => {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);

          p.alpha += Math.sin(Date.now() * p.twinkleSpeed) * 0.01;
          const clampedAlpha = Math.max(0.05, Math.min(opacityFactor, p.alpha));

          ctx.fillStyle = `rgba(255, 255, 255, ${clampedAlpha})`;
          ctx.shadowBlur = 6;
          ctx.shadowColor = '#ffffff';
          ctx.fill();

          p.y -= p.speedY;
          p.x += p.speedX;

          if (p.y < 0) {
            p.y = height;
            p.x = Math.random() * width;
          }
          if (p.x < 0) p.x = width;
          if (p.x > width) p.x = 0;
        });

        animId = requestAnimationFrame(renderCosmic);
      };

      animId = requestAnimationFrame(renderCosmic);
    }

    // ==========================================
    // 5. AUDIO WAVEFORM FREQUENCY ENGINE
    // ==========================================
    if (effect === 'audio_waveform') {
      let width = isContainerRelative ? (canvas.parentElement?.clientWidth || 600) : window.innerWidth;
      let height = isContainerRelative ? (canvas.parentElement?.clientHeight || 800) : window.innerHeight;

      let step = 0;

      const renderAudioWaves = () => {
        if (!isTabActive) {
          animId = requestAnimationFrame(renderAudioWaves);
          return;
        }

        width = isContainerRelative ? (canvas.parentElement?.clientWidth || 600) : window.innerWidth;
        height = isContainerRelative ? (canvas.parentElement?.clientHeight || 800) : window.innerHeight;

        ctx.clearRect(0, 0, width, height);

        step += 0.02 * speedFactor;
        const centerY = height * 0.65;

        // Draw 3 harmonic sine waves with depth
        const waves = [
          { freq: 0.008, amp: 40, offset: step, alpha: opacityFactor * 0.8, width: 1.5 },
          { freq: 0.014, amp: 25, offset: -step * 1.3, alpha: opacityFactor * 0.5, width: 1.0 },
          { freq: 0.005, amp: 55, offset: step * 0.7, alpha: opacityFactor * 0.35, width: 0.8 },
        ];

        waves.forEach((w) => {
          ctx.beginPath();
          ctx.moveTo(0, centerY);

          for (let x = 0; x < width; x += 3) {
            const y = centerY + Math.sin(x * w.freq + w.offset) * w.amp * Math.sin(x / width * Math.PI);
            ctx.lineTo(x, y);
          }

          ctx.strokeStyle = `rgba(255, 255, 255, ${w.alpha})`;
          ctx.lineWidth = w.width;
          ctx.stroke();
        });

        animId = requestAnimationFrame(renderAudioWaves);
      };

      animId = requestAnimationFrame(renderAudioWaves);
    }

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', updateDimensions);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [effect, intensity, speed, isContainerRelative, isCanvasEffect]);

  if (!effect || effect === 'none') {
    return null;
  }

  const intensityClasses = INTENSITY_OPACITY_MAP[intensity] || INTENSITY_OPACITY_MAP.medium;
  const speedConfig = SPEED_FACTOR_MAP[speed] || SPEED_FACTOR_MAP.normal;
  const positionClass = isContainerRelative ? 'absolute inset-0' : 'fixed inset-0';

  return (
    <div
      className={`${positionClass} pointer-events-none select-none overflow-hidden z-0 ${className}`}
      aria-hidden="true"
    >
      {/* 1. Canvas Layer (Matrix, Cosmic, Plexus, Hyperspace, Audio Waves) */}
      {isCanvasEffect && (
        <canvas
          ref={canvasRef}
          className="w-full h-full block mix-blend-screen"
        />
      )}

      {/* 2. Hexagonal Tactical Shield */}
      {effect === 'hex_tactical_shield' && (
        <div className={`absolute inset-0 ${intensityClasses.overlay}`}>
          <div
            className="w-full h-full"
            style={{
              backgroundImage: `radial-gradient(circle at center, rgba(255,255,255,0.06) 1px, transparent 1px),
                                linear-gradient(120deg, rgba(255,255,255,0.08) 1px, transparent 1px),
                                linear-gradient(-120deg, rgba(255,255,255,0.08) 1px, transparent 1px)`,
              backgroundSize: '48px 48px, 48px 84px, 48px 84px',
            }}
          />
          {/* Breathing Shield Ambient */}
          <div 
            className="absolute inset-0 bg-gradient-radial from-white/[0.04] to-transparent pointer-events-none animate-pulse" 
            style={{ animationDuration: speed === 'fast' ? '2s' : speed === 'slow' ? '6s' : '4s' }}
          />
        </div>
      )}

      {/* 3. Tactical CRT Scanlines */}
      {effect === 'crt_scanlines' && (
        <div className={`absolute inset-0 ${intensityClasses.overlay}`}>
          <div
            className="w-full h-full"
            style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,0) 50%, rgba(255,255,255,0.08) 50%)',
              backgroundSize: '100% 4px',
            }}
          />
          <div className="absolute inset-0 bg-white/[0.015] animate-pulse" />
          <div 
            className="absolute top-0 left-0 right-0 h-1 bg-white/20 blur-[1px] animate-[scanline_5s_linear_infinite]" 
            style={{ animationDuration: speed === 'fast' ? '2.5s' : speed === 'slow' ? '8s' : '5s' }}
          />
        </div>
      )}

      {/* 4. Hyper Lightning Pulse */}
      {effect === 'lightning_pulse' && (
        <div className={`absolute inset-0 overflow-hidden ${intensityClasses.overlay}`}>
          <div 
            className="absolute inset-0 animate-[lightningFlashes_7s_infinite]"
            style={{ animationDuration: speed === 'fast' ? '3.5s' : speed === 'slow' ? '12s' : '7s' }}
          >
            <svg
              className="w-full h-full mix-blend-screen"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <path
                d="M 10,-5 L 18,30 L 12,42 L 26,68 L 20,74 L 35,105"
                stroke="#ffffff"
                strokeWidth="0.5"
                fill="none"
                strokeDasharray="100"
                className="animate-[pulse_2.2s_infinite]"
              />
              <path
                d="M 90,-5 L 82,25 L 88,38 L 74,62 L 80,68 L 65,105"
                stroke="#ffffff"
                strokeWidth="0.4"
                fill="none"
                strokeDasharray="100"
                className="animate-[pulse_3s_infinite]"
              />
              <path
                d="M 48,-10 L 52,20 L 46,35 L 54,55 L 50,75 L 53,105"
                stroke="#ffffff"
                strokeWidth="0.3"
                fill="none"
                opacity="0.6"
                className="animate-[pulse_4s_infinite]"
              />
            </svg>
          </div>
          <div className="absolute inset-0 bg-white/[0.02] animate-pulse" />
        </div>
      )}

      {/* 5. Cyber 3D Vortex Grid */}
      {effect === 'vortex_grid' && (
        <div className={`absolute inset-0 overflow-hidden [perspective:600px] ${intensityClasses.overlay}`}>
          <div
            className="absolute -bottom-40 -left-1/3 -right-1/3 h-[500px] [transform:rotateX(72deg)] opacity-40 animate-[gridScroll_12s_linear_infinite]"
            style={{
              backgroundImage: `linear-gradient(to right, rgba(255, 255, 255, 0.25) 1px, transparent 1px),
                                linear-gradient(to bottom, rgba(255, 255, 255, 0.25) 1px, transparent 1px)`,
              backgroundSize: '40px 40px',
              animationDuration: speedConfig.cssDuration,
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black pointer-events-none" />
        </div>
      )}
    </div>
  );
}
