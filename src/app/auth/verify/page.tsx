'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, CheckCircle2, Loader2 } from 'lucide-react';

function VerifyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [demoCodeHint, setDemoCodeHint] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [resendCooldown, setResendCooldown] = useState(60);

  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) setEmail(emailParam);

    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('pending_registration');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.email) setEmail(parsed.email);
        if (parsed.demoCode) setDemoCodeHint(parsed.demoCode);
      }
    }

    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [searchParams]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length < 6) return;

    setIsLoading(true);
    setErrorMsg('');

    let regData: any = {};
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('pending_registration');
      if (stored) regData = JSON.parse(stored);
    }

    try {
      const response = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email || regData.email,
          code: code.trim(),
          username: regData.username,
          fullName: regData.fullName,
          role: regData.role,
          primaryGame: regData.primaryGame,
          city: regData.city,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'رمز التحقق غير صحيح');
      }

      setSuccessMsg('تم تأكيد الحساب بنجاح! جاري تحويلك إلى المنصة...');

      if (data.profile && typeof window !== 'undefined') {
        localStorage.setItem('babylon_user_id', data.profile.id);
        sessionStorage.removeItem('pending_registration');
      }

      setTimeout(() => {
        router.push('/');
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message || 'فشل التحقق من الرمز');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (data.demoCode) setDemoCodeHint(data.demoCode);
      setResendCooldown(60);
      setSuccessMsg('تمت إعادة إرسال كود التحقق بنجاح');
    } catch (err) {
      setErrorMsg('فشل إعادة إرسال الرمز');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card-3d p-6 sm:p-8 text-center text-white">
      <div className="w-12 h-12 rounded-2xl bg-[#181818] border border-white/20 text-white mx-auto flex items-center justify-center mb-4 shadow-[0_4px_12px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.2)]">
        <Mail className="w-6 h-6 text-white" />
      </div>

      <h1 className="text-xl font-extrabold text-white">
        تأكيد الحساب عبر رمز التحقق
      </h1>
      <p className="text-xs text-zinc-400 font-medium mt-1 mb-6">
        أدخل رمز التأكيد المكون من 6 أرقام المرسل إلى: <br />
        <strong className="text-white font-mono">{email}</strong>
      </p>

      {demoCodeHint && (
        <div className="mb-4 p-3 bg-[#080808] border border-white/20 rounded-xl text-xs text-white font-semibold shadow-inner">
          رمز التحقق المرسل عبر البريد: <span className="font-mono text-base font-extrabold tracking-widest text-white mr-2">{demoCodeHint}</span>
        </div>
      )}

      {errorMsg && (
        <div className="mb-4 p-3 bg-white/10 border border-white/20 rounded-xl text-white text-xs font-semibold shadow-sm">
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="mb-4 p-3 bg-white text-black rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-black" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleVerify} className="space-y-4">
        <div>
          <input
            type="text"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            placeholder="000000"
            className="w-full text-center tracking-[12px] font-mono text-2xl font-extrabold p-3 rounded-xl input-3d text-white placeholder-zinc-700 focus:outline-none"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || code.length < 6}
          className="w-full py-3 btn-3d-primary text-black rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition disabled:opacity-50"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <span>تأكيد الحساب والدخول</span>
          )}
        </button>
      </form>

      <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs">
        <button
          type="button"
          onClick={handleResend}
          disabled={resendCooldown > 0 || isLoading}
          className="text-white hover:underline font-bold disabled:text-zinc-600"
        >
          {resendCooldown > 0 ? `إعادة الإرسال بعد (${resendCooldown} ثانية)` : 'إعادة إرسال الرمز الآن'}
        </button>

        <button
          type="button"
          onClick={() => router.push('/auth/register')}
          className="text-zinc-400 hover:text-white"
        >
          تغيير البريد
        </button>
      </div>
    </div>
  );
}

export default function VerifyCodePage() {
  return (
    <div className="min-h-screen w-full bg-black flex items-center justify-center p-4">
      <div className="max-w-md w-full mx-auto">
        <Suspense fallback={<div className="card-3d p-12 text-center text-xs text-zinc-400">جاري التحميل...</div>}>
          <VerifyForm />
        </Suspense>
      </div>
    </div>
  );
}
