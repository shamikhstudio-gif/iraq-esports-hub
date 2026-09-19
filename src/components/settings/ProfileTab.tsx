'use client';

import React, { useState, useRef } from 'react';
import { User, Camera, Loader2, Trash2, Palette, Sparkles } from 'lucide-react';
import { IRAQI_CITIES } from '@/lib/constants';
import { uploadMediaAsset } from '@/lib/imageCompressor';
import { Button } from '@/components/ui';
import { AvatarWithDecoration } from '@/components/ui/AvatarWithDecoration';
import { ProfileStudioModal } from '@/components/profile/ProfileStudioModal';
import { useUser } from '@/context/UserContext';

interface ProfileTabProps {
  profileData: {
    id?: string;
    fullName: string;
    username: string;
    email: string;
    contactEmail?: string;
    isEmailPublic?: boolean;
    bio: string;
    city: string;
    avatarUrl: string;
    bannerUrl: string;
  };
  setProfileData: React.Dispatch<React.SetStateAction<any>>;
  triggerChange: () => void;
}

export function ProfileTab({
  profileData,
  setProfileData,
  triggerChange,
}: ProfileTabProps) {
  const { user } = useUser();
  const [isStudioOpen, setIsStudioOpen] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingAvatar(true);
    setUploadError(null);
    try {
      const url = await uploadMediaAsset(file, 'avatars', profileData.id);
      setProfileData((prev: any) => ({ ...prev, avatarUrl: url }));
      triggerChange();
    } catch (err: any) {
      setUploadError(err.message || 'فشل رفع الصورة الشخصية');
    } finally {
      setIsUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  const handleBannerFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingBanner(true);
    setUploadError(null);
    try {
      const url = await uploadMediaAsset(file, 'banners', profileData.id);
      setProfileData((prev: any) => ({ ...prev, bannerUrl: url }));
      triggerChange();
    } catch (err: any) {
      setUploadError(err.message || 'فشل رفع صورة الغلاف');
    } finally {
      setIsUploadingBanner(false);
      if (bannerInputRef.current) bannerInputRef.current.value = '';
    }
  };

  const handleRemoveAvatar = () => {
    const defaultAvatar = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300';
    setProfileData((prev: any) => ({ ...prev, avatarUrl: defaultAvatar }));
    triggerChange();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Hidden File Inputs */}
      <input
        ref={avatarInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleAvatarFileChange}
      />
      <input
        ref={bannerInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleBannerFileChange}
      />

      {uploadError && (
        <div className="p-3 rounded-xl bg-white/10 border border-white/20 text-white text-xs font-bold">
          {uploadError}
        </div>
      )}

      {/* Profile Appearance & Cover */}
      <div className="card-3d p-5 sm:p-6 space-y-4">
        <div>
          <h2 className="text-sm font-extrabold text-white">المظهر العام وصورة الغلاف</h2>
          <p className="text-xs text-zinc-400 mt-1">تخصيص غلاف وصورة ملفك الشخصي التي تظهر لجميع اللاعبين.</p>
        </div>

        {/* Banner Preview */}
        <div className="relative rounded-2xl overflow-hidden h-36 sm:h-44 border border-white/15 group bg-zinc-900">
          <img 
            src={profileData.bannerUrl} 
            alt="Banner preview" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <Button 
              type="button"
              variant="primary"
              size="sm"
              isLoading={isUploadingBanner}
              icon={<Camera className="w-3.5 h-3.5" />}
              onClick={() => bannerInputRef.current?.click()}
              className="font-extrabold shadow-lg"
            >
              تغيير صورة الغلاف
            </Button>
          </div>
        </div>

        {/* Avatar & Controls */}
        <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
          <div className="relative shrink-0">
            <AvatarWithDecoration 
              src={profileData.avatarUrl} 
              alt="Avatar" 
              frame={user?.equipped_frame || (user?.has_neon_frame ? 'neon_pulse' : 'none')}
              size="lg"
            />
            {isUploadingAvatar && (
              <div className="absolute inset-0 bg-black/70 rounded-2xl flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-white animate-spin" />
              </div>
            )}
          </div>
          <div className="flex-1 text-center sm:text-right">
            <div className="text-xs font-bold text-white mb-1">الصورة الشخصية الرمزية (Avatar)</div>
            <div className="text-[11px] text-zinc-400">يتم ضغطها تلقائياً بتقنية WebP لضمان أعلى سرعة وأقل استهلاك للبيانات.</div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              type="button" 
              variant="secondary"
              size="sm"
              isLoading={isUploadingAvatar}
              onClick={() => avatarInputRef.current?.click()}
              className="font-bold"
            >
              تحميل صورة
            </Button>
            <Button 
              type="button" 
              variant="ghost"
              size="sm"
              onClick={handleRemoveAvatar}
              className="font-bold"
            >
              إزالة
            </Button>
          </div>
        </div>

        {/* Profile Customization Studio Access Banner */}
        <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/15 flex flex-col sm:flex-row items-center justify-between gap-3 mt-4">
          <div className="flex items-center gap-3 text-right">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white shrink-0">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-black text-white flex items-center gap-2">
                <span>استوديو تخصيص البروفايل (Profile Studio)</span>
                <span className="px-2 py-0.2 rounded-md bg-white text-black text-[9px] font-black uppercase">PRO</span>
              </div>
              <div className="text-[11px] text-zinc-400">خصص إطارات الأفاتار وتأثيرات الماتريكس والصواعق وزخارف البانر والحالة.</div>
            </div>
          </div>
          <Button
            type="button"
            variant="primary"
            size="sm"
            icon={<Palette className="w-3.5 h-3.5 fill-black" />}
            onClick={() => setIsStudioOpen(true)}
            className="font-black text-xs shrink-0"
          >
            فتح استوديو التخصيص
          </Button>
        </div>
      </div>

      {/* General Information */}
      <div className="card-3d p-5 sm:p-6 space-y-4">
        <div>
          <h2 className="text-sm font-extrabold text-white">المعلومات الشخصية والاسم</h2>
          <p className="text-xs text-zinc-400 mt-1">هذه البيانات تظهر في ملفك الشخصي وقوائم الترتيب في البطولات.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-1.5">الاسم الكامل (العلني)</label>
            <input 
              type="text" 
              value={profileData.fullName}
              onChange={(e) => { setProfileData({ ...profileData, fullName: e.target.value }); triggerChange(); }}
              className="w-full input-3d rounded-xl px-4 py-2.5 text-xs text-white"
              placeholder="أدخل اسمك الحقيقي أو المستعار"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-1.5">اسم المستخدم (Unique Handle)</label>
            <div className="relative">
              <input 
                type="text" 
                value={profileData.username}
                onChange={(e) => { 
                  const cleaned = e.target.value.replace(/[^a-zA-Z0-9_]/g, '');
                  setProfileData({ ...profileData, username: cleaned }); 
                  triggerChange(); 
                }}
                className="w-full input-3d rounded-xl px-4 py-2.5 text-xs text-white font-mono"
                placeholder="username"
              />
              <span className="absolute left-3 top-2.5 text-zinc-500 text-xs font-mono">@</span>
            </div>
            {profileData.username && !/^[a-zA-Z]/.test(profileData.username) && (
              <p className="text-[10px] text-danger mt-1 text-right">يجب أن يبدأ بحرف إنجليزي ولا يمكن أن يكون أرقاماً فقط.</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-1.5">البريد الإلكتروني الموثق (Auth Email)</label>
            <input 
              type="email" 
              value={profileData.email}
              disabled
              className="w-full input-3d rounded-xl px-4 py-2.5 text-xs text-zinc-400 font-mono bg-[#0c0c0c] cursor-not-allowed"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-zinc-300">بريد التواصل العلني (Contact Email)</label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(profileData.isEmailPublic)}
                  onChange={(e) => {
                    setProfileData({ ...profileData, isEmailPublic: e.target.checked });
                    triggerChange();
                  }}
                  className="rounded bg-black border-white/20 text-white focus:ring-0 w-3.5 h-3.5"
                />
                <span className="text-[11px] text-zinc-400 font-medium">إظهار للعامة</span>
              </label>
            </div>
            <input 
              type="email" 
              value={profileData.contactEmail || ''}
              onChange={(e) => { setProfileData({ ...profileData, contactEmail: e.target.value }); triggerChange(); }}
              className="w-full input-3d rounded-xl px-4 py-2.5 text-xs text-white font-mono"
              placeholder="contact@example.com"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-zinc-300 mb-1.5">المحافظة / المدينة</label>
            <select
              value={profileData.city}
              onChange={(e) => { setProfileData({ ...profileData, city: e.target.value }); triggerChange(); }}
              className="w-full input-3d rounded-xl px-4 py-2.5 text-xs text-white font-bold"
            >
              {IRAQI_CITIES.map((city) => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-zinc-300 mb-1.5">النبذة التعريفية (Bio)</label>
          <textarea 
            rows={3}
            value={profileData.bio}
            onChange={(e) => { setProfileData({ ...profileData, bio: e.target.value }); triggerChange(); }}
            className="w-full input-3d rounded-xl p-3 text-xs text-white leading-relaxed resize-none"
            placeholder="اكتب نبذة عن خبراتك في الألعاب، سجل بطولاتك، أو طموحك الرياضي..."
          />
          <div className="text-[10px] text-zinc-500 text-left mt-1 font-mono">160 / {profileData.bio.length} حرف</div>
        </div>
      </div>

      <ProfileStudioModal
        isOpen={isStudioOpen}
        onClose={() => setIsStudioOpen(false)}
      />
    </div>
  );
}
