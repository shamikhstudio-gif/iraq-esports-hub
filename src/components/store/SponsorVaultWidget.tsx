'use client';

import React, { useState, useEffect } from 'react';
import { Zap, Play, TrendingUp, ChevronLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/context/UserContext';
import { SponsorVaultModal } from './SponsorVaultModal';
import Link from '@/lib/navigation';
import { Button, Card } from '@/components/ui';

const COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes between ads
const COOLDOWN_KEY = 'ieh_sponsor_vault_last_watch';

export function SponsorVaultWidget() {
  const { user, updateUser } = useUser();
  const balance = user?.ebits_balance || 0;
  const userId = user?.id || null;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  useEffect(() => {
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
    updateUser({ ebits_balance: newBalance });
    localStorage.setItem(COOLDOWN_KEY, Date.now().toString());
    checkCooldown();
  };

  if (!userId) return null;

  const cooldownMins = Math.floor(cooldownRemaining / 60);
  const cooldownSecs = cooldownRemaining % 60;
  const canWatch = cooldownRemaining === 0;

  return (
    <>
      <Card className="p-4 relative overflow-hidden group border-white/15 hover:border-white/30 transition-all">
        <div
          className="absolute inset-0 pointer-events-none opacity-20 group-hover:opacity-30 transition-opacity"
          style={{ background: 'radial-gradient(ellipse at right bottom, rgba(255,255,255,0.08) 0%, transparent 70%)' }}
        />

        <div className="relative z-10 space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <Link href="/store" className="text-[10px] text-zinc-500 hover:text-white font-bold flex items-center gap-0.5 transition">
              eStore <ChevronLeft className="w-3 h-3" />
            </Link>
            <div className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-white" />
              <span className="text-xs font-black text-white">{balance.toLocaleString()} eBits</span>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-white/5" />

          {/* CTA */}
          <div className="text-right">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-xs font-black text-white">إعلانات الرعاة (eSponsor Vault)</span>
              <span className="text-[10px] font-mono text-zinc-300 font-bold px-1.5 py-0.5 rounded bg-white/5 border border-white/10">
                +20 إلى +30 eBits
              </span>
            </div>
            <p className="text-[10px] text-zinc-400 leading-relaxed mb-3">
              شاهد إعلان أحد الرعاة الرسميين واكسب عملات eBits إضافية.
            </p>
          </div>

          <Button
            fullWidth
            size="sm"
            variant={canWatch ? 'primary' : 'secondary'}
            disabled={!canWatch}
            onClick={handleOpenVault}
            icon={canWatch ? <Play className="w-3.5 h-3.5 fill-current" /> : <TrendingUp className="w-3.5 h-3.5" />}
          >
            {canWatch ? 'شاهد واربح eBits' : `${cooldownMins > 0 ? `${cooldownMins}د ` : ''}${cooldownSecs}ث حتى الإعلان التالي`}
          </Button>
        </div>
      </Card>

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
