'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Zap, ShoppingBag, Sparkles, Play, CheckCircle2, Loader2,
  Package, Star, Crown, Shield, ArrowRight, Palette
} from 'lucide-react';
import { SponsorVaultModal } from '@/components/store/SponsorVaultModal';
import { ProfileStudioModal } from '@/components/profile/ProfileStudioModal';
import { useUser } from '@/context/UserContext';
import { useSwrData } from '@/lib/cache';
import Link from '@/lib/navigation';
import { Button, Badge } from '@/components/ui';

interface StoreItem {
  id: string;
  name: string;
  nameAr: string;
  descAr: string;
  price: number;
  type: 'post_boost' | 'ultra_hd' | 'splash_pass' | 'verified_shield' | 'neon_frame' | 'profile_studio_pass';
  icon: React.ReactNode;
  color: string;
  glowColor: string;
  badge?: string;
  duration?: string;
}

const STORE_ITEMS: StoreItem[] = [
  {
    id: 'neon_frame',
    name: 'Monochrome Neon Frame',
    nameAr: 'إطار النيون المتوهج للملف الشخصي',
    descAr: 'إطار نيون ناصع البياض يحيط بصورتك الشخصية مع تأثير توهج نبضي فاخر ومظهر حصري دائم.',
    price: 500,
    type: 'neon_frame',
    icon: <Sparkles className="w-6 h-6" />,
    color: '#ffffff',
    glowColor: 'rgba(255,255,255,0.2)',
    badge: 'كوزمتك مميز',
    duration: 'دائم',
  },
  {
    id: 'profile_studio_pass',
    name: 'Profile Studio VIP Pass',
    nameAr: 'ترخيص استوديو تخصيص البروفايل VIP',
    descAr: 'افتح استوديو التخصيص الكامل: إطارات الأفاتار المتحركة (Cyber Glitch, Holo Orbit)، وتأثيرات الماتريكس والصواعق، وزخارف البانر وشارات الفخر.',
    price: 750,
    type: 'profile_studio_pass',
    icon: <Palette className="w-6 h-6" />,
    color: '#ffffff',
    glowColor: 'rgba(255,255,255,0.25)',
    badge: 'الاستوديو الكامل',
    duration: 'دائم',
  },
  {
    id: 'verified_shield',
    name: 'Official Verified Shield',
    nameAr: 'شارة ودرع التحقق الرسمي',
    descAr: 'تفعيل شارة التحقق الرسمية فورياً بجانب اسم حسابك وفريقك للظهور كعضو موثّق في شبكة IEH.',
    price: 1000,
    type: 'verified_shield',
    icon: <Shield className="w-6 h-6" />,
    color: '#ffffff',
    glowColor: 'rgba(255,255,255,0.2)',
    badge: 'توثيق رسمي',
    duration: 'دائم',
  },
  {
    id: 'post_boost',
    name: 'Neon Feed Boost Card',
    nameAr: 'بطاقة تمييز المنشور النيون',
    descAr: 'اجعل منشورك يتوهج في الخلاصة بإطار نيون متحرك وشارة "مُميَّز". صالحة لمنشور واحد.',
    price: 150,
    type: 'post_boost',
    icon: <Sparkles className="w-6 h-6" />,
    color: '#ffffff',
    glowColor: 'rgba(255,255,255,0.15)',
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
    color: '#ffffff',
    glowColor: 'rgba(255,255,255,0.15)',
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
    color: '#ffffff',
    glowColor: 'rgba(255,255,255,0.15)',
    badge: 'حصري للفرق',
    duration: 'دائم',
  },
];

export default function StorePage() {
  const { user, updateUser } = useUser();
  const balance = user?.ebits_balance || 0;
  const userId = user?.id || null;

  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [purchaseResult, setPurchaseResult] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [isVaultOpen, setIsVaultOpen] = useState(false);
  const [isStudioOpen, setIsStudioOpen] = useState(false);
  const [items] = useState<StoreItem[]>(STORE_ITEMS);

  const { data: inventory = {}, mutate: mutateInventory } = useSwrData<Record<string, number>>(
    userId ? `user_inventory_${userId}` : null,
    async () => {
      const { data: inv } = await supabase
        .from('user_inventory')
        .select('item_type, quantity')
        .eq('user_id', userId!);

      const map: Record<string, number> = {};
      if (inv) {
        inv.forEach((row: { item_type: string; quantity: number }) => {
          map[row.item_type] = (map[row.item_type] || 0) + row.quantity;
        });
      }
      return map;
    },
    { ttl: 180_000 }
  );

  const handlePurchase = async (item: StoreItem) => {
    const activeUid = userId || (typeof window !== 'undefined' ? localStorage.getItem('babylon_user_id') : null);
    if (!activeUid) {
      setPurchaseResult({ type: 'error', msg: 'يرجى تسجيل الدخول أولاً لإتمام الشراء.' });
      return;
    }

    if (balance < item.price) {
      setPurchaseResult({
        type: 'error',
        msg: `رصيدك غير كافٍ! تحتاج إلى ${item.price - balance} eBits إضافية. شاهد إعلانات في الـ Vault لكسب المزيد مجاناً.`
      });
      return;
    }

    setPurchasing(item.id);
    setPurchaseResult(null);

    try {
      const { data, error } = await supabase.rpc('purchase_store_item', {
        p_user_id: activeUid,
        p_item_type: item.type,
        p_item_id: item.id,
        p_item_name: item.nameAr,
        p_price: item.price,
      });

      if (error) throw error;

      if (data && data.success) {
        updateUser({
          ebits_balance: data.ebits_balance,
          ...(data.is_verified !== undefined ? { is_verified: data.is_verified } : {}),
          ...(data.has_neon_frame !== undefined ? { has_neon_frame: data.has_neon_frame, equipped_frame: data.equipped_frame } : {}),
          ...(data.has_profile_studio !== undefined ? { has_profile_studio: data.has_profile_studio } : {}),
        });
        mutateInventory((prev) => ({
          ...(prev || {}),
          [item.type]: data.quantity,
        }));
        setPurchaseResult({
          type: 'success',
          msg: data.message || `تم شراء "${item.nameAr}" بنجاح!`,
        });

        if (item.id === 'profile_studio_pass') {
          setTimeout(() => {
            setIsStudioOpen(true);
          }, 600);
        }
      }
    } catch (err: any) {
      console.error('Purchase error:', err);
      setPurchaseResult({
        type: 'error',
        msg: err.message || 'حدث خطأ أثناء الشراء. يرجى المحاولة لاحقاً.',
      });
    } finally {
      setPurchasing(null);
    }
  };

  const getInventoryCount = (type: string) => inventory[type] || 0;

  return (
    <div className="relative min-h-[calc(100vh-4rem)] pb-20 bg-black" dir="rtl">
      <div className="layout-container py-8 px-4 space-y-6 relative z-10 text-right">
        
        {/* Header */}
        <div className="p-7 rounded-3xl bg-[#090909] border border-white/10 shadow-2xl text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          <div className="flex items-center justify-center gap-3 mb-5">
            <ShoppingBag className="w-8 h-8 text-white" />
            <h1 className="text-2xl font-black text-white">متجر IEH — eStore</h1>
          </div>

          {/* Balance Card */}
          <div className="inline-flex items-center gap-4 px-6 py-4 rounded-2xl bg-black/95 border border-white/20 shadow-sm mb-5">
            <div className="text-right">
              <div className="text-[10px] text-zinc-400 font-bold">رصيد eBits الحالي</div>
              <div className="text-3xl font-black text-white font-mono tracking-tight">{balance.toLocaleString()}</div>
              <div className="text-[10px] text-zinc-500 font-mono">eBits</div>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shadow-sm">
              <Zap className="w-7 h-7 text-white" />
            </div>
          </div>

          {/* Inventory Quick Look */}
          <div className="flex items-center justify-center gap-3 mb-5 flex-wrap">
            <Badge variant="outline" size="sm" className="gap-1.5 font-black text-white">
              <Package className="w-3.5 h-3.5" />
              <span>بطاقات Neon Boost: {getInventoryCount('post_boost')}</span>
            </Badge>
            <Badge variant="outline" size="sm" className="gap-1.5 font-black text-white">
              <Star className="w-3.5 h-3.5" />
              <span>بطاقات Ultra HD: {getInventoryCount('ultra_hd')}</span>
            </Badge>
          </div>

          <Button
            onClick={() => setIsVaultOpen(true)}
            variant="primary"
            size="md"
            icon={<Play className="w-3.5 h-3.5 fill-black" />}
            className="mx-auto font-black text-xs"
          >
            شاهد إعلان واكسب eBits الآن
          </Button>
        </div>

        {/* Purchase Result */}
        {purchaseResult && (
          <div className={`p-4 rounded-2xl text-sm font-bold flex items-center gap-3 animate-in slide-in-from-top duration-300 ${
            purchaseResult.type === 'success'
              ? 'bg-white text-black font-black'
              : 'bg-white/10 border border-white/20 text-white'
          }`}>
            {purchaseResult.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <Zap className="w-5 h-5 shrink-0" />}
            {purchaseResult.msg}
          </div>
        )}

        {/* Store Grid (2x3 on desktop) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(item => {
            const inventoryCount = getInventoryCount(item.type);
            const canAfford = balance >= item.price;
            const isPurchasing = purchasing === item.id;
            const isOwned = 
              (item.id === 'verified_shield' && user?.is_verified) ||
              (item.id === 'neon_frame' && user?.has_neon_frame) ||
              (item.id === 'profile_studio_pass' && user?.has_profile_studio);

            return (
              <div
                key={item.id}
                className="relative p-5 rounded-3xl bg-[#0c0c0c] border border-white/10 hover:border-white/20 transition-all group overflow-hidden flex flex-col justify-between"
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
                        <div className="mb-2">
                          <Badge variant="solid" size="xs">
                            {item.badge}
                          </Badge>
                        </div>
                      )}
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white/10 border border-white/20 text-white shadow-sm">
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
                    <Badge variant="outline" size="xs" className="gap-1">
                      <Package className="w-3 h-3" />
                      لديك {inventoryCount} بطاقة جاهزة
                    </Badge>
                  )}
                </div>

                {/* Price & Buy */}
                <div className="relative z-10 flex items-center justify-between gap-3 pt-4 border-t border-white/5 mt-4">
                  <div className="flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-white" />
                    <span className="text-sm font-black font-mono text-white">
                      {item.price.toLocaleString()} eBits
                    </span>
                  </div>

                  {isOwned ? (
                    item.id === 'profile_studio_pass' ? (
                      <Button
                        onClick={() => setIsStudioOpen(true)}
                        icon={<Palette className="w-3.5 h-3.5" />}
                        variant="primary"
                        size="sm"
                        className="font-black text-xs"
                      >
                        فتح الاستوديو
                      </Button>
                    ) : (
                      <Badge variant="outline" size="sm" className="font-bold border-white/20 text-white">
                        مُفعّل بحسابك
                      </Badge>
                    )
                  ) : (
                    <Button
                      onClick={() => handlePurchase(item)}
                      disabled={isPurchasing}
                      isLoading={isPurchasing}
                      icon={<ShoppingBag className="w-3.5 h-3.5" />}
                      variant={canAfford ? 'primary' : 'secondary'}
                      size="sm"
                      className="font-black text-xs"
                    >
                      شراء
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Team Splash Studio Entry */}
        <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/15 text-right">
          <div className="flex items-center justify-between">
            <Link href="/teams" className="flex items-center gap-1.5 text-white hover:text-zinc-300 text-xs font-bold transition">
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
          onBalanceUpdate={(newBalance) => updateUser({ ebits_balance: newBalance })}
        />
      )}

      {/* Profile Studio Modal */}
      <ProfileStudioModal
        isOpen={isStudioOpen}
        onClose={() => setIsStudioOpen(false)}
      />
    </div>
  );
}
