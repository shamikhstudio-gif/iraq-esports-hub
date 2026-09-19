'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, Sparkles, Check, Lock, Palette, Shield, Zap, 
  Crown, Target, Trophy, Ghost, RefreshCw, Smartphone, Monitor,
  Radio, Gamepad2, Moon, Circle, ShoppingBag
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Profile } from '@/lib/types';
import { useUser } from '@/context/UserContext';
import { Button, Badge } from '@/components/ui';
import { AvatarWithDecoration, AVATAR_FRAMES_CATALOG } from '@/components/ui/AvatarWithDecoration';
import { ProfileEffectOverlay, PROFILE_EFFECTS_CATALOG } from './ProfileEffectOverlay';
import { BannerFxOverlay, BANNER_FX_CATALOG } from './BannerFxOverlay';

export const PRESTIGE_BADGES_CATALOG = [
  {
    id: 'none',
    name: 'None',
    nameAr: 'بدون شارة فخر',
    icon: null,
    descAr: 'عدم إظهار شارة فخر على رأس البروفايل.',
    isFree: true,
  },
  {
    id: 'ieh_elite',
    name: 'IEH VIP Elite',
    nameAr: 'عضوية النخبة الرسمية',
    icon: <Crown className="w-3.5 h-3.5 text-white" />,
    descAr: 'شارة النخبة المعتمدة في مجتمع الرياضات الإلكترونية العراقي.',
    isFree: false,
  },
  {
    id: 'scrim_warlord',
    name: 'Scrim Warlord',
    nameAr: 'محارب السكريمات والبطولات',
    icon: <Zap className="w-3.5 h-3.5 text-white" />,
    descAr: 'شارة احتراف السكريمات والمنافسات اليومية الشرسة.',
    isFree: false,
  },
  {
    id: 'aim_god',
    name: 'Aim God Sniper',
    nameAr: 'قناص القلوب والمحترفين',
    icon: <Target className="w-3.5 h-3.5 text-white" />,
    descAr: 'شارة مخصصة للرماة الاستثنائيين وأصحاب التصويب الحاسم.',
    isFree: false,
  },
  {
    id: 'team_captain',
    name: 'Verified Captain',
    nameAr: 'قائد تكتيكي معتمد',
    icon: <Shield className="w-3.5 h-3.5 text-white" />,
    descAr: 'شارة قيادة الفرق والتوجيه التكتيكي في الساحات التنافسية.',
    isFree: false,
  },
  {
    id: 'baghdad_champ',
    name: 'Baghdad Champion',
    nameAr: 'بطل دوريات العاصمة',
    icon: <Trophy className="w-3.5 h-3.5 text-white" />,
    descAr: 'شارة حصرية تكريماً لأبطال بطولات العراق وعاصمتها.',
    isFree: false,
  },
  {
    id: 'cyber_ghost',
    name: 'Cyber Phantom',
    nameAr: 'شبح السايبر التكتيكي',
    icon: <Ghost className="w-3.5 h-3.5 text-white" />,
    descAr: 'شارة مقاتلي الظل والتسلل الرقمي الصامت.',
    isFree: false,
  },
];

const STATUS_TYPES = [
  { id: 'online', label: 'متصل ومتاح', icon: <Circle className="w-2.5 h-2.5 fill-white text-white" /> },
  { id: 'in_game', label: 'في مباراة تنافسية', icon: <Gamepad2 className="w-3.5 h-3.5 text-white" /> },
  { id: 'streaming', label: 'بث مباشر للبطولة', icon: <Radio className="w-3.5 h-3.5 text-white animate-pulse" /> },
  { id: 'dnd', label: 'وضع التركيز التام (DND)', icon: <Moon className="w-3.5 h-3.5 text-white" /> },
];

interface ProfileStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetProfile?: Profile | null;
  onSaved?: () => void;
}

type TabKey = 'frames' | 'effects' | 'banner' | 'status' | 'badges';

export function ProfileStudioModal({ isOpen, onClose, targetProfile, onSaved }: ProfileStudioModalProps) {
  const { user, updateUser } = useUser();
  const activeProfile = targetProfile || user;

  const [activeTab, setActiveTab] = useState<TabKey>('frames');
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');

  // Cosmetic Local Draft States for Live Preview
  const [selectedFrame, setSelectedFrame] = useState<string>('none');
  const [selectedEffect, setSelectedEffect] = useState<string>('none');
  const [selectedBannerFx, setSelectedBannerFx] = useState<string>('none');
  const [customStatus, setCustomStatus] = useState<string>('');
  const [statusType, setStatusType] = useState<'online' | 'in_game' | 'streaming' | 'dnd'>('online');
  const [selectedBadge, setSelectedBadge] = useState<string>('none');

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isPurchasingPass, setIsPurchasingPass] = useState(false);
  const [purchaseNotice, setPurchaseNotice] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Unlocked Status
  const hasPass = Boolean(user?.has_profile_studio || activeProfile?.has_profile_studio || activeProfile?.role === 'admin');
  const hasNeonFrame = Boolean(user?.has_neon_frame || activeProfile?.has_neon_frame);

  // Sync draft states when modal opens
  useEffect(() => {
    if (activeProfile) {
      setSelectedFrame(activeProfile.equipped_frame || (activeProfile.has_neon_frame ? 'neon_pulse' : 'none'));
      setSelectedEffect(activeProfile.equipped_effect || 'none');
      setSelectedBannerFx(activeProfile.equipped_banner_fx || 'none');
      setCustomStatus(activeProfile.custom_status || '');
      setStatusType((activeProfile.custom_status_type as any) || 'online');
      setSelectedBadge(activeProfile.featured_badge || 'none');
    }
  }, [activeProfile, isOpen]);

  if (!isOpen || !activeProfile) return null;

  const isUnlocked = (isFree: boolean, itemId: string) => {
    if (isFree) return true;
    if (hasPass) return true;
    if (itemId === 'neon_pulse' && hasNeonFrame) return true;
    return false;
  };

  const handleBuyPass = async () => {
    const activeUid = user?.id || (typeof window !== 'undefined' ? localStorage.getItem('babylon_user_id') : null);
    if (!activeUid) {
      setPurchaseNotice({ type: 'error', msg: 'يرجى تسجيل الدخول أولاً لإتمام عملية الشراء.' });
      return;
    }

    const currentBal = user?.ebits_balance ?? 0;
    if (currentBal < 750) {
      setPurchaseNotice({
        type: 'error',
        msg: `رصيدك غير كافٍ! لديك ${currentBal} eBits وتحتاج إلى 750 eBits. اكسب المزيد من المتجر عبر الـ Vault.`
      });
      return;
    }

    setIsPurchasingPass(true);
    setPurchaseNotice(null);

    try {
      const { data, error } = await supabase.rpc('purchase_store_item', {
        p_user_id: activeUid,
        p_item_type: 'profile_studio_pass',
        p_item_id: 'profile_studio_pass',
        p_item_name: 'ترخيص استوديو تخصيص البروفايل VIP',
        p_price: 750,
      });

      if (error) throw error;

      if (data && data.success) {
        updateUser({
          ebits_balance: data.ebits_balance,
          has_profile_studio: true,
        });
        setPurchaseNotice({
          type: 'success',
          msg: '🎉 تم تفعيل ترخيص الاستوديو بنجاح! تم فتح كافة الإطارات والتأثيرات فورياً.'
        });
        if (onSaved) onSaved();
      }
    } catch (err: any) {
      console.error('Pass purchase error:', err);
      setPurchaseNotice({
        type: 'error',
        msg: err.message || 'حدث خطأ أثناء الشراء. يرجى المحاولة لاحقاً.'
      });
    } finally {
      setIsPurchasingPass(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    setErrorMessage('');
    setSaveSuccess(false);

    try {
      const payload = {
        equipped_frame: selectedFrame,
        equipped_effect: selectedEffect,
        equipped_banner_fx: selectedBannerFx,
        custom_status: customStatus.trim() || null,
        custom_status_type: statusType,
        featured_badge: selectedBadge === 'none' ? null : selectedBadge,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('profiles')
        .update(payload)
        .eq('id', user.id);

      if (error) throw error;

      updateUser(payload);
      setSaveSuccess(true);
      if (onSaved) onSaved();

      setTimeout(() => {
        setSaveSuccess(false);
      }, 2500);
    } catch (err: any) {
      console.error('Failed to save profile cosmetics:', err);
      setErrorMessage(err.message || 'حدث خطأ أثناء حفظ التعديلات');
    } finally {
      setIsSaving(false);
    }
  };

  const currentBadgeObj = PRESTIGE_BADGES_CATALOG.find((b) => b.id === selectedBadge);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md animate-in fade-in duration-200" dir="rtl">
      <div className="relative w-full max-w-5xl bg-[#09090b] border border-white/15 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-black/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-white">استوديو تخصيص البروفايل — Profile Studio</h2>
                {hasPass ? (
                  <Badge variant="solid" size="xs" className="gap-1 font-black">
                    <Crown className="w-3 h-3 text-black" />
                    <span>VIP مفتوح</span>
                  </Badge>
                ) : (
                  <Badge variant="outline" size="xs" className="text-zinc-400">
                    باقة المبتدئين
                  </Badge>
                )}
              </div>
              <p className="text-[11px] text-zinc-400">
                خصص إطارات الأفاتار، والتأثيرات المحيطية، والبانر، والحالة في الوقت الفعلي.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Switcher */}
            <div className="hidden sm:flex items-center p-1 bg-white/5 border border-white/10 rounded-xl">
              <button
                onClick={() => setPreviewMode('desktop')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                  previewMode === 'desktop' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'
                }`}
                title="معاينة شاشة الكمبيوتر"
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>سطح المكتب</span>
              </button>
              <button
                onClick={() => setPreviewMode('mobile')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                  previewMode === 'mobile' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'
                }`}
                title="معاينة شاشة الهاتف"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>الهاتف</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body: Split View (Preview on Left in LTR, Right in RTL) */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x lg:divide-x-reverse divide-white/10">
          
          {/* Controls & Catalog Tabs (7 Cols) */}
          <div className="lg:col-span-7 p-5 flex flex-col h-full overflow-y-auto space-y-5">
            
            {/* Tab Navigation */}
            <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-black border border-white/10 overflow-x-auto no-scrollbar shrink-0">
              <button
                onClick={() => setActiveTab('frames')}
                className={`px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 whitespace-nowrap transition ${
                  activeTab === 'frames' ? 'bg-white text-black shadow-sm' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>إطارات الأفاتار</span>
              </button>

              <button
                onClick={() => setActiveTab('effects')}
                className={`px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 whitespace-nowrap transition ${
                  activeTab === 'effects' ? 'bg-white text-black shadow-sm' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>تأثيرات البروفايل</span>
              </button>

              <button
                onClick={() => setActiveTab('banner')}
                className={`px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 whitespace-nowrap transition ${
                  activeTab === 'banner' ? 'bg-white text-black shadow-sm' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Palette className="w-3.5 h-3.5" />
                <span>زخارف البانر</span>
              </button>

              <button
                onClick={() => setActiveTab('status')}
                className={`px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 whitespace-nowrap transition ${
                  activeTab === 'status' ? 'bg-white text-black shadow-sm' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Gamepad2 className="w-3.5 h-3.5" />
                <span>الحالة المخصصة</span>
              </button>

              <button
                onClick={() => setActiveTab('badges')}
                className={`px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 whitespace-nowrap transition ${
                  activeTab === 'badges' ? 'bg-white text-black shadow-sm' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Crown className="w-3.5 h-3.5" />
                <span>شارات الفخر</span>
              </button>
            </div>

            {/* TAB 1: AVATAR FRAMES */}
            {activeTab === 'frames' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-white flex items-center gap-1.5">
                    <span>إطارات وزخارف الأفاتار المتحركة ({AVATAR_FRAMES_CATALOG.length})</span>
                  </h3>
                  <span className="text-[10px] text-zinc-400">انقر للمعاينة المباشرة</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {AVATAR_FRAMES_CATALOG.map((frame) => {
                    const unlocked = isUnlocked(frame.isFree, frame.id);
                    const isSelected = selectedFrame === frame.id;

                    return (
                      <div
                        key={frame.id}
                        onClick={() => unlocked && setSelectedFrame(frame.id)}
                        className={`p-3.5 rounded-2xl border transition-all relative cursor-pointer text-right flex items-center gap-3.5 ${
                          isSelected
                            ? 'bg-white/10 border-white shadow-[0_0_20px_rgba(255,255,255,0.15)]'
                            : unlocked
                            ? 'bg-black/60 border-white/10 hover:border-white/25 hover:bg-white/[0.04]'
                            : 'bg-black/40 border-white/5 opacity-60'
                        }`}
                      >
                        <div className="p-1 shrink-0">
                          <AvatarWithDecoration
                            src={activeProfile.avatar_url || ''}
                            frame={frame.id}
                            size="md"
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-black text-white truncate">{frame.nameAr}</span>
                            {isSelected && (
                              <Check className="w-3.5 h-3.5 text-white shrink-0" />
                            )}
                          </div>
                          <p className="text-[10px] text-zinc-400 line-clamp-2 mt-0.5">{frame.descAr}</p>
                        </div>

                        {!unlocked && (
                          <div className="shrink-0 p-1.5 rounded-lg bg-white/10 text-zinc-400" title="يتطلب ترخيص الاستوديو">
                            <Lock className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 2: PROFILE EFFECTS */}
            {activeTab === 'effects' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-white flex items-center gap-1.5">
                    <span>تأثيرات خلفية وجو البروفايل ({PROFILE_EFFECTS_CATALOG.length})</span>
                  </h3>
                  <span className="text-[10px] text-zinc-400">تظهر كخلفية حية لبطاقة الحساب</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {PROFILE_EFFECTS_CATALOG.map((eff) => {
                    const unlocked = isUnlocked(eff.isFree, eff.id);
                    const isSelected = selectedEffect === eff.id;

                    return (
                      <div
                        key={eff.id}
                        onClick={() => unlocked && setSelectedEffect(eff.id)}
                        className={`p-3.5 rounded-2xl border transition-all relative cursor-pointer text-right flex items-center gap-3.5 ${
                          isSelected
                            ? 'bg-white/10 border-white shadow-[0_0_20px_rgba(255,255,255,0.15)]'
                            : unlocked
                            ? 'bg-black/60 border-white/10 hover:border-white/25 hover:bg-white/[0.04]'
                            : 'bg-black/40 border-white/5 opacity-60'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-xl bg-[#111] border border-white/20 flex items-center justify-center shrink-0 text-white font-mono text-xs">
                          {eff.id === 'matrix_rain' ? '010' : eff.id === 'lightning_pulse' ? '⚡' : eff.id === 'cosmic_dust' ? '✨' : '◈'}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-black text-white truncate">{eff.nameAr}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-white shrink-0" />}
                          </div>
                          <p className="text-[10px] text-zinc-400 line-clamp-2 mt-0.5">{eff.descAr}</p>
                        </div>

                        {!unlocked && (
                          <div className="shrink-0 p-1.5 rounded-lg bg-white/10 text-zinc-400">
                            <Lock className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 3: BANNER FX */}
            {activeTab === 'banner' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-white flex items-center gap-1.5">
                    <span>زخارف وتأثيرات البانر ({BANNER_FX_CATALOG.length})</span>
                  </h3>
                  <span className="text-[10px] text-zinc-400">طبقات ضوئية وتكتيكية فوق البانر</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {BANNER_FX_CATALOG.map((fx) => {
                    const unlocked = isUnlocked(fx.isFree, fx.id);
                    const isSelected = selectedBannerFx === fx.id;

                    return (
                      <div
                        key={fx.id}
                        onClick={() => unlocked && setSelectedBannerFx(fx.id)}
                        className={`p-3.5 rounded-2xl border transition-all relative cursor-pointer text-right flex items-center gap-3.5 ${
                          isSelected
                            ? 'bg-white/10 border-white shadow-[0_0_20px_rgba(255,255,255,0.15)]'
                            : unlocked
                            ? 'bg-black/60 border-white/10 hover:border-white/25 hover:bg-white/[0.04]'
                            : 'bg-black/40 border-white/5 opacity-60'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-xl bg-[#111] border border-white/20 flex items-center justify-center shrink-0 text-white font-mono text-xs">
                          {fx.id === 'laser_scan' ? '━' : fx.id === 'cyber_grid' ? '▦' : fx.id === 'noise_grain' ? '░' : '▣'}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-black text-white truncate">{fx.nameAr}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-white shrink-0" />}
                          </div>
                          <p className="text-[10px] text-zinc-400 line-clamp-2 mt-0.5">{fx.descAr}</p>
                        </div>

                        {!unlocked && (
                          <div className="shrink-0 p-1.5 rounded-lg bg-white/10 text-zinc-400">
                            <Lock className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 4: CUSTOM STATUS */}
            {activeTab === 'status' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-xs font-black text-white mb-1">الحالة المخصصة ومؤشر النشاط</h3>
                  <p className="text-[11px] text-zinc-400">
                    اكتب جملتك التنافسية وحدد نوع النشاط الذي يظهر بجانب اسمك للمجتمع.
                  </p>
                </div>

                {/* Status Type Picker */}
                <div className="grid grid-cols-2 gap-2">
                  {STATUS_TYPES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setStatusType(t.id as any)}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition ${
                        statusType === t.id
                          ? 'bg-white text-black border-white'
                          : 'bg-black/60 border-white/10 text-zinc-300 hover:border-white/25'
                      }`}
                    >
                      {t.icon}
                      <span>{t.label}</span>
                    </button>
                  ))}
                </div>

                {/* Text Motto Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-300">جملة الحالة (Motto / Tagline):</label>
                  <input
                    type="text"
                    value={customStatus}
                    onChange={(e) => setCustomStatus(e.target.value.substring(0, 70))}
                    placeholder="مثال: Clutch or Kick ⚡ | جاهز للسكريمات التنافسية"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black border border-white/20 text-xs text-white placeholder:text-zinc-600 focus:border-white focus:outline-none transition"
                  />
                  <div className="flex items-center justify-between text-[10px] text-zinc-500">
                    <span>تظهر تحت اسمك مباشرة في صفحة البروفايل</span>
                    <span>{customStatus.length}/70</span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: PRESTIGE BADGES */}
            {activeTab === 'badges' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-white flex items-center gap-1.5">
                    <span>شارات الفخر والبطولات المعروضة ({PRESTIGE_BADGES_CATALOG.length})</span>
                  </h3>
                  <span className="text-[10px] text-zinc-400">تظهر كشارة بارزة بجانب شارة التوثيق</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {PRESTIGE_BADGES_CATALOG.map((badge) => {
                    const unlocked = isUnlocked(badge.isFree, badge.id);
                    const isSelected = selectedBadge === badge.id;

                    return (
                      <div
                        key={badge.id}
                        onClick={() => unlocked && setSelectedBadge(badge.id)}
                        className={`p-3.5 rounded-2xl border transition-all relative cursor-pointer text-right flex items-center gap-3.5 ${
                          isSelected
                            ? 'bg-white/10 border-white shadow-[0_0_20px_rgba(255,255,255,0.15)]'
                            : unlocked
                            ? 'bg-black/60 border-white/10 hover:border-white/25 hover:bg-white/[0.04]'
                            : 'bg-black/40 border-white/5 opacity-60'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                          {badge.icon || <span className="text-xs text-zinc-500">—</span>}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-black text-white truncate">{badge.nameAr}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-white shrink-0" />}
                          </div>
                          <p className="text-[10px] text-zinc-400 line-clamp-2 mt-0.5">{badge.descAr}</p>
                        </div>

                        {!unlocked && (
                          <div className="shrink-0 p-1.5 rounded-lg bg-white/10 text-zinc-400">
                            <Lock className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* VIP Pass Callout if not unlocked */}
            {!hasPass && (
              <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/20 flex flex-col sm:flex-row items-center justify-between gap-3 mt-auto shadow-lg">
                <div className="text-right">
                  <div className="text-xs font-black text-white flex items-center gap-2">
                    <span>ترخيص استوديو تخصيص البروفايل VIP</span>
                    <span className="px-2 py-0.2 rounded-md bg-white text-black text-[9px] font-black uppercase">750 eBits</span>
                  </div>
                  <div className="text-[10px] text-zinc-400 mt-0.5">افتح كافة الإطارات، التأثيرات المحيطية، والشارات فورياً بنقرة واحدة.</div>
                  {purchaseNotice && (
                    <div className={`mt-2 text-xs font-bold ${purchaseNotice.type === 'success' ? 'text-white' : 'text-zinc-300'}`}>
                      {purchaseNotice.msg}
                    </div>
                  )}
                </div>
                <Button
                  type="button"
                  onClick={handleBuyPass}
                  isLoading={isPurchasingPass}
                  disabled={isPurchasingPass}
                  variant="primary"
                  size="sm"
                  icon={<ShoppingBag className="w-3.5 h-3.5 fill-black" />}
                  className="font-black text-xs shrink-0 whitespace-nowrap"
                >
                  شراء وتفعيل الآن (750 eBits)
                </Button>
              </div>
            )}
          </div>

          {/* LIVE REAL-TIME PREVIEW CARD (5 Cols) */}
          <div className="lg:col-span-5 p-5 bg-black/40 flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-black text-zinc-300">المعاينة الحية الفورية (Live Preview)</span>
                <span className="text-[10px] font-mono text-zinc-500">60 FPS Render</span>
              </div>

              {/* Discord-Style Simulated Profile Card */}
              <div className={`relative mx-auto rounded-3xl border border-white/20 bg-[#080808] overflow-hidden shadow-2xl transition-all ${
                previewMode === 'mobile' ? 'max-w-[290px]' : 'max-w-md w-full'
              }`}>
                {/* Background Ambient Effect */}
                <ProfileEffectOverlay effect={selectedEffect} />

                {/* Banner with FX */}
                <div className="h-32 sm:h-36 relative bg-[#050505] overflow-hidden">
                  <img
                    src={activeProfile.banner_url || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200'}
                    alt="Banner"
                    className="w-full h-full object-cover opacity-60"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-[#080808]/40 to-transparent" />
                  <BannerFxOverlay fx={selectedBannerFx} />
                </div>

                {/* Profile Card Body */}
                <div className="p-4 pt-0 relative z-10">
                  <div className="flex items-end justify-between -mt-10 sm:-mt-12 mb-3">
                    {/* Decorated Avatar */}
                    <div className="relative">
                      <AvatarWithDecoration
                        src={activeProfile.avatar_url || ''}
                        alt={activeProfile.full_name}
                        frame={selectedFrame}
                        size="xl"
                        showBadge={true}
                      />
                    </div>

                    {/* Featured Badge Preview */}
                    {currentBadgeObj && currentBadgeObj.id !== 'none' && (
                      <div className="px-2.5 py-1 rounded-xl bg-white text-black text-[10px] font-black flex items-center gap-1.5 shadow-lg animate-in zoom-in-50">
                        {currentBadgeObj.icon}
                        <span>{currentBadgeObj.name}</span>
                      </div>
                    )}
                  </div>

                  {/* Name & Tag */}
                  <div>
                    <h4 className="text-base font-black text-white flex items-center gap-1.5">
                      <span>{activeProfile.full_name}</span>
                      {activeProfile.is_verified && (
                        <Check className="w-4 h-4 text-white shrink-0 p-0.5 bg-white/20 rounded-full" />
                      )}
                    </h4>
                    <div className="text-[11px] text-zinc-400 font-mono">@{activeProfile.username}</div>
                  </div>

                  {/* Custom Status Motto */}
                  {customStatus && (
                    <div className="mt-2.5 p-2 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2">
                      <span className="shrink-0">
                        {STATUS_TYPES.find((t) => t.id === statusType)?.icon}
                      </span>
                      <span className="text-[11px] font-bold text-white truncate">{customStatus}</span>
                    </div>
                  )}

                  {/* Minimal Bio & Details */}
                  <p className="text-[10px] text-zinc-400 mt-2.5 line-clamp-2">
                    {activeProfile.bio || 'لاعب ومنافس في بطولات العراق الإلكترونية شبكة IEH.'}
                  </p>

                  <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-white/10 text-[10px] font-bold text-zinc-300">
                    <span className="px-2 py-0.5 rounded-lg bg-white/10 border border-white/15">
                      {activeProfile.primary_game || 'PUBG Mobile'}
                    </span>
                    <span className="px-2 py-0.5 rounded-lg bg-white/10 border border-white/15">
                      {activeProfile.city || 'بغداد'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="mt-5 pt-4 border-t border-white/10 space-y-2">
              {saveSuccess && (
                <div className="p-2.5 rounded-xl bg-white text-black text-xs font-black text-center animate-in zoom-in-90">
                  ✓ تم حفظ وتطبيق المظهر بنجاح!
                </div>
              )}

              {errorMessage && (
                <div className="p-2.5 rounded-xl bg-white/10 border border-white/20 text-white text-xs font-bold text-center">
                  {errorMessage}
                </div>
              )}

              <div className="flex items-center gap-2">
                <Button
                  onClick={handleSave}
                  isLoading={isSaving}
                  disabled={isSaving}
                  variant="primary"
                  size="md"
                  className="flex-1 font-black text-xs"
                >
                  حفظ وتطبيق المظهر
                </Button>

                <Button
                  onClick={onClose}
                  variant="secondary"
                  size="md"
                  className="text-xs"
                >
                  إغلاق
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
