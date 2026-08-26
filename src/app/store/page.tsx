'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Zap, ShoppingBag, Sparkles, Play, CheckCircle2, Loader2,
  Package, Star, Crown, Shield, ArrowRight
} from 'lucide-react';
import { SponsorVaultModal } from '@/components/store/SponsorVaultModal';
import Link from 'next/link';

interface StoreItem {
  id: string;
  name: string;
  nameAr: string;
  descAr: string;
  price: number;
  type: 'post_boost' | 'ultra_hd' | 'splash_pass' | 'verified_shield';
  icon: React.ReactNode;
  color: string;
  glowColor: string;
  badge?: string;
  duration?: string;
}

const STORE_ITEMS: StoreItem[] = [
  {
    id: 'post_boost',
    name: 'Neon Feed Boost Card',
    nameAr: 'بطاقة تمييز المنشور النيون',
    descAr: 'اجعل منشورك يتوهج في الخلاصة بإطار نيون متحرك وشارة "مُميَّز 🔥". صالحة لمنشور واحد.',
    price: 150,
    type: 'post_boost',
    icon: <Sparkles className="w-6 h-6" />,
    color: '#f59e0b',
    glowColor: 'rgba(245,158,11,0.4)',
    badge: 'الأكثر طلباً',
    duration: 'استخدام واحد',
  },
  {
    id: 'ultra_hd',
    name: 'Ultra HD 4K Upload Card',
    nameAr: 'بطاقة رفع وسائط 4K فائقة الدقة',
    descAr: 'ارفع صوراً وفيديوهات بجودة 4K فائقة الدقة مع شارة "Ultra HD" على منشورك. صالحة لمنشور واحد.',
    price: 200,
    type: 'ultra_hd',
    icon: <Star className="w-6 h-6" />,
    color: '#06b6d4',
    glowColor: 'rgba(6,182,212,0.4)',
    duration: 'استخدام واحد',
  },
  {
    id: 'splash_pass',
    name: 'Team Entry Splash Studio Pass',
    nameAr: 'ترخيص استوديو أنيميشن دخول الفريق',
    descAr: 'افتح استوديو التصميم المتقدم لإنشاء أنيميشن حصري يظهر لكل زائر لصفحة فريقك. دائم.',
    price: 1500,
    type: 'splash_pass',
    icon: <Crown className="w-6 h-6" />,
    color: '#a855f7',
    glowColor: 'rgba(168,85,247,0.4)',
    badge: 'حصري للفرق',
    duration: 'دائم',
  },
  {
    id: 'verified_shield',
    name: 'Team Verified Shield',
    nameAr: 'درع التحقق الرسمي للفريق',
    descAr: 'قدّم طلب التحقق الرسمي بشكل مباشر مع إشارة درع التحقق المميزة بجانب اسم فريقك.',
    price: 3000,
    type: 'verified_shield',
    icon: <Shield className="w-6 h-6" />,
    color: '#22c55e',
    glowColor: 'rgba(34,197,94,0.4)',
    duration: 'دائم',
  },
];

export default function StorePage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [balance, setBalance] = useState(0);
  const [boostCards, setBoostCards] = useState(0);
  const [ultraHdCards, setUltraHdCards] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [purchaseResult, setPurchaseResult] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [isVaultOpen, setIsVaultOpen] = useState(false);

  useEffect(() => {
    const savedId = typeof window !== 'undefined' ? localStorage.getItem('babylon_user_id') : null;
    if (!savedId) { setIsLoading(false); return; }
    setUserId(savedId);
    fetchUserData(savedId);
  }, []);

  const fetchUserData = async (id: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('ebits_balance, boost_cards_count, ultra_hd_cards_count')
      .eq('id', id)
      .single();
    if (data) {
      setBalance(data.ebits_balance || 0);
      setBoostCards(data.boost_cards_count || 0);
      setUltraHdCards(data.ultra_hd_cards_count || 0);
    }
    setIsLoading(false);
  };

  const handlePurchase = async (item: StoreItem) => {
    if (!userId || balance < item.price) {
      setPurchaseResult({ type: 'error', msg: 'رصيد eBits غير كافٍ. شاهد المزيد من إعلانات الرعاة لتجميع المزيد!' });
      setTimeout(() => setPurchaseResult(null), 4000);
      return;
    }
    setPurchasing(item.id);
    setPurchaseResult(null);
    
    try {
      const updates: Record<string, number> = { ebits_balance: balance - item.price };
      if (item.type === 'post_boost') updates.boost_cards_count = boostCards + 1;
      if (item.type === 'ultra_hd') updates.ultra_hd_cards_count = ultraHdCards + 1;

      const { error } = await supabase.from('profiles').update(updates).eq('id', userId);
      if (error) throw error;

      setBalance(prev => prev - item.price);
      if (item.type === 'post_boost') setBoostCards(prev => prev + 1);
      if (item.type === 'ultra_hd') setUltraHdCards(prev => prev + 1);
      
      setPurchaseResult({ type: 'success', msg: `تم شراء "${item.nameAr}" بنجاح! ${item.type === 'post_boost' ? `لديك الآن ${boostCards + 1} بطاقة.` : item.type === 'ultra_hd' ? `لديك الآن ${ultraHdCards + 1} بطاقة.` : 'تحقق من صفحة فريقك للوصول.'}` });
      setTimeout(() => setPurchaseResult(null), 5000);
    } catch {
      setPurchaseResult({ type: 'error', msg: 'حدث خطأ أثناء معالجة الشراء.' });
      setTimeout(() => setPurchaseResult(null), 4000);
    } finally {
      setPurchasing(null);
    }
  };

  const getInventoryCount = (type: StoreItem['type']) => {
    if (type === 'post_boost') return boostCards;
    if (type === 'ultra_hd') return ultraHdCards;
    return null;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative min-h-[calc(100vh-4rem)] pb-20" dir="rtl">
      <div className="fixed top-0 left-0 right-0 h-[500px] pointer-events-none z-0 opacity-25"
        style={{ background: 'radial-gradient(ellipse 70% 40% at 50% 0%, rgba(245,158,11,0.3) 0%, transparent 80%)' }}
      />

      <div className="max-w-4xl mx-auto py-8 px-4 space-y-6 relative z-10 text-right">
        
        {/* Header */}
        <div className="p-7 rounded-3xl bg-[#090909] border border-white/10 shadow-2xl text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
          <div className="flex items-center justify-center gap-3 mb-5">
            <ShoppingBag className="w-8 h-8 text-amber-400" />
            <h1 className="text-2xl font-black text-white">متجر IEH — eStore</h1>
          </div>

          {/* Balance Card */}
          <div className="inline-flex items-center gap-4 px-6 py-4 rounded-2xl bg-black/60 border border-amber-500/30 shadow-[0_0_30px_rgba(245,158,11,0.15)] mb-5">
            <div className="text-right">
              <div className="text-[10px] text-zinc-400 font-bold">رصيد eBits الحالي</div>
              <div className="text-3xl font-black text-amber-400 font-mono tracking-tight">{balance.toLocaleString()}</div>
              <div className="text-[10px] text-zinc-500 font-mono">eBits</div>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.3)]">
              <Zap className="w-7 h-7 text-amber-400" />
            </div>
          </div>

          {/* Inventory Quick Look */}
          <div className="flex items-center justify-center gap-3 mb-5 flex-wrap">
            <div className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs font-black text-amber-400 flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5" />
              <span>بطاقات Neon Boost: {boostCards}</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-xs font-black text-cyan-400 flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5" />
              <span>بطاقات Ultra HD: {ultraHdCards}</span>
            </div>
          </div>

          <button
            onClick={() => setIsVaultOpen(true)}
            className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs flex items-center gap-2 mx-auto transition hover:scale-105 shadow-[0_0_20px_rgba(245,158,11,0.3)]"
          >
            <Play className="w-3.5 h-3.5 fill-black" />
            شاهد إعلان واكسب eBits الآن
          </button>
        </div>

        {/* Purchase Result */}
        {purchaseResult && (
          <div className={`p-4 rounded-2xl text-sm font-bold flex items-center gap-3 animate-in slide-in-from-top duration-300 ${
            purchaseResult.type === 'success'
              ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
              : 'bg-red-500/15 border border-red-500/30 text-red-300'
          }`}>
            {purchaseResult.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <Zap className="w-5 h-5 shrink-0" />}
            {purchaseResult.msg}
          </div>
        )}

        {/* Store Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {STORE_ITEMS.map(item => {
            const inventoryCount = getInventoryCount(item.type);
            const canAfford = balance >= item.price;
            const isPurchasing = purchasing === item.id;

            return (
              <div
                key={item.id}
                className="relative p-5 rounded-3xl bg-[#0c0c0c] border border-white/10 hover:border-white/20 transition-all group overflow-hidden"
              >
                <div
                  className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: `radial-gradient(ellipse at top right, ${item.glowColor} 0%, transparent 60%)` }}
                />

                <div className="relative z-10 space-y-4">
                  {/* Item Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="shrink-0">
                      {item.badge && (
                        <span className="block text-[9px] font-black px-2 py-0.5 rounded-full mb-2 text-center"
                          style={{ backgroundColor: `${item.color}25`, color: item.color, border: `1px solid ${item.color}40` }}>
                          {item.badge}
                        </span>
                      )}
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                        style={{ backgroundColor: `${item.color}20`, border: `1px solid ${item.color}30`, color: item.color, boxShadow: `0 0 15px ${item.glowColor}` }}>
                        {item.icon}
                      </div>
                    </div>
                    <div className="flex-1 text-right">
                      <h3 className="text-sm font-black text-white leading-tight">{item.nameAr}</h3>
                      <div className="text-[10px] text-zinc-500 font-mono mt-0.5">{item.duration}</div>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-400 leading-relaxed">{item.descAr}</p>

                  {/* Inventory Count */}
                  {inventoryCount !== null && inventoryCount > 0 && (
                    <div className="text-[10px] font-black px-2.5 py-1 rounded-lg inline-flex items-center gap-1"
                      style={{ backgroundColor: `${item.color}15`, color: item.color, border: `1px solid ${item.color}25` }}>
                      <Package className="w-3 h-3" />
                      لديك {inventoryCount} بطاقة جاهزة
                    </div>
                  )}

                  {/* Price & Buy */}
                  <div className="flex items-center justify-between gap-3 pt-1 border-t border-white/5">
                    <div className="flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-sm font-black font-mono" style={{ color: canAfford ? item.color : '#71717a' }}>
                        {item.price.toLocaleString()} eBits
                      </span>
                    </div>
                    <button
                      onClick={() => handlePurchase(item)}
                      disabled={isPurchasing}
                      className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition ${
                        canAfford
                          ? 'hover:brightness-110 hover:scale-105 active:scale-95'
                          : 'opacity-40 cursor-not-allowed'
                      }`}
                      style={canAfford ? {
                        backgroundColor: item.color,
                        color: '#000',
                        boxShadow: `0 4px 15px ${item.glowColor}`,
                      } : { backgroundColor: '#27272a', color: '#71717a' }}
                    >
                      {isPurchasing ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <>
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>شراء</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Team Splash Studio Entry */}
        <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-950/60 to-[#0c0c0c] border border-purple-500/20 text-right">
          <div className="flex items-center justify-between">
            <Link href="/teams" className="flex items-center gap-1.5 text-purple-400 hover:text-purple-300 text-xs font-bold transition">
              <span>فتح استوديو الفرق</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <div>
              <h3 className="text-sm font-black text-white">هل اشتريت ترخيص Splash Studio؟</h3>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                اذهب إلى صفحة فريقك → إعدادات الفريق → استوديو الدخول لتفعيله وتصميم الأنيميشن.
              </p>
            </div>
          </div>
        </div>
      </div>

      {userId && (
        <SponsorVaultModal
          isOpen={isVaultOpen}
          onClose={() => setIsVaultOpen(false)}
          userId={userId}
          currentBalance={balance}
          onBalanceUpdate={(newBalance) => setBalance(newBalance)}
        />
      )}
    </div>
  );
}
