'use client';

import React, { useState, useEffect } from 'react';
import { 
  User, 
  Gamepad2, 
  Shield, 
  Bell, 
  Lock, 
  Camera, 
  CheckCircle2,
  Loader2,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import Link from '@/lib/navigation';
import { supabase } from '@/lib/supabase';
import { Profile } from '@/lib/types';
import { getActiveSessions, syncRemoteSessions, terminateSession, terminateAllOtherSessions, DeviceSession } from '@/lib/deviceSession';
import { AUTH_USER_KEY } from '@/lib/constants';
import { Button } from '@/components/ui';
import { AvatarWithDecoration } from '@/components/ui/AvatarWithDecoration';

import { useUser } from '@/context/UserContext';
import { useAppBackground } from '@/context/BackgroundContext';
import { useAppFont } from '@/context/FontContext';
import { ProfileTab } from '@/components/settings/ProfileTab';
import { GamingTab } from '@/components/settings/GamingTab';
import { AppearanceTab } from '@/components/settings/AppearanceTab';
import { SecurityTab } from '@/components/settings/SecurityTab';
import { NotificationsTab } from '@/components/settings/NotificationsTab';
import { PrivacyTab } from '@/components/settings/PrivacyTab';

type TabType = 'profile' | 'gaming' | 'appearance' | 'security' | 'notifications' | 'privacy';

export default function SettingsPage() {
  const { user, updateUser } = useUser();
  const { saveBackgroundSettings, revertBackgroundSettings } = useAppBackground();
  const { saveFontSettings, revertFontSettings } = useAppFont();
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [cancelSignal, setCancelSignal] = useState(0);
  const [isProfileLoading, setIsProfileLoading] = useState(!user);
  const [isOAuthUser, setIsOAuthUser] = useState(false);

  // Tab action registry for root save/cancel coordination across any existing or future tab
  const tabActionsRef = React.useRef<{
    [key in TabType]?: {
      save?: () => Promise<void> | void;
      revert?: () => void;
    };
  }>({});

  const registerTabActions = React.useCallback((tab: TabType, actions: { save?: () => Promise<void> | void; revert?: () => void }) => {
    tabActionsRef.current[tab] = actions;
  }, []);

  // Profile State initialized synchronously from user context (0ms)
  const [profileData, setProfileData] = useState(() => ({
    id: user?.id || '',
    fullName: user?.full_name || 'لاعب شبكة IEH',
    username: user?.username || 'player',
    email: user?.email || 'user@iraqesportshub.com',
    bio: user?.bio || 'لاعب ومنافس في بطولات العراق الإلكترونية',
    city: user?.city || 'بغداد',
    phone: '+964 770 000 0000',
    role: user?.role || 'player',
    avatarUrl: user?.avatar_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300',
    bannerUrl: user?.banner_url || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200',
    contactEmail: user?.contact_email || '',
    isEmailPublic: user?.is_email_public ?? false,
  }));

  const [gamingData, setGamingData] = useState({
    primaryGame: 'PUBG Mobile',
    secondaryGames: [] as string[],
    inGameId: '',
    inGameTag: '',
    inGameRole: '',
    discordTag: '',
    steamId: '',
    riotId: '',
    twitchChannel: '',
  });

  const [notificationSettings, setNotificationSettings] = useState({
    scrimInvites: true,
    teamApplications: true,
    directMessages: true,
    postLikesComments: true,
    emailDigest: false,
    soundAlerts: true,
    browserPush: true,
  });

  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: 'public',
    showOnlineStatus: true,
    showMatchHistory: true,
    allowDirectMessages: 'everyone',
    allowTeamInvites: true,
  });

  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: false,
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [sessions, setSessions] = useState<DeviceSession[]>([]);

  // Snapshot refs for instant and synchronous revert
  const savedProfileRef = React.useRef<any>(null);
  const savedGamingRef = React.useRef<any>(null);
  const savedNotificationsRef = React.useRef<any>(null);
  const savedPrivacyRef = React.useRef<any>(null);

  React.useEffect(() => {
    if (!savedProfileRef.current && profileData) savedProfileRef.current = { ...profileData };
    if (!savedGamingRef.current && gamingData) savedGamingRef.current = { ...gamingData };
    if (!savedNotificationsRef.current && notificationSettings) savedNotificationsRef.current = { ...notificationSettings };
    if (!savedPrivacyRef.current && privacySettings) savedPrivacyRef.current = { ...privacySettings };
  }, []);

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    if (activeTab === 'security') {
      if (profileData.id) {
        setSessions(getActiveSessions(profileData.id));
        syncRemoteSessions(profileData.id).then((remote) => setSessions(remote)).catch(() => {});
      }
    }
  }, [activeTab, profileData.id]);

  const loadUserData = async () => {
    setIsProfileLoading(true);
    try {
      let currentUserId = typeof window !== 'undefined' ? localStorage.getItem(AUTH_USER_KEY) : null;
      const { data: authData } = await supabase.auth.getUser();
      const authUser = authData?.user;

      if (authUser) {
        const isGoogle = authUser.app_metadata?.provider === 'google' ||
          authUser.identities?.some((i: any) => i.provider === 'google') ||
          authUser.app_metadata?.providers?.includes('google');
        setIsOAuthUser(Boolean(isGoogle));
      }

      if (!currentUserId && authUser) {
        currentUserId = authUser.id;
        if (typeof window !== 'undefined') {
          localStorage.setItem(AUTH_USER_KEY, authUser.id);
        }
      }

      let profile: Profile | null = null;
      if (currentUserId) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUserId)
          .single();
        if (data && !error) {
          profile = data;
        }
      }

      if (!profile) {
        const { data: firstProfiles } = await supabase.from('profiles').select('*').limit(1);
        if (firstProfiles && firstProfiles.length > 0) {
          profile = firstProfiles[0];
          if (typeof window !== 'undefined' && profile) {
            localStorage.setItem(AUTH_USER_KEY, profile.id);
          }
        }
      }

      if (profile) {
        const loadedProfile = {
          id: profile.id,
          fullName: profile.full_name || 'لاعب شبكة IEH',
          username: profile.username || 'player',
          email: profile.email || authUser?.email || 'user@iraqesportshub.com',
          bio: profile.bio || 'لاعب ومنافس في بطولات العراق الإلكترونية',
          city: profile.city || 'بغداد',
          phone: '+964 770 000 0000',
          role: profile.role || 'player',
          avatarUrl: profile.avatar_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300',
          bannerUrl: profile.banner_url || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200',
          contactEmail: profile.contact_email || profile.email || '',
          isEmailPublic: profile.is_email_public ?? false,
        };
        const loadedGaming = {
          primaryGame: profile.primary_game || 'PUBG Mobile',
          secondaryGames: [],
          inGameId: profile.in_game_id || '',
          inGameTag: '',
          inGameRole: profile.in_game_role || '',
          discordTag: '',
          steamId: '',
          riotId: '',
          twitchChannel: '',
        };

        setProfileData(loadedProfile);
        savedProfileRef.current = { ...loadedProfile };

        setGamingData((prev) => {
          const updated = { ...prev, ...loadedGaming };
          savedGamingRef.current = { ...updated };
          return updated;
        });

        if (profile.notification_preferences) {
          setNotificationSettings(profile.notification_preferences);
          savedNotificationsRef.current = { ...profile.notification_preferences };
        }
        if (profile.privacy_preferences) {
          setPrivacySettings(profile.privacy_preferences);
          savedPrivacyRef.current = { ...profile.privacy_preferences };
        }

        setSessions(getActiveSessions(profile.id));
      }
    } catch (err) {
      console.error('Error loading settings user data:', err);
    } finally {
      setIsProfileLoading(false);
    }
  };


  const handleTerminateSession = (sessionId: string) => {
    if (!profileData.id) return;
    const remaining = terminateSession(profileData.id, sessionId);
    setSessions(remaining);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleTerminateAllOtherSessions = () => {
    if (!profileData.id) return;
    if (!confirm('هل تريد تسجيل الخروج من جميع الأجهزة الأخرى النشطة؟')) return;
    const remaining = terminateAllOtherSessions(profileData.id);
    setSessions(remaining);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const triggerChange = () => {
    setHasUnsavedChanges(true);
    setSavedSuccess(false);
  };

  const handleSaveProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      if (profileData.username && !/^[a-zA-Z][a-zA-Z0-9_]{2,29}$/.test(profileData.username)) {
        alert('اسم المستخدم غير صالح: يجب أن يبدأ بحرف إنجليزي ولا يمكن أن يتكون من أرقام فقط (3-30 حرفاً).');
        return;
      }

      if (profileData.id) {
        await supabase
          .from('profiles')
          .update({
            full_name: profileData.fullName,
            username: profileData.username,
            avatar_url: profileData.avatarUrl,
            banner_url: profileData.bannerUrl,
            contact_email: profileData.contactEmail || null,
            is_email_public: Boolean(profileData.isEmailPublic),
            bio: profileData.bio,
            city: profileData.city,
            primary_game: gamingData.primaryGame,
            in_game_id: gamingData.inGameId,
            in_game_role: gamingData.inGameRole,
          })
          .eq('id', profileData.id);

        updateUser({
          full_name: profileData.fullName,
          username: profileData.username,
          avatar_url: profileData.avatarUrl,
          banner_url: profileData.bannerUrl,
          contact_email: profileData.contactEmail || null,
          is_email_public: Boolean(profileData.isEmailPublic),
          bio: profileData.bio,
          city: profileData.city,
          primary_game: gamingData.primaryGame,
          in_game_id: gamingData.inGameId,
          in_game_role: gamingData.inGameRole,
        });
      }
      setHasUnsavedChanges(false);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving profile:', err);
    }
  };

  const handleGlobalSave = async () => {
    try {
      // 1. If tab registered a dedicated save action, execute it!
      const activeActions = tabActionsRef.current[activeTab];
      if (activeActions?.save) {
        await activeActions.save();
      } else if (activeTab === 'appearance') {
        await Promise.all([
          saveBackgroundSettings(),
          saveFontSettings(),
        ]);
      } else if (activeTab === 'notifications') {
        if (profileData.id) {
          await supabase
            .from('profiles')
            .update({ notification_preferences: notificationSettings })
            .eq('id', profileData.id);
        }
      } else if (activeTab === 'privacy') {
        if (profileData.id) {
          await supabase
            .from('profiles')
            .update({ privacy_preferences: privacySettings })
            .eq('id', profileData.id);
        }
      } else {
        await handleSaveProfile();
      }

      // Update baseline snapshots upon successful commit
      savedProfileRef.current = { ...profileData };
      savedGamingRef.current = { ...gamingData };
      savedNotificationsRef.current = { ...notificationSettings };
      savedPrivacyRef.current = { ...privacySettings };

      setHasUnsavedChanges(false);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error('Error in handleGlobalSave:', err);
    }
  };

  const handleCancel = () => {
    // 1. Execute tab-specific revert if registered
    tabActionsRef.current[activeTab]?.revert?.();

    // 2. ROOT FIX: Revert all live preview global contexts unconditionally
    revertBackgroundSettings();
    revertFontSettings();

    // 3. Restore in-memory form drafts from snapshots synchronously
    if (savedProfileRef.current) setProfileData({ ...savedProfileRef.current });
    if (savedGamingRef.current) setGamingData({ ...savedGamingRef.current });
    if (savedNotificationsRef.current) setNotificationSettings({ ...savedNotificationsRef.current });
    if (savedPrivacyRef.current) setPrivacySettings({ ...savedPrivacyRef.current });

    // 4. Trigger cancel signal to notify child components (e.g. AppearanceTab)
    setCancelSignal((prev) => prev + 1);

    setHasUnsavedChanges(false);
  };

  const handleTabChange = (tabId: TabType) => {
    if (tabId === activeTab) return;
    if (hasUnsavedChanges) {
      // Revert uncommitted preview visual changes when switching tabs without saving
      handleCancel();
    }
    setActiveTab(tabId);
  };

  const navTabs = [
    { id: 'profile' as TabType, label: 'الملف الشخصي', icon: User, desc: 'البيانات الشخصية، الاسم، والصور' },
    { id: 'gaming' as TabType, label: 'الهوية التنافسية والألعاب', icon: Gamepad2, desc: 'معرفات الألعاب، الرتب، والربط' },
    { id: 'appearance' as TabType, label: 'المظهر ومؤثرات الخلفية', icon: Sparkles, desc: 'تخصيص خلفية التطبيق والمشروع' },
    { id: 'security' as TabType, label: 'الأمان وكلمة المرور', icon: Lock, desc: 'كلمة السر، الجلسات، والتحقق 2FA' },
    { id: 'notifications' as TabType, label: 'مركز التنبيهات', icon: Bell, desc: 'إشعارات السكريمات والرسائل' },
    { id: 'privacy' as TabType, label: 'الخصوصية والتواصل', icon: Shield, desc: 'ظهور الملف، وسجل المباريات' },
  ];

  if (isProfileLoading) {
    return (
      <div className="layout-container flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  return (
    <div className="layout-container space-y-6">
      {/* Top Banner / Header */}
      <div className="card-3d p-4 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2" />
        
        <div className="flex items-center gap-4 sm:gap-5 z-10 w-full min-w-0">
          <div className="relative group shrink-0">
            <AvatarWithDecoration
              src={profileData.avatarUrl}
              alt={profileData.fullName}
              frame={user?.equipped_frame || (user?.has_neon_frame ? 'neon_pulse' : 'none')}
              size="custom"
              customSizeClass="w-20 h-20 sm:w-24 sm:h-24"
            />
            <button 
              type="button"
              onClick={() => setActiveTab('profile')}
              className="absolute inset-0 bg-black/90 rounded-2xl flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-10"
              title="تغيير الصورة"
            >
              <Camera className="w-6 h-6 mb-1" />
              <span className="text-[10px] font-bold">تغيير</span>
            </button>
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-2xl font-black text-white truncate mb-1">
              {profileData.fullName}
            </h1>
            <div className="text-xs text-text-tertiary font-mono flex flex-wrap items-center gap-1.5 mb-2 min-w-0">
              <span dir="ltr" className="text-zinc-300 font-semibold truncate">@{profileData.username}</span>
              <span>•</span>
              <span className="text-text-muted truncate">{profileData.email}</span>
            </div>
            {gamingData.primaryGame && (
              <div className="flex items-center gap-2 text-[11px]">
                <span className="px-2 py-0.5 rounded-lg bg-[#141414] border border-white/10 text-white font-bold shrink-0">
                  {gamingData.primaryGame}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-4 space-y-2">
          <div className="card-3d p-2 space-y-1">
            {navTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`w-full flex items-center gap-3.5 p-3 rounded-xl transition text-right group cursor-pointer ${
                    isActive
                      ? 'bg-white text-black font-extrabold shadow-md border border-white'
                      : 'text-zinc-400 hover:text-white hover:bg-white/[0.04] border border-transparent'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition ${
                      isActive ? 'bg-black text-white' : 'bg-white/10 text-zinc-400 group-hover:text-white'
                    }`}
                  >
                    <Icon
                      className="w-4 h-4 shrink-0"
                      style={{
                        stroke: isActive ? '#ffffff' : '#a1a1aa',
                        color: isActive ? '#ffffff' : '#a1a1aa',
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-xs font-bold truncate ${isActive ? 'text-black font-black' : 'text-zinc-200'}`}>
                      {tab.label}
                    </div>
                    <div className={`text-[10px] truncate ${isActive ? 'text-zinc-600 font-semibold' : 'text-zinc-500'}`}>
                      {tab.desc}
                    </div>
                  </div>
                </button>
              );
            })}

            {profileData.role === 'admin' && (
              <Link
                href="/admin"
                className="w-full flex items-center gap-3.5 p-3 rounded-xl transition text-right group cursor-pointer bg-white/[0.06] hover:bg-white/10 text-white border border-white/15 mt-2"
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-white text-black font-black">
                  <ShieldCheck className="w-4 h-4 text-black" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-black text-white">لوحة الإدارة (Admin Panel)</div>
                  <div className="text-[10px] text-zinc-400">ملاحظات البيتا، الحظر، إدارة المنصة</div>
                </div>
              </Link>
            )}
          </div>
        </div>

        {/* Content Pane */}
        <div className="lg:col-span-8">
          {activeTab === 'profile' && (
            <ProfileTab
              profileData={profileData}
              setProfileData={setProfileData}
              triggerChange={triggerChange}
            />
          )}

          {activeTab === 'gaming' && (
            <GamingTab
              gamingData={gamingData}
              setGamingData={setGamingData}
              triggerChange={triggerChange}
            />
          )}

          {activeTab === 'appearance' && (
            <AppearanceTab 
              triggerChange={triggerChange}
              registerTabActions={registerTabActions}
              cancelSignal={cancelSignal}
              onSaved={() => {
                setHasUnsavedChanges(false);
                setSavedSuccess(true);
                setTimeout(() => setSavedSuccess(false), 3000);
              }}
            />
          )}

          {activeTab === 'security' && (
            <SecurityTab
              profileEmail={profileData.email}
              isOAuthUser={isOAuthUser}
              sessions={sessions}
              securitySettings={securitySettings}
              setSecuritySettings={setSecuritySettings}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              handleTerminateSession={handleTerminateSession}
              handleTerminateAllOtherSessions={handleTerminateAllOtherSessions}
              handleSaveProfile={handleSaveProfile}
              triggerChange={triggerChange}
            />
          )}

          {activeTab === 'notifications' && (
            <NotificationsTab
              notificationSettings={notificationSettings}
              setNotificationSettings={setNotificationSettings}
              triggerChange={triggerChange}
            />
          )}

          {activeTab === 'privacy' && (
            <PrivacyTab
              privacySettings={privacySettings}
              setPrivacySettings={setPrivacySettings}
              triggerChange={triggerChange}
            />
          )}
        </div>
      </div>

      {/* Floating Save Changes Notification Bar */}
      {hasUnsavedChanges && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-xl bg-[#111111] border border-white/20 rounded-2xl shadow-modal p-4 flex items-center justify-between gap-4 animate-in slide-in-from-bottom-5 duration-200">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
            <div className="text-xs font-bold text-white">لديك تعديلات غير محفوظة</div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleCancel}
            >
              إلغاء
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleGlobalSave}
              className="font-extrabold"
            >
              حفظ الآن
            </Button>
          </div>
        </div>
      )}

      {/* Save Success Toast */}
      {savedSuccess && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-white text-black rounded-2xl shadow-modal px-5 py-3 flex items-center gap-2 text-xs font-black animate-in fade-in zoom-in-95 duration-150">
          <CheckCircle2 className="w-4 h-4 text-black" />
          <span>تم حفظ الإعدادات بنجاح!</span>
        </div>
      )}

    </div>
  );
}
