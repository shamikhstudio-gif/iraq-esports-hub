'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
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
  AlertCircle
} from 'lucide-react';
import { TeamsIcon, MessagesIcon, SwordsIcon } from '@/components/icons/CustomIcons';
import { supabase } from '@/lib/supabase';
import { Team, TeamRole, TeamMember, TeamMatch, Post, Profile } from '@/lib/types';
import { PostCard } from '@/components/PostCard';
import { TeamManagementModal } from '@/components/TeamManagementModal';
import { ApplyToTeamModal } from '@/components/ApplyToTeamModal';
import { MatchScoreboardCard } from '@/components/MatchScoreboardCard';
import { extractDominantColor } from '@/lib/colorExtractor';

export default function TeamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const teamId = params?.id as string;

  const [team, setTeam] = useState<Team | null>(null);
  const [teamColor, setTeamColor] = useState<string>('rgb(99, 102, 241)');
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
        if (teamData.logo_url) {
          extractDominantColor(teamData.logo_url).then((c) => setTeamColor(c));
        }
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
    return <div className="card-clean p-12 text-center text-xs text-slate-400 bg-[#0f172a] border-slate-800">جاري تحميل بيانات وهوية الفريق...</div>;
  }

  if (!team) {
    return <div className="card-clean p-12 text-center text-xs text-slate-400 bg-[#0f172a] border-slate-800">لم يتم العثور على هذا الفريق.</div>;
  }

  // Permission helper: Check if user is Captain or has Manager permissions
  const isCaptain = currentUser?.id === team.captain_id;
  const currentMember = members.find((m) => m.user_id === currentUser?.id);
  const isManager = isCaptain || (currentMember?.role?.permissions && currentMember.role.permissions.includes('manage_roster'));
  const isMember = !!currentMember;

  return (
    <div className="relative min-h-[calc(100vh-4rem)]">
      {/* Top-to-Bottom Ambient Team Color Gradient (Extended Deep Length) */}
      <div 
        className="fixed top-0 left-0 right-0 h-[1200px] pointer-events-none z-0 transition-opacity duration-1000 ease-out"
        style={{
          background: `radial-gradient(ellipse 110% 75% at 50% -10%, ${teamColor.replace('rgb', 'rgba').replace(')', ', 0.45)')} 0%, ${teamColor.replace('rgb', 'rgba').replace(')', ', 0.20)')} 40%, ${teamColor.replace('rgb', 'rgba').replace(')', ', 0.06)')} 75%, rgba(0,0,0,0) 100%)`
        }}
      />
      <div 
        className="fixed top-0 left-0 right-0 h-[900px] pointer-events-none z-0 opacity-50 transition-opacity duration-1000 ease-out"
        style={{
          background: `linear-gradient(180deg, ${teamColor.replace('rgb', 'rgba').replace(')', ', 0.28)')} 0%, ${teamColor.replace('rgb', 'rgba').replace(')', ', 0.10)')} 60%, rgba(0,0,0,0) 100%)`
        }}
      />

      <div className="max-w-5xl mx-auto py-4 space-y-6 text-right relative z-10" dir="rtl">
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
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-bold shadow-xs transition"
            >
              <span>ديسكورد الفريق</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>

        {actionMsg && (
          <div className="p-4 rounded-2xl bg-white text-black text-xs font-bold flex items-center justify-between animate-in fade-in shadow-sm">
            <span>{actionMsg}</span>
            <button onClick={() => setActionMsg('')} className="text-black font-extrabold hover:underline">
              إغلاق
            </button>
          </div>
        )}

        {/* Main Team Header Card */}
        <div 
          className="card-3d overflow-hidden text-white transition-all duration-500"
          style={{
            boxShadow: `0 20px 40px -15px rgba(0, 0, 0, 0.9), 0 0 35px -10px ${teamColor.replace('rgb', 'rgba').replace(')', ', 0.25)')}`
          }}
        >
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
            <span className="px-3 py-1 rounded-xl bg-black/90 backdrop-blur text-white text-xs font-mono font-extrabold border border-white/20 shadow-md">
              [{team.tag}]
            </span>
            {team.is_exclusive && (
              <span className="px-3 py-1 rounded-xl bg-white text-black backdrop-blur text-xs font-extrabold flex items-center gap-1 shadow-md">
                <Lock className="w-3 h-3" />
                <span>عضوية حصرية</span>
              </span>
            )}
          </div>

          <div className="absolute top-4 left-4">
            <span
              className={`px-3 py-1 rounded-xl text-xs font-extrabold backdrop-blur shadow-md ${
                team.recruitment_status === 'open'
                  ? 'bg-white text-black'
                  : team.recruitment_status === 'invite_only'
                  ? 'bg-white/20 text-white border border-white/20'
                  : 'bg-black/80 text-zinc-400 border border-white/10'
              }`}
            >
              {team.recruitment_status === 'open'
                ? 'التجارب مفتوحة'
                : team.recruitment_status === 'invite_only'
                ? 'بالدعوة فقط'
                : 'التقديم مغلق'}
            </span>
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
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover border-4 border-black shadow-[0_10px_25px_rgba(0,0,0,0.9)] bg-black shrink-0"
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
                <button
                  type="button"
                  onClick={() => setIsManagementOpen(true)}
                  className="px-4 py-2.5 btn-3d-primary text-black rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition"
                >
                  <Settings className="w-4 h-4 text-black" />
                  <span>لوحة إدارة الفريق</span>
                </button>
              )}

              {/* Player Apply Button */}
              {!isMember && team.recruitment_status !== 'closed' && (
                <button
                  type="button"
                  onClick={() => setIsApplyOpen(true)}
                  className="px-4 py-2.5 btn-3d-primary text-black rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition"
                >
                  <UserPlus className="w-4 h-4 text-black" />
                  <span>تقديم طلب انضمام</span>
                </button>
              )}

              {/* Leave Team Button */}
              {isMember && !isCaptain && (
                <button
                  type="button"
                  onClick={handleLeaveTeam}
                  className="px-3.5 py-2.5 btn-3d-dark hover:border-white/30 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <LogOut className="w-4 h-4" />
                  <span>مغادرة الفريق</span>
                </button>
              )}

              {/* Message Team Button */}
              {isMember ? (
                <Link
                  href={`/messages?targetTeamId=${team.id}`}
                  className="px-4 py-2.5 btn-3d-dark text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <MessagesIcon className="w-4 h-4" />
                  <span>غرفة شات الفريق</span>
                </Link>
              ) : (
                <Link
                  href={`/messages?targetTeamId=${team.id}`}
                  className="px-4 py-2.5 btn-3d-dark text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <MessagesIcon className="w-4 h-4" />
                  <span>مراسلة الفريق</span>
                </Link>
              )}
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
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-xl bg-[#080808] border border-white/15 text-[11px] font-bold text-white flex items-center gap-1.5 shrink-0 shadow-sm"
                  >
                    <span>{ach.title}</span>
                    <span className="text-zinc-400 font-mono text-[10px]">[{ach.year}]</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex bg-[#080808] border border-white/10 shadow-inner rounded-2xl p-1.5 gap-1 sm:gap-2">
        <button
          onClick={() => setActiveTab('roster')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition ${
            activeTab === 'roster'
              ? 'bg-white text-black shadow-sm'
              : 'text-zinc-400 hover:bg-white/5 hover:text-white'
          }`}
        >
          <TeamsIcon className="w-4 h-4" />
          <span>التشكيلة والرتب ({members.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('rules')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition ${
            activeTab === 'rules'
              ? 'bg-white text-black shadow-sm'
              : 'text-zinc-400 hover:bg-white/5 hover:text-white'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>القوانين والشروط</span>
        </button>

        <button
          onClick={() => setActiveTab('matches')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition ${
            activeTab === 'matches'
              ? 'bg-white text-black shadow-sm'
              : 'text-zinc-400 hover:bg-white/5 hover:text-white'
          }`}
        >
          <SwordsIcon className="w-4 h-4" />
          <span>سجل المباريات ({matches.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('feed')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition ${
            activeTab === 'feed'
              ? 'bg-white text-black shadow-sm'
              : 'text-zinc-400 hover:bg-white/5 hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>المنشورات ({posts.length})</span>
        </button>
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
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold text-white shadow-xs"
                          style={{ backgroundColor: member.role.color || '#ef4444' }}
                        >
                          {member.role.name}
                        </span>
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
          teamColor={teamColor}
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