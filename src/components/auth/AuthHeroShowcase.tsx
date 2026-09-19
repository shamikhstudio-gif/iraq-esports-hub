'use client';

import React from 'react';
import { 
  Zap, 
  Trophy, 
  Heart, 
  Star, 
  Crown 
} from 'lucide-react';
import { IehLogo } from '@/components/icons/CustomIcons';

export function AuthHeroShowcase() {
  return (
    <div className="hidden lg:flex flex-col items-center text-center space-y-8 select-none">
      {/* Official IEH Logo Badge */}
      <div className="w-20 h-20 rounded-3xl bg-black border border-white/20 p-3 flex items-center justify-center shadow-2xl">
        <IehLogo size={56} glow={false} />
      </div>

      {/* Headline */}
      <div className="space-y-2 max-w-md">
        <h2 className="text-3xl xl:text-4xl font-black tracking-tight text-white leading-tight">
          شاهد أقوى اللحظات والبطولات من{' '}
          <span className="text-white border-b-2 border-white pb-0.5">
            فرقك المفضلة.
          </span>
        </h2>
        <p className="text-sm text-zinc-400">
          المنصة الرسمية المخصصة للاعبي وفرق الرياضات الإلكترونية داخل جمهورية العراق.
        </p>
      </div>

      {/* Layered Visual */}
      <div className="relative w-80 h-96 mt-2 flex items-center justify-center">
        {/* Back Card Left (Valorant Esports) */}
        <div className="absolute left-2 w-52 h-72 rounded-3xl bg-[#090909] border border-white/10 shadow-2xl transform -rotate-12 -translate-y-2 overflow-hidden opacity-75">
          <div className="w-full h-full p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-white text-[11px] font-bold">
              <span className="flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-white" />
                <span>GX Scrims</span>
              </span>
              <span className="px-1.5 py-0.5 rounded bg-white/10 text-[9px] font-mono">Valorant</span>
            </div>
            <div className="text-right space-y-1">
              <div className="text-xs font-black text-white">نهائي بطولة العراق</div>
              <div className="text-[10px] text-zinc-400">12:00 PM • سيرفر بغداد</div>
            </div>
            <div className="flex items-center justify-between text-white text-[10px]">
              <span className="text-white font-bold">● جاري اللعب</span>
              <Heart className="w-4 h-4 fill-white text-white" />
            </div>
          </div>
        </div>

        {/* Back Card Right (PUBG / CS2) */}
        <div className="absolute right-2 w-52 h-72 rounded-3xl bg-[#090909] border border-white/10 shadow-2xl transform rotate-12 -translate-y-1 overflow-hidden opacity-75">
          <div className="w-full h-full p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-white text-[11px] font-bold">
              <span className="flex items-center gap-1">
                <Trophy className="w-3.5 h-3.5 text-white" />
                <span>IEH Cup</span>
              </span>
              <span className="px-1.5 py-0.5 rounded bg-white/10 text-white text-[9px] font-mono">PUBG-M</span>
            </div>
            <div className="text-right space-y-1">
              <div className="text-xs font-black text-white">روم تصفيات النخبة</div>
              <div className="text-[10px] text-zinc-400">جائزة 1,000,000 د.ع</div>
            </div>
            <div className="flex items-center justify-between text-white text-[10px]">
              <span className="text-zinc-300 font-bold">16 فريق</span>
              <Star className="w-4 h-4 fill-white text-white" />
            </div>
          </div>
        </div>

        {/* Center Main Card */}
        <div className="relative z-10 w-64 h-88 rounded-[28px] bg-black border-2 border-white/20 shadow-2xl overflow-hidden flex flex-col justify-between p-3.5">
          {/* Story Top Bar */}
          <div className="relative z-10 space-y-2.5">
            <div className="flex gap-1">
              <div className="h-0.5 flex-1 bg-white rounded-full" />
              <div className="h-0.5 flex-1 bg-white/30 rounded-full" />
              <div className="h-0.5 flex-1 bg-white/30 rounded-full" />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white text-black p-[1px] flex items-center justify-center font-mono font-black text-xs">
                  IQ
                </div>
                <div className="text-right">
                  <div className="text-[11px] font-bold text-white leading-tight">ShadowIQ</div>
                  <div className="text-[9px] text-zinc-400">كابتن فريق ذئاب بغداد</div>
                </div>
              </div>

              <span className="px-2 py-0.5 rounded-full bg-white text-black text-[10px] font-black flex items-center gap-1 shadow-sm">
                <Star className="w-2.5 h-2.5 fill-black text-black" />
                <span>مباشر</span>
              </span>
            </div>
          </div>

          {/* Center Content */}
          <div className="relative z-10 my-auto text-center space-y-2 px-2">
            <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mx-auto">
              <Crown className="w-7 h-7 text-white" />
            </div>
            <div className="text-sm font-black text-white">تحدي 5v5 فوري</div>
            <div className="text-[11px] text-zinc-400">جاهزون لأي كلان عراقي الليلة</div>
          </div>

          {/* Floating Reaction Pill */}
          <div className="absolute top-1/2 left-3 -translate-y-1/2 z-20 px-2.5 py-1 rounded-full bg-black border border-white/20 text-white text-xs flex items-center gap-1.5 shadow-2xl">
            <Heart className="w-3.5 h-3.5 fill-white text-white" />
            <span className="text-[10px] font-mono font-bold">14.2k</span>
          </div>

          {/* Bottom Call to Action */}
          <div className="relative z-10 pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-zinc-400 font-bold">
            <span>انضم للساحة الآن</span>
            <span className="text-white text-xs font-mono">IEH // PRO</span>
          </div>
        </div>
      </div>
    </div>
  );
}
