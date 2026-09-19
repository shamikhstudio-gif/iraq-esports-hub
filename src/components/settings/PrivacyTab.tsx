'use client';

import React from 'react';
import { Shield } from 'lucide-react';

interface PrivacyTabProps {
  privacySettings: {
    profileVisibility: string;
    allowDirectMessages: string;
  };
  setPrivacySettings: React.Dispatch<React.SetStateAction<any>>;
  triggerChange: () => void;
}

export function PrivacyTab({
  privacySettings,
  setPrivacySettings,
  triggerChange,
}: PrivacyTabProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="card-3d p-5 sm:p-6 space-y-4">
        <div>
          <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-white" />
            <span>الخصوصية والظهور في المجتمع</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-1">التحكم في من يستطيع رؤية نشاطك ومراسلتك داخل مجتمع IEH.</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-1.5">مستوى ظهور الملف الشخصي</label>
            <select
              value={privacySettings.profileVisibility}
              onChange={(e) => { setPrivacySettings({ ...privacySettings, profileVisibility: e.target.value }); triggerChange(); }}
              className="w-full input-3d rounded-xl px-4 py-2.5 text-xs text-white font-bold"
            >
              <option value="public">عام (مرئي للجميع ومحركات البحث)</option>
              <option value="teams_only">للفرق واللاعبين المسجلين فقط</option>
              <option value="private">خاص (مخفي)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-1.5">من يمكنه إرسال رسائل خاصة لك؟</label>
            <select
              value={privacySettings.allowDirectMessages}
              onChange={(e) => { setPrivacySettings({ ...privacySettings, allowDirectMessages: e.target.value }); triggerChange(); }}
              className="w-full input-3d rounded-xl px-4 py-2.5 text-xs text-white font-bold"
            >
              <option value="everyone">الجميع</option>
              <option value="teams">قادة الفرق الموثقة فقط</option>
              <option value="none">لا أحد (إيقاف الرسائل المباشرة)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
