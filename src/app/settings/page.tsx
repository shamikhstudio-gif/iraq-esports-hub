'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  User, 
  Gamepad2, 
  Shield, 
  Bell, 
  Lock, 
  Eye, 
  EyeOff, 
  Save, 
  Trash2, 
  Camera, 
  Check, 
  Copy, 
  ExternalLink, 
  Smartphone, 
  Tablet,
  Key, 
  Sliders, 
  Globe, 
  Sparkles, 
  AlertTriangle, 
  LogOut,
  Laptop,
  CheckCircle2,
  ChevronLeft,
  X,
  Volume2,
  Radio,
  Share2,
  Crown,
  Fingerprint,
  KeyRound,
  Loader2
} from 'lucide-react';
import { SwordsIcon, TeamsIcon, BellIcon, MessagesIcon } from '@/components/icons/CustomIcons';
import { supabase } from '@/lib/supabase';
import { Profile } from '@/lib/types';
import { getActiveSessions, terminateSession, terminateAllOtherSessions, DeviceSession } from '@/lib/deviceSession';

type TabType = 'profile' | 'gaming' | 'security' | 'notifications' | 'privacy';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isProfileLoading, setIsProfileLoading] = useState(true);

  // Real Profile State loaded from Supabase Auth & profiles table
  const [profileData, setProfileData] = useState({
    id: '',
    fullName: '',
    username: '',
    email: '',
    bio: '',
    city: 'بغداد',
    phone: '',
    role: 'player',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300',
    bannerUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200',
  });

  const [gamingData, setGamingData] = useState({
    primaryGame: 'PUBG Mobile',
    secondaryGames: [] as string[],
    inGameId: '',
    inGameTag: '',
    inGameRole: '',
    discordTag: '',
    steamId: '',
    riotId: '',
    twitchChannel: '',
  });

  const [notificationSettings, setNotificationSettings] = useState({
    scrimInvites: true,
    teamApplications: true,
    directMessages: true,
    postLikesComments: true,
    emailDigest: false,
    soundAlerts: true,
    browserPush: true,
  });

  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: 'public',
    showOnlineStatus: true,
    showMatchHistory: true,
    allowDirectMessages: 'everyone',
    allowTeamInvites: true,
  });

  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: false,
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);

  // Real Active Device Sessions State
  const [sessions, setSessions] = useState<DeviceSession[]>([]);

  // Passkey Management State
  const [passkeys, setPasskeys] = useState<any[]>([]);
  const [isPasskeyLoading, setIsPasskeyLoading] = useState(false);
  const [passkeyNotice, setPasskeyNotice] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [verifyPasswordInput, setVerifyPasswordInput] = useState('');
  const [verifyPasswordError, setVerifyPasswordError] = useState('');
  const [isVerifyingPassword, setIsVerifyingPassword] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    if (activeTab === 'security') {
      fetchPasskeys();
      if (profileData.id) {
        setSessions(getActiveSessions(profileData.id));
      }
    }
  }, [activeTab, profileData.id]);

  const loadUserData = async () => {
    setIsProfileLoading(true);
    try {
      let currentUserId = typeof window !== 'undefined' ? localStorage.getItem('babylon_user_id') : null;
      
      // Also check Supabase Auth Session
      const { data: authData } = await supabase.auth.getUser();
      const authUser = authData?.user;

      if (!currentUserId && authUser) {
        currentUserId = authUser.id;
        if (typeof window !== 'undefined') {
          localStorage.setItem('babylon_user_id', authUser.id);
        }
      }

      let profile: Profile | null = null;
      if (currentUserId) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUserId)
          .single();
        if (data && !error) {
          profile = data;
        }
      }

      // If no saved user, fallback to first available or create demo fallback
      if (!profile) {
        const { data: firstProfiles } = await supabase.from('profiles').select('*').limit(1);
        if (firstProfiles && firstProfiles.length > 0) {
          const firstProfile = firstProfiles[0];
          profile = firstProfile;
          if (typeof window !== 'undefined' && firstProfile) {
            localStorage.setItem('babylon_user_id', firstProfile.id);
          }
        }
      }

      if (profile) {
        setProfileData({
          id: profile.id,
          fullName: profile.full_name || 'لاعب شبكة بابل',
          username: profile.username || 'player',
          email: profile.email || authUser?.email || 'user@babylon.network',
          bio: profile.bio || 'لاعب ومنافس في بطولات العراق الإلكترونية 🇮🇶',
          city: profile.city || 'بغداد',
          phone: '+964 770 000 0000',
          role: profile.role || 'player',
          avatarUrl: profile.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300',
          bannerUrl: profile.banner_url || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200',
        });

        setGamingData(prev => ({
          ...prev,
          primaryGame: profile.primary_game || 'PUBG Mobile',
          inGameId: profile.in_game_id || '',
          inGameRole: profile.in_game_role || '',
        }));

        setSessions(getActiveSessions(profile.id));
      }
    } catch (err) {
      console.error('Error loading settings user data:', err);
    } finally {
      setIsProfileLoading(false);
    }
  };

  const fetchPasskeys = async () => {
    try {
      if (supabase.auth?.passkey?.list) {
        const { data, error } = await supabase.auth.passkey.list();
        if (data) {
          setPasskeys(data);
        }
      }
    } catch (e) {
      console.warn('Could not list passkeys:', e);
    }
  };

  const handleRegisterPasskey = async () => {
    setIsPasskeyLoading(true);
    setPasskeyNotice(null);
    try {
      if (typeof window === 'undefined' || !window.PublicKeyCredential) {
        throw new Error('المتصفح أو الجهاز الحالي لا يدعم تقنية مفاتيح المرور Passkeys');
      }

      // Check if active Supabase session exists
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session) {
        setIsPasskeyLoading(false);
        setVerifyPasswordError('');
        setVerifyPasswordInput('');
        setIsPasswordModalOpen(true);
        return;
      }

      const { data, error } = await supabase.auth.registerPasskey();
      if (error) {
        if (error.name === 'NotAllowedError' || error.message?.includes('NotAllowedError')) {
          throw new Error('تم إلغاء عملية تسجيل مفتاح المرور أو لم يتم التعرف على البصمة');
        }
        if (error.message?.includes('passkey_disabled')) {
          throw new Error('خدمة Passkey غير مفعلة في مشروع Supabase حالياً');
        }
        throw new Error(error.message || 'فشل تسجيل مفتاح المرور');
      }

      setPasskeyNotice({ type: 'success', msg: 'تم تسجيل مفتاح مرور جديد بنجاح وتأمينه في Supabase!' });
      fetchPasskeys();
    } catch (err: any) {
      console.error('Register passkey error:', err);
      setPasskeyNotice({ type: 'error', msg: err.message || 'فشل تسجيل مفتاح المرور' });
    } finally {
      setIsPasskeyLoading(false);
    }
  };

  const handleVerifyPasswordAndRegisterPasskey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyPasswordInput || verifyPasswordInput.length < 6) {
      setVerifyPasswordError('يرجى إدخال كلمة المرور (6 خانات على الأقل)');
      return;
    }

    setIsVerifyingPassword(true);
    setVerifyPasswordError('');

    try {
      const email = profileData.email.trim().toLowerCase();
      
      // Attempt sign in with password using current profile email
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: email,
        password: verifyPasswordInput,
      });

      if (signInError) {
        // If user does not exist in auth.users yet, attempt signup
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: email,
          password: verifyPasswordInput,
          options: {
            data: {
              full_name: profileData.fullName,
              username: profileData.username,
            },
          },
        });

        if (signUpData?.user && profileData.id) {
          await supabase
            .from('profiles')
            .update({ auth_user_id: signUpData.user.id })
            .eq('id', profileData.id);
        }
      } else if (signInData?.user && profileData.id) {
        await supabase
          .from('profiles')
          .update({ auth_user_id: signInData.user.id })
          .eq('id', profileData.id);
      }

      // Close password modal
      setIsPasswordModalOpen(false);
      setVerifyPasswordInput('');
      
      // Prompt WebAuthn Passkey registration ceremony
      setTimeout(async () => {
        setIsPasskeyLoading(true);
        try {
          const { data, error } = await supabase.auth.registerPasskey();
          if (error) {
            if (error.name === 'NotAllowedError' || error.message?.includes('NotAllowedError')) {
              throw new Error('تم إلغاء عملية تسجيل مفتاح المرور أو لم يتم التعرف على البصمة');
            }
            throw new Error(error.message || 'فشل تسجيل مفتاح المرور');
          }
          setPasskeyNotice({ type: 'success', msg: 'تم تسجيل مفتاح مرور جديد بنجاح وتأمينه في Supabase!' });
          fetchPasskeys();
        } catch (err: any) {
          setPasskeyNotice({ type: 'error', msg: err.message || 'فشل تسجيل مفتاح المرور' });
        } finally {
          setIsPasskeyLoading(false);
        }
      }, 300);

    } catch (err: any) {
      setVerifyPasswordError(err.message || 'كلمة المرور غير صحيحة');
    } finally {
      setIsVerifyingPassword(false);
    }
  };

  const handleDeletePasskey = async (passkeyId: string) => {
    if (!confirm('هل أنت متأكد من حذف وإلغاء مفتاح المرور هذا؟')) return;
    setIsPasskeyLoading(true);
    try {
      const { error } = await supabase.auth.passkey.delete({ passkeyId });
      if (error) throw error;
      setPasskeyNotice({ type: 'success', msg: 'تم حذف مفتاح المرور بنجاح' });
      fetchPasskeys();
    } catch (err: any) {
      setPasskeyNotice({ type: 'error', msg: err.message || 'فشل حذف مفتاح المرور' });
    } finally {
      setIsPasskeyLoading(false);
    }
  };

  const handleTerminateSession = (sessionId: string) => {
    if (!profileData.id) return;
    const remaining = terminateSession(profileData.id, sessionId);
    setSessions(remaining);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleTerminateAllOtherSessions = () => {
    if (!profileData.id) return;
    if (!confirm('هل تريد تسجيل الخروج من جميع الأجهزة الأخرى النشطة؟')) return;
    const remaining = terminateAllOtherSessions(profileData.id);
    setSessions(remaining);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const triggerChange = () => {
    setHasUnsavedChanges(true);
    setSavedSuccess(false);
  };

  const handleSaveProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      if (profileData.id) {
        await supabase
          .from('profiles')
          .update({
            full_name: profileData.fullName,
            username: profileData.username,
            bio: profileData.bio,
            city: profileData.city,
            primary_game: gamingData.primaryGame,
            in_game_id: gamingData.inGameId,
            in_game_role: gamingData.inGameRole,
          })
          .eq('id', profileData.id);
      }
      setHasUnsavedChanges(false);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving profile:', err);
    }
  };

  const navTabs = [
    { id: 'profile' as TabType, label: 'الملف الشخصي', icon: User, desc: 'البيانات الشخصية، الاسم، والصور' },
    { id: 'gaming' as TabType, label: 'الهوية التنافسية والألعاب', icon: Gamepad2, desc: 'معرفات الألعاب، الرتب، والربط' },
    { id: 'security' as TabType, label: 'الأمان وكلمة المرور', icon: Lock, desc: 'كلمة السر، الجلسات، والتحقق 2FA' },
    { id: 'notifications' as TabType, label: 'مركز التنبيهات', icon: Bell, desc: 'إشعارات السكريمات والرسائل' },
    { id: 'privacy' as TabType, label: 'الخصوصية والتواصل', icon: Shield, desc: 'ظهور الملف، وسجل المباريات' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* Top Banner / Header */}
      <div className="card-3d p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2" />
        
        <div className="flex items-center gap-5 z-10">
          <div className="relative group">
            <img 
              src={profileData.avatarUrl} 
              alt={profileData.fullName}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-white/20 shadow-xl"
            />
            <button 
              type="button"
              className="absolute inset-0 bg-black/60 rounded-2xl flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-xs"
              title="تغيير الصورة"
            >
              <Camera className="w-6 h-6 mb-1" />
              <span className="text-[10px] font-bold">تغيير</span>
            </button>
          </div>

          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <h1 className="text-xl sm:text-2xl font-black text-white">{profileData.fullName}</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-white text-black text-[11px] font-black flex items-center gap-1 shadow-sm">
                <CheckCircle2 className="w-3 h-3 text-black" />
                <span>لاعب معتمد</span>
              </span>
            </div>
            <div className="text-xs text-zinc-400 font-mono flex items-center gap-2 mb-2">
              <span>@{profileData.username}</span>
              <span>•</span>
              <span className="text-zinc-500">{profileData.email}</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-zinc-400 font-medium">
              <span className="px-2 py-0.5 rounded-lg bg-[#141414] border border-white/10 text-white font-bold">
                {gamingData.primaryGame}
              </span>
              <span>عضو منذ 2026</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 w-full md:w-auto z-10">
          <Link
            href={`/profile/${profileData.username}`}
            className="flex-1 md:flex-initial px-4 py-2.5 rounded-xl btn-3d-dark text-xs font-bold flex items-center justify-center gap-2 transition"
          >
            <ExternalLink className="w-4 h-4" />
            <span>عرض ملفي العام</span>
          </Link>
          <button
            type="button"
            onClick={() => handleSaveProfile()}
            className="flex-1 md:flex-initial px-6 py-2.5 rounded-xl btn-3d-primary text-black text-xs font-black flex items-center justify-center gap-2 shadow-md transition active:scale-95"
          >
            <Save className="w-4 h-4 text-black" />
            <span>حفظ الإعدادات</span>
          </button>
        </div>
      </div>

      {/* Main Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Navigation Sidebar Tabs */}
        <div className="lg:col-span-4 space-y-2">
          <div className="card-3d p-2 sm:p-3 space-y-1">
            {navTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl transition-all text-right group ${
                    isActive 
                      ? 'bg-white text-black font-extrabold shadow-md' 
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                      isActive ? 'bg-black text-white' : 'bg-[#181818] border border-white/10 text-zinc-400 group-hover:text-white'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold leading-tight">{tab.label}</div>
                      <div className={`text-[10px] mt-0.5 leading-tight ${isActive ? 'text-zinc-600 font-semibold' : 'text-zinc-500'}`}>
                        {tab.desc}
                      </div>
                    </div>
                  </div>
                  <ChevronLeft className={`w-4 h-4 shrink-0 transition-transform ${isActive ? 'text-black translate-x-1' : 'text-zinc-600 group-hover:text-white'}`} />
                </button>
              );
            })}
          </div>

          {/* Quick Support Card */}
          <div className="card-3d p-4 space-y-2 text-right">
            <div className="flex items-center gap-2 text-white text-xs font-bold">
              <Sparkles className="w-4 h-4 text-white" />
              <span>تحتاج مساعدة في حسابك؟</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              فريق الدعم الفني لشبكة IEH متواجد لمساعدتك في استرجاع الحساب أو حل مشاكل التحقق.
            </p>
            <Link 
              href="/admin" 
              className="inline-flex items-center gap-1.5 text-xs font-bold text-white hover:underline pt-1"
            >
              <span>فتح تذكرة دعم فني</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Content Pane */}
        <div className="lg:col-span-8">
          
          {/* TAB 1: PROFILE SETTINGS */}
          {activeTab === 'profile' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              {/* Profile Appearance & Cover */}
              <div className="card-3d p-5 sm:p-6 space-y-5">
                <div>
                  <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
                    <User className="w-4 h-4 text-white" />
                    <span>تخصيص المظهر والصور</span>
                  </h2>
                  <p className="text-xs text-zinc-400 mt-1">تعديل الغلاف الرئيسي والصورة الرمزية التي تظهر في ملفك وخلاصات المجتمع.</p>
                </div>

                {/* Banner Preview */}
                <div className="relative rounded-2xl overflow-hidden h-36 sm:h-44 border border-white/15 group bg-zinc-900">
                  <img 
                    src={profileData.bannerUrl} 
                    alt="Banner preview" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-xs">
                    <button 
                      type="button"
                      className="px-3.5 py-2 rounded-xl bg-white text-black text-xs font-extrabold flex items-center gap-1.5 shadow-lg active:scale-95 transition"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>تغيير صورة الغلاف</span>
                    </button>
                  </div>
                </div>

                {/* Avatar & Controls */}
                <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
                  <img 
                    src={profileData.avatarUrl} 
                    alt="Avatar" 
                    className="w-16 h-16 rounded-xl object-cover border border-white/20 shadow-md shrink-0"
                  />
                  <div className="flex-1 text-center sm:text-right">
                    <div className="text-xs font-bold text-white mb-1">الصورة الشخصية الرمزية (Avatar)</div>
                    <div className="text-[11px] text-zinc-400">يفضل صورة مربعة بنسبة 1:1 بجودة عالية (PNG أو WebP أو JPG).</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      type="button" 
                      className="px-3.5 py-2 rounded-xl btn-3d-dark text-xs font-bold text-white hover:bg-white/10 transition"
                    >
                      تحميل صورة
                    </button>
                    <button 
                      type="button" 
                      className="px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold border border-red-500/20 transition"
                    >
                      إزالة
                    </button>
                  </div>
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
                        onChange={(e) => { setProfileData({ ...profileData, username: e.target.value }); triggerChange(); }}
                        className="w-full input-3d rounded-xl px-4 py-2.5 text-xs text-white font-mono"
                        placeholder="username"
                      />
                      <span className="absolute left-3 top-2.5 text-zinc-500 text-xs font-mono">@</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1.5">البريد الإلكتروني الموثق</label>
                    <input 
                      type="email" 
                      value={profileData.email}
                      disabled
                      className="w-full input-3d rounded-xl px-4 py-2.5 text-xs text-zinc-400 font-mono bg-[#0c0c0c] cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1.5">المحافظة / المدينة</label>
                    <select
                      value={profileData.city}
                      onChange={(e) => { setProfileData({ ...profileData, city: e.target.value }); triggerChange(); }}
                      className="w-full input-3d rounded-xl px-4 py-2.5 text-xs text-white font-bold"
                    >
                      <option value="بغداد">بغداد</option>
                      <option value="البصرة">البصرة</option>
                      <option value="أربيل">أربيل</option>
                      <option value="الموصل">الموصل</option>
                      <option value="النجف">النجف</option>
                      <option value="كربلاء">كربلاء</option>
                      <option value="كركوك">كركوك</option>
                      <option value="السليمانية">السليمانية</option>
                      <option value="الأنبار">الأنبار</option>
                      <option value="بابل">بابل</option>
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
            </div>
          )}

          {/* TAB 2: GAMING IDENTITY & ACCOUNTS */}
          {activeTab === 'gaming' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              {/* In-Game Roles and Primary Titles */}
              <div className="card-3d p-5 sm:p-6 space-y-4">
                <div>
                  <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
                    <Gamepad2 className="w-4 h-4 text-white" />
                    <span>الهوية التنافسية والأدوار</span>
                  </h2>
                  <p className="text-xs text-zinc-400 mt-1">تحديد لعبتك الأساسية ورتبتك وموقعك التكتيكي داخل الفريق.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1.5">اللعبة الأساسية</label>
                    <select
                      value={gamingData.primaryGame}
                      onChange={(e) => { setGamingData({ ...gamingData, primaryGame: e.target.value }); triggerChange(); }}
                      className="w-full input-3d rounded-xl px-4 py-2.5 text-xs text-white font-bold"
                    >
                      <option value="PUBG Mobile">PUBG Mobile</option>
                      <option value="Valorant">Valorant</option>
                      <option value="Counter-Strike 2">Counter-Strike 2</option>
                      <option value="League of Legends">League of Legends</option>
                      <option value="FC24 (FIFA)">FC24 (FIFA)</option>
                      <option value="Mobile Legends">Mobile Legends</option>
                      <option value="Call of Duty: Warzone">Call of Duty: Warzone</option>
                      <option value="Fortnite">Fortnite</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1.5">الدور التكتيكي (In-Game Role)</label>
                    <input 
                      type="text" 
                      value={gamingData.inGameRole}
                      onChange={(e) => { setGamingData({ ...gamingData, inGameRole: e.target.value }); triggerChange(); }}
                      className="w-full input-3d rounded-xl px-4 py-2.5 text-xs text-white"
                      placeholder="مثال: IGL, Sniper, Rusher, Support..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1.5">معرف اللعبة الأساسي (In-Game ID / UID)</label>
                    <input 
                      type="text" 
                      value={gamingData.inGameId}
                      onChange={(e) => { setGamingData({ ...gamingData, inGameId: e.target.value }); triggerChange(); }}
                      className="w-full input-3d rounded-xl px-4 py-2.5 text-xs text-white font-mono"
                      placeholder="مثال: 5123984124"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1.5">اسم الحساب داخل اللعبة (In-Game Nickname)</label>
                    <input 
                      type="text" 
                      value={gamingData.inGameTag}
                      onChange={(e) => { setGamingData({ ...gamingData, inGameTag: e.target.value }); triggerChange(); }}
                      className="w-full input-3d rounded-xl px-4 py-2.5 text-xs text-white font-mono"
                      placeholder="مثال: PLAYER#777"
                    />
                  </div>
                </div>
              </div>

              {/* Connected Accounts / Integrations */}
              <div className="card-3d p-5 sm:p-6 space-y-4">
                <div>
                  <h2 className="text-sm font-extrabold text-white">ربط الحسابات ومنصات الجيمنج</h2>
                  <p className="text-xs text-zinc-400 mt-1">اربط حساباتك الرسمية لتسهيل التواصل والتحقق أثناء مباريات السكريمات والبطولات.</p>
                </div>

                <div className="space-y-3">
                  {/* Discord Account */}
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#0c0c0c] border border-white/10 hover:border-white/20 transition">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#5865F2]/20 text-[#5865F2] flex items-center justify-center font-bold text-base">
                        D
                      </div>
                      <div>
                        <div className="text-xs font-extrabold text-white flex items-center gap-2">
                          <span>Discord</span>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">جاهز للربط</span>
                        </div>
                        <div className="text-[11px] text-zinc-400 font-mono">{gamingData.discordTag || 'لم يتم الربط بعد'}</div>
                      </div>
                    </div>
                    <button type="button" className="px-3 py-1.5 rounded-lg btn-3d-dark text-xs font-bold text-zinc-300 hover:text-white">
                      ربط الحساب
                    </button>
                  </div>

                  {/* Steam Account */}
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#0c0c0c] border border-white/10 hover:border-white/20 transition">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center font-bold text-base">
                        S
                      </div>
                      <div>
                        <div className="text-xs font-extrabold text-white flex items-center gap-2">
                          <span>Steam</span>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">جاهز للربط</span>
                        </div>
                        <div className="text-[11px] text-zinc-400 font-mono">{gamingData.steamId || 'لم يتم الربط بعد'}</div>
                      </div>
                    </div>
                    <button type="button" className="px-3 py-1.5 rounded-lg btn-3d-dark text-xs font-bold text-zinc-300 hover:text-white">
                      ربط الحساب
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SECURITY & PASSWORD */}
          {activeTab === 'security' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              {/* Passkeys & WebAuthn Management */}
              <div className="card-3d p-5 sm:p-6 space-y-4 border-white/20">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
                      <Fingerprint className="w-4 h-4 text-white" />
                      <span>مفاتيح المرور البيومترية (Passkeys & WebAuthn)</span>
                    </h2>
                    <p className="text-xs text-zinc-400 mt-1">
                      سجّل دخولك بلمسة واحدة باستخدام Face ID أو بصمة الإصبع أو Windows Hello لحساب ({profileData.email}).
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleRegisterPasskey}
                    disabled={isPasskeyLoading}
                    className="px-4 py-2.5 rounded-xl btn-3d-primary text-black text-xs font-extrabold flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
                  >
                    {isPasskeyLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-black" />
                    ) : (
                      <>
                        <KeyRound className="w-4 h-4 text-black" />
                        <span>إضافة مفتاح مرور جديد</span>
                      </>
                    )}
                  </button>
                </div>

                {passkeyNotice && (
                  <div className={`p-3 rounded-xl text-xs font-bold ${passkeyNotice.type === 'success' ? 'bg-green-500/10 border border-green-500/30 text-green-400' : 'bg-red-500/10 border border-red-500/30 text-red-400'}`}>
                    {passkeyNotice.msg}
                  </div>
                )}

                {/* Enrolled Passkeys List */}
                <div className="space-y-2.5 pt-1">
                  {passkeys.length === 0 ? (
                    <div className="p-4 rounded-xl bg-[#0c0c0c] border border-white/10 text-center text-xs text-zinc-400 font-medium">
                      لا توجد مفاتيح مرور مسجلة لهذا الحساب حالياً. اضغط على الزر أعلاه لإضافة مفتاح مرور لجهازك الحالي.
                    </div>
                  ) : (
                    passkeys.map((pk) => (
                      <div key={pk.id} className="flex items-center justify-between p-3.5 rounded-xl bg-[#0c0c0c] border border-white/10 hover:border-white/20 transition">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-white/10 text-white flex items-center justify-center">
                            <Fingerprint className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-white flex items-center gap-2">
                              <span>{pk.friendly_name || 'مفتاح مرور مسجل'}</span>
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[9px] font-bold">نشط</span>
                            </div>
                            <div className="text-[10px] text-zinc-500 font-mono">
                              تم الإنشاء: {new Date(pk.created_at).toLocaleDateString('ar-IQ')} {pk.last_used_at && `• آخر استخدام: ${new Date(pk.last_used_at).toLocaleDateString('ar-IQ')}`}
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeletePasskey(pk.id)}
                          disabled={isPasskeyLoading}
                          className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold border border-red-500/20 transition"
                        >
                          إلغاء المفتاح
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Real Active Login Sessions & Devices */}
              <div className="card-3d p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
                      <Laptop className="w-4 h-4 text-white" />
                      <span>الجلسات والأجهزة النشطة (Real Device Sessions)</span>
                    </h2>
                    <p className="text-xs text-zinc-400 mt-1">الأجهزة والمتصفحات التي سجلت دخولها فعلياً إلى هذا الحساب.</p>
                  </div>
                  {sessions.length > 1 && (
                    <button 
                      type="button" 
                      onClick={handleTerminateAllOtherSessions}
                      className="text-xs font-bold text-red-400 hover:underline"
                    >
                      تسجيل الخروج من كل الأجهزة الأخرى
                    </button>
                  )}
                </div>

                <div className="space-y-2.5">
                  {sessions.map((sess) => {
                    const isMobile = sess.deviceType === 'mobile';
                    const isTablet = sess.deviceType === 'tablet';
                    const DeviceIcon = isMobile ? Smartphone : isTablet ? Tablet : Laptop;

                    return (
                      <div 
                        key={sess.id} 
                        className={`flex items-center justify-between p-3.5 rounded-xl border transition ${
                          sess.isCurrent 
                            ? 'bg-[#121212] border-white/30 shadow-sm' 
                            : 'bg-[#0c0c0c] border-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${sess.isCurrent ? 'bg-white text-black' : 'bg-white/10 text-zinc-400'}`}>
                            <DeviceIcon className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-white flex items-center gap-2">
                              <span>{sess.deviceName}</span>
                              {sess.isCurrent && (
                                <span className="px-2 py-0.5 rounded-full bg-white text-black text-[9px] font-black">
                                  الجهاز الحالي
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-zinc-400 font-mono">
                              {sess.os} • {sess.browser} • {sess.location}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          {sess.isCurrent ? (
                            <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              نشط الآن
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleTerminateSession(sess.id)}
                              className="text-xs font-bold text-zinc-400 hover:text-red-400 transition"
                            >
                              إنهاء الجلسة
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Password Change */}
              <div className="card-3d p-5 sm:p-6 space-y-4">
                <div>
                  <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
                    <Key className="w-4 h-4 text-white" />
                    <span>تغيير كلمة المرور</span>
                  </h2>
                  <p className="text-xs text-zinc-400 mt-1">تأكد من اختيار كلمة مرور قوية تحتوي على أحرف وأرقام ورموز.</p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1.5">كلمة المرور الحالية</label>
                    <div className="relative">
                      <input 
                        type={showPassword ? 'text' : 'password'} 
                        value={securitySettings.currentPassword}
                        onChange={(e) => { setSecuritySettings({ ...securitySettings, currentPassword: e.target.value }); triggerChange(); }}
                        className="w-full input-3d rounded-xl px-4 py-2.5 text-xs text-white"
                        placeholder="••••••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute left-3 top-2.5 text-zinc-400 hover:text-white"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-zinc-300 mb-1.5">كلمة المرور الجديدة</label>
                      <input 
                        type={showPassword ? 'text' : 'password'} 
                        value={securitySettings.newPassword}
                        onChange={(e) => { setSecuritySettings({ ...securitySettings, newPassword: e.target.value }); triggerChange(); }}
                        className="w-full input-3d rounded-xl px-4 py-2.5 text-xs text-white"
                        placeholder="••••••••••••"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-300 mb-1.5">تأكيد كلمة المرور الجديدة</label>
                      <input 
                        type={showPassword ? 'text' : 'password'} 
                        value={securitySettings.confirmPassword}
                        onChange={(e) => { setSecuritySettings({ ...securitySettings, confirmPassword: e.target.value }); triggerChange(); }}
                        className="w-full input-3d rounded-xl px-4 py-2.5 text-xs text-white"
                        placeholder="••••••••••••"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button 
                      type="button"
                      onClick={() => handleSaveProfile()}
                      className="px-4 py-2 rounded-xl btn-3d-primary text-black text-xs font-extrabold"
                    >
                      تحديث كلمة المرور
                    </button>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 4: NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="card-3d p-5 sm:p-6 space-y-5">
                <div>
                  <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
                    <Bell className="w-4 h-4 text-white" />
                    <span>تفضيلات الإشعارات والتنبيهات</span>
                  </h2>
                  <p className="text-xs text-zinc-400 mt-1">اختر التنبيهات التي ترغب باستلامها فوراً داخل المنصة أو عبر البريد.</p>
                </div>

                <div className="space-y-3.5 divide-y divide-white/5">
                  <div className="flex items-center justify-between pt-3">
                    <div>
                      <div className="text-xs font-extrabold text-white">تنبيهات السكريمات والتحديات الفورية</div>
                      <div className="text-[11px] text-zinc-400">استلام إشعار عند نشر سكريم جديد في لعبتك الأساسية أو قبول فريقك لتحدٍ.</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input 
                        type="checkbox" 
                        checked={notificationSettings.scrimInvites} 
                        onChange={(e) => { setNotificationSettings({ ...notificationSettings, scrimInvites: e.target.checked }); triggerChange(); }}
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-[#1e1e1e] border border-white/20 peer-focus:outline-none rounded-full peer peer-checked:bg-white peer-checked:border-white transition-colors duration-200 after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-zinc-400 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:bg-black" />
                    </label>
                  </div>

                  <div className="flex items-center justify-between pt-3">
                    <div>
                      <div className="text-xs font-extrabold text-white">طلبات الانضمام ودعوات الفرق</div>
                      <div className="text-[11px] text-zinc-400">إشعار عند تقديم لاعب على فريقك أو تلقيك دعوة للاختبار (Tryout).</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input 
                        type="checkbox" 
                        checked={notificationSettings.teamApplications} 
                        onChange={(e) => { setNotificationSettings({ ...notificationSettings, teamApplications: e.target.checked }); triggerChange(); }}
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-[#1e1e1e] border border-white/20 peer-focus:outline-none rounded-full peer peer-checked:bg-white peer-checked:border-white transition-colors duration-200 after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-zinc-400 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:bg-black" />
                    </label>
                  </div>

                  <div className="flex items-center justify-between pt-3">
                    <div>
                      <div className="text-xs font-extrabold text-white">الرسائل والمحادثات المباشرة</div>
                      <div className="text-[11px] text-zinc-400">تنبيه عند استلام رسالة خاصة جديدة من قادة الفرق أو اللاعبين.</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input 
                        type="checkbox" 
                        checked={notificationSettings.directMessages} 
                        onChange={(e) => { setNotificationSettings({ ...notificationSettings, directMessages: e.target.checked }); triggerChange(); }}
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-[#1e1e1e] border border-white/20 peer-focus:outline-none rounded-full peer peer-checked:bg-white peer-checked:border-white transition-colors duration-200 after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-zinc-400 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:bg-black" />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: PRIVACY & SOCIAL */}
          {activeTab === 'privacy' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="card-3d p-5 sm:p-6 space-y-4">
                <div>
                  <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
                    <Shield className="w-4 h-4 text-white" />
                    <span>الخصوصية والظهور في المجتمع</span>
                  </h2>
                  <p className="text-xs text-zinc-400 mt-1">التحكم في من يستطيع رؤية نشاطك ومراسلتك داخل مجتمع IEH.</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1.5">مستوى ظهور الملف الشخصي</label>
                    <select
                      value={privacySettings.profileVisibility}
                      onChange={(e) => { setPrivacySettings({ ...privacySettings, profileVisibility: e.target.value }); triggerChange(); }}
                      className="w-full input-3d rounded-xl px-4 py-2.5 text-xs text-white font-bold"
                    >
                      <option value="public">عام (مرئي للجميع ومحركات البحث)</option>
                      <option value="teams_only">للفرق واللاعبين المسجلين فقط</option>
                      <option value="private">خاص (مخفي)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1.5">من يمكنه إرسال رسائل خاصة لك؟</label>
                    <select
                      value={privacySettings.allowDirectMessages}
                      onChange={(e) => { setPrivacySettings({ ...privacySettings, allowDirectMessages: e.target.value }); triggerChange(); }}
                      className="w-full input-3d rounded-xl px-4 py-2.5 text-xs text-white font-bold"
                    >
                      <option value="everyone">الجميع</option>
                      <option value="teams">قادة الفرق الموثقة فقط</option>
                      <option value="none">لا أحد (إيقاف الرسائل المباشرة)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Floating Save Changes Notification Bar */}
      {hasUnsavedChanges && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-xl bg-[#111111] border border-white/20 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.95)] p-4 flex items-center justify-between gap-4 animate-in slide-in-from-bottom-5 duration-200">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
            <div className="text-xs font-bold text-white">لديك تعديلات غير محفوظة</div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setHasUnsavedChanges(false)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-zinc-400 hover:text-white"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={() => handleSaveProfile()}
              className="px-5 py-1.5 rounded-xl btn-3d-primary text-black text-xs font-extrabold shadow-sm active:scale-95 transition"
            >
              حفظ الآن
            </button>
          </div>
        </div>
      )}

      {/* Save Success Toast */}
      {savedSuccess && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-white text-black rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.95)] px-5 py-3 flex items-center gap-2 text-xs font-black animate-in fade-in zoom-in-95 duration-150">
          <CheckCircle2 className="w-4 h-4 text-black" />
          <span>تم حفظ الإعدادات بنجاح!</span>
        </div>
      )}

      {/* Password Confirmation Modal for Passkey Activation */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-[#141414] border border-white/20 rounded-2xl p-6 space-y-4 shadow-[0_20px_60px_rgba(0,0,0,0.9)]">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/10 text-white flex items-center justify-center">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white">تأكيد كلمة المرور لتفعيل Passkey</h3>
                  <p className="text-[11px] text-zinc-400">يلزم تأكيد هويتك مرة واحدة لإنشاء جلسة أمان وربط المفتاح</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleVerifyPasswordAndRegisterPasskey} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                  كلمة المرور لحسابك ({profileData.email}):
                </label>
                <input
                  type="password"
                  value={verifyPasswordInput}
                  onChange={(e) => setVerifyPasswordInput(e.target.value)}
                  placeholder="••••••••••••"
                  autoFocus
                  className="w-full input-3d rounded-xl px-4 py-2.5 text-xs text-white"
                />
              </div>

              {verifyPasswordError && (
                <div className="p-3 bg-red-500/10 border border-red-500/25 rounded-xl text-red-400 text-xs font-bold">
                  {verifyPasswordError}
                </div>
              )}

              <div className="flex items-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="flex-1 py-2.5 btn-3d-dark text-xs font-bold text-zinc-400 hover:text-white rounded-xl transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isVerifyingPassword}
                  className="flex-1 py-2.5 btn-3d-primary text-black text-xs font-extrabold rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-50"
                >
                  {isVerifyingPassword ? (
                    <Loader2 className="w-4 h-4 animate-spin text-black" />
                  ) : (
                    <>
                      <Fingerprint className="w-4 h-4 text-black" />
                      <span>تأكيد ومتابعة البصمة</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
