'use client';

import React from 'react';
import { 
  Sparkles, 
  Shield, 
  Upload, 
  Image as ImageIcon, 
  MapPin 
} from 'lucide-react';
import { CustomSelect } from '@/components/CustomSelect';
import { GameSearchSelect } from '@/components/GameSearchSelect';
import { IRAQI_CITIES } from '@/lib/constants';
import { Card } from '@/components/ui';

interface TeamProfileTabProps {
  teamName: string;
  setTeamName: (val: string) => void;
  teamTag: string;
  setTeamTag: (val: string) => void;
  teamCity: string;
  setTeamCity: (val: string) => void;
  teamBio: string;
  setTeamBio: (val: string) => void;
  teamGames: string[];
  setTeamGames: (val: string[]) => void;
  teamLogoUrl: string;
  logoPreview: string;
  teamBannerUrl: string;
  bannerPreview: string;
  handleLogoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleBannerChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function TeamProfileTab({
  teamName,
  setTeamName,
  teamTag,
  setTeamTag,
  teamCity,
  setTeamCity,
  teamBio,
  setTeamBio,
  teamGames,
  setTeamGames,
  teamLogoUrl,
  logoPreview,
  teamBannerUrl,
  bannerPreview,
  handleLogoChange,
  handleBannerChange,
}: TeamProfileTabProps) {
  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <Card variant="elevated" className="p-4 sm:p-5 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-white/10">
          <Sparkles className="w-4 h-4 text-white" />
          <h4 className="text-xs font-black text-white">الهوية البصرية والبيانات الأساسية للفريق</h4>
        </div>

        {/* Team Name & Tag */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-zinc-300 mb-1">اسم الفريق الرسمي *</label>
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="مثال: أسود الرافدين / GX eSports"
              className="w-full text-xs p-2.5 rounded-xl input-3d text-white placeholder-zinc-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-1">التاغ (TAG) *</label>
            <input
              type="text"
              maxLength={5}
              value={teamTag}
              onChange={(e) => setTeamTag(e.target.value.toUpperCase())}
              placeholder="مثال: GX"
              className="w-full text-xs p-2.5 rounded-xl input-3d text-white placeholder-zinc-500 focus:outline-none font-mono font-bold text-center uppercase"
              required
            />
          </div>
        </div>

        {/* City Selection (from centralized constants) */}
        <div>
          <CustomSelect
            label="المقر / المحافظة *"
            value={teamCity}
            onChange={setTeamCity}
            options={IRAQI_CITIES as unknown as string[]}
            icon={<MapPin className="w-4 h-4 text-zinc-400" />}
          />
        </div>

        {/* Games Selection */}
        <div>
          <GameSearchSelect
            label="الألعاب والبطولات التنافسية المعتمدة للفريق:"
            mode="multiple"
            value={teamGames}
            onChange={setTeamGames}
            placeholder="ابحث عن ألعاب الفريق (مثل: Valorant, PUBG, CS2)..."
          />
        </div>

        {/* Bio */}
        <div>
          <label className="block text-xs font-bold text-zinc-300 mb-1">نبذة عن الفريق والأهداف:</label>
          <textarea
            value={teamBio}
            onChange={(e) => setTeamBio(e.target.value)}
            rows={3}
            placeholder="اكتب نبذة تعريفية عن تاريخ الفريق وطموحاتكم في البطولات العراقية..."
            className="w-full text-xs p-3 rounded-xl input-3d text-white placeholder-zinc-500 focus:outline-none resize-none leading-relaxed"
          />
        </div>

        {/* Logo & Banner Uploads */}
        <div className="space-y-4 pt-3 border-t border-white/10">
          {/* Logo Upload Section */}
          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-2">شعار الفريق الرسمي (Logo):</label>
            <div className="flex items-center gap-4 p-3 rounded-2xl bg-[#0c0c0c] border border-white/10">
              {logoPreview || teamLogoUrl ? (
                <img 
                  src={logoPreview || teamLogoUrl} 
                  alt="Logo preview" 
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-white/20 shadow-md shrink-0 bg-black" 
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-black border-2 border-white/15 flex items-center justify-center text-zinc-400 shrink-0">
                  <Shield className="w-8 h-8" />
                </div>
              )}
              <div className="flex-1 space-y-1">
                <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl btn-3d-dark hover:border-white/30 text-xs font-bold text-white cursor-pointer transition">
                  <Upload className="w-4 h-4 text-white" />
                  <span>{logoPreview || teamLogoUrl ? 'تغيير الشعار الحالي' : 'رفع شعار الفريق'}</span>
                  <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                </label>
                <p className="text-[11px] text-zinc-400">يفضل صورة مربعة (1:1) بصيغة PNG أو JPG بدقة عالية</p>
              </div>
            </div>
          </div>

          {/* Banner Upload Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-zinc-300">غلاف وبنر الفريق (Banner / Cover):</label>
              {(bannerPreview || teamBannerUrl) && (
                <label className="inline-flex items-center gap-1.5 text-xs text-zinc-300 hover:text-white font-bold cursor-pointer transition">
                  <Upload className="w-3.5 h-3.5" />
                  <span>استبدال الغلاف</span>
                  <input type="file" accept="image/*" onChange={handleBannerChange} className="hidden" />
                </label>
              )}
            </div>

            {bannerPreview || teamBannerUrl ? (
              <div className="relative w-full h-36 sm:h-44 rounded-2xl overflow-hidden border border-white/20 shadow-md group bg-[#050505]">
                <img 
                  src={bannerPreview || teamBannerUrl} 
                  alt="Banner preview" 
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
                
                <label className="absolute inset-0 bg-black/95 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 text-xs font-extrabold text-white cursor-pointer transition">
                  <Upload className="w-4 h-4" />
                  <span>تغيير صورة الغلاف</span>
                  <input type="file" accept="image/*" onChange={handleBannerChange} className="hidden" />
                </label>

                <div className="absolute bottom-3 right-3 text-[11px] font-bold text-white/90 bg-black/95 px-2.5 py-1 rounded-lg border border-white/10 pointer-events-none">
                  معاينة الغلاف الرسمي للفريق
                </div>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center gap-2 p-6 rounded-2xl border-2 border-dashed border-white/20 hover:border-white/40 bg-[#0c0c0c] hover:bg-white/5 cursor-pointer transition group">
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-white group-hover:scale-110 transition">
                  <ImageIcon className="w-6 h-6 text-zinc-300" />
                </div>
                <div className="text-center space-y-0.5">
                  <span className="text-xs font-bold text-white">انقر هنا لرفع غلاف أو بنر الفريق الرسمي</span>
                  <p className="text-[11px] text-zinc-400">يفضل استخدام أبعاد عريضة بدقة عالية (مثل 1200×400 أو 1920×600)</p>
                </div>
                <input type="file" accept="image/*" onChange={handleBannerChange} className="hidden" />
              </label>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
