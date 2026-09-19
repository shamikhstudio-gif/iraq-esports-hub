'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

interface RegisterStep1Props {
  email: string;
  setEmail: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  showPassword: boolean;
  setShowPassword: (val: boolean) => void;
  isLoading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onSwitchToLogin: () => void;
}

export function RegisterStep1({
  email,
  setEmail,
  password,
  setPassword,
  showPassword,
  setShowPassword,
  isLoading,
  onSubmit,
  onSwitchToLogin,
}: RegisterStep1Props) {
  return (
    <form onSubmit={onSubmit} className="space-y-3">
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
        className="w-full py-2.5 rounded-xl bg-white hover:bg-zinc-200 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none text-black font-bold text-sm transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer shadow-sm"
      >
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin text-black" /> : <span>متابعة</span>}
      </button>

      <button
        type="button"
        onClick={onSwitchToLogin}
        className="w-full py-2.5 rounded-xl border border-white/20 text-zinc-300 hover:text-white hover:bg-white/5 active:scale-[0.98] text-xs font-semibold transition-all duration-150 cursor-pointer"
      >
        لديك حساب بالفعل؟ تسجيل الدخول
      </button>
    </form>
  );
}
