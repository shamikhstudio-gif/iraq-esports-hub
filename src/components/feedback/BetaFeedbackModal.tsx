'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Bug, 
  Lightbulb, 
  Send, 
  CheckCircle2, 
  Sparkles,
  Smartphone,
  Monitor
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/context/UserContext';
import { usePathname } from '@/lib/navigation';
import { triggerHaptic } from '@/lib/haptics';
import { Button } from '@/components/ui';

interface BetaFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BetaFeedbackModal({ isOpen, onClose }: BetaFeedbackModalProps) {
  const { user } = useUser();
  const pathname = usePathname();

  const [type, setType] = useState<'bug' | 'suggestion' | 'other'>('bug');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const getDeviceInfo = () => {
    if (typeof window === 'undefined') return {};
    const isElectron = Boolean((window as any).electronAPI?.isDesktop);
    const isCapacitor = Boolean((window as any).Capacitor);
    let platform = 'Web Browser';
    if (isElectron) platform = 'Desktop (Electron)';
    else if (isCapacitor) platform = 'Mobile (Android APK)';

    const dpr = window.devicePixelRatio || 1;
    // Use window.screen multiplied by DPR to capture true physical device display resolution
    // (Prevents soft keyboards from collapsing the height)
    const sWidth = window.screen?.width || window.innerWidth;
    const sHeight = window.screen?.height || window.innerHeight;
    const screenRes = `${Math.round(sWidth * dpr)}x${Math.round(sHeight * dpr)}`;

    return {
      platform,
      appVersion: 'v2.0.0-beta.2',
      userAgent: navigator.userAgent,
      screen: screenRes,
      route: pathname,
      contact: user?.email || undefined,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setErrorMsg('يرجى كتابة الملاحظة أو المشكلة');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const deviceInfo = getDeviceInfo();
      const generatedTitle = description.trim().length > 50 
        ? `${description.trim().slice(0, 50)}...` 
        : description.trim();

      const { error } = await supabase.from('beta_feedback').insert({
        user_id: user?.id || null,
        type,
        title: generatedTitle,
        description: description.trim(),
        device_info: deviceInfo,
        status: 'new',
      });

      if (error) throw error;

      triggerHaptic('success');
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setDescription('');
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error('Error submitting feedback:', err);
      setErrorMsg(err.message || 'حدث خطأ أثناء إرسال الملاحظة');
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div 
      className="fixed inset-0 z-[999999] flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-md bg-[#0a0a0a] border border-white/20 rounded-3xl overflow-hidden shadow-2xl text-white text-right modal-animate"
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-[#121212]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white text-black flex items-center justify-center font-black shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">تقرير وملاحظات البيتا</h3>
              <p className="text-xs text-zinc-400 mt-0.5">شاركنا أي خطأ أو فكرة لتطوير التجربة</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSuccess ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-white text-black flex items-center justify-center mx-auto shadow-lg">
              <CheckCircle2 className="w-8 h-8 text-black" />
            </div>
            <h4 className="text-base font-black text-white">تم استلام تقريرك بنجاح!</h4>
            <p className="text-xs text-zinc-400">شكراً لمساهمتك القيمة في تحسين شبكة IEH.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-white/10 border border-white/20 text-white text-xs font-bold">
                {errorMsg}
              </div>
            )}

            {/* Type selector */}
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-2">نوع الملاحظة</label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setType('bug');
                  }}
                  className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                    type === 'bug'
                      ? 'bg-white text-black border-white shadow-md'
                      : 'bg-white/[0.04] text-zinc-400 border-white/10 hover:border-white/25 hover:text-white'
                  }`}
                >
                  <Bug className="w-4 h-4" />
                  <span>خطأ برمجي (Bug)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setType('suggestion');
                  }}
                  className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                    type === 'suggestion'
                      ? 'bg-white text-black border-white shadow-md'
                      : 'bg-white/[0.04] text-zinc-400 border-white/10 hover:border-white/25 hover:text-white'
                  }`}
                >
                  <Lightbulb className="w-4 h-4" />
                  <span>اقتراح أو فكرة</span>
                </button>
              </div>
            </div>

            {/* Feedback Content */}
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1.5">اكتب الملاحظة</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="اشرح ما حدث بالتفصيل، أو شارك فكرتك للتحسين..."
                rows={5}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/15 text-white text-xs placeholder:text-zinc-500 focus:outline-none focus:border-white resize-none"
                required
                autoFocus
              />
            </div>

            {/* Device Info Summary */}
            <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-between text-[11px] text-zinc-500 font-mono">
              <span className="flex items-center gap-1.5">
                {typeof window !== 'undefined' && Boolean((window as any).Capacitor) ? (
                  <Smartphone className="w-3.5 h-3.5 text-zinc-400" />
                ) : (
                  <Monitor className="w-3.5 h-3.5 text-zinc-400" />
                )}
                <span>إرفاق بيانات الجهاز تلقائياً</span>
              </span>
              <span className="text-zinc-400">{pathname}</span>
            </div>

            {/* Submit button */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  triggerHaptic('light');
                  onClose();
                }} 
                disabled={isSubmitting}
              >
                إلغاء
              </Button>
              <Button 
                type="submit" 
                variant="primary" 
                size="sm" 
                isLoading={isSubmitting}
                icon={<Send className="w-3.5 h-3.5" />}
                className="font-black"
              >
                إرسال
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
}
