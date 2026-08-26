'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Shield, 
  Settings, 
  UserPlus, 
  Check, 
  Trash2, 
  Edit2,
  Edit3,
  Plus, 
  Sparkles, 
  Globe,
  Lock, 
  Unlock, 
  Crown, 
  Mic, 
  Trophy, 
  ExternalLink,
  AlertCircle,
  Loader2,
  CheckCircle2,
  ChevronDown,
  Upload,
  Image as ImageIcon,
  MapPin,
  Pipette,
  Palette
} from 'lucide-react';
import { SwordsIcon, TeamsIcon } from '@/components/icons/CustomIcons';
import { supabase } from '@/lib/supabase';
import { Team, TeamRole, TeamMember, TeamJoinRequest, TeamMatch } from '@/lib/types';
import { CustomSelect } from './CustomSelect';
import { GameSearchSelect } from './GameSearchSelect';
import { GameSearchInput } from './GameSearchInput';
import { TeamSearchSelect } from './TeamSearchSelect';
import { MatchScoreboardCard } from './MatchScoreboardCard';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { extractDominantColor } from '@/lib/colorExtractor';

interface TeamManagementModalProps {
  team: Team;
  teamColor?: string;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

function isLightColor(color: string): boolean {
  if (!color || !color.startsWith('#')) return false;
  const c = color.substring(1);
  const rgb = parseInt(c.length === 3 ? c.split('').map(x => x + x).join('') : c, 16);
  if (isNaN(rgb)) return false;
  const r = (rgb >> 16) & 0xff;
  const g = (rgb >> 8) & 0xff;
  const b = (rgb >> 0) & 0xff;
  const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luma > 160;
}

const PRESET_COLORS = [
  '#ef4444', // Red
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#3b82f6', // Blue
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#64748b', // Slate
  '#14b8a6', // Teal
];

const AVAILABLE_PERMISSIONS = [
  { id: 'manage_roster', label: 'إدارة التشكيلة وتعيين الرتب' },
  { id: 'accept_requests', label: 'قبول ورفض طلبات الانضمام' },
  { id: 'kick_members', label: 'طرد واستبعاد الأعضاء' },
  { id: 'manage_scrims', label: 'تنظيم وتسجيل السكريمات والمباريات' },
  { id: 'manage_messages', label: 'الوصول إلى رسائل الفريق والرد عليها' },
  { id: 'edit_team', label: 'تعديل قوانين وبيانات الفريق' },
];

const iraqiCities = [
  'أونلاين (بدون مقر فيزيائي)',
  'بغداد',
  'بابل',
  'أربيل',
  'البصرة',
  'السليمانية',
  'الموصل',
  'النجف',
  'كربلاء',
  'كركوك',
  'دهوك',
  'الأنبار',
  'ذي قار',
  'صلاح الدين',
  'ديالى',
  'ميسان',
  'المثنى',
  'القادسية',
  'واسط',
];

export function TeamManagementModal({
  team,
  teamColor,
  isOpen,
  onClose,
  onUpdate,
}: TeamManagementModalProps) {
  const [accentColor, setAccentColor] = useState<string>(teamColor || 'rgb(99, 102, 241)');

  useEffect(() => {
    if (teamColor) {
      setAccentColor(teamColor);
    } else if (team?.logo_url) {
      extractDominantColor(team.logo_url).then(setAccentColor);
    }
  }, [teamColor, team?.logo_url]);

  const [activeTab, setActiveTab] = useState<'profile' | 'rules' | 'roles' | 'roster' | 'requests' | 'matches'>('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Profile Edit State (First Section)
  const [teamName, setTeamName] = useState(team.name || '');
  const [teamTag, setTeamTag] = useState(team.tag || '');
  const [teamCity, setTeamCity] = useState(team.city || 'أونلاين (بدون مقر فيزيائي)');
  const [teamBio, setTeamBio] = useState(team.bio || '');
  const [teamGames, setTeamGames] = useState<string[]>(team.games || []);
  const [teamLogoUrl, setTeamLogoUrl] = useState(team.logo_url || '');
  const [teamBannerUrl, setTeamBannerUrl] = useState(team.banner_url || '');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string>('');

  // Rules & Settings state
  const [isExclusive, setIsExclusive] = useState(team.is_exclusive ?? true);
  const [recruitmentStatus, setRecruitmentStatus] = useState<string>(team.recruitment_status || 'open');
  const [minRank, setMinRank] = useState(team.min_rank || '');
  const [voiceRequired, setVoiceRequired] = useState(team.voice_chat_required ?? true);
  const [discordUrl, setDiscordUrl] = useState(team.discord_url || '');
  const [rulesList, setRulesList] = useState<string[]>(team.rules || []);
  const [newRuleInput, setNewRuleInput] = useState('');

  // Roles state
  const [roles, setRoles] = useState<TeamRole[]>([]);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleColor, setNewRoleColor] = useState('#3b82f6');
  const [newRolePermissions, setNewRolePermissions] = useState<string[]>([]);
  const [isCreatingRole, setIsCreatingRole] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);

  // Roster state
  const [members, setMembers] = useState<TeamMember[]>([]);

  // Requests state
  const [requests, setRequests] = useState<TeamJoinRequest[]>([]);

  // Matches state
  const [matches, setMatches] = useState<TeamMatch[]>([]);
  const [selectedOpponentTeam, setSelectedOpponentTeam] = useState<Team | null>(null);
  const [newMatchGame, setNewMatchGame] = useState(team.games?.[0] || 'Valorant');
  const [newMatchOurScore, setNewMatchOurScore] = useState<string | number>('13');
  const [newMatchOpponentScore, setNewMatchOpponentScore] = useState<string | number>('7');

  const [mounted, setMounted] = useState(false);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setBannerFile(file);
      setBannerPreview(URL.createObjectURL(file));
    }
  };

  const handleSaveProfile = async () => {
    if (!teamName.trim() || !teamTag.trim()) {
      setErrorMsg('يرجى إدخال اسم الفريق والتاغ');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      let finalLogoUrl = teamLogoUrl;
      if (logoFile) {
        finalLogoUrl = await uploadToCloudinary(logoFile);
      }

      let finalBannerUrl = teamBannerUrl;
      if (bannerFile) {
        finalBannerUrl = await uploadToCloudinary(bannerFile);
      }

      const { error } = await supabase
        .from('teams')
        .update({
          name: teamName.trim(),
          tag: teamTag.trim().toUpperCase(),
          city: teamCity,
          bio: teamBio.trim(),
          games: teamGames,
          logo_url: finalLogoUrl,
          banner_url: finalBannerUrl,
        })
        .eq('id', team.id);

      if (error) throw error;

      setTeamLogoUrl(finalLogoUrl);
      setTeamBannerUrl(finalBannerUrl);
      setLogoFile(null);
      setBannerFile(null);

      if (logoFile) {
        extractDominantColor(finalLogoUrl).then(setAccentColor);
      }

      setSuccessMsg('تم حفظ وتحديث هوية وبيانات الفريق بنجاح!');
      onUpdate();
    } catch (err: any) {
      console.error('Error saving team profile:', err);
      setErrorMsg(err.message || 'حدث خطأ أثناء حفظ هوية الفريق');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      loadTeamData();
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, team.id]);

  const loadTeamData = async () => {
    setIsLoading(true);
    try {
      // 1. Load Roles
      const { data: rolesData } = await supabase
        .from('team_roles')
        .select('*')
        .eq('team_id', team.id)
        .order('priority', { ascending: true });
      if (rolesData) setRoles(rolesData as TeamRole[]);

      // 2. Load Members
      const { data: membersData } = await supabase
        .from('team_members')
        .select(`
          *,
          user:profiles(*),
          role:team_roles(*)
        `)
        .eq('team_id', team.id);
      if (membersData) setMembers(membersData as TeamMember[]);

      // 3. Load Join Requests
      const { data: requestsData } = await supabase
        .from('team_join_requests')
        .select(`
          *,
          user:profiles(*)
        `)
        .eq('team_id', team.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      if (requestsData) setRequests(requestsData as TeamJoinRequest[]);

      // 4. Load Matches
      const { data: matchesData } = await supabase
        .from('team_matches')
        .select(`
          *,
          opponent_team:teams!team_matches_opponent_team_id_fkey(*)
        `)
        .eq('team_id', team.id)
        .order('match_date', { ascending: false });
      if (matchesData) setMatches(matchesData as TeamMatch[]);
    } catch (err) {
      console.error('Error loading team management data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted || !isOpen) return null;

  // Save Rules & General Settings
  const handleSaveSettings = async () => {
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const { error } = await supabase
        .from('teams')
        .update({
          is_exclusive: isExclusive,
          recruitment_status: recruitmentStatus,
          min_rank: minRank.trim(),
          voice_chat_required: voiceRequired,
          discord_url: discordUrl.trim(),
          rules: rulesList,
        })
        .eq('id', team.id);

      if (error) throw error;
      setSuccessMsg('تم حفظ قوانين وإعدادات الفريق بنجاح');
      onUpdate();
    } catch (err: any) {
      setErrorMsg(err.message || 'فشل حفظ الإعدادات');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddRule = () => {
    if (!newRuleInput.trim()) return;
    setRulesList([...rulesList, newRuleInput.trim()]);
    setNewRuleInput('');
  };

  const handleRemoveRule = (index: number) => {
    setRulesList(rulesList.filter((_, i) => i !== index));
  };

  // Save or Update Role
  const handleSaveRole = async () => {
    if (!newRoleName.trim()) return;
    setIsLoading(true);
    try {
      if (editingRoleId) {
        const { data: updatedRole, error } = await supabase
          .from('team_roles')
          .update({
            name: newRoleName.trim(),
            color: newRoleColor,
            permissions: newRolePermissions,
          })
          .eq('id', editingRoleId)
          .select('*')
          .single();

        if (error) throw error;
        if (updatedRole) {
          setRoles(roles.map(r => r.id === editingRoleId ? updatedRole as TeamRole : r));
          setSuccessMsg('تم تحديث الرتبة بنجاح');
        }
      } else {
        const { data: createdRole, error } = await supabase
          .from('team_roles')
          .insert({
            team_id: team.id,
            name: newRoleName.trim(),
            color: newRoleColor,
            permissions: newRolePermissions,
            priority: roles.length + 1,
          })
          .select('*')
          .single();

        if (error) throw error;
        if (createdRole) {
          setRoles([...roles, createdRole as TeamRole]);
          setSuccessMsg('تم إنشاء الرتبة بنجاح');
        }
      }
      setNewRoleName('');
      setNewRolePermissions([]);
      setIsCreatingRole(false);
      setEditingRoleId(null);
    } catch (err: any) {
      setErrorMsg(err.message || 'فشل حفظ الرتبة');
    } finally {
      setIsLoading(false);
    }
  };

  // Delete Role
  const handleDeleteRole = async (roleId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الرتبة؟')) return;
    try {
      await supabase.from('team_roles').delete().eq('id', roleId);
      setRoles(roles.filter((r) => r.id !== roleId));
      loadTeamData();
    } catch (err: any) {
      setErrorMsg(err.message || 'فشل حذف الرتبة');
    }
  };

  // Update Member Role / In-Game Title
  const handleUpdateMember = async (memberId: string, roleId: string | null, title: string, isStarter: boolean) => {
    try {
      const { error } = await supabase
        .from('team_members')
        .update({
          role_id: roleId,
          in_game_title: title,
          is_starter: isStarter,
        })
        .eq('id', memberId);

      if (error) throw error;
      loadTeamData();
      setSuccessMsg('تم تحديث بيانات العضو');
    } catch (err: any) {
      setErrorMsg(err.message || 'فشل تحديث العضو');
    }
  };

  // Kick Member
  const handleKickMember = async (member: TeamMember) => {
    if (!confirm(`هل أنت متأكد من طرد اللاعب ${member.user?.full_name || ''} من الفريق؟`)) return;
    try {
      await supabase.from('team_members').delete().eq('id', member.id);
      await supabase.from('profiles').update({ team_id: null, in_game_role: 'لاعب حر' }).eq('id', member.user_id);
      loadTeamData();
      onUpdate();
      setSuccessMsg('تم استبعاد اللاعب من الفريق');
    } catch (err: any) {
      setErrorMsg(err.message || 'فشل طرد اللاعب');
    }
  };

  // Accept Join Request
  const handleAcceptRequest = async (req: TeamJoinRequest) => {
    setIsLoading(true);
    try {
      // Find starter role
      const starterRole = roles.find((r) => r.name.includes('أساسي') || r.name.includes('Starter')) || roles[0];

      // 0. Remove from any previous teams to ensure exclusivity
      await supabase.from('team_members').delete().eq('user_id', req.user_id);

      // 1. Add to team_members
      await supabase.from('team_members').insert({
        team_id: team.id,
        user_id: req.user_id,
        role_id: starterRole ? starterRole.id : null,
        in_game_title: req.rank ? `لاعب (${req.rank})` : 'لاعب أساسي',
        is_starter: true,
      });

      // 2. Update profile team_id
      await supabase
        .from('profiles')
        .update({
          team_id: team.id,
          in_game_role: `عضو في ${team.name}`,
        })
        .eq('id', req.user_id);

      // 3. Mark request as accepted
      await supabase
        .from('team_join_requests')
        .update({ status: 'accepted' })
        .eq('id', req.id);

      // 4. Send notification
      await supabase.from('notifications').insert({
        user_id: req.user_id,
        type: 'general',
        title: `تم قبولك في فريق ${team.name}! 🎉`,
        description: `مبروك! وافقت إدارة ${team.name} على طلب انضمامك للتشكيلة الرسمية.`,
      });

      loadTeamData();
      onUpdate();
      setSuccessMsg('تم قبول اللاعب بنجاح وإضافته للتشكيلة');
    } catch (err: any) {
      setErrorMsg(err.message || 'فشل قبول الطلب');
    } finally {
      setIsLoading(false);
    }
  };

  // Reject Join Request
  const handleRejectRequest = async (reqId: string) => {
    try {
      await supabase
        .from('team_join_requests')
        .update({ status: 'rejected' })
        .eq('id', reqId);
      setRequests(requests.filter((r) => r.id !== reqId));
      setSuccessMsg('تم رفض الطلب');
    } catch (err: any) {
      setErrorMsg(err.message || 'فشل رفض الطلب');
    }
  };

  // Add Match Record with IEH opponent search & derived score
  const handleAddMatch = async () => {
    if (!selectedOpponentTeam) {
      setErrorMsg('يرجى البحث واختيار الفريق الخصم من بين أندية IEH المسجلة');
      return;
    }
    if (!newMatchGame || !newMatchGame.trim()) {
      setErrorMsg('يرجى اختيار اللعبة');
      return;
    }

    const ourNum = parseInt(newMatchOurScore.toString(), 10) || 0;
    const oppNum = parseInt(newMatchOpponentScore.toString(), 10) || 0;
    const computedResult: 'win' | 'loss' | 'draw' = ourNum > oppNum ? 'win' : ourNum < oppNum ? 'loss' : 'draw';
    const computedScore = `${ourNum} - ${oppNum}`;

    setIsLoading(true);
    setErrorMsg('');
    try {
      const { data: createdMatch, error } = await supabase
        .from('team_matches')
        .insert({
          team_id: team.id,
          opponent_team_id: selectedOpponentTeam.id,
          opponent_name: selectedOpponentTeam.name,
          opponent_logo: selectedOpponentTeam.logo_url || null,
          game: newMatchGame,
          our_score: ourNum,
          opponent_score: oppNum,
          score: computedScore,
          result: computedResult,
          match_date: new Date().toISOString(),
        })
        .select(`
          *,
          opponent_team:teams!team_matches_opponent_team_id_fkey(*)
        `)
        .single();

      if (error) throw error;
      if (createdMatch) {
        setMatches([createdMatch as TeamMatch, ...matches]);
        setSelectedOpponentTeam(null);
        setNewMatchOurScore('13');
        setNewMatchOpponentScore('7');
        setSuccessMsg('تم تسجيل نتيجة المباراة في سجل الفريق بنجاح');
        onUpdate();
      }
    } catch (err: any) {
      console.error('Error logging match:', err);
      setErrorMsg(err.message || 'فشل تسجيل نتيجة المباراة');
    } finally {
      setIsLoading(false);
    }
  };

  // Delete Match Record
  const handleDeleteMatch = async (matchId: string) => {
    if (!confirm('هل أنت متأكد من رغبتك في حذف نتيجة هذه المباراة نهائياً من السجل؟')) return;
    setIsLoading(true);
    try {
      const { error } = await supabase.from('team_matches').delete().eq('id', matchId);
      if (error) throw error;
      setMatches((prev) => prev.filter((m) => m.id !== matchId));
      setSuccessMsg('تم حذف المباراة من السجل');
      onUpdate();
    } catch (err: any) {
      setErrorMsg(err.message || 'فشل حذف المباراة');
    } finally {
      setIsLoading(false);
    }
  };

  return createPortal(
    <div 
      className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-4xl h-[680px] max-h-[90vh] modal-animate rounded-3xl flex flex-col overflow-hidden text-right text-white border border-white/15 shadow-[0_25px_60px_rgba(0,0,0,0.95)]"
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div 
          className="p-4 sm:p-5 text-white flex items-center justify-between border-b border-white/10 shrink-0 shadow-md relative overflow-hidden"
          style={{
            background: `linear-gradient(180deg, ${accentColor.replace('rgb', 'rgba').replace(')', ', 0.35)')} 0%, rgba(14, 14, 14, 0.98) 100%)`
          }}
        >
          {/* Top highlight bar */}
          <div 
            className="absolute top-0 left-0 right-0 h-[2px] opacity-80"
            style={{
              background: `linear-gradient(90deg, transparent 0%, ${accentColor} 50%, transparent 100%)`
            }}
          />

          <div className="flex items-center gap-3 relative z-10">
            <div className="w-11 h-11 rounded-2xl bg-black/80 p-1 border border-white/15 overflow-hidden flex items-center justify-center shrink-0 shadow-inner">
              <img
                src={team.logo_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100'}
                alt={team.name}
                className="w-full h-full object-cover rounded-xl"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-black text-white">
                  لوحة قيادة وإدارة فريق {team.name}
                </h2>
                <span className="px-2 py-0.5 rounded-md bg-white text-black text-[10px] font-mono font-extrabold shadow-xs">
                  [{team.tag}]
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                تحكم كامل في الرتب والصلاحيات، حصرية اللاعبين، وقبول طلبات الانضمام
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition relative z-10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Alerts */}

        {errorMsg && (
          <div className="px-5 py-2 bg-white/10 border-b border-white/20 text-white text-xs font-bold flex items-center justify-between shrink-0 shadow-sm">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <span>{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg('')} className="text-red-400 hover:text-red-200">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div 
          className="flex border-b border-white/10 px-4 sm:px-6 gap-1 sm:gap-2 overflow-x-auto shrink-0 shadow-inner no-scrollbar"
          style={{
            background: `linear-gradient(180deg, ${accentColor.replace('rgb', 'rgba').replace(')', ', 0.12)')} 0%, rgba(10, 10, 10, 0.98) 100%)`
          }}
        >
          <button
            onClick={() => setActiveTab('profile')}
            style={activeTab === 'profile' ? {
              borderColor: accentColor,
              backgroundColor: accentColor.replace('rgb', 'rgba').replace(')', ', 0.18)'),
              color: '#ffffff'
            } : undefined}
            className={`py-2.5 px-3.5 text-xs font-extrabold flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
              activeTab === 'profile'
                ? 'shadow-xs rounded-t-xl'
                : 'border-transparent text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Edit3 className="w-4 h-4" />
            <span>الملف التعريفي والهوية</span>
          </button>

          <button
            onClick={() => setActiveTab('rules')}
            style={activeTab === 'rules' ? {
              borderColor: accentColor,
              backgroundColor: accentColor.replace('rgb', 'rgba').replace(')', ', 0.18)'),
              color: '#ffffff'
            } : undefined}
            className={`py-2.5 px-3.5 text-xs font-extrabold flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
              activeTab === 'rules'
                ? 'shadow-xs rounded-t-xl'
                : 'border-transparent text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>القوانين والحصرية</span>
          </button>

          <button
            onClick={() => setActiveTab('roles')}
            style={activeTab === 'roles' ? {
              borderColor: accentColor,
              backgroundColor: accentColor.replace('rgb', 'rgba').replace(')', ', 0.18)'),
              color: '#ffffff'
            } : undefined}
            className={`py-2.5 px-3.5 text-xs font-extrabold flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
              activeTab === 'roles'
                ? 'shadow-xs rounded-t-xl'
                : 'border-transparent text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Crown className="w-4 h-4 text-white" />
            <span>الرتب والصلاحيات ({roles.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('roster')}
            style={activeTab === 'roster' ? {
              borderColor: accentColor,
              backgroundColor: accentColor.replace('rgb', 'rgba').replace(')', ', 0.18)'),
              color: '#ffffff'
            } : undefined}
            className={`py-2.5 px-3.5 text-xs font-extrabold flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
              activeTab === 'roster'
                ? 'shadow-xs rounded-t-xl'
                : 'border-transparent text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <TeamsIcon className="w-4 h-4" />
            <span>إدارة التشكيلة ({members.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('requests')}
            style={activeTab === 'requests' ? {
              borderColor: accentColor,
              backgroundColor: accentColor.replace('rgb', 'rgba').replace(')', ', 0.18)'),
              color: '#ffffff'
            } : undefined}
            className={`py-2.5 px-3.5 text-xs font-extrabold flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
              activeTab === 'requests'
                ? 'shadow-xs rounded-t-xl'
                : 'border-transparent text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>طلبات الانضمام</span>
            {requests.length > 0 && (
              <span className="px-1.5 py-0.2 bg-white text-black rounded-full text-[10px] font-extrabold shadow-xs">
                {requests.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('matches')}
            style={activeTab === 'matches' ? {
              borderColor: accentColor,
              backgroundColor: accentColor.replace('rgb', 'rgba').replace(')', ', 0.18)'),
              color: '#ffffff'
            } : undefined}
            className={`py-2.5 px-3.5 text-xs font-extrabold flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
              activeTab === 'matches'
                ? 'shadow-xs rounded-t-xl'
                : 'border-transparent text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <SwordsIcon className="w-4 h-4 text-white" />
            <span>سجل المباريات</span>
          </button>
        </div>

        {/* Modal Body / Tab Contents */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6 no-scrollbar">
          {/* TAB 0: PROFILE & IDENTITY (FIRST SECTION) */}
          {activeTab === 'profile' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-4 sm:p-5 rounded-2xl bg-[#141414] border border-white/15 space-y-4 shadow-sm">
                <div className="flex items-center gap-2 pb-2 border-b border-white/10">
                  <Sparkles className="w-4 h-4 text-white" />
                  <h4 className="text-xs font-black text-white">الهوية البصرية والبيانات الأساسية للفريق</h4>
                </div>

                {/* Team Name & Tag */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-zinc-300 mb-1">اسم الفريق الرسمي *</label>
                    <input
                      type="text"
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      placeholder="مثال: أسود الرافدين / GX eSports"
                      className="w-full text-xs p-2.5 rounded-xl input-3d text-white placeholder-zinc-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1">التاغ (TAG) *</label>
                    <input
                      type="text"
                      maxLength={5}
                      value={teamTag}
                      onChange={(e) => setTeamTag(e.target.value.toUpperCase())}
                      placeholder="مثال: GX"
                      className="w-full text-xs p-2.5 rounded-xl input-3d text-white placeholder-zinc-500 focus:outline-none font-mono font-bold text-center uppercase"
                      required
                    />
                  </div>
                </div>

                {/* City Selection */}
                <div>
                  <CustomSelect
                    label="المقر / المحافظة *"
                    value={teamCity}
                    onChange={setTeamCity}
                    options={iraqiCities}
                    icon={<MapPin className="w-4 h-4 text-zinc-400" />}
                  />
                </div>

                {/* Games Selection */}
                <div>
                  <GameSearchSelect
                    label="الألعاب والبطولات التنافسية المعتمدة للفريق:"
                    mode="multiple"
                    value={teamGames}
                    onChange={setTeamGames}
                    placeholder="ابحث عن ألعاب الفريق (مثل: Valorant, PUBG, CS2)..."
                  />
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">نبذة عن الفريق والأهداف:</label>
                  <textarea
                    value={teamBio}
                    onChange={(e) => setTeamBio(e.target.value)}
                    rows={3}
                    placeholder="اكتب نبذة تعريفية عن تاريخ الفريق وطموحاتكم في البطولات العراقية..."
                    className="w-full text-xs p-3 rounded-xl input-3d text-white placeholder-zinc-500 focus:outline-none resize-none leading-relaxed"
                  />
                </div>

                {/* Logo & Banner Uploads */}
                <div className="space-y-4 pt-3 border-t border-white/10">
                  {/* Logo Upload Section */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-2">شعار الفريق الرسمي (Logo):</label>
                    <div className="flex items-center gap-4 p-3 rounded-2xl bg-[#0c0c0c] border border-white/10">
                      {logoPreview || teamLogoUrl ? (
                        <img 
                          src={logoPreview || teamLogoUrl} 
                          alt="Logo preview" 
                          className="w-16 h-16 rounded-2xl object-cover border-2 border-white/20 shadow-md shrink-0 bg-black" 
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-2xl bg-black border-2 border-white/15 flex items-center justify-center text-zinc-400 shrink-0">
                          <Shield className="w-8 h-8" />
                        </div>
                      )}
                      <div className="flex-1 space-y-1">
                        <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl btn-3d-dark hover:border-white/30 text-xs font-bold text-white cursor-pointer transition">
                          <Upload className="w-4 h-4 text-white" />
                          <span>{logoPreview || teamLogoUrl ? 'تغيير الشعار الحالي' : 'رفع شعار الفريق'}</span>
                          <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                        </label>
                        <p className="text-[11px] text-zinc-400">يفضل صورة مربعة (1:1) بصيغة PNG أو JPG بدقة عالية</p>
                      </div>
                    </div>
                  </div>

                  {/* Banner Upload Section - Full Width & Proper Aspect Ratio */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-bold text-zinc-300">غلاف وبنر الفريق (Banner / Cover):</label>
                      {(bannerPreview || teamBannerUrl) && (
                        <label className="inline-flex items-center gap-1.5 text-xs text-zinc-300 hover:text-white font-bold cursor-pointer transition">
                          <Upload className="w-3.5 h-3.5" />
                          <span>استبدال الغلاف</span>
                          <input type="file" accept="image/*" onChange={handleBannerChange} className="hidden" />
                        </label>
                      )}
                    </div>

                    {bannerPreview || teamBannerUrl ? (
                      <div className="relative w-full h-36 sm:h-44 rounded-2xl overflow-hidden border border-white/20 shadow-md group bg-[#050505]">
                        <img 
                          src={bannerPreview || teamBannerUrl} 
                          alt="Banner preview" 
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
                        
                        <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 text-xs font-extrabold text-white cursor-pointer backdrop-blur-xs transition">
                          <Upload className="w-4 h-4" />
                          <span>تغيير صورة الغلاف</span>
                          <input type="file" accept="image/*" onChange={handleBannerChange} className="hidden" />
                        </label>

                        <div className="absolute bottom-3 right-3 text-[11px] font-bold text-white/90 bg-black/70 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-white/10 pointer-events-none">
                          معاينة الغلاف الرسمي للفريق
                        </div>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center gap-2 p-6 rounded-2xl border-2 border-dashed border-white/20 hover:border-white/40 bg-[#0c0c0c] hover:bg-white/5 cursor-pointer transition group">
                        <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-white group-hover:scale-110 transition">
                          <ImageIcon className="w-6 h-6 text-zinc-300" />
                        </div>
                        <div className="text-center space-y-0.5">
                          <span className="text-xs font-bold text-white">انقر هنا لرفع غلاف أو بنر الفريق الرسمي</span>
                          <p className="text-[11px] text-zinc-400">يفضل استخدام أبعاد عريضة بدقة عالية (مثل 1200×400 أو 1920×600)</p>
                        </div>
                        <input type="file" accept="image/*" onChange={handleBannerChange} className="hidden" />
                      </label>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 1: RULES & EXCLUSIVITY */}
          {activeTab === 'rules' && (
            <div className="space-y-6">
              {/* Exclusivity Lock Box */}
              <div className="p-4 sm:p-5 rounded-2xl border border-white/20 bg-[#141414] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm font-black text-white">
                    <Lock className="w-4 h-4 text-white" />
                    <span>قانون الحصرية والالتزام التام (Exclusivity Rule)</span>
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed font-normal">
                    عند تفعيل هذا الخيار، يُمنع أي عضو في الفريق من الانضمام لفرق أخرى في نفس الوقت، وتعتبر عضويته رسمية وحصرية لـ [{team.tag}].
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={isExclusive}
                    onChange={(e) => setIsExclusive(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-[#1e1e1e] border border-white/20 peer-focus:outline-none rounded-full peer peer-checked:bg-white peer-checked:border-white transition-colors duration-200 after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-zinc-400 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:bg-black"></div>
                </label>
              </div>

              {/* Recruitment & Prerequisites */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <CustomSelect
                  label="حالة التقديم والتجارب:"
                  value={recruitmentStatus}
                  onChange={setRecruitmentStatus}
                  options={[
                    { value: 'open', label: 'مفتوح للجميع (Open Tryouts)' },
                    { value: 'invite_only', label: 'بالدعوة فقط (Invite Only)' },
                    { value: 'closed', label: 'مغلق حالياً (Closed)' },
                  ]}
                />

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                    الحد الأدنى للرتبة (Min Rank):
                  </label>
                  <input
                    type="text"
                    value={minRank}
                    onChange={(e) => setMinRank(e.target.value)}
                    placeholder="مثال: Immortal 2 / Conqueror"
                    className="w-full text-xs p-2.5 rounded-xl input-3d text-white placeholder-zinc-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                    رابط ديسكورد الفريق:
                  </label>
                  <input
                    type="url"
                    value={discordUrl}
                    onChange={(e) => setDiscordUrl(e.target.value)}
                    placeholder="https://discord.gg/..."
                    className="w-full text-xs p-2.5 rounded-xl input-3d text-white placeholder-zinc-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Voice Chat Toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#080808] border border-white/10 shadow-inner">
                <div className="flex items-center gap-2 text-xs font-bold text-zinc-200">
                  <Mic className="w-4 h-4 text-white" />
                  <span>اشتراط وجود مايك وتواصل صوتي واضح أثناء التدريب</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={voiceRequired}
                    onChange={(e) => setVoiceRequired(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-[#1e1e1e] border border-white/20 peer-focus:outline-none rounded-full peer peer-checked:bg-white peer-checked:border-white transition-colors duration-200 after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-zinc-400 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:bg-black"></div>
                </label>
              </div>

              {/* Dynamic Rules List */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-zinc-200">
                  بنود وقوانين الفريق المخصصة:
                </label>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newRuleInput}
                    onChange={(e) => setNewRuleInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddRule()}
                    placeholder="أضف بنداً جديداً (مثال: عدم الغياب عن التمارين بدون عذر مسبق)..."
                    className="flex-1 text-xs p-2.5 rounded-xl input-3d text-white placeholder-zinc-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddRule}
                    className="px-4 py-2.5 btn-3d-dark text-white rounded-xl text-xs font-bold flex items-center gap-1 transition shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إضافة بند</span>
                  </button>
                </div>

                <div className="space-y-2 pt-2">
                  {rulesList.map((rule, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-xl bg-[#0c0c0c] border border-white/10 text-xs font-semibold text-zinc-200 shadow-sm group"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-white text-black flex items-center justify-center text-[10px] font-extrabold font-mono shadow-xs">
                          {idx + 1}
                        </span>
                        <span>{rule}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveRule(idx)}
                        className="p-1 text-zinc-400 hover:text-white transition"
                        title="حذف هذا البند"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DISCORD-LIKE ROLES & PERMISSIONS */}
          {activeTab === 'roles' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs sm:text-sm font-extrabold text-white">
                    رتب الفريق والصلاحيات (Discord-like Roles)
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    أنشئ رتباً مخصصة مع شارات وحدد صلاحيات كل رتبة في الفريق
                  </p>
                </div>
                {!isCreatingRole && (
                  <button
                    onClick={() => {
                      setNewRoleName('');
                      setNewRoleColor('#ef4444');
                      setNewRolePermissions([]);
                      setEditingRoleId(null);
                      setIsCreatingRole(true);
                    }}
                    className="px-3.5 py-2 btn-3d-primary text-black rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition"
                  >
                    <Plus className="w-4 h-4 text-black" />
                    <span>إنشاء رتبة جديدة</span>
                  </button>
                )}
              </div>

              {/* Create Role Form */}
              {isCreatingRole && (
                <div className="p-4 sm:p-5 rounded-2xl border border-white/20 bg-[#121212] space-y-4 shadow-sm animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-white">
                      {editingRoleId ? 'تعديل الرتبة:' : 'تفاصيل الرتبة الجديدة:'}
                    </h4>
                    <button
                      onClick={() => {
                        setIsCreatingRole(false);
                        setEditingRoleId(null);
                      }}
                      className="text-zinc-400 hover:text-white text-xs"
                    >
                      إلغاء
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-zinc-300 mb-1">اسم الرتبة:</label>
                      <input
                        type="text"
                        value={newRoleName}
                        onChange={(e) => setNewRoleName(e.target.value)}
                        placeholder="مثال: مدرب / Coach أو كابتن هجوم"
                        className="w-full text-xs p-2.5 rounded-xl input-3d text-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-300 mb-1">لون الشارة والرتبة:</label>
                      <div className="flex items-center gap-2 flex-wrap pt-1">
                        {/* 1. Custom Color Picker (First Option) */}
                        <div
                          className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center relative cursor-pointer transition-all overflow-hidden ${
                            !PRESET_COLORS.includes(newRoleColor)
                              ? 'scale-110 ring-2 ring-white ring-offset-2 ring-offset-black shadow-md border-0'
                              : 'bg-[#202020] hover:bg-[#2c2c2c] border border-white/30 hover:scale-105 shadow-xs'
                          }`}
                          style={!PRESET_COLORS.includes(newRoleColor) ? { backgroundColor: newRoleColor } : undefined}
                          title="تخصيص لون إضافي (Custom Color)"
                        >
                          <Pipette 
                            className={`w-3.5 h-3.5 pointer-events-none transition-colors ${
                              !PRESET_COLORS.includes(newRoleColor)
                                ? isLightColor(newRoleColor)
                                  ? 'text-black stroke-[2.5]'
                                  : 'text-white stroke-[2.5]'
                                : 'text-zinc-200 stroke-[2]'
                            }`} 
                          />
                          <input
                            type="color"
                            value={newRoleColor}
                            onChange={(e) => setNewRoleColor(e.target.value)}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            title="اختر لوناً مخصصاً"
                          />
                        </div>

                        {/* 2. Preset Swatches */}
                        {PRESET_COLORS.map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setNewRoleColor(c)}
                            className={`w-7 h-7 rounded-lg shrink-0 transition-all ${
                              newRoleColor === c
                                ? 'scale-110 ring-2 ring-white ring-offset-2 ring-offset-black shadow-md'
                                : 'hover:scale-105 border border-white/15'
                            }`}
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-2">صلاحيات الرتبة:</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {AVAILABLE_PERMISSIONS.map((perm) => {
                        const hasPerm = newRolePermissions.includes(perm.id);
                        return (
                          <label
                            key={perm.id}
                            className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition ${
                              hasPerm ? 'bg-white text-black font-extrabold shadow-xs' : 'bg-[#080808] border-white/10 text-zinc-300'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={hasPerm}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setNewRolePermissions([...newRolePermissions, perm.id]);
                                } else {
                                  setNewRolePermissions(newRolePermissions.filter((p) => p !== perm.id));
                                }
                              }}
                              className="w-4 h-4 text-black rounded bg-transparent border-white/20 accent-black"
                            />
                            <span className="text-xs">{perm.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={handleSaveRole}
                      disabled={isLoading}
                      className="px-5 py-2 btn-3d-primary text-black rounded-xl text-xs font-extrabold transition"
                    >
                      {editingRoleId ? 'حفظ التعديلات' : 'حفظ وإنشاء الرتبة'}
                    </button>
                  </div>
                </div>
              )}

              {/* Roles List */}
              <div className="space-y-2.5">
                {roles.map((role) => (
                  <div
                    key={role.id}
                    className="flex items-center justify-between p-3.5 rounded-2xl border shadow-sm transition group"
                    style={{
                      background: `linear-gradient(135deg, ${role.color || '#ef4444'}26 0%, ${role.color || '#ef4444'}0d 60%, rgba(10, 10, 10, 0.96) 100%)`,
                      borderColor: `${role.color || '#ef4444'}45`,
                      boxShadow: `0 4px 20px -2px ${role.color || '#ef4444'}18`,
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                        style={{ backgroundColor: role.color, boxShadow: `0 0 10px ${role.color}80` }}
                      />
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-2">
                          <span>{role.name}</span>
                          <span
                            className="px-2 py-0.5 rounded-md text-[10px] font-extrabold text-white shadow-xs"
                            style={{ backgroundColor: role.color }}
                          >
                            شارة
                          </span>
                        </div>
                        <div className="text-[10px] text-zinc-300 mt-0.5">
                          {role.permissions.length > 0
                            ? `الصلاحيات: ${role.permissions
                                .map((p) => AVAILABLE_PERMISSIONS.find((ap) => ap.id === p)?.label)
                                .filter(Boolean)
                                .join(' • ')}`
                            : 'لا توجد صلاحيات إدارية (رتبة شرفية / تشكيلة)'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setNewRoleName(role.name);
                          setNewRoleColor(role.color);
                          setNewRolePermissions(role.permissions);
                          setEditingRoleId(role.id);
                          setIsCreatingRole(true);
                          setActiveTab('roles');
                        }}
                        className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-white/10 transition"
                        title="تعديل الرتبة"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteRole(role.id)}
                        className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-white/10 transition"
                        title="حذف الرتبة"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: ROSTER MANAGEMENT */}
          {activeTab === 'roster' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs sm:text-sm font-extrabold text-white">
                    التشكيلة الرسمية والرتب الممنوحة ({members.length} عضو)
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    عين الرتب، مراكز اللعب (IGL, Sniper, Entry Fragger)، واللاعبين الأساسيين والاحتياط
                  </p>
                </div>
              </div>

              <div className="space-y-2.5">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="p-3.5 rounded-2xl border border-white/10 bg-[#0c0c0c] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={member.user?.avatar_url || 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=100'}
                        alt={member.user?.full_name || ''}
                        className="w-11 h-11 rounded-xl object-cover border border-white/10 shadow-sm"
                      />
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-2">
                          <span>{member.user?.full_name}</span>
                          <span className="text-[11px] text-zinc-400 font-normal">@{member.user?.username}</span>
                          {member.role && (
                            <span
                              className="px-2 py-0.5 rounded-md text-[10px] font-extrabold text-white shadow-xs"
                              style={{ backgroundColor: member.role.color || '#ffffff' }}
                            >
                              {member.role.name}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-zinc-400 font-medium mt-0.5 flex items-center gap-2">
                          <span>المركز: {member.in_game_title || 'لاعب'}</span>
                          <span>•</span>
                          <span className={member.is_starter ? 'text-white font-bold' : 'text-zinc-500'}>
                            {member.is_starter ? 'أساسي (Starter)' : 'بديل (Bench)'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Member Action Controls */}
                    <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                      {/* Role Select */}
                      <select
                        value={member.role_id || ''}
                        onChange={(e) =>
                          handleUpdateMember(
                            member.id,
                            e.target.value || null,
                            member.in_game_title,
                            member.is_starter
                          )
                        }
                        className="text-xs p-2 rounded-xl input-3d font-bold text-white outline-none"
                      >
                        <option value="">-- بدون رتبة --</option>
                        {roles.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name}
                          </option>
                        ))}
                      </select>

                      {/* Position Title Input */}
                      <input
                        type="text"
                        defaultValue={member.in_game_title}
                        onBlur={(e) =>
                          handleUpdateMember(
                            member.id,
                            member.role_id || null,
                            e.target.value,
                            member.is_starter
                          )
                        }
                        placeholder="المركز (IGL, Sniper...)"
                        className="w-28 text-xs p-2 rounded-xl input-3d text-white placeholder-zinc-500 focus:outline-none"
                      />

                      {/* Starter Toggle */}
                      <button
                        type="button"
                        onClick={() =>
                          handleUpdateMember(
                            member.id,
                            member.role_id || null,
                            member.in_game_title,
                            !member.is_starter
                          )
                        }
                        className={`px-2.5 py-2 rounded-xl text-xs font-bold transition ${
                          member.is_starter
                            ? 'bg-white text-black shadow-xs font-extrabold'
                            : 'btn-3d-dark text-zinc-400'
                        }`}
                        title="تبديل أساسي / احتياط"
                      >
                        {member.is_starter ? 'أساسي' : 'بديل'}
                      </button>

                      {/* Kick Member */}
                      {member.user_id !== team.captain_id && (
                        <button
                          type="button"
                          onClick={() => handleKickMember(member)}
                          className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-xl transition"
                          title="طرد واستبعاد من الفريق"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: JOIN REQUESTS QUEUE */}
          {activeTab === 'requests' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xs sm:text-sm font-extrabold text-white">
                  طلبات الانضمام وتجارب الأداء المعلقة ({requests.length})
                </h3>
                <p className="text-[11px] text-zinc-400">
                  راجع رتب وإحصائيات اللاعبين المتقدمين للانضمام وقرر قبولهم أو رفضهم
                </p>
              </div>

              {requests.length === 0 ? (
                <div className="p-10 text-center rounded-2xl border border-dashed border-white/10 bg-[#080808]">
                  <UserPlus className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                  <p className="text-xs text-zinc-400 font-bold">لا توجد طلبات انضمام جديدة حالياً</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {requests.map((req) => (
                    <div
                      key={req.id}
                      className="p-4 rounded-2xl border border-white/10 bg-[#0c0c0c] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm"
                    >
                      <div className="flex items-start gap-3">
                        <img
                          src={req.user?.avatar_url || 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=100'}
                          alt={req.user?.full_name || ''}
                          className="w-12 h-12 rounded-xl object-cover border border-white/10 shrink-0 shadow-sm"
                        />
                        <div className="space-y-1">
                          <div className="text-xs font-bold text-white flex items-center gap-2">
                            <span>{req.user?.full_name}</span>
                            <span className="text-[11px] text-zinc-400">@{req.user?.username}</span>
                            <span className="px-2 py-0.5 bg-white/15 text-white border border-white/20 rounded text-[10px] font-bold">
                              {req.game || 'لعبة تنافسية'}
                            </span>
                          </div>
                          <div className="text-[11px] text-zinc-400 flex items-center gap-3">
                            <span>الـ ID داخل اللعبة: <strong className="text-white font-mono">{req.in_game_id}</strong></span>
                            <span>•</span>
                            <span>الرتبة: <strong className="text-white">{req.rank}</strong></span>
                          </div>
                          {req.message && (
                            <p className="text-xs text-zinc-300 bg-[#080808] p-2.5 rounded-xl border border-white/10 mt-2 leading-relaxed">
                              &quot;{req.message}&quot;
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleAcceptRequest(req)}
                          disabled={isLoading}
                          className="px-4 py-2 btn-3d-primary text-black rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition"
                        >
                          <Check className="w-4 h-4" />
                          <span>قبول في التشكيلة</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRejectRequest(req.id)}
                          disabled={isLoading}
                          className="px-3.5 py-2 btn-3d-dark text-zinc-300 hover:text-white rounded-xl text-xs font-bold transition"
                        >
                          رفض
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: MATCHES & SCRIMS LOGGER */}
          {activeTab === 'matches' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xs sm:text-sm font-extrabold text-white flex items-center gap-2">
                  <SwordsIcon className="w-4 h-4 text-white" />
                  <span>سجل المباريات والسكريمات</span>
                </h3>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  سجل تاريخ مباريات الفريق ضد الأندية والفرق المسجلة في شبكة IEH
                </p>
              </div>

              {/* Log Match Form */}
              <div className="p-4 sm:p-5 rounded-3xl border border-white/15 bg-[#101010] space-y-4 shadow-md">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <h4 className="text-xs font-black text-white flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-white" />
                    <span>تسجيل نتيجة مباراة جديدة</span>
                  </h4>
                  <span className="text-[10px] text-zinc-400 font-mono font-bold">
                    لوحة تسجيل المباريات
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Opponent Selection (Must be in IEH) */}
                  <div>
                    <TeamSearchSelect
                      label="الفريق الخصم (من أندية IEH) *"
                      value={selectedOpponentTeam?.id}
                      onSelect={setSelectedOpponentTeam}
                      excludeTeamId={team.id}
                      placeholder="ابحث عن اسم أو تاغ الفريق الخصم..."
                    />
                  </div>

                  {/* Game Search Input (Same height and styling) */}
                  <div>
                    <GameSearchInput
                      label="اللعبة *"
                      value={newMatchGame}
                      onChange={(val) => setNewMatchGame(val)}
                      placeholder="ابحث عن اللعبة أو اكتب اسمها..."
                    />
                  </div>
                </div>

                {/* Symmetrically Centered Scoreboard Inputs */}
                <div className="p-4 sm:p-5 rounded-2xl bg-[#080808] border border-white/10 space-y-3">
                  <div className="text-[11px] font-mono font-bold text-zinc-400 text-center tracking-widest uppercase">
                    النتيجة النهائية للمباراة (Final Score)
                  </div>
                  
                  <div className="flex items-center justify-between gap-4 max-w-xl mx-auto w-full">
                    {/* Home Team (Right side in RTL) - exactly 1/2 of remaining space */}
                    <div className="flex-1 w-0 min-w-0 flex items-center justify-end gap-2 text-right">
                      <div className="truncate">
                        <div className="text-xs sm:text-sm font-black text-white truncate">{team.name}</div>
                        <div className="text-[10px] font-mono text-zinc-400 font-bold">[{team.tag}]</div>
                      </div>
                    </div>

                    {/* Center Score Inputs (Strictly Centered Shrink-0) */}
                    <div className="shrink-0 flex items-center justify-center gap-2 sm:gap-3">
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={newMatchOurScore}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 3);
                          setNewMatchOurScore(val);
                        }}
                        className="w-14 h-12 text-center text-xl font-black font-mono rounded-xl bg-black border border-white/20 text-white focus:outline-none focus:border-white p-0 m-0 shadow-inner flex items-center justify-center leading-none"
                      />
                      <span className="text-xl font-black text-zinc-500 font-mono select-none px-1">:</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={newMatchOpponentScore}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 3);
                          setNewMatchOpponentScore(val);
                        }}
                        className="w-14 h-12 text-center text-xl font-black font-mono rounded-xl bg-black border border-white/20 text-white focus:outline-none focus:border-white p-0 m-0 shadow-inner flex items-center justify-center leading-none"
                      />
                    </div>

                    {/* Opponent Team (Left side in RTL) - exactly 1/2 of remaining space */}
                    <div className="flex-1 w-0 min-w-0 flex items-center justify-start gap-2 text-left">
                      <div className="truncate">
                        <div className="text-xs sm:text-sm font-black text-white truncate">
                          {selectedOpponentTeam ? selectedOpponentTeam.name : 'الخصم'}
                        </div>
                        <div className="text-[10px] font-mono text-zinc-400 font-bold">
                          [{selectedOpponentTeam ? selectedOpponentTeam.tag : 'IEH'}]
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={handleAddMatch}
                    disabled={isLoading || !selectedOpponentTeam}
                    className="px-6 py-2.5 btn-3d-primary text-black rounded-xl text-xs font-extrabold flex items-center gap-2 transition disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin text-black" /> : <Plus className="w-4 h-4 text-black stroke-[3]" />}
                    <span>توثيق وإضافة النتيجة لسجل الفريق</span>
                  </button>
                </div>
              </div>

              {/* Matches History List */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <h4 className="text-xs font-black text-white">
                    سجل المباريات الموثقة ({matches.length})
                  </h4>
                  <span className="text-[10px] text-zinc-500 font-mono font-bold">
                    ترتيب تنازلي حسب التاريخ
                  </span>
                </div>

                {matches.length === 0 ? (
                  <div className="p-10 text-center rounded-3xl border border-dashed border-white/10 bg-[#080808] text-zinc-500 text-xs">
                    <SwordsIcon className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                    <p className="font-bold">لم يتم تسجيل نتائج مباريات سابقة بعد.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {matches.map((m) => (
                      <MatchScoreboardCard
                        key={m.id}
                        match={m}
                        currentTeam={team}
                        onDelete={handleDeleteMatch}
                        canManage={true}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-[#0a0a0a] border-t border-white/10 flex items-center justify-between shrink-0 shadow-inner">
          {activeTab === 'profile' && (
            <button
              type="button"
              onClick={handleSaveProfile}
              disabled={isLoading}
              className="px-6 py-2.5 btn-3d-primary text-black rounded-xl text-xs font-extrabold flex items-center gap-2 transition disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              <span>حفظ بيانات وهوية الفريق</span>
            </button>
          )}

          {activeTab === 'rules' && (
            <button
              type="button"
              onClick={handleSaveSettings}
              disabled={isLoading}
              className="px-6 py-2.5 btn-3d-primary text-black rounded-xl text-xs font-extrabold flex items-center gap-2 transition disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              <span>حفظ التغييرات والقوانين</span>
            </button>
          )}

          <div className="text-xs text-zinc-400 font-medium">
            تحديثات التشكيلة والهوية فورية على صفحة الفريق الرسمية
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 btn-3d-dark text-white rounded-xl text-xs font-bold transition"
          >
            إلغاء / إغلاق
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
