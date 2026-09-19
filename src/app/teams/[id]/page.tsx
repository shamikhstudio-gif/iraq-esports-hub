'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from '@/lib/navigation';
import Link from '@/lib/navigation';
import { 
  Shield, 
  Trophy, 
  MapPin, 
  CheckCircle2, 
  ArrowRight, 
  Lock, 
  Unlock, 
  Crown, 
  Settings, 
  UserPlus, 
  Mic, 
  ExternalLink,
  LogOut,
  Calendar,
  Sparkles,
  Gamepad2,
  FileText,
  AlertCircle,
  MessageSquare
} from 'lucide-react';
import { TeamsIcon, MessagesIcon, SwordsIcon } from '@/components/icons/CustomIcons';
import { supabase } from '@/lib/supabase';
import { Team, TeamRole, TeamMember, TeamMatch, Post, Profile } from '@/lib/types';
import { PostCard } from '@/components/PostCard';
import { TeamManagementModal } from '@/components/TeamManagementModal';
import { ApplyToTeamModal } from '@/components/ApplyToTeamModal';
import { MatchScoreboardCard } from '@/components/MatchScoreboardCard';
import { Button, Badge, Card } from '@/components/ui';

export default function TeamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const teamId = params?.id as string;

  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [roles, setRoles] = useState<TeamRole[]>([]);
  const [matches, setMatches] = useState<TeamMatch[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<'roster' | 'rules' | 'matches' | 'feed'>('roster');
  const [isManagementOpen, setIsManagementOpen] = useState(false);
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [actionMsg, setActionMsg] = useState('');

  useEffect(() => {
    if (teamId) {
      fetchTeamData();
      fetchCurrentUser();
    }
  }, [teamId]);

  const fetchCurrentUser = async () => {
    const savedUserId = typeof window !== 'undefined' ? localStorage.getItem('babylon_user_id') : null;
    if (!savedUserId) {
      setCurrentUser(null);
      return;
    }
    const { data } = await supabase.from('profiles').select('*').eq('id', savedUserId).single();
    if (data) setCurrentUser(data as Profile);
  };

  const fetchTeamData = async (silent = false) => {
    if (!teamId) return;
    if (!silent) setIsLoading(true);
    try {
      // 1. Fetch Team Core Info
      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .select('*')
        .eq('id', teamId)
        .single();

      if (teamData) {
        setTeam(teamData as Team);
      }

      // 2. Fetch Roles
      const { data: rolesData } = await supabase
        .from('team_roles')
        .select('*')
        .eq('team_id', teamId)
        .order('priority', { ascending: true });
      if (rolesData) setRoles(rolesData as TeamRole[]);

      // 3. Fetch Members with profiles and roles
      const { data: membersData } = await supabase
        .from('team_members')
        .select(`
          *,
          user:profiles(*),
          role:team_roles(*)
        `)
        .eq('team_id', teamId);
      if (membersData) setMembers(membersData as TeamMember[]);

      // 4. Fetch Matches
      const { data: matchesData } = await supabase
        .from('team_matches')
        .select(`
          *,
          opponent_team:teams!team_matches_opponent_team_id_fkey(*)
        `)
        .eq('team_id', teamId)
        .order('match_date', { ascending: false });
      if (matchesData) setMatches(matchesData as TeamMatch[]);

      // 5. Fetch Posts
      const { data: postsData } = await supabase
        .from('posts')
        .select(`
          *,
          author:profiles!posts_author_id_fkey(*)
        `)
        .eq('team_id', teamId)
        .order('created_at', { ascending: false });
      if (postsData) setPosts(postsData as Post[]);
    } catch (err) {
      console.error('Error fetching team hub data:', err);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  // Leave Team handler
  const handleLeaveTeam = async () => {
    if (!currentUser) return;
    if (!confirm(`هل أنت متأكد من مغادرة فريق ${team?.name}؟`)) return;

    try {
      await supabase
        .from('team_members')
        .delete()
        .eq('team_id', teamId)
        .eq('user_id', currentUser.id);

      await supabase
        .from('profiles')
        .update({ team_id: null, in_game_role: 'لاعب حر' })
        .eq('id', currentUser.id);

      fetchTeamData();
      fetchCurrentUser();
      setActionMsg('لقد غادرت الفريق بنجاح.');
    } catch (err: any) {
      alert(err.message || 'حدث خطأ أثناء مغادرة الفريق');
    }
  };

  if (isLoading) {
    return <div className="card-clean p-12 text-center text-xs text-zinc-400 bg-[#0a0a0a] border-white/15">جاري تحميل بيانات وهوية الفريق...</div>;
  }

  if (!team) {
    return <div className="card-clean p-12 text-center text-xs text-zinc-400 bg-[#0a0a0a] border-white/15">لم يتم العثور على هذا الفريق.</div>;
  }

  // Permission helper: Check if user is Captain or has Manager permissions
  const isCaptain = currentUser?.id === team.captain_id;
  const currentMember = members.find((m) => m.user_id === currentUser?.id);
  const isManager = isCaptain || (currentMember?.role?.permissions && currentMember.role.permissions.includes('manage_roster'));
  const isMember = !!currentMember;

  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-black">
      <div className="layout-container py-4 space-y-6 text-right relative z-10" dir="rtl">
        {/* Back Link */}
        <div className="flex items-center justify-between">
          <Link href="/teams" className="inline-flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-white transition">
            <ArrowRight className="w-4 h-4" />
            <span>العودة لدليل الأندية والفرق العراقية</span>
          </Link>

          {team.discord_url && (
            <a
              href={team.discord_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="secondary" size="xs" icon={<ExternalLink className="w-3.5 h-3.5" />}>
                <span>ديسكورد الفريق</span>
              </Button>
            </a>
          )}
        </div>

        {actionMsg && (
          <div className="p-4 rounded-2xl bg-white text-black text-xs font-bold flex items-center justify-between animate-in fade-in shadow-sm">
            <span>{actionMsg}</span>
            <button onClick={() => setActionMsg('')} className="text-black font-extrabold hover:underline cursor-pointer">
              إغلاق
            </button>
          </div>
        )}

        {/* Main Team Header Card */}
        <Card variant="elevated" className="overflow-hidden text-white transition-all duration-500 shadow-2xl p-0">
          {/* Banner */}
          <div className="h-48 sm:h-64 relative bg-[#050505]">
            <img
              src={team.banner_url || 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1200'}
              alt={team.name}
              className="w-full h-full object-cover opacity-50"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

            {/* Top Badges */}
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <Badge variant="solid" size="sm">
                [{team.tag}]
              </Badge>
              {team.is_exclusive && (
                <Badge variant="solid" size="sm" icon={<Lock className="w-3 h-3 text-black" />}>
                  <span>عضوية حصرية</span>
                </Badge>
              )}
            </div>

            <div className="absolute top-4 left-4">
              <Badge
                variant={team.recruitment_status === 'open' ? 'solid' : 'default'}
                size="sm"
              >
                {team.recruitment_status === 'open'
                  ? 'التجارب مفتوحة'
                  : team.recruitment_status === 'invite_only'
                  ? 'بالدعوة فقط'
                  : 'التقديم مغلق'}
              </Badge>
            </div>
          </div>

          {/* Profile Info & Actions */}
          <div className="p-6 pt-0 relative">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between -mt-12 sm:-mt-16 mb-4 gap-4">
              {/* Logo & Titles */}
              <div className="flex items-end gap-4">
                <img
                  src={team.logo_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200'}
                  alt={team.name}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover border-4 border-black shadow-sm bg-black shrink-0"
                />
                <div className="mb-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl sm:text-2xl font-black text-white">
                      {team.name}
                    </h1>
                    {team.is_verified && <CheckCircle2 className="w-5 h-5 text-white shrink-0" />}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-zinc-400 font-semibold flex-wrap">
                    <span className="flex items-center gap-1 text-zinc-300">
                      <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                      {team.city}
                    </span>
                    <span>•</span>
                    <span>{members.length} أعضاء مسجلين</span>
                    {team.games && team.games.length > 0 && (
                      <>
                        <span>•</span>
                        <span className="text-white font-extrabold">{team.games.join(' • ')}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                {/* Captain / Manager Console Button */}
                {isManager && (
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<Settings className="w-4 h-4 text-black" />}
                    onClick={() => setIsManagementOpen(true)}
                  >
                    <span>لوحة إدارة الفريق</span>
                  </Button>
                )}

                {/* Player Apply Button */}
                {!isMember && team.recruitment_status !== 'closed' && (
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<UserPlus className="w-4 h-4 text-black" />}
                    onClick={() => setIsApplyOpen(true)}
                  >
                    <span>تقديم طلب انضمام</span>
                  </Button>
                )}

                {/* Leave Team Button */}
                {isMember && !isCaptain && (
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<LogOut className="w-4 h-4" />}
                    onClick={handleLeaveTeam}
                  >
                    <span>مغادرة الفريق</span>
                  </Button>
                )}

                {/* Message Team Button */}
                <Link href={`/messages?targetTeamId=${team.id}`}>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<MessagesIcon className="w-4 h-4" />}
                  >
                    <span>{isMember ? 'غرفة شات الفريق' : 'مراسلة الفريق'}</span>
                  </Button>
                </Link>
              </div>
            </div>

            {/* Bio */}
            {team.bio && (
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed max-w-3xl mb-4 font-normal">
                {team.bio}
              </p>
            )}

            {/* Achievements */}
            {team.achievements && team.achievements.length > 0 && (
              <div className="border-t border-white/10 pt-3 flex items-center gap-2 overflow-x-auto">
                <Trophy className="w-4 h-4 text-white shrink-0" />
                <span className="text-xs font-bold text-zinc-300 shrink-0">الإنجازات:</span>
                <div className="flex gap-2">
                  {team.achievements.map((ach, idx) => (
                    <Badge key={idx} variant="default" size="xs">
                      <span>{ach.title}</span>
                      <span className="text-zinc-400 font-mono text-[10px]">[{ach.year}]</span>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Tabs Navigation */}
        <div className="flex bg-[#080808] border border-white/10 shadow-inner rounded-2xl p-1.5 gap-1 sm:gap-2">
          <Button
            variant={activeTab === 'roster' ? 'primary' : 'ghost'}
            size="sm"
            className="flex-1"
            icon={<TeamsIcon className="w-4 h-4" />}
            onClick={() => setActiveTab('roster')}
          >
            <span>التشكيلة والرتب ({members.length})</span>
          </Button>

          <Button
            variant={activeTab === 'rules' ? 'primary' : 'ghost'}
            size="sm"
            className="flex-1"
            icon={<Shield className="w-4 h-4" />}
            onClick={() => setActiveTab('rules')}
          >
            <span>القوانين والشروط</span>
          </Button>

          <Button
            variant={activeTab === 'matches' ? 'primary' : 'ghost'}
            size="sm"
            className="flex-1"
            icon={<SwordsIcon className="w-4 h-4" />}
            onClick={() => setActiveTab('matches')}
          >
            <span>سجل المباريات ({matches.length})</span>
          </Button>

          <Button
            variant={activeTab === 'feed' ? 'primary' : 'ghost'}
            size="sm"
            className="flex-1"
            icon={<FileText className="w-4 h-4" />}
            onClick={() => setActiveTab('feed')}
          >
            <span>المنشورات ({posts.length})</span>
          </Button>
        </div>

      {/* TAB CONTENT 1: ROSTER WITH DISCORD ROLES */}
      {activeTab === 'roster' && (
        <div className="space-y-6">
          <div className="card-3d p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <Crown className="w-4 h-4 text-white" />
                  <span>التشكيلة الرسمية والرتب الممنوحة</span>
                </h3>
                <p className="text-xs text-zinc-400">
                  جميع لاعبي وكوادر الفريق مصنفين بالرتب ومراكز اللعب
                </p>
              </div>

              {isManager && (
                <button
                  type="button"
                  onClick={() => setIsManagementOpen(true)}
                  className="text-xs font-extrabold text-white hover:underline"
                >
                  تعديل الرتب والتشكيلة ←
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="p-4 rounded-2xl border border-white/10 bg-[#0c0c0c] hover:border-white/20 transition flex items-center gap-3.5 shadow-sm"
                >
                  <Link href={`/profile/${member.user?.username}`} className="shrink-0">
                    <img
                      src={member.user?.avatar_url || 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150'}
                      alt={member.user?.full_name || ''}
                      className="w-12 h-12 rounded-2xl object-cover border border-white/15 shadow-sm"
                    />
                  </Link>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Link
                        href={`/profile/${member.user?.username}`}
                        className="text-xs font-extrabold text-white hover:underline transition truncate"
                      >
                        {member.user?.full_name}
                      </Link>
                      {member.user?.is_verified && <CheckCircle2 className="w-3.5 h-3.5 text-white shrink-0" />}
                    </div>

                    {/* Discord Role Badge */}
                    {member.role ? (
                      <div className="mt-1">
                        <Badge size="xs" color={member.role.color || '#ffffff'}>
                          {member.role.name}
                        </Badge>
                      </div>
                    ) : (
                      <div className="text-[10px] text-zinc-500 mt-1">عضو في الفريق</div>
                    )}

                    <div className="text-[11px] text-zinc-400 font-medium mt-1 flex items-center gap-1.5">
                      <span className="font-semibold text-zinc-300">{member.in_game_title || 'لاعب'}</span>
                      <span>•</span>
                      <span className={member.is_starter ? 'text-white font-bold' : 'text-zinc-500'}>
                        {member.is_starter ? 'أساسي' : 'بديل'}
                      </span>
                    </div>
                  </div>

                  {/* Direct Message button */}
                  {member.user?.id && member.user.id !== currentUser?.id && (
                    <Link
                      href={`/messages?recipientId=${member.user.id}`}
                      className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition shrink-0"
                      title={`مراسلة ${member.user?.full_name}`}
                    >
                      <MessageSquare className="w-4 h-4" />
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: TEAM RULES & POLICIES */}
      {activeTab === 'rules' && (
        <div className="space-y-4">
          <div className="card-3d p-6 space-y-6 text-white">
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-white" />
                <span>قوانين وشروط الالتزام في الفريق</span>
              </h3>
              <p className="text-xs text-zinc-400">
                الشروط والبنود الرسمية المحددة من قبل كابتن وإدارة الفريق
              </p>
            </div>

            {/* Exclusivity Box */}
            <div className="p-4 rounded-2xl border border-white/20 bg-[#141414] space-y-1.5 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-black text-white">
                <Lock className="w-4 h-4 text-white" />
                <span>بند الحصرية والتعاقد الرسمي:</span>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed font-normal">
                {team.is_exclusive
                  ? 'هذا الفريق يطبق نظام العضوية الحصرية. يُحظر على جميع أعضاء التشكيلة اللعب مع أي فريق آخر في البطولات والسكريمات أثناء فترة تواجدهم في الفريق.'
                  : 'الفريق يسمح للاعبين بالمشاركة المفتوحة واللعب مع فرق أخرى بالتنسيق مع الكابتن.'}
              </p>
            </div>

            {/* Prerequisites */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-[#080808] border border-white/10 flex items-center gap-3 shadow-inner">
                <Trophy className="w-5 h-5 text-white shrink-0" />
                <div>
                  <div className="text-xs font-bold text-zinc-300">الحد الأدنى للرتبة المطلوبة:</div>
                  <div className="text-xs font-extrabold text-white mt-0.5">
                    {team.min_rank || 'مفتوح لجميع المستويات'}
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#080808] border border-white/10 flex items-center gap-3 shadow-inner">
                <Mic className="w-5 h-5 text-white shrink-0" />
                <div>
                  <div className="text-xs font-bold text-zinc-300">التواصل الصوتي والمايك:</div>
                  <div className="text-xs font-extrabold text-zinc-400 mt-0.5">
                    {team.voice_chat_required ? 'إلزامي أثناء التمارين والبطولات' : 'اختياري'}
                  </div>
                </div>
              </div>
            </div>

            {/* Dynamic Rules List */}
            <div className="space-y-2 pt-2">
              <h4 className="text-xs font-bold text-white">البنود والقوانين الداخلية:</h4>
              {team.rules && team.rules.length > 0 ? (
                <div className="space-y-2">
                  {team.rules.map((rule, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-[#080808] border border-white/10 text-xs font-semibold text-zinc-300 flex items-center gap-3 shadow-inner"
                    >
                      <span className="w-6 h-6 rounded-full bg-white text-black flex items-center justify-center text-xs font-extrabold shrink-0 font-mono shadow-sm">
                        {idx + 1}
                      </span>
                      <span>{rule}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-xs text-zinc-400">لا توجد قوانين خاصة مضافة بعد.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: SCRIMS & MATCH HISTORY */}
      {activeTab === 'matches' && (
        <div className="space-y-4">
          <div className="card-3d p-6 space-y-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <SwordsIcon className="w-4 h-4 text-white" />
                  <span>سجل نتائج وتحديات الفريق الرسمية</span>
                </h3>
                <p className="text-xs text-zinc-400">
                  تاريخ المباريات والسكريمات ضد الفرق العراقية الأخرى
                </p>
              </div>

              {isManager && (
                <button
                  type="button"
                  onClick={() => setIsManagementOpen(true)}
                  className="text-xs font-extrabold text-white hover:underline"
                >
                  + تسجيل مباراة جديدة
                </button>
              )}
            </div>

            {matches.length === 0 ? (
              <div className="p-10 text-center rounded-3xl border border-dashed border-white/10 bg-[#080808]">
                <SwordsIcon className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                <p className="text-xs text-zinc-400 font-bold">لم يتم تسجيل نتائج مباريات رسمية بعد.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {matches.map((m) => (
                  <MatchScoreboardCard
                    key={m.id}
                    match={m}
                    currentTeam={team}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT 4: TEAM FEED */}
      {activeTab === 'feed' && (
        <div className="space-y-4">
          {posts.length === 0 ? (
            <div className="card-3d p-12 text-center text-xs text-zinc-400">
              <MessagesIcon className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
              <span>لا توجد منشورات أو إعلانات مسجلة باسم هذا الفريق حتى الآن.</span>
            </div>
          ) : (
            posts.map((post) => <PostCard key={post.id} post={post} />)
          )}
        </div>
      )}

      {/* Captain / Manager Console Modal */}
      {isManagementOpen && (
        <TeamManagementModal
          team={team}
          isOpen={isManagementOpen}
          onClose={() => setIsManagementOpen(false)}
          onUpdate={() => {
            fetchTeamData(true);
            fetchCurrentUser();
          }}
        />
      )}

      {/* Player Apply Modal */}
      {isApplyOpen && (
        <ApplyToTeamModal
          team={team}
          isOpen={isApplyOpen}
          onClose={() => setIsApplyOpen(false)}
          onSuccess={() => {
            setActionMsg('تم إرسال طلب الانضمام إلى كابتن الفريق بنجاح!');
          }}
        />
      )}
    </div>
  </div>
  );
}