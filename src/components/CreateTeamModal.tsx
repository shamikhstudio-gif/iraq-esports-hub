'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Shield, Upload, Sparkles, Loader2, CheckCircle2, MapPin, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Team } from '@/lib/types';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { CustomSelect } from './CustomSelect';
import { GameSearchSelect } from './GameSearchSelect';

interface CreateTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTeamCreated: (team: Team) => void;
}

export function CreateTeamModal({ isOpen, onClose, onTeamCreated }: CreateTeamModalProps) {
  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState('');
  const [tag, setTag] = useState('');
  const [city, setCity] = useState('أونلاين (بدون مقر فيزيائي)');
  const [bio, setBio] = useState('');
  const [selectedGames, setSelectedGames] = useState<string[]>([]);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const iraqiCities = [
    'أونلاين (بدون مقر فيزيائي)',
    'بغداد',
    'بابل',
    'أربيل',
    'البصرة',
    'السليمانية',
    'الموصل',
    'النجف',
    'كربلاء',
    'كركوك',
    'دهوك',
    'الأنبار',
    'ذي قار',
    'صلاح الدين',
    'ديالى',
    'ميسان',
    'المثنى',
    'القادسية',
    'واسط',
  ];

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setBannerFile(file);
      setBannerPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !tag.trim()) return;

    setIsLoading(true);
    setErrorMsg('');

    try {
      let logoUrl = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200';
      if (logoFile) {
        logoUrl = await uploadToCloudinary(logoFile);
      }

      let bannerUrl = 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1200';
      if (bannerFile) {
        bannerUrl = await uploadToCloudinary(bannerFile);
      }

      const savedUserId = typeof window !== 'undefined' ? localStorage.getItem('babylon_user_id') : null;
      if (!savedUserId) {
        setErrorMsg('يجب تسجيل الدخول لتأسيس فريق جديد');
        setIsLoading(false);
        return;
      }
      const captainId = savedUserId;

      const { data: newTeam, error: teamError } = await supabase
        .from('teams')
        .insert({
          name: name.trim(),
          tag: tag.trim().toUpperCase(),
          city: city,
          bio: bio.trim(),
          games: selectedGames,
          logo_url: logoUrl,
          banner_url: bannerUrl,
          captain_id: captainId,
          is_verified: false,
          is_exclusive: true,
          recruitment_status: 'open',
          rules: [
            'الالتزام بالأخلاق والروح الرياضية داخل وخارج اللعبة',
            'حظر اللعب مع فرق أخرى أثناء التعاقد (عضوية حصرية)',
            'حضور التمارين والسكريمات الأسبوعية في المواعيد المحددة',
            'التواجد في سيرفر ديسكورد الفريق واستخدام المايك للتواصل',
          ],
          achievements: [],
        })
        .select('*')
        .single();

      if (teamError) throw teamError;

      if (newTeam) {
        // 1. Create Default Discord-Style Roles
        const { data: captainRole } = await supabase
          .from('team_roles')
          .insert({
            team_id: newTeam.id,
            name: 'كابتن الفريق / Leader',
            color: '#ef4444',
            permissions: ['manage_roster', 'kick_members', 'manage_roles', 'accept_requests', 'manage_scrims', 'edit_team'],
            priority: 1,
          })
          .select('id')
          .single();

        await supabase.from('team_roles').insert([
          {
            team_id: newTeam.id,
            name: 'مساعد كابتن / Co-Leader',
            color: '#f59e0b',
            permissions: ['manage_roster', 'accept_requests', 'manage_scrims'],
            priority: 2,
          },
          {
            team_id: newTeam.id,
            name: 'مدرب / Coach',
            color: '#8b5cf6',
            permissions: ['manage_scrims'],
            priority: 3,
          },
          {
            team_id: newTeam.id,
            name: 'لاعب أساسي / Starter',
            color: '#3b82f6',
            permissions: [],
            priority: 4,
          },
          {
            team_id: newTeam.id,
            name: 'بديل / Substitute',
            color: '#64748b',
            permissions: [],
            priority: 5,
          },
        ]);

        // 2. Add creator to team_members as Captain
        await supabase.from('team_members').insert({
          team_id: newTeam.id,
          user_id: captainId,
          role_id: captainRole ? captainRole.id : null,
          in_game_title: 'IGL / قائد التشكيلة',
          is_starter: true,
        });

        // 3. Update profile team_id
        await supabase
          .from('profiles')
          .update({ team_id: newTeam.id, in_game_role: 'مؤسس / كابتن الفريق' })
          .eq('id', captainId);

        onTeamCreated(newTeam as Team);
        onClose();
      }
    } catch (err: any) {
      console.error('Error creating team:', err);
      setErrorMsg(err.message || 'حدث خطأ أثناء إنشاء الفريق');
    } finally {
      setIsLoading(false);
    }
  };

  return createPortal(
    <div 
      className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-sm overflow-y-auto no-scrollbar"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-animate max-w-lg w-full p-5 sm:p-6 rounded-2xl relative my-auto max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3.5rem)] flex flex-col text-white">
        {/* Header - Fixed */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#1c1c1c] border border-white/20 flex items-center justify-center text-white shrink-0 shadow-sm">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base text-white leading-tight">تسجيل وتأسيس فريق عراقي جديد</h3>
              <p className="text-[10px] sm:text-[11px] text-zinc-400 font-medium mt-0.5">سجل كلانك أو منظمتك في شبكة IEH الرسمية</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-3 p-3 bg-white/10 border border-white/20 rounded-xl text-white text-xs font-semibold shrink-0 shadow-sm">
            {errorMsg}
          </div>
        )}

        {/* Form Body - Scrollable without visible scrollbar */}
        <form id="create-team-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-3 space-y-3.5 text-right pl-1 pr-0.5 no-scrollbar">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-zinc-300 mb-1">اسم الفريق الرسمي *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: أسود الرافدين / ذئاب بغداد"
                className="w-full text-xs p-2.5 rounded-xl input-3d text-white placeholder-zinc-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1">التاغ (TAG) *</label>
              <input
                type="text"
                maxLength={5}
                value={tag}
                onChange={(e) => setTag(e.target.value.toUpperCase())}
                placeholder="مثال: LIO"
                className="w-full text-xs p-2.5 rounded-xl input-3d text-white placeholder-zinc-500 focus:outline-none font-mono font-bold text-center uppercase"
                required
              />
            </div>
          </div>

          <div>
            <CustomSelect
              label="المحافظة / المقر العراقي *"
              value={city}
              onChange={setCity}
              options={iraqiCities}
              icon={<MapPin className="w-4 h-4 text-zinc-400" />}
            />
          </div>

          <div>
            <GameSearchSelect
              label="الألعاب والبطولات التنافسية للفريق:"
              mode="multiple"
              value={selectedGames}
              onChange={setSelectedGames}
              placeholder="ابحث عن ألعاب فريقك أونلاين (مثل: Valorant, PUBG, CS2)..."
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-1">نبذة عن الفريق والأهداف:</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              placeholder="اكتب نبذة تعريفية عن الفريق، طموحاتكم في البطولات العراقية، وشروط الانضمام..."
              className="w-full text-xs p-3 rounded-xl input-3d text-white placeholder-zinc-500 focus:outline-none resize-none leading-relaxed"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-1">شعار الفريق (Logo):</label>
            <div className="flex items-center gap-3">
              {logoPreview ? (
                <img src={logoPreview} alt="Logo preview" className="w-12 h-12 rounded-xl object-cover border border-white/15 shadow-sm" />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-[#080808] border border-white/15 flex items-center justify-center text-zinc-400">
                  <Shield className="w-5 h-5" />
                </div>
              )}
              <label className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/15 hover:border-white/30 bg-[#080808] hover:bg-white/10 text-xs font-semibold text-zinc-200 cursor-pointer transition">
                <Upload className="w-4 h-4 text-white" />
                <span>رفع لوغو الفريق</span>
                <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
              </label>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-zinc-300">غلاف وبنر الفريق (Banner / Cover):</label>
              {bannerPreview && (
                <label className="inline-flex items-center gap-1 text-xs text-zinc-300 hover:text-white font-bold cursor-pointer transition">
                  <Upload className="w-3.5 h-3.5" />
                  <span>استبدال الغلاف</span>
                  <input type="file" accept="image/*" onChange={handleBannerChange} className="hidden" />
                </label>
              )}
            </div>

            <div className="flex flex-col gap-2">
              {bannerPreview ? (
                <div className="relative w-full h-36 sm:h-44 rounded-2xl overflow-hidden border border-white/20 shadow-md group bg-[#050505]">
                  <img src={bannerPreview} alt="Banner preview" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
                  <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1.5 text-xs font-bold text-white cursor-pointer backdrop-blur-xs transition">
                    <Upload className="w-4 h-4" />
                    <span>تغيير صورة الغلاف</span>
                    <input type="file" accept="image/*" onChange={handleBannerChange} className="hidden" />
                  </label>
                  <div className="absolute bottom-3 right-3 text-[11px] font-bold text-white/90 bg-black/70 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-white/10 pointer-events-none">
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
        </form>

        {/* Footer - Fixed */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-bold text-zinc-400 hover:text-white hover:bg-white/10 rounded-xl transition"
          >
            إلغاء
          </button>
          <button
            type="submit"
            form="create-team-form"
            disabled={isLoading || !name.trim() || !tag.trim()}
            className="px-5 py-2.5 btn-3d-primary text-black rounded-xl text-xs font-extrabold flex items-center gap-2 transition disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>جاري إنشاء وتأسيس الفريق...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 text-black" />
                <span>تأكيد تسجيل الفريق</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}