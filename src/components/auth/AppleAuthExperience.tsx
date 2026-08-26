'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Mail, 
  Lock, 
  User, 
  AtSign, 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle2, 
  Loader2, 
  KeyRound, 
  ShieldCheck, 
  Fingerprint, 
  Eye, 
  EyeOff, 
  Sparkles,
  Gamepad2,
  MapPin,
  Flame,
  Trophy,
  Heart,
  Star,
  Zap,
  Crown
} from 'lucide-react';
import { SwordsIcon } from '@/components/icons/CustomIcons';
import { supabase } from '@/lib/supabase';
import { GameSearchSelect } from '@/components/GameSearchSelect';
import { CustomSelect } from '@/components/CustomSelect';

interface AppleAuthExperienceProps {
  initialMode?: 'register' | 'login';
  onAuthSuccess?: () => void;
}

export function AppleAuthExperience({
  initialMode = 'login',
  onAuthSuccess,
}: AppleAuthExperienceProps) {
  const [mode, setMode] = useState<'register' | 'login'>(initialMode);
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [primaryGame, setPrimaryGame] = useState('');
  const [city, setCity] = useState('أونلاين (بدون مقر فيزيائي)');

  // UI status states
  const [isLoading, setIsLoading] = useState(false);
  const [isPasskeyLoading, setIsPasskeyLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [passkeySuccess, setPasskeySuccess] = useState(false);
  const [registeredUserId, setRegisteredUserId] = useState<string | null>(null);

  const cities = [
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
    'ديالى',
    'واسط',
    'ميسان',
    'المثنى',
    'صلاح الدين',
    'القادسية',
  ];

  useEffect(() => {
    setErrorMsg('');
  }, [step, mode]);

  // Handle Step 1 (Credentials Validation & Pre-check)
  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setErrorMsg('يرجى إدخال بريد إلكتروني صحيح ومعتمد');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('يجب أن تتكون كلمة المرور من 6 خانات على الأقل');
      return;
    }

    setIsLoading(true);
    try {
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (existingProfile) {
        setErrorMsg('هذا البريد مسجل مسبقاً. يمكنك تسجيل الدخول مباشرة');
        setIsLoading(false);
        return;
      }

      setTimeout(() => {
        setIsLoading(false);
        setStep(2);
      }, 200);
    } catch (err: any) {
      setErrorMsg(err.message || 'حدث خطأ أثناء التحقق');
      setIsLoading(false);
    }
  };

  // Handle Step 2 (Account and Profile Creation)
  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanUsername = username.trim().toLowerCase().replace(/[^a-zA-Z0-9_]/g, '');
    const cleanFullName = fullName.trim();

    if (!cleanFullName || cleanFullName.length < 2) {
      setErrorMsg('يرجى إدخال اسمك الكامل');
      return;
    }

    if (!cleanUsername || cleanUsername.length < 3) {
      setErrorMsg('اسم المستخدم يجب أن يكون من 3 أحرف أو أرقام على الأقل');
      return;
    }

    setIsLoading(true);
    try {
      const { data: userWithUsername } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', cleanUsername)
        .maybeSingle();

      if (userWithUsername) {
        setErrorMsg(`اسم المستخدم @${cleanUsername} مستخدم بالفعل`);
        setIsLoading(false);
        return;
      }

      const cleanEmail = email.trim().toLowerCase();

      let authUserId: string | null = null;
      try {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: cleanEmail,
          password: password,
          options: {
            data: {
              full_name: cleanFullName,
              username: cleanUsername,
            },
          },
        });

        if (authError && !authError.message.includes('already registered')) {
          console.warn('Supabase Auth signUp note:', authError.message);
        } else if (authData.user) {
          authUserId = authData.user.id;
        }

        if (!authData?.session) {
          try {
            await supabase.auth.signInWithPassword({
              email: cleanEmail,
              password: password,
            });
          } catch (signInEx) {
            console.warn('Post-signup auto signIn note:', signInEx);
          }
        }
      } catch (authEx) {
        console.warn('Auth exception handled:', authEx);
      }

      const newUserId = authUserId || crypto.randomUUID();

      const { data: newProfile, error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: newUserId,
          auth_user_id: authUserId,
          email: cleanEmail,
          username: cleanUsername,
          full_name: cleanFullName,
          role: 'player',
          primary_game: primaryGame,
          city: city,
          avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanUsername}`,
          bio: 'لاعب في شبكة الرياضات الإلكترونية العراقية (IEH)',
          is_verified: false,
        })
        .select('*')
        .single();

      if (profileError) {
        throw new Error('فشل إنشاء الملف الشخصي: ' + profileError.message);
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem('babylon_user_id', newProfile.id);
      }
      setRegisteredUserId(newProfile.id);

      setTimeout(() => {
        setIsLoading(false);
        setStep(3);
      }, 250);
    } catch (err: any) {
      setErrorMsg(err.message || 'فشل إتمام إنشاء الحساب، يرجى المحاولة ثانية');
      setIsLoading(false);
    }
  };

  // Handle Step 3: Register Passkey
  const handleAddPasskey = async () => {
    setIsPasskeyLoading(true);
    setErrorMsg('');

    try {
      if (typeof window === 'undefined' || !window.PublicKeyCredential) {
        throw new Error('المتصفح أو الجهاز الحالي لا يدعم تقنية مفاتيح المرور (Passkeys).');
      }

      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session && email && password) {
        try {
          const { error: sInErr } = await supabase.auth.signInWithPassword({
            email: email.trim().toLowerCase(),
            password: password,
          });
          if (sInErr) {
            await supabase.auth.signUp({
              email: email.trim().toLowerCase(),
              password: password,
            });
          }
        } catch (sErr) {
          console.warn('Session refresh note:', sErr);
        }
      }

      const { data, error } = await supabase.auth.registerPasskey();

      if (error) {
        if (error.name === 'NotAllowedError' || error.message?.includes('NotAllowedError')) {
          throw new Error('تم إلغاء عملية مفتاح المرور أو لم يتم التعرف على البصمة');
        }
        if (error.message?.includes('passkey_disabled')) {
          throw new Error('خدمة Passkey غير مفعلة في مشروع Supabase حالياً');
        }
        throw new Error(error.message || 'تعذر تسجيل مفتاح المرور');
      }

      if (data) {
        setPasskeySuccess(true);
        setTimeout(() => {
          completeAuth();
        }, 1000);
      }
    } catch (err: any) {
      console.error('Supabase passkey registration error:', err);
      if (err.name === 'NotAllowedError' || err.message?.includes('NotAllowedError')) {
        setErrorMsg('تم إلغاء عملية مفتاح المرور أو لم يتم التعرف على البصمة');
      } else {
        setErrorMsg(err.message || 'تعذر تسجيل مفتاح المرور');
      }
    } finally {
      setIsPasskeyLoading(false);
    }
  };

  const completeAuth = () => {
    if (onAuthSuccess) {
      onAuthSuccess();
    } else if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  // Handle Login with Passkey
  const handlePasskeyLogin = async () => {
    setIsPasskeyLoading(true);
    setErrorMsg('');

    try {
      if (typeof window === 'undefined' || !window.PublicKeyCredential) {
        throw new Error('المتصفح أو الجهاز لا يدعم تسجيل الدخول عبر Passkey');
      }

      const { data, error } = await supabase.auth.signInWithPasskey();

      if (error) {
        if (error.name === 'NotAllowedError' || error.message?.includes('NotAllowedError')) {
          throw new Error('تم إلغاء تسجيل الدخول بالبصمة');
        }
        if (
          error.message?.includes('webauthn_credential_not_found') ||
          error.message?.includes('verification failed') ||
          error.message?.includes('Credential verification failed') ||
          error.message?.includes('not found')
        ) {
          throw new Error('لم يتم العثور على مفتاح مرور مسجل لهذا الجهاز. سجّل بالبريد أولاً ثم أضف المفتاح من الإعدادات.');
        }
        if (error.message?.includes('passkey_disabled')) {
          throw new Error('خدمة Passkey غير مفعلة حالياً');
        }
        throw new Error(error.message || 'فشل التحقق من مفتاح المرور');
      }

      if (data?.user) {
        const userEmail = data.user.email?.toLowerCase().trim();
        const userId = data.user.id;

        let profile = null;
        if (userEmail) {
          const { data: p } = await supabase
            .from('profiles')
            .select('*')
            .eq('email', userEmail)
            .maybeSingle();
          profile = p;
        }

        if (!profile && userId) {
          const { data: p } = await supabase
            .from('profiles')
            .select('*')
            .or(`id.eq.${userId},auth_user_id.eq.${userId}`)
            .maybeSingle();
          profile = p;
        }

        if (profile) {
          if (profile.is_banned) {
            await supabase.auth.signOut();
            throw new Error('تم حظر هذا الحساب لمخالفة قوانين المنصة');
          }
          localStorage.setItem('babylon_user_id', profile.id);
        } else if (userId) {
          localStorage.setItem('babylon_user_id', userId);
        }

        completeAuth();
      } else {
        throw new Error('لم يتم استرجاع بيانات المستخدم');
      }
    } catch (err: any) {
      console.error('Passkey login error:', err);
      setErrorMsg(err.message || 'فشل تسجيل الدخول بمفتاح المرور');
    } finally {
      setIsPasskeyLoading(false);
    }
  };

  // Handle Email / Username Login with Auto-sync
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      const cleanInput = email.trim().toLowerCase();

      // Look up profile by either email or username
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .or(`email.ilike.${cleanInput},username.ilike.${cleanInput}`)
        .maybeSingle();

      if (profileError || !profile) {
        throw new Error('لم يتم العثور على حساب بهذا البريد الإلكتروني أو اسم المستخدم');
      }

      if (profile.is_banned) {
        throw new Error('تم حظر هذا الحساب لمخالفة قوانين المنصة');
      }

      const userEmail = (profile.email || cleanInput).toLowerCase();

      // Attempt sign in with Supabase Auth
      const { data: authData, error: authSignInError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: password,
      });

      // If user isn't in auth.users yet (e.g. seeded profile), provision automatically
      if (authSignInError && (authSignInError.message?.includes('Invalid login credentials') || authSignInError.message?.includes('invalid_grant'))) {
        try {
          const { data: signupData, error: signupError } = await supabase.auth.signUp({
            email: userEmail,
            password: password,
            options: {
              data: {
                full_name: profile.full_name,
                username: profile.username,
              },
            },
          });

          if (signupData?.user) {
            await supabase
              .from('profiles')
              .update({ auth_user_id: signupData.user.id })
              .eq('id', profile.id);
          }
        } catch (signupEx) {
          console.warn('Auto-sync auth user note:', signupEx);
        }
      } else if (authData?.user && !profile.auth_user_id) {
        await supabase
          .from('profiles')
          .update({ auth_user_id: authData.user.id })
          .eq('id', profile.id);
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem('babylon_user_id', profile.id);
      }

      completeAuth();
    } catch (err: any) {
      setErrorMsg(err.message || 'فشل تسجيل الدخول، يرجى التحقق من صحة البيانات');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-black text-white flex flex-col justify-between selection:bg-[#0095f6]/30 selection:text-white">
      
      {/* Main Container: Split Screen on Desktop (Instagram-style) */}
      <div className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          
          {/* ========================================================
              LEFT COLUMN: INSTAGRAM-STYLE HERO SHOWCASE WITH MOCKUPS
             ======================================================== */}
          <div className="hidden lg:flex flex-col items-center text-center space-y-8 select-none">
            
            {/* Gradient Logo */}
            <div className="w-16 h-16 rounded-[22px] bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] p-[2px] shadow-[0_8px_30px_rgba(220,39,67,0.3)]">
              <div className="w-full h-full bg-black rounded-[20px] flex items-center justify-center">
                <Flame className="w-9 h-9 text-white" />
              </div>
            </div>

            {/* Headline */}
            <div className="space-y-2 max-w-md">
              <h2 className="text-3xl xl:text-4xl font-extrabold tracking-tight text-white leading-tight">
                شاهد أقوى اللحظات والبطولات من{' '}
                <span className="bg-gradient-to-r from-[#f09433] via-[#e6683c] via-[#dc2743] via-[#cc2366] to-[#bc1888] bg-clip-text text-transparent">
                  فرقك المفضلة.
                </span>
              </h2>
              <p className="text-sm text-zinc-400">
                المنصة الرسمية المخصصة للاعبي وفرق الرياضات الإلكترونية داخل جمهورية العراق.
              </p>
            </div>

            {/* Layered Story / Phone Mockup Visual */}
            <div className="relative w-80 h-96 mt-2 flex items-center justify-center">
              
              {/* Back Card Left (Valorant Esports) */}
              <div className="absolute left-2 w-52 h-72 rounded-3xl bg-gradient-to-b from-[#1a1a2e] to-[#0f0f1a] border border-white/10 shadow-2xl transform -rotate-12 -translate-y-2 overflow-hidden opacity-85">
                <div className="w-full h-full bg-gradient-to-br from-indigo-900/60 via-purple-900/40 to-black p-4 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-white text-[11px] font-bold">
                    <span className="flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 text-yellow-400" />
                      <span>GX Scrims</span>
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-white/10 text-[9px]">Valorant</span>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="text-xs font-black text-white">نهائي بطولة العراق</div>
                    <div className="text-[10px] text-zinc-400">12:00 PM • سيرفر بغداد</div>
                  </div>
                  <div className="flex items-center justify-between text-white text-[10px]">
                    <span className="text-emerald-400 font-bold">● جاري اللعب</span>
                    <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                  </div>
                </div>
              </div>

              {/* Back Card Right (PUBG / CS2) */}
              <div className="absolute right-2 w-52 h-72 rounded-3xl bg-gradient-to-b from-[#2a1a10] to-[#120c06] border border-white/10 shadow-2xl transform rotate-12 -translate-y-1 overflow-hidden opacity-85">
                <div className="w-full h-full bg-gradient-to-br from-amber-900/60 via-orange-950/40 to-black p-4 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-white text-[11px] font-bold">
                    <span className="flex items-center gap-1">
                      <Trophy className="w-3.5 h-3.5 text-amber-400" />
                      <span>IEH Cup</span>
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[9px]">PUBG-M</span>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="text-xs font-black text-white">روم تصفيات النخبة</div>
                    <div className="text-[10px] text-zinc-400">جائزة 1,000,000 د.ع</div>
                  </div>
                  <div className="flex items-center justify-between text-white text-[10px]">
                    <span className="text-amber-400 font-bold">16 فريق</span>
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  </div>
                </div>
              </div>

              {/* Center Main Card (Phone Story Style with Instagram Details) */}
              <div className="relative z-10 w-64 h-88 rounded-[28px] bg-[#0c0c0c] border-2 border-white/20 shadow-[0_25px_60px_rgba(0,0,0,0.95)] overflow-hidden flex flex-col justify-between p-3.5">
                
                {/* Background Artwork */}
                <div className="absolute inset-0 bg-gradient-to-b from-blue-900/30 via-[#101827]/80 to-[#050811] z-0" />
                
                {/* Story Top Bar */}
                <div className="relative z-10 space-y-2.5">
                  <div className="flex gap-1">
                    <div className="h-0.5 flex-1 bg-white rounded-full" />
                    <div className="h-0.5 flex-1 bg-white/40 rounded-full" />
                    <div className="h-0.5 flex-1 bg-white/40 rounded-full" />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] p-[1.5px]">
                        <div className="w-full h-full rounded-full bg-black flex items-center justify-center text-white text-xs font-black">
                          IQ
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[11px] font-bold text-white leading-tight">ShadowIQ</div>
                        <div className="text-[9px] text-zinc-400">كابتن فريق ذئاب بغداد</div>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-[10px] font-bold text-emerald-400 flex items-center gap-1 shadow-sm">
                      <Star className="w-2.5 h-2.5 fill-emerald-400" />
                      <span>مباشر</span>
                    </span>
                  </div>
                </div>

                {/* Center Showcase Content */}
                <div className="relative z-10 my-auto text-center space-y-2 px-2">
                  <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/15 flex items-center justify-center mx-auto shadow-inner">
                    <Crown className="w-7 h-7 text-amber-400" />
                  </div>
                  <div className="text-sm font-black text-white">تحدي 5v5 فوري</div>
                  <div className="text-[11px] text-zinc-400">جاهزون لأي كلان عراقي الليلة ⚔️</div>
                </div>

                {/* Floating Reaction Pill */}
                <div className="absolute top-1/2 left-3 -translate-y-1/2 z-20 px-2.5 py-1 rounded-full bg-black/80 backdrop-blur-md border border-white/20 text-white text-xs flex items-center gap-1.5 shadow-2xl animate-pulse">
                  <span>🔥</span>
                  <span className="font-bold text-[10px]">13 - 4 فوز</span>
                </div>

                {/* Floating Heart Icon Left */}
                <div className="absolute -bottom-2 -left-2 z-20 w-10 h-10 rounded-full bg-gradient-to-tr from-[#dc2743] to-[#bc1888] flex items-center justify-center shadow-xl">
                  <Heart className="w-5 h-5 fill-white text-white" />
                </div>

                {/* Bottom Story Reply Bar */}
                <div className="relative z-10 flex items-center gap-2">
                  <div className="flex-1 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[11px] text-zinc-400 text-right">
                    إرسال رسالة أو طلب سكريم...
                  </div>
                  <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-center text-white">
                    <Heart className="w-4 h-4 text-white" />
                  </div>
                </div>

              </div>

            </div>

          </div>

          {/* ========================================================
              RIGHT COLUMN: AUTH FORM (EXACT INSTAGRAM STYLE)
             ======================================================== */}
          <div className="w-full max-w-sm mx-auto flex flex-col justify-center">
            
            {/* Mobile Logo (visible on mobile only) */}
            <div className="lg:hidden text-center mb-6">
              <div className="w-12 h-12 rounded-[18px] bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] p-[2px] mx-auto mb-2 shadow-lg">
                <div className="w-full h-full bg-black rounded-[16px] flex items-center justify-center">
                  <Flame className="w-6 h-6 text-white" />
                </div>
              </div>
              <h1 className="text-xl font-black text-white">IRAQ ESPORTS HUB</h1>
            </div>

            {/* Main Form Box */}
            <div className="space-y-4">
              
              {/* Heading */}
              <div className="mb-2">
                <h3 className="text-base font-semibold text-white">
                  {mode === 'login' 
                    ? 'تسجيل الدخول إلى IEH' 
                    : step === 1 
                    ? 'إنشاء حساب لاعب جديد' 
                    : step === 2 
                    ? 'أكمل هويتك في الشبكة' 
                    : 'تأمين الحساب بمفتاح المرور'}
                </h3>
              </div>

              {/* Error Message */}
              {errorMsg && (
                <div className="p-3 rounded-xl bg-[#ed4956]/10 border border-[#ed4956]/30 text-[#ed4956] text-xs font-medium text-center animate-in fade-in">
                  {errorMsg}
                </div>
              )}

              {/* ===================== MODE: LOGIN ===================== */}
              {mode === 'login' && (
                <form onSubmit={handleEmailLogin} className="space-y-3">
                  
                  {/* Email / Username Input */}
                  <div>
                    <input
                      type="text"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="اسم المستخدم أو البريد الإلكتروني"
                      className="w-full px-3.5 py-3 rounded-xl bg-[#121212] border border-white/15 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-white/40 hover:border-white/25 transition"
                      required
                      autoFocus
                    />
                  </div>

                  {/* Password Input */}
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="كلمة المرور"
                      className="w-full px-3.5 py-3 pr-3.5 pl-12 rounded-xl bg-[#121212] border border-white/15 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-white/40 hover:border-white/25 transition font-mono"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-zinc-400 hover:text-white transition"
                    >
                      {showPassword ? 'إخفاء' : 'عرض'}
                    </button>
                  </div>

                  {/* Primary Login Button (Instagram Blue with Smooth Animation) */}
                  <button
                    type="submit"
                    disabled={isLoading || !email.trim() || !password.trim()}
                    className="w-full py-2.5 rounded-xl bg-[#0095f6] hover:bg-[#1877f2] active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none text-white font-semibold text-sm transition-all duration-150 flex items-center justify-center gap-2 mt-1 cursor-pointer shadow-[0_4px_14px_rgba(0,149,246,0.25)]"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                    ) : (
                      <span>تسجيل الدخول</span>
                    )}
                  </button>

                  {/* Forgot Password Link */}
                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={() => alert('لإعادة تعيين كلمة المرور، يرجى التواصل مع إدارة الدعم الفني: admin@iraqesportshub.com')}
                      className="text-xs text-zinc-400 hover:text-white transition"
                    >
                      هل نسيت كلمة المرور؟
                    </button>
                  </div>

                  {/* Divider */}
                  <div className="flex items-center gap-4 py-2">
                    <div className="flex-1 h-[1px] bg-white/15" />
                    <span className="text-xs text-zinc-500 font-semibold">أو</span>
                    <div className="flex-1 h-[1px] bg-white/15" />
                  </div>

                  {/* Passkey / Face ID Login Button (Smooth Glassmorphism) */}
                  <button
                    type="button"
                    onClick={handlePasskeyLogin}
                    disabled={isPasskeyLoading}
                    className="w-full py-2.5 px-4 rounded-xl bg-white/[0.04] border border-white/20 hover:bg-white/[0.08] hover:border-white/35 active:scale-[0.98] text-white text-xs font-semibold flex items-center justify-center gap-2.5 transition-all duration-150 cursor-pointer"
                  >
                    {isPasskeyLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                    ) : (
                      <>
                        <Fingerprint className="w-4 h-4 text-[#0095f6]" />
                        <span>تسجيل الدخول عبر Passkey / Face ID</span>
                      </>
                    )}
                  </button>

                  {/* Create New Account Button (Outline Style like Instagram) */}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('register');
                      setStep(1);
                    }}
                    className="w-full py-2.5 rounded-xl border border-[#0095f6] text-[#0095f6] hover:bg-[#0095f6]/10 active:scale-[0.98] text-sm font-semibold transition-all duration-150 text-center block mt-3 cursor-pointer"
                  >
                    إنشاء حساب جديد
                  </button>

                </form>
              )}

              {/* ===================== MODE: REGISTER ===================== */}
              {mode === 'register' && (
                <div className="space-y-4">
                  
                  {/* Step Indicator Dots */}
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <div className={`h-1 flex-1 rounded-full transition-all ${step >= 1 ? 'bg-[#0095f6]' : 'bg-white/10'}`} />
                    <div className={`h-1 flex-1 rounded-full transition-all ${step >= 2 ? 'bg-[#0095f6]' : 'bg-white/10'}`} />
                    <div className={`h-1 flex-1 rounded-full transition-all ${step >= 3 ? 'bg-[#0095f6]' : 'bg-white/10'}`} />
                  </div>

                  {/* STEP 1: EMAIL & PASSWORD */}
                  {step === 1 && (
                    <form onSubmit={handleStep1Submit} className="space-y-3">
                      <div>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="البريد الإلكتروني"
                          className="w-full px-3.5 py-3 rounded-xl bg-[#121212] border border-white/15 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-white/40 hover:border-white/25 transition"
                          required
                          autoFocus
                        />
                      </div>

                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="كلمة المرور (6 خانات على الأقل)"
                          className="w-full px-3.5 py-3 pr-3.5 pl-12 rounded-xl bg-[#121212] border border-white/15 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-white/40 hover:border-white/25 transition font-mono"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-zinc-400 hover:text-white transition"
                        >
                          {showPassword ? 'إخفاء' : 'عرض'}
                        </button>
                      </div>

                      <button
                        type="submit"
                        disabled={isLoading || !email.trim() || !password.trim()}
                        className="w-full py-2.5 rounded-xl bg-[#0095f6] hover:bg-[#1877f2] active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none text-white font-semibold text-sm transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer shadow-[0_4px_14px_rgba(0,149,246,0.25)]"
                      >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <span>متابعة</span>}
                      </button>

                      <button
                        type="button"
                        onClick={() => setMode('login')}
                        className="w-full py-2.5 rounded-xl border border-white/20 text-zinc-300 hover:text-white hover:bg-white/5 active:scale-[0.98] text-xs font-semibold transition-all duration-150 cursor-pointer"
                      >
                        لديك حساب بالفعل؟ تسجيل الدخول
                      </button>
                    </form>
                  )}

                  {/* STEP 2: NAME, USERNAME, GAME, CITY */}
                  {step === 2 && (
                    <form onSubmit={handleStep2Submit} className="space-y-3">
                      <div>
                        <input
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="الاسم الكامل"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#121212] border border-white/15 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-white/40"
                          required
                          autoFocus
                        />
                      </div>

                      <div>
                        <input
                          type="text"
                          value={username}
                          onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                          placeholder="اسم المستخدم (Username بالإنجليزية)"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#121212] border border-white/15 text-white placeholder-zinc-500 text-xs font-mono text-left focus:outline-none focus:border-white/40"
                          required
                        />
                      </div>

                      <div>
                        <GameSearchSelect
                          label="اللعبة الأساسية:"
                          mode="single"
                          value={primaryGame}
                          onChange={setPrimaryGame}
                          placeholder="ابحث عن لعبتك..."
                          showSuggestions={false}
                        />
                      </div>

                      <div>
                        <CustomSelect
                          label="المحافظة:"
                          value={city}
                          onChange={setCity}
                          options={cities}
                          icon={<MapPin className="w-4 h-4 text-zinc-400" />}
                        />
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setStep(1)}
                          className="px-4 py-2.5 rounded-xl border border-white/15 text-xs font-semibold text-zinc-400 hover:text-white active:scale-[0.98] transition cursor-pointer"
                        >
                          رجوع
                        </button>
                        <button
                          type="submit"
                          disabled={isLoading || !fullName.trim() || !username.trim()}
                          className="flex-1 py-2.5 rounded-xl bg-[#0095f6] hover:bg-[#1877f2] active:scale-[0.98] text-white font-semibold text-sm transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-40 cursor-pointer shadow-[0_4px_14px_rgba(0,149,246,0.25)]"
                        >
                          {isLoading ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <span>إنشاء الحساب</span>}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* STEP 3: PASSKEY ENROLLMENT */}
                  {step === 3 && (
                    <div className="space-y-4 text-center">
                      <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 space-y-2 text-right">
                        <div className="flex items-center gap-2 text-white font-bold text-xs">
                          <Fingerprint className="w-4 h-4 text-[#0095f6]" />
                          <span>تسجيل دخول فوري بدون كلمة مرور</span>
                        </div>
                        <p className="text-xs text-zinc-400 leading-relaxed">
                          أضف مفتاح مرور Passkey لتتمكن من الدخول بلمسة واحدة عبر Face ID أو بصمة الإصبع في كل مرة.
                        </p>
                      </div>

                      {passkeySuccess ? (
                        <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-green-300 text-xs font-bold space-y-1">
                          <CheckCircle2 className="w-6 h-6 mx-auto text-green-400" />
                          <div>تم تفعيل مفتاح المرور بنجاح!</div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <button
                            type="button"
                            onClick={handleAddPasskey}
                            disabled={isPasskeyLoading}
                            className="w-full py-3 rounded-xl bg-[#0095f6] hover:bg-[#1877f2] active:scale-[0.98] text-white font-semibold text-sm transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer shadow-[0_4px_14px_rgba(0,149,246,0.25)]"
                          >
                            {isPasskeyLoading ? (
                              <Loader2 className="w-4 h-4 animate-spin text-white" />
                            ) : (
                              <>
                                <Fingerprint className="w-4 h-4" />
                                <span>إضافة مفتاح المرور (Passkey)</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={completeAuth}
                            className="w-full py-2 text-xs text-zinc-400 hover:text-white active:scale-[0.98] transition cursor-pointer"
                          >
                            تخطي الآن والدخول إلى المنصة
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                </div>
              )}

            </div>

          </div>

        </div>
      </div>

      {/* ========================================================
          BOTTOM FOOTER: LEGAL & COPYRIGHT (INSTAGRAM STYLE)
         ======================================================== */}
      <footer className="py-6 px-4 border-t border-white/[0.06] text-center text-xs text-zinc-500 space-y-3">
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 font-medium">
          <span className="hover:text-zinc-300 cursor-pointer">عن IEH</span>
          <span className="hover:text-zinc-300 cursor-pointer">الفرق</span>
          <span className="hover:text-zinc-300 cursor-pointer">السكريمات</span>
          <span className="hover:text-zinc-300 cursor-pointer">البطولات</span>
          <span className="hover:text-zinc-300 cursor-pointer">الخصوصية</span>
          <span className="hover:text-zinc-300 cursor-pointer">الشروط</span>
          <span className="hover:text-zinc-300 cursor-pointer">الدعم الفني</span>
        </div>
        <div className="text-[11px] text-zinc-600 font-mono">
          © 2026 IRAQ ESPORTS HUB FROM SHAMIKH
        </div>
      </footer>

    </div>
  );
}
