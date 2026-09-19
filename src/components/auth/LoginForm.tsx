'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoginFormProps {
  email: string;
  setEmail: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  showPassword: boolean;
  setShowPassword: (val: boolean) => void;
  isLoading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onSwitchToRegister: () => void;
}

export function LoginForm({
  email,
  setEmail,
  password,
  setPassword,
  showPassword,
  setShowPassword,
  isLoading,
  onSubmit,
  onSwitchToRegister,
}: LoginFormProps) {

  return (
    <form onSubmit={onSubmit} className="space-y-3">
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

      {/* Primary Login Button */}
      <button
        type="submit"
        disabled={isLoading || !email.trim() || !password.trim()}
        className="w-full py-2.5 rounded-xl bg-white hover:bg-zinc-200 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none text-black font-bold text-sm transition-all duration-150 flex items-center justify-center gap-2 mt-1 cursor-pointer shadow-sm"
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-black" />
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



      {/* Create New Account Button */}
      <button
        type="button"
        onClick={onSwitchToRegister}
        className="w-full py-2.5 rounded-xl border border-white/20 text-white hover:bg-white/10 active:scale-[0.98] text-sm font-semibold transition-all duration-150 text-center block mt-2 cursor-pointer"
      >
        إنشاء حساب جديد
      </button>
    </form>
  );
}
