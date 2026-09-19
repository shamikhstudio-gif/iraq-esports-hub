'use client';

import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  UserPlus, 
  Check, 
  Edit3,
  Crown, 
  Loader2,
  Radio
} from 'lucide-react';
import { SwordsIcon, TeamsIcon } from '@/components/icons/CustomIcons';
import { supabase } from '@/lib/supabase';
import { Team, TeamRole, TeamMember, TeamJoinRequest, TeamMatch, DiscordWebhookChannel } from '@/lib/types';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { extractDominantColor } from '@/lib/colorExtractor';
import { dispatchRosterUpdateDiscord } from '@/lib/discordDispatcher';
import { Modal, ScrollableTabs, TabItem, Button, Badge } from '@/components/ui';

import { TeamProfileTab } from './teams/tabs/TeamProfileTab';
import { TeamRulesTab } from './teams/tabs/TeamRulesTab';
import { TeamRolesTab } from './teams/tabs/TeamRolesTab';
import { TeamRosterTab } from './teams/tabs/TeamRosterTab';
import { TeamRequestsTab } from './teams/tabs/TeamRequestsTab';
import { TeamMatchesTab } from './teams/tabs/TeamMatchesTab';
import { TeamDiscordTab } from './teams/tabs/TeamDiscordTab';

interface TeamManagementModalProps {
  team: Team;
  teamColor?: string;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export function TeamManagementModal({
  team,
  teamColor,
  isOpen,
  onClose,
  onUpdate,
}: TeamManagementModalProps) {
  const [accentColor, setAccentColor] = useState<string>('#ffffff');

  const [activeTab, setActiveTab] = useState<'profile' | 'rules' | 'roles' | 'roster' | 'requests' | 'matches' | 'discord'>('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Profile Edit State
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
  const [newRoleColor, setNewRoleColor] = useState('#ffffff');
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

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      loadTeamData();
    }
  }, [isOpen, team.id]);

  const loadTeamData = async () => {
    setIsLoading(true);
    try {
      const [rolesRes, membersRes, requestsRes, matchesRes] = await Promise.all([
        supabase.from('team_roles').select('*').eq('team_id', team.id).order('priority', { ascending: true }),
        supabase.from('team_members').select('*, user:profiles(*), role:team_roles(*)').eq('team_id', team.id),
        supabase.from('team_join_requests').select('*, user:profiles(*)').eq('team_id', team.id).eq('status', 'pending'),
        supabase.from('team_matches').select('*').eq('team_id', team.id).order('match_date', { ascending: false }),
      ]);

      if (rolesRes.data) setRoles(rolesRes.data as TeamRole[]);
      if (membersRes.data) setMembers(membersRes.data as TeamMember[]);
      if (requestsRes.data) setRequests(requestsRes.data as TeamJoinRequest[]);
      if (matchesRes.data) setMatches(matchesRes.data as TeamMatch[]);
    } catch (err: unknown) {
      console.error('Error loading team data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBannerFile(file);
      setBannerPreview(URL.createObjectURL(file));
    }
  };

  const handleSaveProfile = async () => {
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      let finalLogoUrl = teamLogoUrl;
      let finalBannerUrl = teamBannerUrl;

      if (logoFile) {
        finalLogoUrl = await uploadToCloudinary(logoFile);
      }
      if (bannerFile) {
        finalBannerUrl = await uploadToCloudinary(bannerFile);
      }

      const { error } = await supabase
        .from('teams')
        .update({
          name: teamName,
          tag: teamTag,
          city: teamCity,
          bio: teamBio,
          games: teamGames,
          logo_url: finalLogoUrl,
          banner_url: finalBannerUrl,
        })
        .eq('id', team.id);

      if (error) throw error;

      setSuccessMsg('تم حفظ وتحديث بيانات الفريق بنجاح');
      onUpdate();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'فشل حفظ بيانات الفريق');
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
          min_rank: minRank,
          voice_chat_required: voiceRequired,
          discord_url: discordUrl,
          rules: rulesList,
        })
        .eq('id', team.id);

      if (error) throw error;

      setSuccessMsg('تم حفظ قوانين وإعدادات الفريق بنجاح');
      onUpdate();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'فشل حفظ الإعدادات');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveRole = async () => {
    if (!newRoleName.trim()) {
      setErrorMsg('يرجى كتابة اسم الرتبة');
      return;
    }

    setIsLoading(true);
    try {
      if (editingRoleId) {
        const { error } = await supabase
          .from('team_roles')
          .update({
            name: newRoleName,
            color: newRoleColor,
            permissions: newRolePermissions,
          })
          .eq('id', editingRoleId);
        if (error) throw error;
        setSuccessMsg('تم تعديل الرتبة بنجاح');
      } else {
        const { error } = await supabase.from('team_roles').insert({
          team_id: team.id,
          name: newRoleName,
          color: newRoleColor,
          permissions: newRolePermissions,
          priority: roles.length + 1,
        });
        if (error) throw error;
        setSuccessMsg('تم إنشاء الرتبة بنجاح');
      }

      setNewRoleName('');
      setNewRolePermissions([]);
      setIsCreatingRole(false);
      setEditingRoleId(null);
      loadTeamData();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'فشل حفظ الرتبة');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الرتبة؟')) return;
    setIsLoading(true);
    try {
      const { error } = await supabase.from('team_roles').delete().eq('id', roleId);
      if (error) throw error;
      setSuccessMsg('تم حذف الرتبة');
      loadTeamData();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'فشل حذف الرتبة');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateMember = async (memberId: string, roleId: string | null, inGameTitle: string, isStarter: boolean) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('team_members')
        .update({
          role_id: roleId,
          is_starter: isStarter,
          in_game_title: inGameTitle,
        })
        .eq('id', memberId);

      if (error) throw error;
      setSuccessMsg('تم تحديث بيانات العضو');
      loadTeamData();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'فشل تحديث العضو');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKickMember = async (member: TeamMember) => {
    if (!confirm('هل أنت متأكد من طرد هذا العضو من الفريق؟')) return;
    setIsLoading(true);
    try {
      await supabase.from('team_members').delete().eq('id', member.id);
      await supabase.from('profiles').update({ team_id: null, in_game_role: null }).eq('id', member.user_id);
      setSuccessMsg('تم إزالة العضو من الفريق');
      loadTeamData();
      onUpdate();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'فشل طرد العضو');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptRequest = async (req: TeamJoinRequest) => {
    setIsLoading(true);
    try {
      const starterRole = roles.find((r) => r.name.includes('أساسي') || r.name.includes('Starter')) || roles[0];
      await supabase.from('team_members').delete().eq('user_id', req.user_id);
      await supabase.from('team_members').insert({
        team_id: team.id,
        user_id: req.user_id,
        role_id: starterRole ? starterRole.id : null,
        in_game_title: req.rank ? `لاعب (${req.rank})` : 'لاعب أساسي',
        is_starter: true,
      });

      await supabase
        .from('profiles')
        .update({
          team_id: team.id,
          in_game_role: `عضو في ${team.name}`,
        })
        .eq('id', req.user_id);

      await supabase.from('team_join_requests').update({ status: 'accepted' }).eq('id', req.id);

      await supabase.from('notifications').insert({
        user_id: req.user_id,
        type: 'general',
        title: `تم قبولك في فريق ${team.name}!`,
        description: `مبروك! وافقت إدارة ${team.name} على طلب انضمامك للتشكيلة الرسمية.`,
      });

      // Dispatch Discord Roster update embed
      dispatchRosterUpdateDiscord(
        team,
        req.user?.full_name || req.user?.username || 'لاعب جديد',
        starterRole?.name || 'لاعب أساسي',
        'joined'
      ).catch(console.error);

      loadTeamData();
      onUpdate();
      setSuccessMsg('تم قبول اللاعب بنجاح وإضافته للتشكيلة');
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'فشل قبول الطلب');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRejectRequest = async (reqId: string) => {
    try {
      await supabase.from('team_join_requests').update({ status: 'rejected' }).eq('id', reqId);
      setRequests(requests.filter((r) => r.id !== reqId));
      setSuccessMsg('تم رفض الطلب');
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'فشل رفض الطلب');
    }
  };

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
        .select('*')
        .single();

      if (error) throw error;

      if (createdMatch) {
        setMatches([createdMatch as TeamMatch, ...matches]);
      }

      setSuccessMsg('تمت إضافة المباراة إلى السجل وتحديث الإحصائيات');
      setSelectedOpponentTeam(null);
      onUpdate();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'فشل تسجيل المباراة');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteMatch = async (matchId: string) => {
    if (!confirm('هل أنت متأكد من رغبتك في حذف نتيجة هذه المباراة نهائياً من السجل؟')) return;
    setIsLoading(true);
    try {
      const { error } = await supabase.from('team_matches').delete().eq('id', matchId);
      if (error) throw error;
      setMatches((prev) => prev.filter((m) => m.id !== matchId));
      setSuccessMsg('تم حذف المباراة من السجل');
      onUpdate();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'فشل حذف المباراة');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveWebhooks = async (newWebhooks: DiscordWebhookChannel[]) => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const { error } = await supabase
        .from('teams')
        .update({ discord_webhooks: newWebhooks })
        .eq('id', team.id);

      if (error) throw error;
      team.discord_webhooks = newWebhooks;
      setSuccessMsg('تم حفظ وتحديث قنوات الديسكورد بنجاح');
      onUpdate();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'فشل حفظ قنوات الديسكورد');
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted || !isOpen) return null;

  const tabsList: TabItem[] = [
    { id: 'profile', label: 'الملف التعريفي والهوية', icon: <Edit3 className="w-4 h-4 text-white" /> },
    { id: 'rules', label: 'القوانين والحصرية', icon: <Shield className="w-4 h-4 text-white" /> },
    { id: 'roles', label: 'الرتب والصلاحيات', icon: <Crown className="w-4 h-4 text-white" />, badge: roles.length },
    { id: 'roster', label: 'إدارة التشكيلة', icon: <TeamsIcon className="w-4 h-4 text-white" />, badge: members.length },
    { id: 'requests', label: 'طلبات الانضمام', icon: <UserPlus className="w-4 h-4 text-white" />, badge: requests.length > 0 ? requests.length : undefined },
    { id: 'matches', label: 'سجل المباريات', icon: <SwordsIcon className="w-4 h-4 text-white" /> },
    { id: 'discord', label: 'ربط ديسكورد', icon: <Radio className="w-4 h-4 text-white" />, badge: team.discord_webhooks?.length || undefined },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="3xl"
      fixedHeight={true}
      title={
        <div className="flex items-center gap-2">
          <span>لوحة قيادة وإدارة فريق {team.name}</span>
          <Badge variant="solid" size="sm" className="font-mono font-extrabold">
            [{team.tag}]
          </Badge>
        </div>
      }
      subtitle="تحكم كامل في الرتب والصلاحيات، حصرية اللاعبين، قنوات الديسكورد، وقبول طلبات الانضمام"
      icon={
        <img
          src={team.logo_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100'}
          alt={team.name}
          className="w-full h-full object-cover rounded-xl"
        />
      }
      accentColor={accentColor}
      statusNotice={
        errorMsg
          ? { type: 'error', message: errorMsg }
          : successMsg
          ? { type: 'success', message: successMsg }
          : null
      }
      subHeader={
        <ScrollableTabs
          tabs={tabsList}
          activeTab={activeTab}
          onChange={(id) => setActiveTab(id as any)}
          accentColor={accentColor}
        />
      }
      footer={
        <div className="w-full min-h-[44px] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {activeTab === 'profile' && (
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={handleSaveProfile}
                isLoading={isLoading}
                icon={<Check className="w-4 h-4 stroke-[3]" />}
                className="font-black"
              >
                حفظ بيانات وهوية الفريق
              </Button>
            )}

            {activeTab === 'rules' && (
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={handleSaveSettings}
                isLoading={isLoading}
                icon={<Check className="w-4 h-4 stroke-[3]" />}
                className="font-black"
              >
                حفظ التغييرات والقوانين
              </Button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] text-zinc-500 font-medium hidden sm:inline">
              تحديثات التشكيلة فورية على صفحة الفريق الرسمية
            </span>
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={onClose}
              className="font-bold"
            >
              إلغاء / إغلاق
            </Button>
          </div>
        </div>
      }
    >
      <div key={activeTab} className="animate-in fade-in duration-150">
        {/* Tab Panels */}
        {activeTab === 'profile' && (
          <TeamProfileTab
            teamName={teamName}
            setTeamName={setTeamName}
            teamTag={teamTag}
            setTeamTag={setTeamTag}
            teamCity={teamCity}
            setTeamCity={setTeamCity}
          teamBio={teamBio}
          setTeamBio={setTeamBio}
          teamGames={teamGames}
          setTeamGames={setTeamGames}
          teamLogoUrl={teamLogoUrl}
          logoPreview={logoPreview}
          teamBannerUrl={teamBannerUrl}
          bannerPreview={bannerPreview}
          handleLogoChange={handleLogoChange}
          handleBannerChange={handleBannerChange}
        />
      )}

      {activeTab === 'rules' && (
        <TeamRulesTab
          team={team}
          isExclusive={isExclusive}
          setIsExclusive={setIsExclusive}
          recruitmentStatus={recruitmentStatus}
          setRecruitmentStatus={setRecruitmentStatus}
          minRank={minRank}
          setMinRank={setMinRank}
          discordUrl={discordUrl}
          setDiscordUrl={setDiscordUrl}
          voiceRequired={voiceRequired}
          setVoiceRequired={setVoiceRequired}
          rulesList={rulesList}
          newRuleInput={newRuleInput}
          setNewRuleInput={setNewRuleInput}
          handleAddRule={handleAddRule}
          handleRemoveRule={handleRemoveRule}
        />
      )}

      {activeTab === 'roles' && (
        <TeamRolesTab
          roles={roles}
          isCreatingRole={isCreatingRole}
          setIsCreatingRole={setIsCreatingRole}
          newRoleName={newRoleName}
          setNewRoleName={setNewRoleName}
          newRoleColor={newRoleColor}
          setNewRoleColor={setNewRoleColor}
          newRolePermissions={newRolePermissions}
          setNewRolePermissions={setNewRolePermissions}
          editingRoleId={editingRoleId}
          setEditingRoleId={setEditingRoleId}
          handleSaveRole={handleSaveRole}
          handleDeleteRole={handleDeleteRole}
          isLoading={isLoading}
        />
      )}

      {activeTab === 'roster' && (
        <TeamRosterTab
          team={team}
          members={members}
          roles={roles}
          handleUpdateMember={handleUpdateMember}
          handleKickMember={handleKickMember}
        />
      )}

      {activeTab === 'requests' && (
        <TeamRequestsTab
          requests={requests}
          handleAcceptRequest={handleAcceptRequest}
          handleRejectRequest={handleRejectRequest}
          isLoading={isLoading}
        />
      )}

      {activeTab === 'matches' && (
        <TeamMatchesTab
          team={team}
          matches={matches}
          selectedOpponentTeam={selectedOpponentTeam}
          setSelectedOpponentTeam={setSelectedOpponentTeam}
          newMatchGame={newMatchGame}
          setNewMatchGame={setNewMatchGame}
          newMatchOurScore={newMatchOurScore}
          setNewMatchOurScore={setNewMatchOurScore}
          newMatchOpponentScore={newMatchOpponentScore}
          setNewMatchOpponentScore={setNewMatchOpponentScore}
          handleAddMatch={handleAddMatch}
          handleDeleteMatch={handleDeleteMatch}
          isLoading={isLoading}
        />
      )}

      {activeTab === 'discord' && (
        <TeamDiscordTab
          team={team}
          onSaveWebhooks={handleSaveWebhooks}
          isLoading={isLoading}
        />
      )}
      </div>
    </Modal>
  );
}
