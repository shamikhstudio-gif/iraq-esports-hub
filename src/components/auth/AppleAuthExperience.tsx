'use client';

import React, { useState } from 'react';
import { IehLogo } from '@/components/icons/CustomIcons';
import { supabase } from '@/lib/supabase';
import { AuthHeroShowcase } from './AuthHeroShowcase';
import { ShieldCheck, Zap, Trophy, Loader2 } from 'lucide-react';
import { Button, Badge, Card } from '@/components/ui';

interface AppleAuthExperienceProps {
  initialMode?: 'register' | 'login';
  onAuthSuccess?: () => void;
}

export function AppleAuthExperience({
  onAuthSuccess,
}: AppleAuthExperienceProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isDesktopWaiting, setIsDesktopWaiting] = useState(false);

  // Listen for desktop auth callbacks (from loopback HTTP server or ieh:// deep link)
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const electron = (window as any).electronAPI;
    if (!electron) return;

    const unbindAuthSuccess = electron.onDesktopAuthSuccess?.(async (tokens: { access_token?: string; refresh_token?: string }) => {
      if (tokens?.access_token) {
        setIsLoading(true);
        setIsDesktopWaiting(false);
        try {
          const { error } = await supabase.auth.setSession({
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token || '',
          });
          if (!error && onAuthSuccess) {
            onAuthSuccess();
          }
        } catch (e) {
          console.warn('SetSession error:', e);
        } finally {
          setIsLoading(false);
        }
      }
    });

    const unbindDeepLink = electron.onDesktopDeepLink?.(async (url: string) => {
      try {
        const hash = url.split('#')[1];
        if (hash) {
          const params = new URLSearchParams(hash);
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');
          if (accessToken) {
            setIsLoading(true);
            setIsDesktopWaiting(false);
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || '',
            });
            if (!error && onAuthSuccess) {
              onAuthSuccess();
            }
          }
        }
      } catch (e) {
        console.warn('Deep link parse error:', e);
      } finally {
        setIsLoading(false);
      }
    });

    return () => {
      unbindAuthSuccess?.();
      unbindDeepLink?.();
    };
  }, [onAuthSuccess]);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const isDesktop = typeof window !== 'undefined' && Boolean((window as any).electronAPI?.isDesktop);
      const isMobileApp = typeof window !== 'undefined' && (
        Boolean((window as any).Capacitor) ||
        /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
      );

      if (isDesktop) {
        // Desktop Electron App: open system browser where Google accounts are saved
        setIsDesktopWaiting(true);
        const desktopRedirectUrl = 'https://iraq-esports-hub.pages.dev/auth/desktop-callback';

        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: desktopRedirectUrl,
            skipBrowserRedirect: true,
            queryParams: {
              access_type: 'offline',
              prompt: 'select_account',
            },
          },
        });

        if (error) throw error;

        if (data?.url) {
          (window as any).electronAPI.openExternal(data.url);
        }
        return;
      }

      if (isMobileApp) {
        // Mobile App: Use secure handoff ticket so Chrome on Android passes session back to the app
        const ticket = crypto.randomUUID();
        const mobileRedirectUrl = `https://iraq-esports-hub.pages.dev/auth/mobile-callback?ticket=${ticket}`;

        // 1. Subscribe to Realtime channel for instant session handoff
        const handoffChannel = supabase.channel(`auth-handoff-${ticket}`);
        handoffChannel
          .on('broadcast', { event: 'authenticated' }, async ({ payload }) => {
            if (payload?.access_token) {
              await supabase.auth.setSession({
                access_token: payload.access_token,
                refresh_token: payload.refresh_token || '',
              });
              handoffChannel.unsubscribe();
              onAuthSuccess?.();
            }
          })
          .subscribe();

        const checkHandoff = async () => {
          try {
            const { data: handoff } = await supabase
              .from('auth_handoffs')
              .select('*')
              .eq('ticket', ticket)
              .maybeSingle();

            if (handoff?.access_token) {
              clearInterval(pollInterval);
              window.removeEventListener('focus', checkHandoff);
              document.removeEventListener('visibilitychange', checkHandoff);
              await supabase.from('auth_handoffs').delete().eq('ticket', ticket);
              await supabase.auth.setSession({
                access_token: handoff.access_token,
                refresh_token: handoff.refresh_token || '',
              });
              handoffChannel.unsubscribe();
              onAuthSuccess?.();
            }
          } catch {
            // ignore
          }
        };

        const pollInterval = setInterval(checkHandoff, 1000);
        window.addEventListener('focus', checkHandoff);
        document.addEventListener('visibilitychange', checkHandoff);

        setTimeout(() => {
          clearInterval(pollInterval);
          window.removeEventListener('focus', checkHandoff);
          document.removeEventListener('visibilitychange', checkHandoff);
          handoffChannel.unsubscribe();
        }, 180000);

        // 3. Initiate Google OAuth
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: mobileRedirectUrl,
            queryParams: {
              access_type: 'offline',
              prompt: 'select_account',
            },
          },
        });

        if (error) {
          clearInterval(pollInterval);
          handoffChannel.unsubscribe();
          throw error;
        }

        return;
      }

      // Web App Browser Flow
      const redirectUrl = typeof window !== 'undefined'
        ? window.location.origin.replace(/\/$/, '')
        : 'https://iraq-esports-hub.pages.dev';

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
        },
      });

      if (error) {
        throw error;
      }
    } catch (err: unknown) {
      console.error('Google Sign-in error:', err);
      setErrorMsg(err instanceof Error ? err.message : 'تعذر الاتصال بخدمة Google، يرجى المحاولة مجدداً');
      setIsLoading(false);
      setIsDesktopWaiting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-black text-white flex flex-col justify-between selection:bg-white selection:text-black">
      {/* Main Container: Split Screen on Desktop */}
      <div className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Column: Hero Showcase */}
          <AuthHeroShowcase />

          {/* Right Column: Google Auth Card */}
          <div className="w-full max-w-md mx-auto flex flex-col justify-center">
            {/* Mobile Logo */}
            <div className="lg:hidden text-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-black border border-white/20 p-2.5 mx-auto mb-3 flex items-center justify-center shadow-2xl">
                <IehLogo size={42} glow={false} />
              </div>
              <h1 className="text-xl font-black tracking-widest text-white">IRAQ ESPORTS HUB</h1>
              <p className="text-xs text-zinc-400 mt-1">المنصة الرسمية للرياضات الإلكترونية في العراق</p>
            </div>

            {/* Auth Box */}
            <div className="bg-[#090909] border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
              {/* Header inside Card */}
              <div className="text-center space-y-2">
                <div>
                  <Badge variant="outline" size="sm" icon={<span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}>
                    CLOSED BETA // 2026
                  </Badge>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  تسجيل الدخول
                </h2>
                <p className="text-xs sm:text-sm text-zinc-400">
                  الدخول الحصري للاعبين والفرق المعتمدة في العراق
                </p>
              </div>

              {/* Error Message */}
              {errorMsg && (
                <div className="p-3.5 rounded-xl bg-white/5 border border-white/20 text-white text-xs font-medium text-center animate-in fade-in">
                  {errorMsg}
                </div>
              )}

              {/* Single 1-Click Google Sign-In Button */}
              <div className="pt-2">
                <Button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  isLoading={isLoading}
                  variant="primary"
                  size="lg"
                  fullWidth
                  className="h-14 rounded-2xl text-sm sm:text-base border border-white/30"
                  icon={
                    !isLoading && (
                      <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        />
                      </svg>
                    )
                  }
                >
                  {isLoading
                    ? (isDesktopWaiting ? 'بانتظار تسجيل الدخول في المتصفح...' : 'جاري الاتصال بـ Google...')
                    : 'المتابعة باستخدام Google'}
                </Button>
                {isDesktopWaiting && (
                  <div className="text-center mt-2 animate-pulse">
                    <span className="text-[11px] text-white/70">
                      تم فتح المتصفح — اختر حساب Google ليتم ربط التطبيق تلقائياً
                    </span>
                  </div>
                )}
                <div className="text-center mt-2.5">
                  <span className="text-[11px] text-zinc-500 font-medium">
                    تسجيل فوري بضغطة واحدة بدون كلمات مرور
                  </span>
                </div>
              </div>

              {/* Trust & Security Features */}
              <div className="pt-4 border-t border-white/[0.08] space-y-3">
                <div className="flex items-center gap-3 text-xs text-zinc-400">
                  <ShieldCheck className="w-4 h-4 text-white shrink-0" />
                  <span>مصادقة أمان معتمدة ومحمية عبر Google Identity</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-zinc-400">
                  <Zap className="w-4 h-4 text-white shrink-0" />
                  <span>مزامنة فورية للملف الشخصي وسجل بطولات السكريمات</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-zinc-400">
                  <Trophy className="w-4 h-4 text-white shrink-0" />
                  <span>رصيد ترحيبي 50 eBits فوري عند أول تسجيل دخول</span>
                </div>
              </div>

              {/* Disclaimer */}
              <div className="pt-2 text-center">
                <p className="text-[10px] text-zinc-600 leading-relaxed">
                  بالمتابعة فإنك توافق على ميثاق النزاهة التنافسية وشروط الخدمة الخاصة بشبكة IEH.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-6 px-4 border-t border-white/[0.06] text-center text-xs text-zinc-500 space-y-2">
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 font-medium">
          <span className="hover:text-zinc-300">عن IEH</span>
          <span className="hover:text-zinc-300">السكريمات</span>
          <span className="hover:text-zinc-300">البطولات الرسمية</span>
          <span className="hover:text-zinc-300">شروط الاستخدام</span>
          <span className="hover:text-zinc-300">الدعم الفني</span>
        </div>
        <div className="text-[11px] text-zinc-600 font-mono">
          © 2026 IRAQ ESPORTS HUB FROM SHAMIKH
        </div>
      </footer>
    </div>
  );
}
