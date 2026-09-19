'use client';

import React, { useState, useRef } from 'react';
import { MessageSquarePlus } from 'lucide-react';
import { BetaFeedbackModal } from './BetaFeedbackModal';
import { triggerHaptic } from '@/lib/haptics';

export function FloatingBetaFeedbackButton() {
  const [isOpen, setIsOpen] = useState(false);
  const lastHapticTimeRef = useRef(0);

  const fireHaptic = () => {
    const now = Date.now();
    // Debounce to avoid duplicate vibration between pointerdown and click
    if (now - lastHapticTimeRef.current > 250) {
      lastHapticTimeRef.current = now;
      triggerHaptic('light');
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button === 0) {
      fireHaptic();
    }
  };

  const handleClick = () => {
    fireHaptic();
    setIsOpen(true);
  };

  return (
    <>
      <div 
        dir="rtl"
        className="fixed bottom-20 left-4 sm:bottom-6 sm:left-6 z-40 select-none animate-in fade-in duration-300"
      >
        <button
          type="button"
          onPointerDown={handlePointerDown}
          onClick={handleClick}
          className="group flex items-center gap-2 px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-full bg-black/90 hover:bg-black text-white border border-white/20 hover:border-white shadow-[0_8px_30px_rgb(0,0,0,0.8)] backdrop-blur-md transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
          title="إرسال ملاحظة أو الإبلاغ عن خطأ في النسخة التجريبية (Beta II)"
        >
          <MessageSquarePlus className="w-4 h-4 text-white group-hover:rotate-12 transition-transform duration-200" />
          <span className="text-xs font-black tracking-tight hidden xs:inline sm:inline">
            تقرير بيتا
          </span>
        </button>
      </div>

      <BetaFeedbackModal 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
      />
    </>
  );
}
