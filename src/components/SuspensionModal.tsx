'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Send, CheckCircle2, Clock, AlertTriangle, X } from 'lucide-react';
import { IehLogo } from '@/components/icons/CustomIcons';
import { NotificationItem } from '@/lib/types';
import { Button } from '@/components/ui';

interface SuspensionModalProps {
  notification: NotificationItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSupportDispatched?: (notificationId: string) => void;
}

export function SuspensionModal({
  notification,
  isOpen,
  onClose,
  onSupportDispatched,
}: SuspensionModalProps) {
  const [mounted, setMounted] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isDispatched, setIsDispatched] = useState(notification?.support_dispatched || false);
  const [appealMessage, setAppealMessage] = useState('');
  const [showCustomAppeal, setShowCustomAppeal] = useState(false);
  const [successNotice, setSuccessNotice] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !notification || !mounted) return null;

  const suspensionDays = notification.suspension_days || 7;
  const suspensionReason = notification.suspension_reason || 'مخالفة لوائح النزاهة التنافسية أو السلوك الرياضي لشبكة بابل';

  const handleDispatchSupport = async () => {
    setIsSending(true);
    try {
      const response = await fetch('/api/support/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: notification.user_id,
          notificationId: notification.id,
          type: 'suspension_appeal',
          subject: `طلب استئناف تعليق الحساب (السبب: ${suspensionReason})`,
          message: appealMessage || `أرجو مراجعة قرار تعليق الحساب لمدة ${suspensionDays} يوم لسبب: ${suspensionReason}. أود تقديم استئناف والتعهد بالالتزام بالقواعد.`,
        }),
      });

      if (response.ok) {
        setIsDispatched(true);
        setSuccessNotice(true);
        if (onSupportDispatched) {
          onSupportDispatched(notification.id);
        }
      }
    } catch (error) {
      console.error('Error dispatching support ticket:', error);
    } finally {
      setIsSending(false);
    }
  };

  return createPortal(
    <div 
      className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-black/95 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-animate max-w-lg w-full p-5 sm:p-6 rounded-2xl relative my-auto max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3.5rem)] flex flex-col text-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-black/80 border border-white/20 p-1.5 flex items-center justify-center text-white shrink-0 shadow-sm">
              <IehLogo size={24} glow={true} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">
                إشعار إداري: تم تعليق الحساب
              </h3>
              <p className="text-[11px] text-zinc-400 font-medium">
                نظام الرقابة والنزاهة التنافسية - شبكة IEH
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto py-3 space-y-3.5 pl-1 pr-0.5 text-right">
          <div className="bg-[#141414] border border-white/20 rounded-xl p-4 text-zinc-200 text-xs sm:text-sm leading-relaxed shadow-sm">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-white shrink-0 mt-0.5" />
              <div className="font-semibold text-white">
                تم تعليق حسابك لمدة <span className="text-white font-black underline px-1">{suspensionDays}</span> من الأيام لسبب <span className="text-white font-black underline px-1">{suspensionReason}</span>، تواصل مع الدعم الفني بالضغط على الزر أدناه.
              </div>
            </div>
          </div>

          <div className="bg-[#080808] rounded-xl p-3.5 border border-white/10 space-y-2 text-xs shadow-inner">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400 font-medium">مدة التعليق:</span>
              <span className="font-bold text-white flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-zinc-400" />
                {suspensionDays} يوم
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-400 font-medium">سبب الإجراء الإداري:</span>
              <span className="font-bold text-white">{suspensionReason}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-400 font-medium">تاريخ الإشعار:</span>
              <span className="text-zinc-300 font-mono">
                {new Date(notification.created_at).toLocaleDateString('ar-IQ')}
              </span>
            </div>
          </div>

          {!isDispatched && (
            <div>
              <button
                type="button"
                onClick={() => setShowCustomAppeal(!showCustomAppeal)}
                className="text-xs text-white hover:underline font-semibold mb-2 block"
              >
                {showCustomAppeal ? 'إخفاء الرسالة المخصصة' : '+ إضافة توضيح أو رسالة مخصصة لفريق الدعم (اختياري)'}
              </button>
              {showCustomAppeal && (
                <textarea
                  value={appealMessage}
                  onChange={(e) => setAppealMessage(e.target.value)}
                  placeholder="اكتب توضيحك أو سبب الاستئناف هنا..."
                  rows={3}
                  className="w-full text-xs p-3 rounded-xl input-3d text-white placeholder-zinc-500 focus:outline-none leading-relaxed"
                />
              )}
            </div>
          )}

          {successNotice && (
            <div className="p-3.5 bg-white text-black rounded-xl flex items-center gap-2.5 text-xs font-bold shadow-sm">
              <CheckCircle2 className="w-4 h-4 text-black shrink-0" />
              <span>تم إرسال طلب الدعم الفني مباشرة إلى لوحة إدارة شبكة IEH بنجاح! سيتم مراجعة طلبك خلال 24 ساعة.</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-3 border-t border-white/10 shrink-0">
          {isDispatched ? (
            <div className="w-full py-2.5 px-4 bg-[#080808] border border-white/15 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-inner">
              <CheckCircle2 className="w-4 h-4 text-white" />
              تم إرسال طلب الدعم الفني مسبقاً (قيد المراجعة الإدارية)
            </div>
          ) : (
            <Button
              onClick={handleDispatchSupport}
              isLoading={isSending}
              icon={<Send className="w-4 h-4" />}
              variant="primary"
              size="md"
              className="w-full sm:flex-1 text-xs font-extrabold"
            >
              تواصل مع الدعم الفني واستئناف القرار
            </Button>
          )}

          <Button
            onClick={onClose}
            variant="secondary"
            size="md"
            className="w-full sm:w-auto text-xs font-semibold"
          >
            إغلاق
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}