'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, X, ShieldAlert, CheckCircle2, Loader2 } from 'lucide-react';
import { Profile } from '@/lib/types';
import { Button, Badge } from '@/components/ui';

interface WarningModalProps {
  user: Profile | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmWarn: (user: Profile, reason: string, category: string) => Promise<void>;
}

export const VIOLATION_CATEGORIES = [
  {
    id: 'harassment',
    title: 'سلوك مسيء وسب وشتم (Harassment & Toxic Behavior)',
    desc: 'استخدام ألفاظ نابية، إساءة عنصرية، أو مضايقة اللاعبين في الشات أو التعليقات',
  },
  {
    id: 'impersonation',
    title: 'انتحال شخصية أو فريق (Impersonation)',
    desc: 'استخدام اسم أو شعار أو هوية لاعب معروف أو منظمة أخرى لتضليل اللاعبين',
  },
  {
    id: 'spam_scam',
    title: 'سبام وروابط احتيالية (Spam & Phishing)',
    desc: 'إرسال روابط مشبوهة، إعلانات عشوائية، أو محاولات سرقة حسابات',
  },
  {
    id: 'match_fixing',
    title: 'تلاعب بنتائج السكريمات أو الغش (Match Fixing / Cheating)',
    desc: 'تقديم إثباتات نتائج مزيفة أو استخدام برامج غير مشروعة أثناء المباريات',
  },
  {
    id: 'tos_abuse',
    title: 'مخالفة اللوائح وشروط الخدمة (TOS Abuse)',
    desc: 'مخالفة بنود النزاهة التنافسية أو القوانين العامة لشبكة IEH',
  },
];

export function WarningModal({ user, isOpen, onClose, onConfirmWarn }: WarningModalProps) {
  const [selectedCategory, setSelectedCategory] = useState(VIOLATION_CATEGORIES[0].id);
  const [customNotes, setCustomNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen || !user || typeof document === 'undefined') return null;

  const currentStrikes = user.warning_count || 0;
  const nextStrike = currentStrikes + 1;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const categoryObj = VIOLATION_CATEGORIES.find((c) => c.id === selectedCategory);
      const categoryTitle = categoryObj ? categoryObj.title : 'مخالفة لوائح المنصة';
      const fullReason = customNotes.trim()
        ? `${categoryTitle} — تفاصيل: ${customNotes.trim()}`
        : categoryTitle;

      await onConfirmWarn(user, fullReason, selectedCategory);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'فشل إصدار الإنذار');
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/95 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div className="card-3d max-w-lg w-full p-6 relative my-auto text-white space-y-5 border-white/20">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-danger/10 border border-danger/30 flex items-center justify-center text-danger shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm text-white">إصدار إنذار إداري رسمي موثّق</h3>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                اللاعب: <span className="text-white font-bold">{user.full_name}</span> (@{user.username})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-zinc-400 hover:text-white p-1 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Strike Progression Badge */}
        <div className="p-3.5 rounded-xl bg-[#0c0c0c] border border-white/15 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-zinc-300">مستوى الإنذار الحالي:</div>
            <div className="text-[11px] text-zinc-400">
              {currentStrikes === 0
                ? 'لا توجد سوابق إنذارات على الحساب (الإنذار القادم: المستوى الأول)'
                : currentStrikes === 1
                ? 'لدى اللاعب إنذار أول نشط (الإنذار القادم: الإنذار النهائي الثاني)'
                : 'لدى اللاعب إنذاران سابقان (الإنذار القادم سيؤدي لتعليق الحساب)'}
            </div>
          </div>
          <Badge variant="solid" size="md">
            الإنذار رقم #{nextStrike}
          </Badge>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-white/10 border border-white/20 text-white text-xs font-bold">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-2">
              اختر تصنيف المخالفة المعياري:
            </label>
            <div className="space-y-2">
              {VIOLATION_CATEGORIES.map((cat) => (
                <label
                  key={cat.id}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                    selectedCategory === cat.id
                      ? 'bg-white/10 border-white text-white'
                      : 'bg-[#080808] border-white/10 text-zinc-400 hover:text-white hover:border-white/20'
                  }`}
                >
                  <input
                    type="radio"
                    name="violation_category"
                    value={cat.id}
                    checked={selectedCategory === cat.id}
                    onChange={() => setSelectedCategory(cat.id)}
                    className="mt-1 accent-white"
                  />
                  <div className="text-right flex-1">
                    <div className="text-xs font-bold text-white">{cat.title}</div>
                    <div className="text-[10px] text-zinc-400 mt-0.5">{cat.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-1.5">
              ملاحظات أو روابط إثبات إضافية (اختياري):
            </label>
            <textarea
              rows={2}
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              placeholder="مثال: تعليق مسيء في منشور رقم #102..."
              className="w-full input-3d rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
            <Button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              variant="ghost"
              size="sm"
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              isLoading={isSubmitting}
              variant="primary"
              size="sm"
              icon={<AlertTriangle className="w-4 h-4" />}
              className="font-black"
            >
              تأكيد وإصدار الإنذار #{nextStrike}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
