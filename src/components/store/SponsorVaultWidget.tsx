'use client';

import React, { useState, useEffect } from 'react';
import { Zap, Play, TrendingUp, ChevronLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { SponsorVaultModal } from './SponsorVaultModal';
import Link from 'next/link';

const COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes between ads
const COOLDOWN_KEY = 'ieh_sponsor_vault_last_watch';

export function SponsorVaultWidget() {
  const [balance, setBalance] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedId = typeof window !== 'undefined' ? localStorage.getItem('babylon_user_id') : null;
    if (!savedId) { setIsLoading(false); return; }
    setUserId(savedId);

    supabase.from('profiles').select('ebits_balance').eq('id', savedId).single().then(({ data }) => {
      if (data) setBalance(data.ebits_balance || 0);
      setIsLoading(false);
    });

    checkCooldown();
    const interval = setInterval(checkCooldown, 1000);
    return () => clearInterval(interval);
  }, []);

  const checkCooldown = () => {
    const lastWatch = localStorage.getItem(COOLDOWN_KEY);
    if (!lastWatch) { setCooldownRemaining(0); return; }
    const diff = Date.now() - parseInt(lastWatch);
    const remaining = Math.max(0, COOLDOWN_MS - diff);
    setCooldownRemaining(Math.ceil(remaining / 1000));
  };

  const handleOpenVault = () => {
    if (cooldownRemaining > 0) return;
    setIsModalOpen(true);
  };

  const handleBalanceUpdate = (newBalance: number) => {
    setBalance(newBalance);
    localStorage.setItem(COOLDOWN_KEY, Date.now().toString());
    checkCooldown();
  };

  if (isLoading || !userId) return null;

  const cooldownMins = Math.floor(cooldownRemaining / 60);
  const cooldownSecs = cooldownRemaining % 60;
  const canWatch = cooldownRemaining === 0;

  return (
    <>
      <div className="card-3d p-4 relative overflow-hidden group border border-amber-500/15 hover:border-amber-500/30 transition-all">
        <div
          className="absolute inset-0 pointer-events-none opacity-10 group-hover:opacity-20 transition-opacity"
          style={{ background: 'radial-gradient(ellipse at right bottom, rgba(245,158,11,0.6) 0%, transparent 70%)' }}
        />

        <div className="relative z-10 space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <Link href="/store" className="text-[10px] text-zinc-500 hover:text-white font-bold flex items-center gap-0.5 transition">
              eStore <ChevronLeft className="w-3 h-3" />
            </Link>
            <div className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-black text-white">{balance.toLocaleString()} eBits</span>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-white/5" />

          {/* CTA */}
          <div className="text-right">
            <div className="text-xs font-black text-white mb-0.5">eSponsor Vault 🎯</div>
            <p className="text-[10px] text-zinc-400 leading-relaxed mb-3">
              شاهد إعلان الراعي واكسب eBits لشراء تخصيصات حصرية.
            </p>
          </div>

          <button
            onClick={handleOpenVault}
            disabled={!canWatch}
            className={`w-full py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition ${
              canWatch
                ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-[0_0_20px_rgba(245,158,11,0.25)] hover:shadow-[0_0_30px_rgba(245,158,11,0.4)] hover:scale-[1.02]'
                : 'bg-zinc-800 text-zinc-500 border border-white/5 cursor-not-allowed'
            }`}
          >
            {canWatch ? (
              <>
                <Play className="w-3.5 h-3.5 fill-black" />
                <span>شاهد واربح eBits</span>
              </>
            ) : (
              <>
                <TrendingUp className="w-3.5 h-3.5" />
                <span>
                  {cooldownMins > 0 ? `${cooldownMins}د ` : ''}{cooldownSecs}ث حتى الإعلان التالي
                </span>
              </>
            )}
          </button>
        </div>
      </div>

      <SponsorVaultModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        userId={userId}
        currentBalance={balance}
        onBalanceUpdate={handleBalanceUpdate}
      />
    </>
  );
}
