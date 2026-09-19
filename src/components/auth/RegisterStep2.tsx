'use client';

import React from 'react';
import { Loader2, MapPin } from 'lucide-react';
import { GameSearchSelect } from '@/components/GameSearchSelect';
import { CustomSelect } from '@/components/CustomSelect';
import { IRAQI_CITIES } from '@/lib/constants';

interface RegisterStep2Props {
  fullName: string;
  setFullName: (val: string) => void;
  username: string;
  setUsername: (val: string) => void;
  primaryGame: string;
  setPrimaryGame: (val: string) => void;
  city: string;
  setCity: (val: string) => void;
  isLoading: boolean;
  onBack: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function RegisterStep2({
  fullName,
  setFullName,
  username,
  setUsername,
  primaryGame,
  setPrimaryGame,
  city,
  setCity,
  isLoading,
  onBack,
  onSubmit,
}: RegisterStep2Props) {
  return (
    <form onSubmit={onSubmit} className="space-y-3">
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
          options={IRAQI_CITIES as unknown as string[]}
          icon={<MapPin className="w-4 h-4 text-zinc-400" />}
        />
      </div>

      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2.5 rounded-xl border border-white/15 text-xs font-semibold text-zinc-400 hover:text-white active:scale-[0.98] transition cursor-pointer"
        >
          رجوع
        </button>
        <button
          type="submit"
          disabled={isLoading || !fullName.trim() || !username.trim()}
          className="flex-1 py-2.5 rounded-xl bg-white hover:bg-zinc-200 active:scale-[0.98] text-black font-bold text-sm transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-40 cursor-pointer shadow-sm"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin text-black" /> : <span>إنشاء الحساب</span>}
        </button>
      </div>
    </form>
  );
}
