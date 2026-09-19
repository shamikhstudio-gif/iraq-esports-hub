'use client';

import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { Profile } from '@/lib/types';
import { Button } from '@/components/ui';

interface SuspensionModalProps {
  user: Profile | null;
  onClose: () => void;
  suspensionDays: number;
  setSuspensionDays: (days: number) => void;
  suspensionReason: string;
  setSuspensionReason: (reason: string) => void;
  onConfirm: () => void;
}

export function SuspensionModal({
  user,
  onClose,
  suspensionDays,
  setSuspensionDays,
  suspensionReason,
  setSuspensionReason,
  onConfirm,
}: SuspensionModalProps) {
  if (!user) return null;

  return (
    <div 
      className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-black/95 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-animate max-w-md w-full p-5 sm:p-6 rounded-2xl relative my-auto max-h-[calc(100vh-2rem)] flex flex-col text-white">
        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-white/10 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-[#181818] border border-white/20 flex items-center justify-center text-white shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-black text-sm text-white">
              تعليق حساب: {user.full_name}
            </h3>
            <p className="text-[11px] text-zinc-400 font-medium">إرسال إشعار تفاعلي مباشر للمستخدم</p>
          </div>
        </div>

        <div className="space-y-3 mb-4 overflow-y-auto flex-1 text-right">
          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-1">مدة التعليق بالأيام (X):</label>
            <input
              type="number"
              min={1}
              max={365}
              value={suspensionDays}
              onChange={(e) => setSuspensionDays(parseInt(e.target.value) || 1)}
              className="w-full text-xs p-2.5 rounded-xl input-3d text-white font-bold focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-1">سبب التعليق (X):</label>
            <textarea
              value={suspensionReason}
              onChange={(e) => setSuspensionReason(e.target.value)}
              rows={3}
              className="w-full text-xs p-2.5 rounded-xl input-3d text-white leading-relaxed focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10 shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
          >
            إلغاء
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={onConfirm}
            className="font-extrabold"
          >
            تأكيد تعليق الحساب
          </Button>
        </div>
      </div>
    </div>
  );
}
