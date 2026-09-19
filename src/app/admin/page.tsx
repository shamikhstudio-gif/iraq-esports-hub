'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Users, 
  MessageSquare, 
  Shield, 
  RefreshCw, 
  Zap,
  Loader2 
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Profile, Team, Post, SupportTicket, ScrimLobby, BetaFeedback } from '@/lib/types';
import Link from '@/lib/navigation';
import { useUser } from '@/context/UserContext';
import { Button, Badge } from '@/components/ui';

import { IehLogo } from '@/components/icons/CustomIcons';

import { UsersTab } from '@/components/admin/UsersTab';
import { TeamsTab } from '@/components/admin/TeamsTab';
import { EconomyTab } from '@/components/admin/EconomyTab';
import { AppealsTab } from '@/components/admin/AppealsTab';
import { PostsTab } from '@/components/admin/PostsTab';
import { BetaFeedbackTab } from '@/components/admin/BetaFeedbackTab';
import { SuspensionModal } from '@/components/admin/SuspensionModal';
import { WarningModal } from '@/components/admin/WarningModal';

export default function AdminDashboardPage() {
  const { user: currentUser, isLoading: isUserLoading } = useUser();
  const [activeTab, setActiveTab] = useState<'users' | 'teams' | 'economy' | 'appeals' | 'posts' | 'feedback'>('users');
  const [feedbackList, setFeedbackList] = useState<BetaFeedback[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [disputedLobbies, setDisputedLobbies] = useState<ScrimLobby[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Economy & Pricing State
  const [storePrices, setStorePrices] = useState({
    post_boost: 15,
    ultra_hd: 25,
    splash_pass: 50,
    verified_shield: 100,
  });
  const [vaultConfig, setVaultConfig] = useState({
    default_reward: 25,
    ad_duration: 20,
    cooldown_minutes: 5,
  });
  const [dailyConfig, setDailyConfig] = useState({
    daily_ebits: 50,
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsNotice, setSettingsNotice] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Balance Modifier State
  const [modifierTargetType, setModifierTargetType] = useState<'user' | 'team'>('user');
  const [modifierTargetId, setModifierTargetId] = useState('');
  const [modifierAmount, setModifierAmount] = useState<number>(250);
  const [isModifyingBalance, setIsModifyingBalance] = useState(false);

  // Suspension & Warning Dialog State
  const [selectedUserForSuspension, setSelectedUserForSuspension] = useState<Profile | null>(null);
  const [selectedUserForWarning, setSelectedUserForWarning] = useState<Profile | null>(null);
  const [suspensionDays, setSuspensionDays] = useState<number>(7);
  const [suspensionReason, setSuspensionReason] = useState<string>('مخالفة لوائح النزاهة التنافسية أو السلوك الرياضي لشبكة IEH');

  useEffect(() => {
    if (!isUserLoading && currentUser) {
      if (currentUser.role === 'admin') {
        fetchAdminData();
      } else {
        setIsLoading(false);
      }
    } else if (!isUserLoading && !currentUser) {
      setIsLoading(false);
    }
  }, [isUserLoading, currentUser?.role]);

  const fetchAdminData = async () => {
    setIsLoading(true);
    const [usersRes, teamsRes, postsRes, ticketsRes, settingsRes, disputedRes, feedbackRes] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('teams').select('*').order('created_at', { ascending: false }),
      supabase.from('posts').select('*, author:profiles!posts_author_id_fkey(*)').order('created_at', { ascending: false }),
      supabase.from('support_tickets').select('*, user:profiles!support_tickets_user_id_fkey(*)').order('created_at', { ascending: false }),
      supabase.from('platform_settings').select('*'),
      supabase.from('scrim_lobbies').select(`
        *,
        host_team:teams!scrim_lobbies_host_team_id_fkey(*),
        guest_team:teams!scrim_lobbies_guest_team_id_fkey(*)
      `).eq('status', 'disputed').order('created_at', { ascending: false }),
      supabase.from('beta_feedback').select('*').order('created_at', { ascending: false }),
    ]);

    if (usersRes.data) {
      setUsers(usersRes.data as Profile[]);
      if (!modifierTargetId && usersRes.data.length > 0) {
        setModifierTargetId(usersRes.data[0].id);
      }
    }
    if (teamsRes.data) setTeams(teamsRes.data as Team[]);
    if (postsRes.data) setPosts(postsRes.data as Post[]);
    if (ticketsRes.data) setTickets(ticketsRes.data as SupportTicket[]);
    if (disputedRes.data) setDisputedLobbies(disputedRes.data as ScrimLobby[]);
    if (feedbackRes.data) setFeedbackList(feedbackRes.data as BetaFeedback[]);

    if (settingsRes.data) {
      settingsRes.data.forEach((row: { key: string; value: Record<string, unknown> }) => {
        if (row.key === 'store_prices' && row.value) setStorePrices((prev) => ({ ...prev, ...row.value }));
        if (row.key === 'sponsor_vault_config' && row.value) setVaultConfig((prev) => ({ ...prev, ...row.value }));
        if (row.key === 'daily_rewards_config' && row.value) setDailyConfig((prev) => ({ ...prev, ...row.value }));
      });
    }

    setIsLoading(false);
  };

  const handleSaveEconomySettings = async () => {
    setIsSavingSettings(true);
    setSettingsNotice(null);
    try {
      const [p1, p2, p3] = await Promise.all([
        supabase.from('platform_settings').upsert({
          key: 'store_prices',
          value: storePrices,
          updated_at: new Date().toISOString(),
        }),
        supabase.from('platform_settings').upsert({
          key: 'sponsor_vault_config',
          value: vaultConfig,
          updated_at: new Date().toISOString(),
        }),
        supabase.from('platform_settings').upsert({
          key: 'daily_rewards_config',
          value: dailyConfig,
          updated_at: new Date().toISOString(),
        }),
      ]);

      if (p1.error || p2.error || p3.error) throw new Error('فشل حفظ بعض الإعدادات');

      setSettingsNotice({ type: 'success', msg: 'تم حفظ وتحديث جميع الأسعار ومكافآت الاقتصاد بنجاح!' });
      setTimeout(() => setSettingsNotice(null), 4000);
    } catch (err: unknown) {
      setSettingsNotice({ type: 'error', msg: err instanceof Error ? err.message : 'حدث خطأ أثناء الحفظ' });
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleAdjustBalance = async (delta: number) => {
    if (!modifierTargetId) return;
    setIsModifyingBalance(true);
    setSettingsNotice(null);

    try {
      const { data, error } = await supabase.rpc('admin_adjust_balance', {
        p_target_type: modifierTargetType,
        p_target_id: modifierTargetId,
        p_amount: delta,
      });

      if (error) throw error;

      if (data && data.success) {
        setSettingsNotice({
          type: 'success',
          msg: `تم ${delta > 0 ? 'إضافة' : 'خصم'} ${Math.abs(delta)} eBits لـ (${data.target_name}). الرصيد الجديد: ${data.new_balance} eBits`,
        });
      }

      fetchAdminData();
      setTimeout(() => setSettingsNotice(null), 4000);
    } catch (err: unknown) {
      setSettingsNotice({ type: 'error', msg: err instanceof Error ? err.message : 'فشل تعديل الرصيد' });
    } finally {
      setIsModifyingBalance(false);
    }
  };

  const handleSuspendUser = async () => {
    if (!selectedUserForSuspension) return;

    const untilDate = new Date();
    untilDate.setDate(untilDate.getDate() + suspensionDays);

    await supabase
      .from('profiles')
      .update({
        is_suspended: true,
        suspended_until: untilDate.toISOString(),
        suspension_reason: suspensionReason,
      })
      .eq('id', selectedUserForSuspension.id);

    await supabase.from('notifications').insert({
      user_id: selectedUserForSuspension.id,
      type: 'account_suspended',
      title: 'تم تعليق الحساب',
      message: `تم تعليق حسابك لمدة ${suspensionDays} من الأيام لسبب: ${suspensionReason}. يمكنك التواصل مع الدعم الفني لمراجعة القرار.`,
      link_url: '/settings',
      is_read: false,
    });

    setSelectedUserForSuspension(null);
    fetchAdminData();
  };

  const handleUnsuspendUser = async (userId: string) => {
    await supabase
      .from('profiles')
      .update({
        is_suspended: false,
        suspended_until: null,
        suspension_reason: '',
      })
      .eq('id', userId);

    await supabase.from('notifications').insert({
      user_id: userId,
      type: 'general',
      title: 'تم رفع تعليق الحساب',
      message: 'تمت مراجعة حسابك وإلغاء التعليق بنجاح. نرجو الالتزام بميثاق النزاهة التنافسية واللعب النظيف.',
      link_url: '/settings',
      is_read: false,
    });

    fetchAdminData();
  };

  const handleToggleVerify = async (profile: Profile) => {
    await supabase
      .from('profiles')
      .update({ is_verified: !profile.is_verified })
      .eq('id', profile.id);
    fetchAdminData();
  };

  const handleToggleTeamVerify = async (team: Team) => {
    await supabase
      .from('teams')
      .update({ is_verified: !team.is_verified })
      .eq('id', team.id);
    fetchAdminData();
  };

  const handleConfirmWarnUser = async (user: Profile, reason: string, category: string) => {
    const newCount = (user.warning_count || 0) + 1;
    const shouldSuspend = newCount >= 3;
    const untilDate = new Date();
    untilDate.setDate(untilDate.getDate() + 7);

    await supabase
      .from('profiles')
      .update({
        warning_count: newCount,
        ...(shouldSuspend
          ? {
              is_suspended: true,
              suspended_until: untilDate.toISOString(),
              suspension_reason: `تجاوز الحد الأقصى للإنذارات (الإنذار رقم ${newCount}): ${reason}`,
            }
          : {}),
      })
      .eq('id', user.id);

    await supabase.from('notifications').insert({
      user_id: user.id,
      type: shouldSuspend ? 'account_suspended' : 'first_warning',
      title: shouldSuspend
        ? 'تم تعليق الحساب لتجاوز حد الإنذارات'
        : `إنذار إداري رسمي #${newCount}`,
      message: shouldSuspend
        ? `تم تعليق حسابك لمدة 7 أيام بسبب تجاوز حد المخالفات (الإنذار رقم ${newCount}): ${reason}. يرجى مراجعة الدعم الفني.`
        : `تم توجيه إنذار رسمي لك برقم #${newCount} بسبب: ${reason}. يرجى الالتزام باللوائح لتفادي تعليق الحساب.`,
      link_url: '/settings',
      is_read: false,
    });

    setSelectedUserForWarning(null);
    fetchAdminData();
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المنشور؟')) return;
    await supabase.from('posts').delete().eq('id', postId);
    fetchAdminData();
  };

  const handleResolveTicket = async (ticketId: string, userId: string) => {
    await supabase.from('support_tickets').update({ status: 'resolved' }).eq('id', ticketId);
    await handleUnsuspendUser(userId);
    fetchAdminData();
  };

  const handleResolveDispute = async (lobbyId: string, hostScore: number, guestScore: number) => {
    try {
      const { data, error } = await supabase.rpc('finalize_scrim_match', {
        p_lobby_id: lobbyId,
        p_confirming_team_id: null,
        p_override_by_admin: true,
        p_override_host_score: hostScore,
        p_override_guest_score: guestScore,
      });

      if (error) throw error;
      fetchAdminData();
    } catch (err: unknown) {
      console.error('Error resolving dispute by admin:', err);
      alert(err instanceof Error ? err.message : 'فشل حسم النزاع');
    }
  };

  if (isUserLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
        <Loader2 className="w-8 h-8 text-white animate-spin mx-auto" />
        <p className="text-xs text-zinc-400 font-mono">جاري التحقق من صلاحيات الإدارة...</p>
      </div>
    );
  }

  if (currentUser?.role !== 'admin') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-[#121212] border border-white/20 flex items-center justify-center text-white">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-black text-white">غير مصرح لك بالوصول</h1>
        <p className="text-xs text-zinc-400 max-w-md">
          لوحة الإدارة مقتصرة حصرياً على مشرفي وإداريي شبكة IEH الرسمية.
        </p>
        <Link href="/">
          <Button variant="primary" size="md">
            العودة للرئيسية
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="layout-container py-4 space-y-6 text-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-black/80 border border-white/20 p-2 flex items-center justify-center shadow-md">
            <IehLogo size={32} glow={true} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-white">
                لوحة الإشراف والإدارة الرسمية (IEH Admin Panel)
              </h1>
              <Badge variant="outline" size="xs" className="font-mono">
                admin@iraqesportshub.com
              </Badge>
            </div>
            <p className="text-xs text-zinc-400 font-medium mt-0.5">
              إدارة لاعبي ومنظمات الرياضات الإلكترونية، الرقابة، استئنافات الدعم الفني ومراقبة المنشورات
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="icon-sm"
            onClick={fetchAdminData}
            isLoading={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="card-3d p-4">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-bold mb-1">
            <span>إجمالي اللاعبين المسجلين</span>
            <Users className="w-4 h-4 text-white" />
          </div>
          <div className="text-2xl font-black text-white">{users.length}</div>
        </div>

        <div className="card-3d p-4">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-bold mb-1">
            <span>الفرق والكلانات الموثقة</span>
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div className="text-2xl font-black text-white">{teams.length}</div>
        </div>

        <div className="card-3d p-4">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-bold mb-1">
            <span>طلبات واستئنافات الدعم</span>
            <MessageSquare className="w-4 h-4 text-white" />
          </div>
          <div className="text-2xl font-black text-white">{tickets.filter((t) => t.status === 'pending').length}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 border-b border-white/10 pb-2 overflow-x-auto">
        <Button
          variant={activeTab === 'users' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('users')}
          className="font-extrabold shrink-0"
        >
          إدارة اللاعبين والرقابة ({users.length})
        </Button>
        <Button
          variant={activeTab === 'teams' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('teams')}
          className="font-extrabold shrink-0"
        >
          المنظمات والفرق ({teams.length})
        </Button>
        <Button
          variant={activeTab === 'economy' ? 'primary' : 'ghost'}
          size="sm"
          icon={<Zap className="w-3.5 h-3.5" />}
          onClick={() => setActiveTab('economy')}
          className="font-extrabold shrink-0"
        >
          أسعار المتجر والاقتصاد (eBits)
        </Button>
        <Button
          variant={activeTab === 'appeals' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('appeals')}
          className="font-extrabold shrink-0"
        >
          استئنافات الدعم الفني ({tickets.length})
        </Button>
        <Button
          variant={activeTab === 'posts' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('posts')}
          className="font-extrabold shrink-0"
        >
          مراقبة المنشورات ({posts.length})
        </Button>
        <Button
          variant={activeTab === 'feedback' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('feedback')}
          className="font-extrabold shrink-0"
        >
          ملاحظات البيتا ({feedbackList.length})
        </Button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'users' && (
        <UsersTab
          users={users}
          search={search}
          setSearch={setSearch}
          onSuspendClick={setSelectedUserForSuspension}
          onUnsuspend={handleUnsuspendUser}
          onWarn={(u) => setSelectedUserForWarning(u)}
          onToggleVerify={handleToggleVerify}
        />
      )}

      {activeTab === 'teams' && (
        <TeamsTab
          teams={teams}
          onToggleTeamVerify={handleToggleTeamVerify}
        />
      )}

      {activeTab === 'economy' && (
        <EconomyTab
          settingsNotice={settingsNotice}
          storePrices={storePrices}
          setStorePrices={setStorePrices}
          vaultConfig={vaultConfig}
          setVaultConfig={setVaultConfig}
          dailyConfig={dailyConfig}
          setDailyConfig={setDailyConfig}
          isSavingSettings={isSavingSettings}
          handleSaveEconomySettings={handleSaveEconomySettings}
          modifierTargetType={modifierTargetType}
          setModifierTargetType={setModifierTargetType}
          modifierTargetId={modifierTargetId}
          setModifierTargetId={setModifierTargetId}
          modifierAmount={modifierAmount}
          setModifierAmount={setModifierAmount}
          isModifyingBalance={isModifyingBalance}
          handleAdjustBalance={handleAdjustBalance}
          users={users}
          teams={teams}
        />
      )}

      {activeTab === 'appeals' && (
        <AppealsTab
          tickets={tickets}
          disputedLobbies={disputedLobbies}
          onResolveTicket={handleResolveTicket}
          onResolveDispute={handleResolveDispute}
        />
      )}

      {activeTab === 'posts' && (
        <PostsTab
          posts={posts}
          onDeletePost={handleDeletePost}
        />
      )}

      {activeTab === 'feedback' && (
        <BetaFeedbackTab
          feedbackList={feedbackList}
          onRefresh={fetchAdminData}
        />
      )}

      {/* Suspension Modal Dialog */}
      <SuspensionModal
        user={selectedUserForSuspension}
        onClose={() => setSelectedUserForSuspension(null)}
        suspensionDays={suspensionDays}
        setSuspensionDays={setSuspensionDays}
        suspensionReason={suspensionReason}
        setSuspensionReason={setSuspensionReason}
        onConfirm={handleSuspendUser}
      />

      {/* Warning Taxonomy Modal Dialog */}
      <WarningModal
        user={selectedUserForWarning}
        isOpen={Boolean(selectedUserForWarning)}
        onClose={() => setSelectedUserForWarning(null)}
        onConfirmWarn={handleConfirmWarnUser}
      />
    </div>
  );
}