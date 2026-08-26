'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Play, Zap, Gift, Loader2, CheckCircle2, Volume2, VolumeX } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface SponsorVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  currentBalance: number;
  onBalanceUpdate: (newBalance: number) => void;
}

const SPONSORS = [
  {
    name: 'Logitech G Iraq',
    tagline: 'العب بأدوات الأبطال. تجهيزات Logitech G الرسمية في العراق.',
    color: '#006BFF',
    reward: 25,
    bg: 'from-blue-950 to-black',
    logo: '🎮',
  },
  {
    name: 'Fastnet Esports',
    tagline: 'الإنترنت لا يتحملك — Fastnet يتحملك. أسرع خطوط الجيمنج في العراق.',
    color: '#22d3ee',
    reward: 30,
    bg: 'from-cyan-950 to-black',
    logo: '⚡',
  },
  {
    name: 'RTX Gaming Cafe - Baghdad',
    tagline: 'الحياة الثانية تبدأ هنا. PC Gaming على أعلى مستوى بقلب بغداد.',
    color: '#a855f7',
    reward: 20,
    bg: 'from-purple-950 to-black',
    logo: '🖥️',
  },
];

const AD_DURATION = 20; // seconds

export function SponsorVaultModal({
  isOpen,
  onClose,
  userId,
  currentBalance,
  onBalanceUpdate,
}: SponsorVaultModalProps) {
  const [phase, setPhase] = useState<'idle' | 'watching' | 'claiming' | 'done'>('idle');
  const [countdown, setCountdown] = useState(AD_DURATION);
  const [sponsor] = useState(SPONSORS[Math.floor(Math.random() * SPONSORS.length)]);
  const [isMuted, setIsMuted] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setPhase('idle');
      setCountdown(AD_DURATION);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [isOpen]);

  const startWatching = () => {
    setPhase('watching');
    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleClaim = async () => {
    setPhase('claiming');
    try {
      const newBalance = currentBalance + sponsor.reward;
      const { error } = await supabase
        .from('profiles')
        .update({ ebits_balance: newBalance })
        .eq('id', userId);
      
      if (!error) {
        onBalanceUpdate(newBalance);
        setPhase('done');
      }
    } catch (err) {
      console.error('Error claiming eBits:', err);
      setPhase('done');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={onClose} />

      {/* Modal */}
      <div className={`relative z-10 w-full max-w-md rounded-3xl bg-gradient-to-b ${sponsor.bg} border border-white/15 shadow-2xl overflow-hidden`}>
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
        >
          <X className="w-4 h-4 text-white" />
        </button>

        {/* Header */}
        <div className="p-6 pb-4 text-right">
          <div className="flex items-center justify-end gap-2 mb-1">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full border" style={{ borderColor: sponsor.color, color: sponsor.color, backgroundColor: `${sponsor.color}15` }}>
              محتوى مدفوع من الراعي
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-4xl">{sponsor.logo}</div>
            <div className="text-right">
              <h2 className="text-lg font-black text-white">{sponsor.name}</h2>
              <p className="text-xs text-zinc-400 mt-0.5 max-w-[220px] leading-relaxed">{sponsor.tagline}</p>
            </div>
          </div>
        </div>

        {/* Ad Screen */}
        <div className="mx-4 rounded-2xl overflow-hidden border border-white/10 bg-black/60 h-44 flex items-center justify-center relative">
          <div
            className="absolute inset-0 opacity-20"
            style={{ background: `radial-gradient(ellipse at center, ${sponsor.color} 0%, transparent 70%)` }}
          />
          
          {phase === 'idle' && (
            <button
              onClick={startWatching}
              className="flex flex-col items-center gap-3 group"
            >
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform"
                style={{ backgroundColor: sponsor.color }}
              >
                <Play className="w-7 h-7 text-white fill-white" />
              </div>
              <span className="text-xs font-bold text-white">اضغط لمشاهدة الإعلان</span>
            </button>
          )}

          {phase === 'watching' && (
            <div className="flex flex-col items-center gap-4 w-full px-6">
              {/* Simulated animated ad */}
              <div className="w-full h-20 rounded-xl flex items-center justify-center text-2xl font-black"
                style={{ background: `linear-gradient(135deg, ${sponsor.color}30, transparent)`, border: `1px solid ${sponsor.color}40` }}>
                <span className="animate-pulse">{sponsor.logo} {sponsor.name}</span>
              </div>
              
              {/* Countdown */}
              <div className="flex items-center gap-3 w-full justify-between">
                <button onClick={() => setIsMuted(!isMuted)} className="text-zinc-500 hover:text-white transition">
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${((AD_DURATION - countdown) / AD_DURATION) * 100}%`, backgroundColor: sponsor.color }}
                  />
                </div>
                <span className="text-xs font-black font-mono text-white w-6 text-center">{countdown}</span>
              </div>
            </div>
          )}

          {(phase === 'claiming' || phase === 'done') && (
            <div className="flex flex-col items-center gap-2">
              {phase === 'claiming' ? (
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: sponsor.color }} />
              ) : (
                <CheckCircle2 className="w-12 h-12 text-emerald-400 drop-shadow-[0_0_20px_rgba(52,211,153,0.8)]" />
              )}
            </div>
          )}
        </div>

        {/* Reward Footer */}
        <div className="p-5 pt-4 text-right space-y-3">
          <div className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.04] border border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <Zap className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <div className="text-[10px] text-zinc-400 font-medium">مكافأة المشاهدة</div>
                <div className="text-sm font-black text-white">+{sponsor.reward} eBits</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-zinc-400">رصيدك الحالي</div>
              <div className="text-sm font-black font-mono" style={{ color: sponsor.color }}>{currentBalance} eBits</div>
            </div>
          </div>

          {phase === 'done' ? (
            <button
              onClick={onClose}
              className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-sm transition flex items-center justify-center gap-2"
            >
              <Gift className="w-4 h-4" />
              <span>تم! رصيدك الجديد: {currentBalance + sponsor.reward} eBits 🎉</span>
            </button>
          ) : countdown === 0 && phase === 'watching' ? (
            <button
              onClick={handleClaim}
              className="w-full py-3 rounded-2xl font-black text-sm transition flex items-center justify-center gap-2 hover:brightness-110"
              style={{ backgroundColor: sponsor.color, color: '#000' }}
            >
              <Zap className="w-4 h-4" />
              <span>المطالبة بـ +{sponsor.reward} eBits الآن! 🔥</span>
            </button>
          ) : (
            <div className="w-full py-3 rounded-2xl bg-white/5 border border-white/10 text-zinc-500 font-black text-sm text-center">
              {phase === 'idle' ? 'شاهد الإعلان كاملاً للمطالبة بالمكافأة' : `انتظر ${countdown} ثانية...`}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
