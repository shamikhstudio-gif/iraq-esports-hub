'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { IehLogo } from '@/components/icons/CustomIcons';
import { CheckCircle2, Laptop, ArrowUpRight } from 'lucide-react';

export default function DesktopCallbackPage() {
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState('');
  const [deepLinkUrl, setDeepLinkUrl] = useState('');

  useEffect(() => {
    handleTokens();
  }, []);

  const handleTokens = async () => {
    try {
      if (typeof window === 'undefined') return;

      let accessToken: string | null = null;
      let refreshToken: string | null = null;

      // 1. Check Hash Fragment (#access_token=...&refresh_token=...)
      if (window.location.hash) {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        accessToken = hashParams.get('access_token');
        refreshToken = hashParams.get('refresh_token');
      }

      // 2. Check Query Params (?code=... or ?access_token=...)
      if (!accessToken) {
        const searchParams = new URLSearchParams(window.location.search);
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

      // 3. Fallback: check Supabase active session
      if (!accessToken) {
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session) {
          accessToken = sessionData.session.access_token;
          refreshToken = sessionData.session.refresh_token;
        }
      }

      if (!accessToken) {
        throw new Error('لم يتم العثور على بيانات تسجيل الدخول. يرجى المحاولة مرة أخرى من التطبيق.');
      }

      const link = `ieh://auth#access_token=${accessToken}&refresh_token=${refreshToken || ''}`;
      setDeepLinkUrl(link);

      // Attempt A: Send directly to local Electron loopback server
      try {
        await fetch('http://127.0.0.1:23456/auth-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ access_token: accessToken, refresh_token: refreshToken }),
        });
      } catch {
        // Loopback might not be reachable if browser blocks PNA; deep link will handle it
      }

      // Attempt B: Trigger custom protocol deep link to bring Electron to front
      try {
        window.location.href = link;
      } catch {
        // ignore
      }

      setStatus('success');
    } catch (err: unknown) {
      setStatus('error');
      setErrorMessage(err instanceof Error ? err.message : 'حدث خطأ أثناء مزامنة الجلسة مع التطبيق');
    }
  };

  return (
    <div className="min-h-screen w-full bg-black text-white flex flex-col items-center justify-center p-4 selection:bg-white selection:text-black">
      <div className="w-full max-w-md bg-[#090909] border border-white/15 rounded-3xl p-8 text-center space-y-6 shadow-2xl">
        {/* Logo Badge */}
        <div className="w-16 h-16 rounded-2xl bg-black border border-white/20 p-2.5 mx-auto flex items-center justify-center shadow-xl">
          <IehLogo size={42} glow={false} />
        </div>

        {status === 'processing' && (
          <div className="space-y-3">
            <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto" />
            <h2 className="text-lg font-black text-white">جاري مزامنة الدخول مع تطبيق IEH...</h2>
            <p className="text-xs text-zinc-400">يرجى الانتظار لحظات لنقل بيانات حسابك إلى تطبيق الكمبيوتر.</p>
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
                تم نقل جلستك بأمان إلى تطبيق <span className="text-white font-bold">IEH Desktop</span>.
              </p>
            </div>

            {/* CTA Button */}
            {deepLinkUrl && (
              <a
                href={deepLinkUrl}
                className="w-full h-12 bg-white text-black hover:bg-zinc-200 active:scale-[0.98] transition rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-xl cursor-pointer"
              >
                <Laptop className="w-4 h-4" />
                <span>العودة إلى تطبيق الكمبيوتر</span>
                <ArrowUpRight className="w-4 h-4" />
              </a>
            )}

            <p className="text-[11px] text-zinc-500">
              يمكنك الآن إغلاق هذا التبويب في المتصفح والرجوع لتطبيق IEH على سطح المكتب.
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-white/5 border border-red-500/30 text-red-300 text-xs font-medium">
              {errorMessage}
            </div>
            <p className="text-xs text-zinc-400">
              يرجى فتح تطبيق IEH للكمبيوتر والمحاولة مجدداً.
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
