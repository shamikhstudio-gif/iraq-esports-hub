import { Icon } from '@/components/ui/Icon';
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Play, Zap, Gift, Loader2, CheckCircle2, Volume2, VolumeX } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button, Badge } from '@/components/ui';

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
    color: '#ffffff',
    reward: 25,
    bg: 'from-white/[0.08] to-black',
    logoSymbol: 'sports_esports',
  },
  {
    name: 'Fastnet Esports',
    tagline: 'الإنترنت لا يتحملك — Fastnet يتحملك. أسرع خطوط الجيمنج في العراق.',
    color: '#ffffff',
    reward: 30,
    bg: 'from-white/[0.08] to-black',
    logoSymbol: 'bolt',
  },
  {
    name: 'RTX Gaming Cafe - Baghdad',
    tagline: 'الحياة الثانية تبدأ هنا. PC Gaming على أعلى مستوى بقلب بغداد.',
    color: '#ffffff',
    reward: 20,
    bg: 'from-white/[0.08] to-black',
    logoSymbol: 'desktop_windows',
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
      const { data, error } = await supabase.rpc('claim_vault_reward', {
        p_user_id: userId,
        p_reward_amount: sponsor.reward,
      });
      
      if (!error && data && data.success) {
        onBalanceUpdate(data.ebits_balance);
        setPhase('done');
      } else {
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
      <div className="absolute inset-0 bg-black/95" onClick={onClose} />

      {/* Modal */}
      <div className={`relative z-10 w-full max-w-md rounded-3xl bg-gradient-to-b ${sponsor.bg} border border-white/15 shadow-2xl overflow-hidden`}>
        
        {/* Close button */}
        <Button
          onClick={onClose}
          size="icon-sm"
          variant="ghost"
          className="absolute top-4 right-4 z-20 rounded-full bg-white/10 hover:bg-white/20"
          icon={<X className="w-4 h-4 text-white" />}
          aria-label="إغلاق"
        />

        {/* Header */}
        <div className="p-6 pb-4 text-right">
          <div className="flex items-center justify-end gap-2 mb-1">
            <Badge variant="outline" size="xs">
              محتوى مدفوع من الراعي
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white"><Icon name={sponsor.logoSymbol} size={28} /></div>
            <div className="text-right">
              <h2 className="text-lg font-black text-white">{sponsor.name}</h2>
              <p className="text-xs text-zinc-400 mt-0.5 max-w-[220px] leading-relaxed">{sponsor.tagline}</p>
            </div>
          </div>
        </div>

        {/* Ad Screen */}
        <div className="mx-4 rounded-2xl overflow-hidden border border-white/10 bg-black/95 h-44 flex items-center justify-center relative">
          <div
            className="absolute inset-0 opacity-20"
            style={{ background: `radial-gradient(ellipse at center, ${sponsor.color} 0%, transparent 70%)` }}
          />
          
          {phase === 'idle' && (
            <button
              onClick={startWatching}
              className="flex flex-col items-center gap-3 group cursor-pointer"
            >
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform bg-white"
              >
                <Play className="w-7 h-7 text-black fill-black" />
              </div>
              <span className="text-xs font-bold text-white">اضغط لمشاهدة الإعلان</span>
            </button>
          )}

          {phase === 'watching' && (
            <div className="flex flex-col items-center gap-4 w-full px-6">
              {/* Simulated animated ad */}
              <div className="w-full h-20 rounded-xl flex items-center justify-center text-2xl font-black bg-white/5 border border-white/20">
                <span className="animate-pulse">{sponsor.name}</span>
              </div>
              
              {/* Countdown */}
              <div className="flex items-center gap-3 w-full justify-between">
                <Button 
                  size="icon-sm"
                  variant="ghost"
                  onClick={() => setIsMuted(!isMuted)} 
                  className="text-zinc-400 hover:text-white"
                  icon={isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                />
                <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all bg-white"
                    style={{ width: `${((AD_DURATION - countdown) / AD_DURATION) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-black font-mono text-white w-6 text-center">{countdown}</span>
              </div>
            </div>
          )}

          {(phase === 'claiming' || phase === 'done') && (
            <div className="flex flex-col items-center gap-2">
              {phase === 'claiming' ? (
                <Loader2 className="w-8 h-8 animate-spin text-white" />
              ) : (
                <CheckCircle2 className="w-12 h-12 text-white drop-shadow-sm" />
              )}
            </div>
          )}
        </div>

        {/* Reward Footer */}
        <div className="p-5 pt-4 text-right space-y-3">
          <div className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.04] border border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="text-[10px] text-zinc-400 font-medium">مكافأة المشاهدة</div>
                <div className="text-sm font-black text-white">+{sponsor.reward} eBits</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-zinc-400">رصيدك الحالي</div>
              <div className="text-sm font-black font-mono text-white">{currentBalance} eBits</div>
            </div>
          </div>

          {phase === 'done' ? (
            <Button
              onClick={onClose}
              variant="primary"
              size="lg"
              icon={<Gift className="w-4 h-4" />}
              className="w-full font-black text-sm"
            >
              تم! رصيدك الجديد: {currentBalance + sponsor.reward} eBits
            </Button>
          ) : countdown === 0 && phase === 'watching' ? (
            <Button
              onClick={handleClaim}
              variant="primary"
              size="lg"
              icon={<Zap className="w-4 h-4" />}
              className="w-full font-black text-sm"
            >
              المطالبة بـ +{sponsor.reward} eBits الآن!
            </Button>
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
