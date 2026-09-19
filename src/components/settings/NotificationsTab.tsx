import React, { useState } from 'react';
import { Bell, Smartphone } from 'lucide-react';
import { isHapticsEnabled, setHapticsEnabled, triggerHaptic } from '@/lib/haptics';

interface NotificationsTabProps {
  notificationSettings: {
    scrimInvites: boolean;
    teamApplications: boolean;
    directMessages: boolean;
    postLikesComments: boolean;
    emailDigest: boolean;
    soundAlerts: boolean;
    browserPush: boolean;
  };
  setNotificationSettings: React.Dispatch<React.SetStateAction<any>>;
  triggerChange: () => void;
}

export function NotificationsTab({
  notificationSettings,
  setNotificationSettings,
  triggerChange,
}: NotificationsTabProps) {
  const [hapticsOn, setHapticsOn] = useState<boolean>(() => isHapticsEnabled());

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="card-3d p-5 sm:p-6 space-y-5">
        <div>
          <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
            <Bell className="w-4 h-4 text-white" />
            <span>تفضيلات الإشعارات والتنبيهات</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-1">اختر التنبيهات التي ترغب باستلامها فوراً داخل المنصة أو عبر البريد.</p>
        </div>

        <div className="space-y-3.5 divide-y divide-white/5">
          <div className="flex items-center justify-between pt-3">
            <div>
              <div className="text-xs font-extrabold text-white">تنبيهات السكريمات والتحديات الفورية</div>
              <div className="text-[11px] text-zinc-400">استلام إشعار عند نشر سكريم جديد في لعبتك الأساسية أو قبول فريقك لتحدٍ.</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input 
                type="checkbox" 
                checked={notificationSettings.scrimInvites} 
                onChange={(e) => { setNotificationSettings({ ...notificationSettings, scrimInvites: e.target.checked }); triggerChange(); }}
                className="sr-only peer" 
              />
              <div className="w-11 h-6 bg-[#1e1e1e] border border-white/20 peer-focus:outline-none rounded-full peer peer-checked:bg-white peer-checked:border-white transition-colors duration-200 after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-zinc-400 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:bg-black" />
            </label>
          </div>

          <div className="flex items-center justify-between pt-3">
            <div>
              <div className="text-xs font-extrabold text-white">طلبات الانضمام ودعوات الفرق</div>
              <div className="text-[11px] text-zinc-400">إشعار عند تقديم لاعب على فريقك أو تلقيك دعوة للاختبار (Tryout).</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input 
                type="checkbox" 
                checked={notificationSettings.teamApplications} 
                onChange={(e) => { setNotificationSettings({ ...notificationSettings, teamApplications: e.target.checked }); triggerChange(); }}
                className="sr-only peer" 
              />
              <div className="w-11 h-6 bg-[#1e1e1e] border border-white/20 peer-focus:outline-none rounded-full peer peer-checked:bg-white peer-checked:border-white transition-colors duration-200 after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-zinc-400 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:bg-black" />
            </label>
          </div>

          <div className="flex items-center justify-between pt-3">
            <div>
              <div className="text-xs font-extrabold text-white">الرسائل والمحادثات المباشرة</div>
              <div className="text-[11px] text-zinc-400">تنبيه عند استلام رسالة خاصة جديدة من قادة الفرق أو اللاعبين.</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input 
                type="checkbox" 
                checked={notificationSettings.directMessages} 
                onChange={(e) => { setNotificationSettings({ ...notificationSettings, directMessages: e.target.checked }); triggerChange(); }}
                className="sr-only peer" 
              />
              <div className="w-11 h-6 bg-[#1e1e1e] border border-white/20 peer-focus:outline-none rounded-full peer peer-checked:bg-white peer-checked:border-white transition-colors duration-200 after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-zinc-400 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:bg-black" />
            </label>
          </div>

          <div className="flex items-center justify-between pt-3">
            <div>
              <div className="text-xs font-extrabold text-white flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-zinc-300" />
                <span>الاهتزاز التفاعلي (Haptic Feedback)</span>
              </div>
              <div className="text-[11px] text-zinc-400">نبضات لمسية دقيقة وخفيفة على الهاتف عند التفاعل مع السكريمات، الإعجاب بالمنشورات، واستلام مكافآت eBits.</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input 
                type="checkbox" 
                checked={hapticsOn} 
                onChange={(e) => { 
                  const nextVal = e.target.checked;
                  setHapticsOn(nextVal);
                  setHapticsEnabled(nextVal);
                  if (nextVal) triggerHaptic('light');
                  triggerChange(); 
                }}
                className="sr-only peer" 
              />
              <div className="w-11 h-6 bg-[#1e1e1e] border border-white/20 peer-focus:outline-none rounded-full peer peer-checked:bg-white peer-checked:border-white transition-colors duration-200 after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-zinc-400 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:bg-black" />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
