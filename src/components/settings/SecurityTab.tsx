'use client';

import React from 'react';
import { 
  Laptop, 
  Smartphone, 
  Tablet, 
  Key, 
  Eye, 
  EyeOff 
} from 'lucide-react';
import { DeviceSession } from '@/lib/deviceSession';
import { Button, Badge } from '@/components/ui';

interface SecurityTabProps {
  profileEmail: string;
  isOAuthUser?: boolean;
  sessions: DeviceSession[];
  securitySettings: {
    twoFactorAuth: boolean;
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  };
  setSecuritySettings: React.Dispatch<React.SetStateAction<any>>;
  showPassword: boolean;
  setShowPassword: (val: boolean) => void;
  handleTerminateSession: (id: string) => void;
  handleTerminateAllOtherSessions: () => void;
  handleSaveProfile: () => void;
  triggerChange: () => void;
}

export function SecurityTab({
  profileEmail,
  isOAuthUser = false,
  sessions,
  securitySettings,
  setSecuritySettings,
  showPassword,
  setShowPassword,
  handleTerminateSession,
  handleTerminateAllOtherSessions,
  handleSaveProfile,
  triggerChange,
}: SecurityTabProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">

      {/* Real Active Login Sessions & Devices */}
      <div className="card-3d p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
              <Laptop className="w-4 h-4 text-white" />
              <span>الجلسات والأجهزة النشطة (Real Device Sessions)</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-1">الأجهزة والمتصفحات التي سجلت دخولها فعلياً إلى هذا الحساب.</p>
          </div>
          {sessions.length > 1 && (
            <button 
              type="button" 
              onClick={handleTerminateAllOtherSessions}
              className="text-xs font-bold text-zinc-400 hover:text-white hover:underline transition"
            >
              تسجيل الخروج من كل الأجهزة الأخرى
            </button>
          )}
        </div>

        <div className="space-y-2.5">
          {sessions.map((sess) => {
            const isMobile = sess.deviceType === 'mobile';
            const isTablet = sess.deviceType === 'tablet';
            const DeviceIcon = isMobile ? Smartphone : isTablet ? Tablet : Laptop;

            return (
              <div 
                key={sess.id} 
                className={`flex items-center justify-between p-3.5 rounded-xl border transition ${
                  sess.isCurrent 
                    ? 'bg-[#121212] border-white/30 shadow-sm' 
                    : 'bg-[#0c0c0c] border-white/10'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center shrink-0 text-white">
                    <DeviceIcon className="w-5 h-5 shrink-0 text-white" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate">
                      {sess.deviceName}
                    </div>
                    <div className="text-[10px] text-zinc-400 font-mono truncate">
                      {sess.os} • {sess.browser} • {sess.location}
                    </div>
                  </div>
                </div>
                
                <div className="shrink-0">
                  {sess.isCurrent ? (
                    <Badge variant="solid" size="xs">
                      الجهاز الحالي
                    </Badge>
                  ) : (
                    <Button
                      type="button"
                      variant="secondary"
                      size="xs"
                      onClick={() => handleTerminateSession(sess.id)}
                    >
                      إنهاء الجلسة
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Password Management / Federated Identity Notice */}
      <div className="card-3d p-5 sm:p-6 space-y-4">
        <div>
          <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
            <Key className="w-4 h-4 text-white" />
            <span>أمان كلمة المرور وتسجيل الدخول</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-1">إدارة طريقة تسجيل الدخول وكلمة المرور الخاصة بحسابك.</p>
        </div>

        {isOAuthUser ? (
          <div className="p-4 rounded-xl bg-[#0c0c0c] border border-white/15 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.053 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
              </svg>
            </div>
            <div>
              <div className="text-xs font-black text-white">حساب موثّق عبر Google (Federated Identity)</div>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                حسابك مرتبط ومحمي بالكامل بواسطة مزوّد الهوية الخارجي من Google. لا يتطلب حسابك إدخال أو تغيير كلمة مرور منفصلة داخل شبكة IEH.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1.5">كلمة المرور الحالية</label>
              <div className="relative">
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  value={securitySettings.currentPassword}
                  onChange={(e) => { setSecuritySettings({ ...securitySettings, currentPassword: e.target.value }); triggerChange(); }}
                  className="w-full input-3d rounded-xl px-4 py-2.5 text-xs text-white"
                  placeholder="••••••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-2.5 text-zinc-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">كلمة المرور الجديدة</label>
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  value={securitySettings.newPassword}
                  onChange={(e) => { setSecuritySettings({ ...securitySettings, newPassword: e.target.value }); triggerChange(); }}
                  className="w-full input-3d rounded-xl px-4 py-2.5 text-xs text-white"
                  placeholder="••••••••••••"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">تأكيد كلمة المرور الجديدة</label>
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  value={securitySettings.confirmPassword}
                  onChange={(e) => { setSecuritySettings({ ...securitySettings, confirmPassword: e.target.value }); triggerChange(); }}
                  className="w-full input-3d rounded-xl px-4 py-2.5 text-xs text-white"
                  placeholder="••••••••••••"
                />
              </div>
            </div>

            <div className="pt-2">
              <Button 
                type="button"
                variant="primary"
                size="md"
                onClick={() => handleSaveProfile()}
                className="font-extrabold"
              >
                تحديث كلمة المرور
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
