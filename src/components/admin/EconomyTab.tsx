'use client';

import React from 'react';
import { 
  ShoppingBag, 
  Save, 
  Sparkles, 
  Star, 
  Crown, 
  Shield, 
  Zap, 
  Gift, 
  Coins, 
  Plus, 
  Minus, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';
import { Profile, Team } from '@/lib/types';
import { Button } from '@/components/ui';

interface EconomyTabProps {
  settingsNotice: { type: 'success' | 'error'; msg: string } | null;
  storePrices: {
    post_boost: number;
    ultra_hd: number;
    splash_pass: number;
    verified_shield: number;
  };
  setStorePrices: React.Dispatch<React.SetStateAction<{
    post_boost: number;
    ultra_hd: number;
    splash_pass: number;
    verified_shield: number;
  }>>;
  vaultConfig: {
    default_reward: number;
    ad_duration: number;
    cooldown_minutes: number;
  };
  setVaultConfig: React.Dispatch<React.SetStateAction<{
    default_reward: number;
    ad_duration: number;
    cooldown_minutes: number;
  }>>;
  dailyConfig: {
    daily_xp?: number;
    daily_ebits: number;
  };
  setDailyConfig: React.Dispatch<React.SetStateAction<{
    daily_xp?: number;
    daily_ebits: number;
  }>>;
  isSavingSettings: boolean;
  handleSaveEconomySettings: () => void;
  modifierTargetType: 'user' | 'team';
  setModifierTargetType: (type: 'user' | 'team') => void;
  modifierTargetId: string;
  setModifierTargetId: (id: string) => void;
  modifierAmount: number;
  setModifierAmount: (amount: number) => void;
  isModifyingBalance: boolean;
  handleAdjustBalance: (delta: number) => void;
  users: Profile[];
  teams: Team[];
}

export function EconomyTab({
  settingsNotice,
  storePrices,
  setStorePrices,
  vaultConfig,
  setVaultConfig,
  dailyConfig,
  setDailyConfig,
  isSavingSettings,
  handleSaveEconomySettings,
  modifierTargetType,
  setModifierTargetType,
  modifierTargetId,
  setModifierTargetId,
  modifierAmount,
  setModifierAmount,
  isModifyingBalance,
  handleAdjustBalance,
  users,
  teams,
}: EconomyTabProps) {
  return (
    <div className="space-y-6 text-right animate-in fade-in duration-200">
      {/* Notification Banner */}
      {settingsNotice && (
        <div className={`p-4 rounded-2xl text-xs font-black flex items-center justify-between gap-3 shadow-lg ${
 settingsNotice.type === 'success'
 ? 'bg-white text-black font-black border-white'
 : 'bg-white/10 border border-white/20 text-white'
 }`}>
          <div className="flex items-center gap-2">
            {settingsNotice.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            <span>{settingsNotice.msg}</span>
          </div>
        </div>
      )}

      {/* 1. STORE ITEMS PRICING CONFIG */}
      <div className="card-3d p-6 space-y-5 border-white/15">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <h2 className="text-base font-black text-white flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-white" />
              <span>تعديل أسعار متجر المنصة (eStore Prices)</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              الأسعار المحددة هنا تُطبق فورياً وبشكل حي على صفحة المتجر (/store) لجميع اللاعبين والفرق.
            </p>
          </div>

          <Button
            variant="primary"
            size="md"
            onClick={handleSaveEconomySettings}
            isLoading={isSavingSettings}
            icon={<Save className="w-4 h-4" />}
            className="font-black"
          >
            حفظ التعديلات في النظام
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Item 1: Post Boost */}
          <div className="p-4 rounded-2xl bg-black/95 border border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">بطاقة تمييز المنشور (Neon Boost)</span>
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <p className="text-[10px] text-zinc-500 leading-tight">سعر البطاقة الواحدة لتمييز المنشور بوهج نيون</p>
            <div className="relative pt-1">
              <input
                type="number"
                min={10}
                max={50000}
                step={10}
                value={storePrices.post_boost}
                onChange={(e) => setStorePrices({ ...storePrices, post_boost: Number(e.target.value) || 0 })}
                className="w-full input-3d rounded-xl px-3 py-2 text-xs font-mono font-black text-white"
              />
              <span className="absolute left-3 top-3 text-[10px] font-mono text-zinc-500">eBits</span>
            </div>
          </div>

          {/* Item 2: Ultra HD */}
          <div className="p-4 rounded-2xl bg-black/95 border border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">بطاقة رفع وسائط 4K (Ultra HD)</span>
              <Star className="w-4 h-4 text-white" />
            </div>
            <p className="text-[10px] text-zinc-500 leading-tight">سعر تفعيل البث والرفع بجودة 4K فائقة الدقة</p>
            <div className="relative pt-1">
              <input
                type="number"
                min={10}
                max={50000}
                step={10}
                value={storePrices.ultra_hd}
                onChange={(e) => setStorePrices({ ...storePrices, ultra_hd: Number(e.target.value) || 0 })}
                className="w-full input-3d rounded-xl px-3 py-2 text-xs font-mono font-black text-white"
              />
              <span className="absolute left-3 top-3 text-[10px] font-mono text-zinc-500">eBits</span>
            </div>
          </div>

          {/* Item 3: Splash Pass */}
          <div className="p-4 rounded-2xl bg-black/95 border border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">ترخيص استوديو الدخول (Splash Studio)</span>
              <Crown className="w-4 h-4 text-white" />
            </div>
            <p className="text-[10px] text-zinc-500 leading-tight">سعر فتح استوديو تصميم أنيميشن دخول صفحة الفريق</p>
            <div className="relative pt-1">
              <input
                type="number"
                min={50}
                max={100000}
                step={50}
                value={storePrices.splash_pass}
                onChange={(e) => setStorePrices({ ...storePrices, splash_pass: Number(e.target.value) || 0 })}
                className="w-full input-3d rounded-xl px-3 py-2 text-xs font-mono font-black text-white"
              />
              <span className="absolute left-3 top-3 text-[10px] font-mono text-zinc-500">eBits</span>
            </div>
          </div>

          {/* Item 4: Verified Shield */}
          <div className="p-4 rounded-2xl bg-black/95 border border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">درع توثيق الفريق (Verified Shield)</span>
              <Shield className="w-4 h-4 text-white" />
            </div>
            <p className="text-[10px] text-zinc-500 leading-tight">سعر تقديم طلب التوثيق الرسمي للكلان أو الفريق</p>
            <div className="relative pt-1">
              <input
                type="number"
                min={100}
                max={200000}
                step={100}
                value={storePrices.verified_shield}
                onChange={(e) => setStorePrices({ ...storePrices, verified_shield: Number(e.target.value) || 0 })}
                className="w-full input-3d rounded-xl px-3 py-2 text-xs font-mono font-black text-white"
              />
              <span className="absolute left-3 top-3 text-[10px] font-mono text-zinc-500">eBits</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. SPONSOR VAULT & DAILY REWARDS CONFIG */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Sponsor Vault Settings */}
        <div className="card-3d p-5 space-y-4">
          <div className="flex items-center gap-2 text-white font-extrabold text-sm border-b border-white/10 pb-3">
            <Zap className="w-4 h-4 text-white" />
            <span>إعدادات إعلانات الرعاة (eSponsor Vault)</span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1">مكافأة مشاهدة الإعلان الواحد (eBits):</label>
              <input
                type="number"
                min={5}
                max={1000}
                value={vaultConfig.default_reward}
                onChange={(e) => setVaultConfig({ ...vaultConfig, default_reward: Number(e.target.value) || 0 })}
                className="w-full input-3d rounded-xl px-3 py-2 text-xs font-mono font-black text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1">مدة الإعلان الإجبارية (بالثواني):</label>
              <input
                type="number"
                min={5}
                max={60}
                value={vaultConfig.ad_duration}
                onChange={(e) => setVaultConfig({ ...vaultConfig, ad_duration: Number(e.target.value) || 0 })}
                className="w-full input-3d rounded-xl px-3 py-2 text-xs font-mono font-black text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1">فترة الانتظار بين الإعلانات (بالدقائق):</label>
              <input
                type="number"
                min={1}
                max={120}
                value={vaultConfig.cooldown_minutes}
                onChange={(e) => setVaultConfig({ ...vaultConfig, cooldown_minutes: Number(e.target.value) || 0 })}
                className="w-full input-3d rounded-xl px-3 py-2 text-xs font-mono font-black text-white"
              />
            </div>
          </div>
        </div>

        {/* Daily Rewards Settings */}
        <div className="card-3d p-5 space-y-4">
          <div className="flex items-center gap-2 text-white font-extrabold text-sm border-b border-white/10 pb-3">
            <Gift className="w-4 h-4 text-white" />
            <span>إعدادات مكافآت الدخول اليومي (Daily Check-in)</span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1">رصيد eBits اليومي الممنوح (Daily eBits):</label>
              <input
                type="number"
                min={0}
                max={5000}
                value={dailyConfig.daily_ebits}
                onChange={(e) => setDailyConfig({ ...dailyConfig, daily_ebits: Number(e.target.value) || 0 })}
                className="w-full input-3d rounded-xl px-3 py-2 text-xs font-mono font-black text-white"
              />
              <p className="text-[10px] text-zinc-500 mt-1">الرصيد الذي يحصل عليه اللاعب يومياً عند النقر على مكافأة تسجيل الدخول.</p>
            </div>

            <div className="pt-2">
              <Button
                variant="primary"
                size="md"
                onClick={handleSaveEconomySettings}
                isLoading={isSavingSettings}
                className="w-full font-black"
              >
                حفظ وتثبيت المكافآت اليومية
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. DIRECT USER BALANCE MODIFIER */}
      <div className="card-3d p-6 space-y-4 border-white/20">
        <div className="border-b border-white/10 pb-3">
          <h3 className="text-sm font-black text-white flex items-center gap-2">
            <Coins className="w-4 h-4 text-white" />
            <span>شحن أو تعديل رصيد eBits المباشر للاعبين</span>
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            يمكنك كمسؤول منح أو خصم عملات eBits لأي لاعب مع إرسال إشعار فوري في حسابه (العملة مخصصة لحسابات اللاعبين الفردية).
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
          <div className="sm:col-span-6">
            <label className="block text-xs font-bold text-zinc-300 mb-1.5">
              اختر اللاعب المستهدف:
            </label>
            <select
              value={modifierTargetId}
              onChange={(e) => setModifierTargetId(e.target.value)}
              className="w-full input-3d rounded-xl px-3 py-2 text-xs font-bold text-white"
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.full_name} (@{u.username}) — الرصيد الحالي: {(u.ebits_balance || 0)} eBits
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-zinc-300 mb-1.5">الكمية (eBits):</label>
            <input
              type="number"
              min={1}
              max={500000}
              step={50}
              value={modifierAmount}
              onChange={(e) => setModifierAmount(Number(e.target.value) || 0)}
              className="w-full input-3d rounded-xl px-3 py-2 text-xs font-mono font-black text-white"
            />
          </div>

          <div className="sm:col-span-4 flex items-center gap-1.5">
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleAdjustBalance(modifierAmount)}
              isLoading={isModifyingBalance}
              disabled={modifierAmount <= 0}
              icon={<Plus className="w-3.5 h-3.5" />}
              className="flex-1 font-black"
              title="إضافة رصيد"
            >
              شحن (+)
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleAdjustBalance(-modifierAmount)}
              isLoading={isModifyingBalance}
              disabled={modifierAmount <= 0}
              icon={<Minus className="w-3.5 h-3.5" />}
              className="flex-1 font-black"
              title="خصم رصيد"
            >
              خصم (-)
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
