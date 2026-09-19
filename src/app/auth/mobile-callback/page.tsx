import { Icon } from '@/components/ui/Icon';
'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { IehLogo } from '@/components/icons/CustomIcons';
import { CheckCircle2, Smartphone, ArrowUpRight, Loader2 } from 'lucide-react';

export default function MobileCallbackPage() {
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState('');

  const intentUrl = 'intent://#Intent;package=com.eshamikh.ieh;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;end';

  useEffect(() => {
    handleTokens();
  }, []);

  const handleTokens = async () => {
    try {
      if (typeof window === 'undefined') return;

      const searchParams = new URLSearchParams(window.location.search);
      const ticket = searchParams.get('ticket');

      let accessToken: string | null = null;
      let refreshToken: string | null = null;

      // 1. Check Hash Fragment
      if (window.location.hash) {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        accessToken = hashParams.get('access_token');
        refreshToken = hashParams.get('refresh_token');
      }

      // 2. Check Query Params (?code=... or ?access_token=...)
      if (!accessToken) {
        accessToken = searchParams.get('access_token');
        refreshToken = searchParams.get('refresh_token');

        const code = searchParams.get('code');
        if (code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          if (data?.session) {
            accessToken = data.session.access_token;
            refreshToken = data.session.refresh_token;
          }
        }
      }

      // 3. Fallback: check Supabase active session in browser
      if (!accessToken) {
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session) {
          accessToken = sessionData.session.access_token;
          refreshToken = sessionData.session.refresh_token;
        }
      }

      if (!accessToken) {
        throw new Error('لم يتم العثور على توكن الجلسة. يرجى المحاولة مجدداً.');
      }

      // 4. Save handoff ticket to Supabase so the mobile app picks it up immediately
      if (ticket) {
        await supabase
          .from('auth_handoffs')
          .upsert({
            ticket: ticket,
            access_token: accessToken,
            refresh_token: refreshToken || '',
          });

        // Broadcast over Realtime channel for 0ms wakeup
        try {
          const channel = supabase.channel(`auth-handoff-${ticket}`);
          await channel.subscribe();
          channel.send({
            type: 'broadcast',
            event: 'authenticated',
            payload: {
              access_token: accessToken,
              refresh_token: refreshToken || '',
            },
          });
        } catch (rtErr) {
          console.warn('Realtime broadcast notice:', rtErr);
        }
      }

      setStatus('success');
    } catch (err: unknown) {
      setStatus('error');
      setErrorMessage(err instanceof Error ? err.message : 'حدث خطأ أثناء مزامنة الجلسة مع الهاتف');
    }
  };

  return (
    <div className="min-h-screen w-full bg-black text-white flex flex-col items-center justify-center p-4 selection:bg-white selection:text-black">
      <div className="w-full max-w-sm bg-[#090909] border border-white/15 rounded-3xl p-7 text-center space-y-6 shadow-2xl">
        {/* Logo Badge */}
        <div className="w-16 h-16 rounded-2xl bg-black border border-white/20 p-2.5 mx-auto flex items-center justify-center shadow-xl">
          <IehLogo size={42} glow={false} />
        </div>

        {status === 'processing' && (
          <div className="space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-white mx-auto" />
            <h2 className="text-base font-black text-white">جاري مزامنة الدخول مع تطبيق الهاتف...</h2>
            <p className="text-xs text-zinc-400">يرجى الانتظار ثوانٍ معدودة لنقل الحساب.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-5 animate-in fade-in zoom-in-95 duration-300">
            <div className="w-14 h-14 rounded-full bg-white/10 border border-white/20 flex items-center justify-center mx-auto text-white">
              <CheckCircle2 className="w-8 h-8 text-white" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-xl font-black text-white">تم تسجيل الدخول بنجاح!</h2>
              <p className="text-xs text-zinc-400">
                تم ربط ومزامنة حسابك مع تطبيق <span className="text-white font-bold">IEH</span> على هاتفك.
              </p>
            </div>

            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl text-center space-y-1">
              <Icon name="sports_esports" size={20} />
              <p className="text-xs text-white font-bold">
                ارجع الآن لتطبيق IEH على هاتفك
              </p>
              <p className="text-[11px] text-zinc-400">
                حسابك جاهز وتم تسجيل دخولك بالكامل!
              </p>
            </div>

            <p className="text-[11px] text-zinc-500">
              يمكنك الآن إغلاق هذا التبويب في المتصفح بأمان.
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-white/5 border border-red-500/30 text-red-300 text-xs font-medium">
              {errorMessage}
            </div>
            <p className="text-xs text-zinc-400">
              يرجى فتح تطبيق IEH والمحاولة مجدداً.
            </p>
          </div>
        )}
      </div>

      <div className="mt-8 text-center text-xs text-zinc-600 font-mono">
        © 2026 IRAQ ESPORTS HUB FROM SHAMIKH
      </div>
    </div>
  );
}
