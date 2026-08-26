'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  Users, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Search, 
  Clock, 
  MessageSquare, 
  Send,
  Trash2,
  Sparkles,
  ExternalLink,
  Shield,
  RefreshCw,
  Crown
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Profile, Team, Post, SupportTicket } from '@/lib/types';

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<'users' | 'teams' | 'appeals' | 'posts'>('users');
  const [users, setUsers] = useState<Profile[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Suspension Dialog State
  const [selectedUserForSuspension, setSelectedUserForSuspension] = useState<Profile | null>(null);
  const [suspensionDays, setSuspensionDays] = useState<number>(7);
  const [suspensionReason, setSuspensionReason] = useState<string>('مخالفة لوائح النزاهة التنافسية أو السلوك الرياضي لشبكة IEH');

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setIsLoading(true);
    const { data: usersData } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    const { data: teamsData } = await supabase.from('teams').select('*').order('created_at', { ascending: false });
    const { data: postsData } = await supabase.from('posts').select('*, author:profiles!posts_author_id_fkey(*)').order('created_at', { ascending: false });
    const { data: ticketsData } = await supabase.from('support_tickets').select('*, user:profiles!support_tickets_user_id_fkey(*)').order('created_at', { ascending: false });

    if (usersData) setUsers(usersData as Profile[]);
    if (teamsData) setTeams(teamsData as Team[]);
    if (postsData) setPosts(postsData as Post[]);
    if (ticketsData) setTickets(ticketsData as SupportTicket[]);
    setIsLoading(false);
  };

  // Actions
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
      description: `تم تعليق حسابك لمدة ${suspensionDays} من الأيام لسبب ${suspensionReason}، تواصل مع الدعم الفني بالضغط على الزر أدناه.`,
      suspension_days: suspensionDays,
      suspension_reason: suspensionReason,
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
      description: 'تمت مراجعة حسابك وإلغاء التعليق. نرجو الالتزام بقواعد اللعب النظيف.',
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

  const handleWarnUser = async (user: Profile) => {
    const newCount = (user.warning_count || 0) + 1;
    await supabase
      .from('profiles')
      .update({ warning_count: newCount })
      .eq('id', user.id);

    await supabase.from('notifications').insert({
      user_id: user.id,
      type: 'first_warning',
      title: 'إنذار إداري رسمي',
      description: 'تلقيت إنذاراً إدارياً لمخالفة قوانين المنصة. يرجى تجنب تكرار السلوك لتفادي تعليق الحساب.',
      is_read: false,
    });

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

  const filteredUsers = users.filter(
    (u) =>
      u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.username?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto py-4 space-y-6 text-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#181818] border border-white/20 text-white flex items-center justify-center shadow-md">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-white">
                لوحة الإشراف والإدارة الرسمية (IEH Admin Panel)
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-white/10 text-white border border-white/20">
                admin@iraqesportshub.com
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-medium mt-0.5">
              إدارة لاعبي ومنظمات الرياضات الإلكترونية، الرقابة، استئنافات الدعم الفني ومراقبة المنشورات
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchAdminData}
            className="p-2 bg-[#181818] hover:bg-[#222222] text-white border border-white/20 rounded-xl transition shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
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
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition shrink-0 ${
            activeTab === 'users' ? 'bg-white text-black shadow-sm' : 'bg-[#080808] text-zinc-400 hover:bg-white/5 hover:text-white border border-white/10'
          }`}
        >
          إدارة اللاعبين والرقابة ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('teams')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition shrink-0 ${
            activeTab === 'teams' ? 'bg-white text-black shadow-sm' : 'bg-[#080808] text-zinc-400 hover:bg-white/5 hover:text-white border border-white/10'
          }`}
        >
          المنظمات والفرق ({teams.length})
        </button>
        <button
          onClick={() => setActiveTab('appeals')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition shrink-0 ${
            activeTab === 'appeals' ? 'bg-white text-black shadow-sm' : 'bg-[#080808] text-zinc-400 hover:bg-white/5 hover:text-white border border-white/10'
          }`}
        >
          استئنافات الدعم الفني ({tickets.length})
        </button>
        <button
          onClick={() => setActiveTab('posts')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition shrink-0 ${
            activeTab === 'posts' ? 'bg-white text-black shadow-sm' : 'bg-[#080808] text-zinc-400 hover:bg-white/5 hover:text-white border border-white/10'
          }`}
        >
          مراقبة المنشورات ({posts.length})
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'users' && (
        <div className="card-3d overflow-hidden">
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <div className="relative w-full max-w-sm">
              <Search className="w-4 h-4 text-zinc-400 absolute right-3.5 top-3" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث بالاسم أو البريد أو اسم المستخدم..."
                className="w-full text-xs p-2 pr-10 rounded-xl input-3d text-white placeholder-zinc-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right">
              <thead className="bg-[#080808] text-zinc-400 font-bold border-b border-white/10">
                <tr>
                  <th className="p-3.5">اللاعب / الحساب</th>
                  <th className="p-3.5">اللعبة والمحافظة</th>
                  <th className="p-3.5">حالة الحساب</th>
                  <th className="p-3.5">الإنذارات</th>
                  <th className="p-3.5 text-center">الإجراءات الإدارية</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-medium">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-white/5 transition">
                    <td className="p-3.5">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={u.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                          alt={u.full_name}
                          className="w-9 h-9 rounded-xl object-cover border border-white/10"
                        />
                        <div>
                          <div className="font-bold text-white flex items-center gap-1">
                            {u.full_name}
                            {u.is_verified && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                          </div>
                          <div className="text-[11px] text-zinc-400">@{u.username} • {u.email}</div>
                        </div>
                      </div>
                    </td>

                    <td className="p-3.5">
                      <div className="text-white font-bold">{u.primary_game}</div>
                      <div className="text-[11px] text-zinc-400">{u.city}</div>
                    </td>

                    <td className="p-3.5">
                      {u.is_suspended ? (
                        <span className="px-2 py-0.5 rounded-lg bg-white/15 text-white border border-white/30 text-[10px] font-bold">
                          معلق مؤقتاً ({u.suspension_reason || 'مخالفة'})
                        </span>
                      ) : u.is_banned ? (
                        <span className="px-2 py-0.5 rounded-lg bg-[#080808] text-white border border-white/10 text-[10px] font-bold">
                          محظور نهائياً
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-lg bg-white text-black text-[10px] font-extrabold shadow-xs">
                          نشط وطبيعي
                        </span>
                      )}
                    </td>

                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                        u.warning_count > 0 ? 'bg-white/15 text-white border border-white/20' : 'bg-[#080808] text-zinc-400 border border-white/10'
                      }`}>
                        {u.warning_count} إنذارات
                      </span>
                    </td>

                    <td className="p-3.5">
                      <div className="flex items-center justify-center gap-1.5">
                        {u.is_suspended ? (
                          <button
                            onClick={() => handleUnsuspendUser(u.id)}
                            className="px-2.5 py-1 btn-3d-primary text-black rounded-lg font-extrabold text-[11px] shadow-sm"
                          >
                            فك التعليق
                          </button>
                        ) : (
                          <button
                            onClick={() => setSelectedUserForSuspension(u)}
                            className="px-2.5 py-1 bg-white/15 hover:bg-white/25 text-white border border-white/20 rounded-lg font-bold text-[11px]"
                          >
                            تعليق الحساب
                          </button>
                        )}

                        <button
                          onClick={() => handleWarnUser(u)}
                          className="px-2.5 py-1 btn-3d-dark text-white rounded-lg font-bold text-[11px]"
                        >
                          تحذير أول
                        </button>

                        <button
                          onClick={() => handleToggleVerify(u)}
                          className="p-1 rounded-lg text-zinc-400 hover:bg-white/5 hover:text-white"
                          title="توثيق / إلغاء التوثيق"
                        >
                          <CheckCircle2 className={`w-4 h-4 ${u.is_verified ? 'text-white' : 'text-zinc-600'}`} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'teams' && (
        <div className="card-3d overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right">
              <thead className="bg-[#080808] text-zinc-400 font-bold border-b border-white/10">
                <tr>
                  <th className="p-3.5">الفريق / المنظمة</th>
                  <th className="p-3.5">المقر والألعاب</th>
                  <th className="p-3.5">حالة التوثيق</th>
                  <th className="p-3.5 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-medium">
                {teams.map((t) => (
                  <tr key={t.id} className="hover:bg-white/5 transition">
                    <td className="p-3.5">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={t.logo_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200'}
                          alt={t.name}
                          className="w-9 h-9 rounded-xl object-cover border border-white/10"
                        />
                        <div>
                          <div className="font-bold text-white flex items-center gap-1">
                            {t.name}
                            <span className="font-mono text-zinc-400">[{t.tag}]</span>
                          </div>
                          <div className="text-[11px] text-zinc-400 line-clamp-1">{t.bio}</div>
                        </div>
                      </div>
                    </td>

                    <td className="p-3.5">
                      <div className="text-white font-bold">{t.city}</div>
                      <div className="text-[10px] text-zinc-400">{t.games?.join(' • ')}</div>
                    </td>

                    <td className="p-3.5">
                      {t.is_verified ? (
                        <span className="px-2 py-0.5 rounded-lg bg-white text-black text-[10px] font-extrabold shadow-xs">
                          موثق رسمياً
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-lg bg-[#080808] text-zinc-400 border border-white/10 text-[10px] font-bold">
                          غير موثق
                        </span>
                      )}
                    </td>

                    <td className="p-3.5 text-center">
                      <button
                        onClick={() => handleToggleTeamVerify(t)}
                        className={`px-3 py-1 rounded-lg text-xs font-extrabold transition ${
                          t.is_verified
                            ? 'btn-3d-dark text-white'
                            : 'btn-3d-primary text-black'
                        }`}
                      >
                        {t.is_verified ? 'إلغاء التوثيق' : 'توثيق رسمي'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'appeals' && (
        <div className="space-y-3">
          {tickets.length === 0 ? (
            <div className="card-3d p-12 text-center text-zinc-400 text-xs font-medium">
              لا توجد تذاكر استئناف مفتوحة حالياً.
            </div>
          ) : (
            tickets.map((ticket) => (
              <div key={ticket.id} className="card-3d p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-extrabold text-sm text-white">{ticket.subject}</span>
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold ${
                      ticket.status === 'resolved' ? 'bg-white text-black shadow-xs' : 'bg-white/15 text-white border border-white/20'
                    }`}>
                      {ticket.status === 'resolved' ? 'تمت المعالجة وقبول الاستئناف' : 'قيد المراجعة الإدارية'}
                    </span>
                  </div>

                  <p className="text-xs text-zinc-300 leading-relaxed mb-2">
                    {ticket.message}
                  </p>

                  <div className="text-[11px] text-zinc-400 flex items-center gap-2 font-medium">
                    <span>صاحب الاستئناف: {ticket.user?.full_name} (@{ticket.user?.username})</span>
                    <span>•</span>
                    <span className="font-mono">{new Date(ticket.created_at).toLocaleDateString('ar-IQ')}</span>
                  </div>
                </div>

                {ticket.status !== 'resolved' && (
                  <button
                    onClick={() => handleResolveTicket(ticket.id, ticket.user_id)}
                    className="px-4 py-2 btn-3d-primary text-black rounded-xl text-xs font-extrabold shrink-0 flex items-center gap-1.5 shadow-md transition"
                  >
                    <CheckCircle2 className="w-4 h-4 text-black" />
                    <span>قبول الاستئناف وفك التعليق فوراً</span>
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'posts' && (
        <div className="card-3d overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right">
              <thead className="bg-[#080808] text-zinc-400 font-bold border-b border-white/10">
                <tr>
                  <th className="p-3.5">الناشر</th>
                  <th className="p-3.5">المحتوى والنوع</th>
                  <th className="p-3.5">التفاعل</th>
                  <th className="p-3.5 text-center">إجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-medium">
                {posts.map((p) => (
                  <tr key={p.id} className="hover:bg-white/5 transition">
                    <td className="p-3.5 font-bold text-white">
                      {p.author?.full_name || 'مستخدم'}
                    </td>
                    <td className="p-3.5">
                      <div className="text-zinc-300 line-clamp-1 max-w-md">{p.content}</div>
                      <div className="text-[10px] text-zinc-400">{p.post_type} • {p.game}</div>
                    </td>
                    <td className="p-3.5 text-zinc-400 font-mono">
                      {p.likes_count} إعجاب • {p.comments_count} رد
                    </td>
                    <td className="p-3.5 text-center">
                      <button
                        onClick={() => handleDeletePost(p.id)}
                        className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition"
                        title="حذف المنشور"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Suspension Modal Dialog */}
      {selectedUserForSuspension && (
        <div 
          className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-sm overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedUserForSuspension(null);
          }}
        >
          <div className="modal-animate max-w-md w-full p-5 sm:p-6 rounded-2xl relative my-auto max-h-[calc(100vh-2rem)] flex flex-col text-white">
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-white/10 shrink-0">
              <div className="w-10 h-10 rounded-xl bg-[#181818] border border-white/20 flex items-center justify-center text-white shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-sm text-white">
                  تعليق حساب: {selectedUserForSuspension.full_name}
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
              <button
                type="button"
                onClick={() => setSelectedUserForSuspension(null)}
                className="px-4 py-2 text-xs font-bold text-zinc-400 hover:bg-white/5 hover:text-white rounded-xl transition"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSuspendUser}
                className="px-4 py-2 btn-3d-primary text-black rounded-xl text-xs font-extrabold shadow-md transition"
              >
                تأكيد تعليق الحساب
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}