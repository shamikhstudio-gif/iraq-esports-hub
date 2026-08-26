'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Swords, 
  CheckCircle2, 
  Copy, 
  Check, 
  ExternalLink, 
  Shield, 
  Trophy, 
  AlertTriangle, 
  Loader2, 
  Ban, 
  Flame, 
  Lock, 
  Radio, 
  AlertCircle 
} from 'lucide-react';
import { ScrimLobby, Team, Profile } from '@/lib/types';
import { TeamsIcon, SwordsIcon } from '@/components/icons/CustomIcons';
import { supabase } from '@/lib/supabase';

interface MatchRoomModalProps {
  lobby: ScrimLobby;
  isOpen: boolean;
  onClose: () => void;
  currentUser: Profile | null;
  userTeams: Team[];
  onUpdateLobby: (updated: ScrimLobby) => void;
}

// Popular map pools for competitive pick/ban
const MAP_POOLS: Record<string, string[]> = {
  Valorant: ['Ascent', 'Bind', 'Haven', 'Split', 'Sunset', 'Abyss', 'Lotus'],
  CS2: ['Mirage', 'Inferno', 'Nuke', 'Dust II', 'Ancient', 'Anubis', 'Vertigo'],
  'Rocket League': ['DFH Stadium', 'Mannfield', 'Champions Field', 'Utopia Coliseum'],
  Default: ['Map 1', 'Map 2', 'Map 3', 'Map 4', 'Map 5'],
};

export function MatchRoomModal({
  lobby,
  isOpen,
  onClose,
  currentUser,
  userTeams,
  onUpdateLobby,
}: MatchRoomModalProps) {
  const hostTeam = lobby.host_team;
  const guestTeam = lobby.guest_team;

  // Action access (Must be captain)
  const isHost = Boolean(currentUser?.id && hostTeam?.captain_id === currentUser.id);
  const isGuest = Boolean(guestTeam && currentUser?.id && guestTeam.captain_id === currentUser.id);

  // View access (Can be just a member)
  const isHostMember = userTeams.some((t) => t.id === lobby.host_team_id);
  const isGuestMember = guestTeam ? userTeams.some((t) => t.id === lobby.guest_team_id) : false;
  const isMemberOnly = (isHostMember && !isHost) || (isGuestMember && !isGuest);

  const [copiedCode, setCopiedCode] = useState(false);
  const [roomCodeInput, setRoomCodeInput] = useState(lobby.room_code || '');
  const [discordInput, setDiscordInput] = useState(lobby.discord_channel || '');
  const [scoreHost, setScoreHost] = useState(lobby.host_score?.toString() || '0');
  const [scoreGuest, setScoreGuest] = useState(lobby.guest_score?.toString() || '0');
  const [isUpdating, setIsUpdating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeTab, setActiveTab] = useState<'lobby' | 'veto' | 'score'>('lobby');

  const bothReady = Boolean(lobby.host_ready && lobby.guest_ready);
  const isMatchLive = lobby.status === 'in_progress' || bothReady;
  const isMatchCompleted = lobby.status === 'completed';
  const isPendingVerification = lobby.status === 'pending_verification';

  useEffect(() => {
    if (!isOpen || !lobby.id) return;

    // Realtime listener for match room updates
    const channel = supabase
      .channel(`match_room_${lobby.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'scrim_lobbies', filter: `id=eq.${lobby.id}` },
        async () => {
          const { data } = await supabase
            .from('scrim_lobbies')
            .select(`
              *,
              host_team:teams!scrim_lobbies_host_team_id_fkey(*),
              guest_team:teams!scrim_lobbies_guest_team_id_fkey(*)
            `)
            .eq('id', lobby.id)
            .single();

          if (data) {
            onUpdateLobby(data as ScrimLobby);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen, lobby.id]);

  if (!isOpen) return null;

  const mapPool = MAP_POOLS[lobby.game] || MAP_POOLS.Default;
  const bannedMaps = lobby.banned_maps || [];

  // Toggle ready state & automatically advance to in_progress when both ready
  const handleToggleReady = async () => {
    setIsUpdating(true);
    setErrorMsg('');

    try {
      const nextHostReady = isHost ? !lobby.host_ready : Boolean(lobby.host_ready);
      const nextGuestReady = isGuest ? !lobby.guest_ready : Boolean(lobby.guest_ready);
      const willBothBeReady = nextHostReady && nextGuestReady;

      const updates: any = {
        host_ready: nextHostReady,
        guest_ready: nextGuestReady,
      };

      if (willBothBeReady && lobby.status === 'accepted') {
        updates.status = 'in_progress';
      }

      const { data, error } = await supabase
        .from('scrim_lobbies')
        .update(updates)
        .eq('id', lobby.id)
        .select(`
          *,
          host_team:teams!scrim_lobbies_host_team_id_fkey(*),
          guest_team:teams!scrim_lobbies_guest_team_id_fkey(*)
        `)
        .single();

      if (error) throw error;
      if (data) onUpdateLobby(data as ScrimLobby);
    } catch (err: any) {
      console.error('Error toggling ready state:', err);
      setErrorMsg(err.message || 'حدث خطأ في تحديث الجاهزية');
    } finally {
      setIsUpdating(false);
    }
  };

  // Save room code / credentials
  const handleSaveCredentials = async () => {
    setIsUpdating(true);
    setErrorMsg('');
    try {
      const { data, error } = await supabase
        .from('scrim_lobbies')
        .update({
          room_code: roomCodeInput.trim() || null,
          discord_channel: discordInput.trim() || null,
        })
        .eq('id', lobby.id)
        .select(`
          *,
          host_team:teams!scrim_lobbies_host_team_id_fkey(*),
          guest_team:teams!scrim_lobbies_guest_team_id_fkey(*)
        `)
        .single();

      if (error) throw error;
      if (data) onUpdateLobby(data as ScrimLobby);
    } catch (err: any) {
      console.error('Error saving room credentials:', err);
      setErrorMsg(err.message || 'حدث خطأ في حفظ بيانات الغرفة');
    } finally {
      setIsUpdating(false);
    }
  };

  // Cancel Match (Abort)
  const handleCancelMatch = async () => {
    if (!confirm('هل أنت متأكد من إلغاء هذه المباراة بشكل نهائي؟ لا يمكن التراجع عن هذا الإجراء.')) return;
    setIsUpdating(true);
    setErrorMsg('');
    try {
      const { error } = await supabase
        .from('scrim_lobbies')
        .update({ status: 'cancelled' })
        .eq('id', lobby.id);
        
      if (error) throw error;
      onClose();
    } catch (err: any) {
      console.error('Error cancelling match:', err);
      setErrorMsg(err.message || 'حدث خطأ أثناء إلغاء المباراة');
    } finally {
      setIsUpdating(false);
    }
  };

  // Map Ban
  const handleBanMap = async (mapName: string) => {
    if (bannedMaps.includes(mapName) || !bothReady) return;
    setIsUpdating(true);
    try {
      const newBans = [...bannedMaps, mapName];
      const remaining = mapPool.filter((m) => !newBans.includes(m));
      const selectedMap = remaining.length === 1 ? remaining[0] : lobby.selected_map;

      const { data, error } = await supabase
        .from('scrim_lobbies')
        .update({
          banned_maps: newBans,
          selected_map: selectedMap,
        })
        .eq('id', lobby.id)
        .select(`
          *,
          host_team:teams!scrim_lobbies_host_team_id_fkey(*),
          guest_team:teams!scrim_lobbies_guest_team_id_fkey(*)
        `)
        .single();

      if (error) throw error;
      if (data) onUpdateLobby(data as ScrimLobby);
    } catch (err: any) {
      console.error('Error banning map:', err);
      setErrorMsg(err.message || 'حدث خطأ أثناء حظر الخريطة');
    } finally {
      setIsUpdating(false);
    }
  };

  // 1. Submit Initial Score (requires both teams ready first)
  const handleReportScore = async () => {
    if (!bothReady && !isMatchLive) {
      setErrorMsg('لا يمكن توثيق النتيجة قبل تأكيد جاهزية الفريقين وبدء المباراة!');
      return;
    }

    const hScore = parseInt(scoreHost, 10) || 0;
    const gScore = parseInt(scoreGuest, 10) || 0;
    const reportingTeamId = isHost ? lobby.host_team_id : lobby.guest_team_id;

    setIsUpdating(true);
    setErrorMsg('');

    try {
      const { data, error } = await supabase
        .from('scrim_lobbies')
        .update({
          host_score: hScore,
          guest_score: gScore,
          reported_by_team_id: reportingTeamId,
          status: 'pending_verification',
        })
        .eq('id', lobby.id)
        .select(`
          *,
          host_team:teams!scrim_lobbies_host_team_id_fkey(*),
          guest_team:teams!scrim_lobbies_guest_team_id_fkey(*)
        `)
        .single();

      if (error) throw error;
      if (data) onUpdateLobby(data as ScrimLobby);
    } catch (err: any) {
      console.error('Error reporting match score:', err);
      setErrorMsg(err.message || 'حدث خطأ أثناء إرسال النتيجة');
    } finally {
      setIsUpdating(false);
    }
  };

  // 2. Confirm Score & Permanently Log to Official Matches History for BOTH teams
  const handleConfirmScore = async () => {
    setIsUpdating(true);
    setErrorMsg('');

    try {
      const hScore = lobby.host_score ?? parseInt(scoreHost, 10) ?? 0;
      const gScore = lobby.guest_score ?? parseInt(scoreGuest, 10) ?? 0;

      // 1. Fetch complete team details to ensure 100% data integrity
      const [hostRes, guestRes] = await Promise.all([
        supabase.from('teams').select('*').eq('id', lobby.host_team_id).single(),
        supabase.from('teams').select('*').eq('id', lobby.guest_team_id!).single(),
      ]);

      const hTeam = hostRes.data;
      const gTeam = guestRes.data;

      if (!hTeam || !gTeam) {
        throw new Error('تعذر العثور على بيانات الفريقين لتوثيق النتيجة');
      }

      // Calculate results
      const hostResult = hScore > gScore ? 'win' : hScore < gScore ? 'loss' : 'draw';
      const guestResult = gScore > hScore ? 'win' : gScore < hScore ? 'loss' : 'draw';
      const matchDate = new Date().toISOString();

      // 2. Log official match for Host Team
      const { error: hostInsertErr } = await supabase.from('team_matches').insert({
        team_id: hTeam.id,
        opponent_name: gTeam.name,
        opponent_logo: gTeam.logo_url || null,
        opponent_team_id: gTeam.id,
        game: lobby.game,
        score: `${hScore} - ${gScore}`,
        our_score: hScore,
        opponent_score: gScore,
        result: hostResult,
        notes: `سكريم رسمي عبر غرفة التحكيم (${lobby.format})`,
        match_date: matchDate,
      });
      if (hostInsertErr) console.error('Host match insert error:', hostInsertErr);

      // 3. Log official match for Guest Team (reciprocal)
      const { error: guestInsertErr } = await supabase.from('team_matches').insert({
        team_id: gTeam.id,
        opponent_name: hTeam.name,
        opponent_logo: hTeam.logo_url || null,
        opponent_team_id: hTeam.id,
        game: lobby.game,
        score: `${gScore} - ${hScore}`,
        our_score: gScore,
        opponent_score: hScore,
        result: guestResult,
        notes: `سكريم رسمي عبر غرفة التحكيم (${lobby.format})`,
        match_date: matchDate,
      });
      if (guestInsertErr) console.error('Guest match insert error:', guestInsertErr);

      // 4. Update lobby status to completed
      const { data, error } = await supabase
        .from('scrim_lobbies')
        .update({
          status: 'completed',
        })
        .eq('id', lobby.id)
        .select(`
          *,
          host_team:teams!scrim_lobbies_host_team_id_fkey(*),
          guest_team:teams!scrim_lobbies_guest_team_id_fkey(*)
        `)
        .single();

      if (error) throw error;
      if (data) onUpdateLobby(data as ScrimLobby);
      onClose();
    } catch (err: any) {
      console.error('Error confirming match score:', err);
      setErrorMsg(err.message || 'حدث خطأ أثناء اعتماد النتيجة');
    } finally {
      setIsUpdating(false);
    }
  };

  // 3. Reject Score / Cancel Submission
  const handleRejectScore = async () => {
    setIsUpdating(true);
    setErrorMsg('');
    try {
      const { data, error } = await supabase
        .from('scrim_lobbies')
        .update({
          status: 'in_progress',
          reported_by_team_id: null,
          host_score: null,
          guest_score: null,
        })
        .eq('id', lobby.id)
        .select(`
          *,
          host_team:teams!scrim_lobbies_host_team_id_fkey(*),
          guest_team:teams!scrim_lobbies_guest_team_id_fkey(*)
        `)
        .single();

      if (error) throw error;
      if (data) onUpdateLobby(data as ScrimLobby);
    } catch (err: any) {
      console.error('Error rejecting match score:', err);
      setErrorMsg(err.message || 'حدث خطأ أثناء رفض النتيجة');
    } finally {
      setIsUpdating(false);
    }
  };

  const copyCode = () => {
    if (lobby.room_code) {
      navigator.clipboard.writeText(lobby.room_code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  return createPortal(
    <div 
      className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-3xl modal-animate rounded-3xl flex flex-col overflow-hidden text-right text-white border border-white/20 bg-[#0c0c0c] shadow-[0_30px_70px_rgba(0,0,0,0.95)]"
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 bg-[#121212] border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white text-black flex items-center justify-center shadow-md">
              <Swords className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white">غرفة المباراة والتحكيم المباشر</h3>
                <span className="px-2 py-0.5 rounded bg-white/10 text-[10px] font-mono font-bold text-white border border-white/15">
                  {lobby.game} • {lobby.format}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                {isMatchCompleted 
                  ? 'المباراة منتهية وموثقة في السجل الرسمي' 
                  : isMatchLive 
                  ? 'المباراة جارية الآن ⚔️' 
                  : 'مرحلة التحضير وتأكيد جاهزية الفريقين'}
                {isMemberOnly && <span className="text-amber-500 mr-2 font-bold">• وضع المشاهدة (للكباتن فقط)</span>}
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3 bg-red-950/50 border-b border-red-500/30 text-red-300 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Scoreboard Arena Header */}
        <div className="p-4 sm:p-6 bg-[#080808] border-b border-white/10">
          <div className="grid grid-cols-11 items-center gap-4">
            
            {/* Host Team */}
            <div className="col-span-5 flex items-center justify-end gap-3 text-right">
              <div>
                <div className="text-sm sm:text-base font-black text-white">{hostTeam?.name}</div>
                <div className="text-[10px] font-mono text-zinc-400 font-bold">[{hostTeam?.tag}]</div>
                <div className="mt-1">
                  {lobby.host_ready ? (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                      ✓ جاهز للعب
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 text-[10px] font-bold">
                      بانتظار الجاهزية
                    </span>
                  )}
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-black border-2 border-white/20 overflow-hidden flex items-center justify-center shrink-0">
                {hostTeam?.logo_url ? (
                  <img src={hostTeam.logo_url} alt={hostTeam.name} className="w-full h-full object-cover" />
                ) : (
                  <TeamsIcon className="w-5 h-5 text-white" />
                )}
              </div>
            </div>

            {/* Center Status / Score */}
            <div className="col-span-1 flex flex-col items-center justify-center">
              {isMatchCompleted && (typeof lobby.host_score === 'number' && typeof lobby.guest_score === 'number') ? (
                <div className="px-2.5 py-1 rounded-xl bg-black border border-white/20 font-mono text-sm font-black text-white">
                  {lobby.host_score} : {lobby.guest_score}
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center font-mono font-black text-xs text-zinc-400">
                  VS
                </div>
              )}
            </div>

            {/* Guest Team */}
            <div className="col-span-5 flex items-center justify-start gap-3 text-left">
              <div className="w-12 h-12 rounded-2xl bg-black border-2 border-white/20 overflow-hidden flex items-center justify-center shrink-0">
                {guestTeam?.logo_url ? (
                  <img src={guestTeam.logo_url} alt={guestTeam.name} className="w-full h-full object-cover" />
                ) : (
                  <TeamsIcon className="w-5 h-5 text-zinc-400" />
                )}
              </div>
              <div>
                <div className="text-sm sm:text-base font-black text-white">{guestTeam?.name || 'الخصم'}</div>
                <div className="text-[10px] font-mono text-zinc-400 font-bold">[{guestTeam?.tag || 'IEH'}]</div>
                <div className="mt-1">
                  {lobby.guest_ready ? (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                      ✓ جاهز للعب
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 text-[10px] font-bold">
                      بانتظار الجاهزية
                    </span>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-white/10 px-6 gap-2 bg-[#101010]">
          <button
            onClick={() => setActiveTab('lobby')}
            className={`py-2.5 px-4 text-xs font-black border-b-2 transition ${
              activeTab === 'lobby'
                ? 'border-white text-white bg-white/5'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            بيانات الغرفة والسيرفر
          </button>
          
          <button
            onClick={() => {
              if (!bothReady && !isMatchLive) {
                setErrorMsg('يجب تأكيد جاهزية الفريقين أولاً لفتح حظر الخرائط');
                return;
              }
              setActiveTab('veto');
            }}
            className={`py-2.5 px-4 text-xs font-black border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'veto'
                ? 'border-white text-white bg-white/5'
                : !bothReady && !isMatchLive
                ? 'border-transparent text-zinc-600 opacity-60'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            {!bothReady && !isMatchLive && <Lock className="w-3 h-3 text-zinc-600" />}
            <span>حظر واختيار الخرائط (Map Veto)</span>
            {lobby.selected_map && <span className="w-2 h-2 rounded-full bg-emerald-400" />}
          </button>

          <button
            onClick={() => {
              if (!bothReady && !isMatchLive) {
                setErrorMsg('لا يمكن إدخال النتيجة قبل تأكيد جاهزية الفريقين وبدء المباراة!');
                return;
              }
              setActiveTab('score');
            }}
            className={`py-2.5 px-4 text-xs font-black border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'score'
                ? 'border-white text-white bg-white/5'
                : !bothReady && !isMatchLive
                ? 'border-transparent text-zinc-600 opacity-60'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            {!bothReady && !isMatchLive && <Lock className="w-3 h-3 text-zinc-600" />}
            <span>توثيق النتيجة الرسمية</span>
            {isPendingVerification && <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />}
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-5 sm:p-6 overflow-y-auto max-h-[60vh] space-y-5">
          
          {/* TAB 1: LOBBY & CREDENTIALS */}
          {activeTab === 'lobby' && (
            <div className="space-y-5">
              
              {/* Ready Check Action */}
              <div className="p-4 rounded-2xl bg-[#141414] border border-white/10 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">تأكيد الجاهزية والحضور (Ready Check)</div>
                  <div className="text-[11px] text-zinc-400">
                    {bothReady 
                      ? '✓ تم تأكيد جاهزية الفريقين بنجاح. المباراة جارية!' 
                      : 'يجب على كلا الكابتنين تأكيد الجاهزية لفتح مرحلة حظر الخرائط وبدء اللقاء'}
                  </div>
                </div>

                {!isMatchCompleted && (
                  <button
                    type="button"
                    onClick={handleToggleReady}
                    disabled={isUpdating}
                    className={`px-5 py-2.5 rounded-xl text-xs font-black transition flex items-center gap-2 shadow-md ${
                      (isHost && lobby.host_ready) || (isGuest && lobby.guest_ready)
                        ? 'bg-emerald-500 text-black border border-emerald-400'
                        : 'btn-3d-primary text-black hover:scale-105'
                    }`}
                  >
                    {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />}
                    <span>
                      {(isHost && lobby.host_ready) || (isGuest && lobby.guest_ready) 
                        ? 'أنت جاهز ✓ (إلغاء)' 
                        : 'أنا جاهز للعب الآن'}
                    </span>
                  </button>
                )}
              </div>

              {/* Room Code & Discord */}
              <div className="p-4 rounded-2xl bg-[#141414] border border-white/10 space-y-4">
                <div className="text-xs font-bold text-white flex items-center justify-between">
                  <span>بيانات الاتصال وروم اللعبة (Credentials)</span>
                  <span className="text-[10px] text-zinc-500 font-mono">خاصة بكباتن الفريقين</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Party / Lobby Code */}
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">اسم الروم والرقم السري (Name & Password):</label>
                    {isHost && !isMatchCompleted ? (
                      <input
                        type="text"
                        value={roomCodeInput}
                        onChange={(e) => setRoomCodeInput(e.target.value)}
                        placeholder="مثال: Name: Room1 / Pass: 123"
                        className="w-full text-xs p-2.5 rounded-xl input-3d text-white font-mono focus:outline-none"
                      />
                    ) : (
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-black border border-white/10 font-mono text-xs text-white">
                        <span>{lobby.room_code || 'بانتظار إضافة الكود من المستضيف...'}</span>
                        {lobby.room_code && (
                          <button onClick={copyCode} className="text-zinc-400 hover:text-white">
                            {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Discord Channel */}
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">رابط قناة الديسكورد (Voice / Lobby):</label>
                    {isHost && !isMatchCompleted ? (
                      <input
                        type="text"
                        value={discordInput}
                        onChange={(e) => setDiscordInput(e.target.value)}
                        placeholder="https://discord.gg/..."
                        className="w-full text-xs p-2.5 rounded-xl input-3d text-white font-mono focus:outline-none"
                      />
                    ) : (
                      <div className="p-2.5 rounded-xl bg-black border border-white/10 text-xs truncate">
                        {lobby.discord_channel ? (
                          <a href={lobby.discord_channel} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline flex items-center gap-1">
                            <span>دخول روم الديسكورد</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-zinc-500">غير محدد</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {(isHost || isGuest) && !isMatchCompleted && (
                  <div className="flex items-center justify-between mt-2 pt-4 border-t border-white/10">
                    <button
                      type="button"
                      onClick={handleCancelMatch}
                      disabled={isUpdating}
                      className="text-red-500 hover:text-red-400 hover:underline text-xs font-bold transition flex items-center gap-1"
                    >
                      <Ban className="w-3.5 h-3.5" />
                      إلغاء المباراة نهائياً
                    </button>
                    
                    {isHost && (
                      <button
                        type="button"
                        onClick={handleSaveCredentials}
                        disabled={isUpdating}
                        className="px-4 py-2 bg-white text-black text-xs font-bold rounded-xl hover:bg-zinc-200 transition"
                      >
                        حفظ وتحديث بيانات اللوبي
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: MAP VETO (PICK / BAN) */}
          {activeTab === 'veto' && (
            <div className="space-y-4">
              {!bothReady && !isMatchLive ? (
                <div className="p-8 text-center rounded-2xl bg-black/50 border border-white/10 space-y-2">
                  <Lock className="w-8 h-8 text-zinc-600 mx-auto" />
                  <p className="text-xs font-bold text-zinc-400">مرحلة حظر الخرائط مقفلة حالياً</p>
                  <p className="text-[11px] text-zinc-500">يجب على كلا الكابتنين الضغط على "أنا جاهز للعب" في التبويب الأول أولاً.</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-white">نظام حظر واختيار الخرائط (Map Veto)</div>
                      <div className="text-[11px] text-zinc-400">قم بحظر الخرائط غير المرغوبة لاختيار الخريطة الرسمية للمباراة</div>
                    </div>
                    {lobby.selected_map && (
                      <div className="px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-black">
                        الخريطة المحددة: {lobby.selected_map} 🎯
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {mapPool.map((mapName) => {
                      const isBanned = bannedMaps.includes(mapName);
                      const isSelected = lobby.selected_map === mapName;

                      return (
                        <div
                          key={mapName}
                          className={`p-3 rounded-2xl border text-center transition flex flex-col items-center justify-between gap-2 ${
                            isSelected
                              ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 font-black shadow-md'
                              : isBanned
                              ? 'bg-red-950/20 border-red-500/30 text-zinc-500 line-through opacity-60'
                              : 'bg-[#141414] border-white/15 text-white hover:border-white/40'
                          }`}
                        >
                          <span className="text-xs font-bold">{mapName}</span>
                          
                          {!isBanned && !lobby.selected_map && !isMatchCompleted && (
                            <button
                              type="button"
                              onClick={() => handleBanMap(mapName)}
                              disabled={isUpdating}
                              className="px-2.5 py-1 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 text-[10px] font-bold transition flex items-center gap-1"
                            >
                              <Ban className="w-3 h-3" />
                              <span>حظر (Ban)</span>
                            </button>
                          )}

                          {isBanned && (
                            <span className="text-[10px] text-red-400 font-bold">محظورة</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 3: VERIFY & SUBMIT SCORE */}
          {activeTab === 'score' && (
            <div className="space-y-4">
              {!bothReady && !isMatchLive && !isMatchCompleted ? (
                <div className="p-8 text-center rounded-2xl bg-black/50 border border-white/10 space-y-2">
                  <Lock className="w-8 h-8 text-zinc-600 mx-auto" />
                  <p className="text-xs font-bold text-zinc-400">توثيق النتيجة مقفل حالياً</p>
                  <p className="text-[11px] text-zinc-500">لا يمكن إدخال النتيجة قبل تأكيد جاهزية الفريقين وبدء المباراة فعلياً.</p>
                </div>
              ) : isMatchCompleted ? (
                <div className="p-6 text-center rounded-2xl bg-[#141414] border border-white/10 space-y-2">
                  <Trophy className="w-8 h-8 text-emerald-400 mx-auto" />
                  <h4 className="text-sm font-black text-white">المباراة منتهية وموثقة رسمياً</h4>
                  <div className="text-xl font-mono font-black text-white">
                    {lobby.host_score} : {lobby.guest_score}
                  </div>
                  <p className="text-xs text-zinc-400">تم تسجيل النتيجة في السجل التاريخي لكلا الفريقين بنجاح.</p>
                </div>
              ) : isPendingVerification ? (
                <div className="p-6 rounded-2xl bg-[#141414] border border-purple-500/30 space-y-4 text-center">
                  <div className="text-xs font-black text-purple-300">
                    تم رفع نتيجة المباراة من قبل الكابتن: ({lobby.host_score} - {lobby.guest_score})
                  </div>
                  <p className="text-xs text-zinc-400">
                    {lobby.reported_by_team_id === (isHost ? lobby.host_team_id : lobby.guest_team_id)
                      ? 'بانتظار تأكيد الكابتن المنافس للنتيجة المرفوعة...'
                      : 'يرجى مراجعة وتأكيد نتيجة المباراة لاعتمادها في السجل الرسمي:'}
                  </p>

                  <div className="flex items-center justify-center gap-3">
                    {(isHost || isGuest) && (
                      lobby.reported_by_team_id !== (isHost ? lobby.host_team_id : lobby.guest_team_id) ? (
                        <>
                          <button
                            type="button"
                            onClick={handleConfirmScore}
                            disabled={isUpdating}
                            className="px-6 py-2.5 btn-3d-primary text-black rounded-xl text-xs font-extrabold flex items-center gap-2 shadow-md hover:scale-105"
                          >
                            {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 stroke-[3]" />}
                            <span>تأكيد واعتماد النتيجة رسمياً</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleRejectScore}
                            disabled={isUpdating}
                            className="px-6 py-2.5 bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 rounded-xl text-xs font-extrabold flex items-center gap-2 shadow-md transition"
                          >
                            {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4 stroke-[3]" />}
                            <span>رفض النتيجة</span>
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={handleRejectScore}
                          disabled={isUpdating}
                          className="px-6 py-2.5 bg-zinc-800 text-zinc-400 hover:bg-zinc-700 rounded-xl text-xs font-extrabold flex items-center gap-2 shadow-md transition"
                        >
                          {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4 stroke-[3]" />}
                          <span>إلغاء وتعديل النتيجة</span>
                        </button>
                      )
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-5 rounded-2xl bg-[#080808] border border-white/10 space-y-4">
                  <div className="text-center space-y-1">
                    <div className="text-xs font-black text-white">إدخال النتيجة النهائية للمباراة</div>
                    <div className="text-[11px] text-zinc-400">
                      عند إرسال النتيجة، سيُطلب من الكابتن المنافس تأكيدها قبل توثيقها رسمياً
                    </div>
                  </div>

                  {/* Symmetrical Centered Inputs */}
                  <div className="flex items-center justify-between gap-4 max-w-md mx-auto w-full py-2">
                    <div className="flex-1 w-0 min-w-0 text-right truncate">
                      <span className="text-xs font-black text-white truncate block">{hostTeam?.name}</span>
                      <span className="text-[10px] font-mono text-zinc-400 font-bold">[{hostTeam?.tag}]</span>
                    </div>

                    <div className="shrink-0 flex items-center justify-center gap-2">
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={scoreHost}
                        onChange={(e) => setScoreHost(e.target.value.replace(/\D/g, '').slice(0, 3))}
                        className="w-14 h-12 text-center text-xl font-black font-mono rounded-xl bg-black border border-white/20 text-white focus:outline-none focus:border-white p-0 m-0 shadow-inner flex items-center justify-center leading-none"
                      />
                      <span className="text-xl font-black text-zinc-500 font-mono select-none px-1">:</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={scoreGuest}
                        onChange={(e) => setScoreGuest(e.target.value.replace(/\D/g, '').slice(0, 3))}
                        className="w-14 h-12 text-center text-xl font-black font-mono rounded-xl bg-black border border-white/20 text-white focus:outline-none focus:border-white p-0 m-0 shadow-inner flex items-center justify-center leading-none"
                      />
                    </div>

                    <div className="flex-1 w-0 min-w-0 text-left truncate">
                      <span className="text-xs font-black text-white truncate block">{guestTeam?.name || 'الخصم'}</span>
                      <span className="text-[10px] font-mono text-zinc-400 font-bold">[{guestTeam?.tag || 'IEH'}]</span>
                    </div>
                  </div>

                  {(isHost || isGuest) && (
                    <div className="flex justify-center pt-2">
                      <button
                        type="button"
                        onClick={handleReportScore}
                        disabled={isUpdating}
                        className="px-6 py-2.5 btn-3d-primary text-black rounded-xl text-xs font-extrabold flex items-center gap-2 shadow-md hover:scale-105 transition"
                      >
                        {isUpdating ? <Loader2 className="w-4 h-4 animate-spin text-black" /> : <Trophy className="w-4 h-4 text-black" />}
                        <span>رفع النتيجة لطلب تأكيد الخصم</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

            </div>
          )}

        </div>
      </div>
    </div>,
    document.body
  );
}
