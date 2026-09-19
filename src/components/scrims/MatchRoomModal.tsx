'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  AlertCircle,
  UploadCloud,
  Image as ImageIcon,
  Eye,
  Scale,
  FileCheck2,
  Clock,
  Sparkles
} from 'lucide-react';
import { ScrimLobby, Team, Profile } from '@/lib/types';
import { TeamsIcon, SwordsIcon } from '@/components/icons/CustomIcons';
import { supabase } from '@/lib/supabase';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { dispatchMatchCompletedDiscord, dispatchWarRoomAlertDiscord } from '@/lib/discordDispatcher';
import { Button, Badge } from '@/components/ui';

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
  'PUBG Mobile': ['Erangel', 'Miramar', 'Sanhok', 'Vikendi'],
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
  const myTeamId = isHost ? lobby.host_team_id : isGuest ? lobby.guest_team_id : null;

  const [copiedCode, setCopiedCode] = useState(false);
  const [roomCodeInput, setRoomCodeInput] = useState(lobby.room_code || '');
  const [discordInput, setDiscordInput] = useState(lobby.discord_channel || '');
  const [scoreHost, setScoreHost] = useState(lobby.host_score?.toString() || '0');
  const [scoreGuest, setScoreGuest] = useState(lobby.guest_score?.toString() || '0');
  const [proofUrl, setProofUrl] = useState(lobby.proof_url || '');
  const [proofNotes, setProofNotes] = useState(lobby.proof_notes || '');
  const [isUploadingProof, setIsUploadingProof] = useState(false);
  const [previewImageModal, setPreviewImageModal] = useState<string | null>(null);

  // Dispute flow states
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [counterProofUrl, setCounterProofUrl] = useState('');
  const [isUploadingCounterProof, setIsUploadingCounterProof] = useState(false);

  const [isUpdating, setIsUpdating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [activeTab, setActiveTab] = useState<'lobby' | 'veto' | 'score' | 'dispute'>('lobby');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const counterFileInputRef = useRef<HTMLInputElement>(null);

  const bothReady = Boolean(lobby.host_ready && lobby.guest_ready);
  const isMatchLive = lobby.status === 'in_progress' || bothReady;
  const isMatchCompleted = lobby.status === 'completed';
  const isPendingVerification = lobby.status === 'pending_verification';
  const isDisputed = lobby.status === 'disputed';

  // Map veto turns
  const currentTurn = lobby.veto_turn || 'host';
  const isMyVetoTurn = (currentTurn === 'host' && isHost) || (currentTurn === 'guest' && isGuest);

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
  }, [isOpen, lobby.id, onUpdateLobby]);

  // Set default active tab based on status
  useEffect(() => {
    if (isDisputed) {
      setActiveTab('dispute');
    } else if (isPendingVerification || isMatchCompleted) {
      setActiveTab('score');
    }
  }, [isDisputed, isPendingVerification, isMatchCompleted]);

  if (!isOpen) return null;

  const mapPool = MAP_POOLS[lobby.game] || MAP_POOLS.Default;
  const bannedMaps = lobby.banned_maps || [];

  // 1. Toggle ready state & advance to in_progress
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
        veto_turn: 'host',
      };

      if (willBothBeReady && (lobby.status === 'accepted' || lobby.status === 'open')) {
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
      if (data) {
        onUpdateLobby(data as ScrimLobby);
        if (willBothBeReady) {
          if (data.host_team) {
            dispatchWarRoomAlertDiscord(data.host_team as Team, data.guest_team as Team, data as ScrimLobby).catch(console.error);
          }
          if (data.guest_team) {
            dispatchWarRoomAlertDiscord(data.guest_team as Team, data.host_team as Team, data as ScrimLobby).catch(console.error);
          }
        }
      }
    } catch (err: any) {
      console.error('Error toggling ready state:', err);
      setErrorMsg(err.message || 'حدث خطأ في تحديث الجاهزية');
    } finally {
      setIsUpdating(false);
    }
  };

  // 2. Save room code / credentials
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
      setSuccessMsg('تم حفظ بيانات الغرفة وتحديثها لدى الفريقين بنجاح');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      console.error('Error saving room credentials:', err);
      setErrorMsg(err.message || 'حدث خطأ في حفظ بيانات الغرفة');
    } finally {
      setIsUpdating(false);
    }
  };

  // 3. Cancel Match (Abort)
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

  // 4. Turn-based Map Ban
  const handleBanMap = async (mapName: string) => {
    if (bannedMaps.includes(mapName) || !bothReady) return;
    if (!isMyVetoTurn) {
      setErrorMsg(`انتظر دورك! الدور الآن لفريق ${currentTurn === 'host' ? hostTeam?.tag : guestTeam?.tag} للحظر.`);
      return;
    }

    setIsUpdating(true);
    setErrorMsg('');
    try {
      const newBans = [...bannedMaps, mapName];
      const remaining = mapPool.filter((m) => !newBans.includes(m));
      const selectedMap = remaining.length === 1 ? remaining[0] : lobby.selected_map;
      const nextTurn = currentTurn === 'host' ? 'guest' : 'host';

      const { data, error } = await supabase
        .from('scrim_lobbies')
        .update({
          banned_maps: newBans,
          selected_map: selectedMap,
          veto_turn: nextTurn,
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

  // 5. Upload Scoreboard Screenshot Proof
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isCounter: boolean = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('يرجى رفع ملف صورة سكرين شوت فقط (JPG, PNG, WebP)');
      return;
    }

    if (isCounter) {
      setIsUploadingCounterProof(true);
    } else {
      setIsUploadingProof(true);
    }
    setErrorMsg('');

    try {
      const url = await uploadToCloudinary(file);
      if (isCounter) {
        setCounterProofUrl(url);
      } else {
        setProofUrl(url);
      }
    } catch (err: any) {
      console.error('Proof upload error:', err);
      setErrorMsg('فشل رفع صورة الإثبات، يرجى المحاولة مرة أخرى');
    } finally {
      if (isCounter) {
        setIsUploadingCounterProof(false);
      } else {
        setIsUploadingProof(false);
      }
    }
  };

  // 6. Submit Initial Score with Mandatory Scoreboard Proof
  const handleReportScore = async () => {
    if (!bothReady && !isMatchLive) {
      setErrorMsg('لا يمكن توثيق النتيجة قبل تأكيد جاهزية الفريقين وبدء المباراة!');
      return;
    }

    if (!proofUrl) {
      setErrorMsg('يجب إرفاق صورة سكرين شوت للوحة النتائج النهائية (Scoreboard Proof) لتوثيق المباراة!');
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
          proof_url: proofUrl,
          proof_notes: proofNotes.trim() || null,
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
      if (data) {
        onUpdateLobby(data as ScrimLobby);
        setSuccessMsg('تم رفع النتيجة بنجاح! بانتظار مراجعة وتأكيد كابتن الفريق المنافس ⏳');
      }
    } catch (err: any) {
      console.error('Error reporting match score:', err);
      setErrorMsg(err.message || 'حدث خطأ أثناء إرسال النتيجة');
    } finally {
      setIsUpdating(false);
    }
  };

  // 7. Atomic Confirm Score via PostgreSQL RPC
  const handleConfirmScore = async () => {
    if (!myTeamId) return;
    setIsUpdating(true);
    setErrorMsg('');

    try {
      const { data, error } = await supabase.rpc('finalize_scrim_match', {
        p_lobby_id: lobby.id,
        p_confirming_team_id: myTeamId,
      });

      if (error) throw error;

      if (data && data.success) {
        setSuccessMsg('تم اعتماد النتيجة وتوثيقها رسمياً في سجل المباريات ولوائح الشرف!');
        const { data: updatedLobby } = await supabase
          .from('scrim_lobbies')
          .select(`
            *,
            host_team:teams!scrim_lobbies_host_team_id_fkey(*),
            guest_team:teams!scrim_lobbies_guest_team_id_fkey(*)
          `)
          .eq('id', lobby.id)
          .single();

        if (updatedLobby) {
          onUpdateLobby(updatedLobby as ScrimLobby);
          // Dispatch Discord victory scorecard with screenshot proof to both teams
          if (updatedLobby.host_team) {
            dispatchMatchCompletedDiscord(
              updatedLobby.host_team as Team,
              updatedLobby.guest_team as Team,
              updatedLobby as ScrimLobby,
              updatedLobby.host_score ?? 0,
              updatedLobby.guest_score ?? 0,
              updatedLobby.proof_url || undefined
            ).catch(console.error);
          }
          if (updatedLobby.guest_team) {
            dispatchMatchCompletedDiscord(
              updatedLobby.guest_team as Team,
              updatedLobby.host_team as Team,
              updatedLobby as ScrimLobby,
              updatedLobby.guest_score ?? 0,
              updatedLobby.host_score ?? 0,
              updatedLobby.proof_url || undefined
            ).catch(console.error);
          }
        }
      }
    } catch (err: any) {
      console.error('Error confirming match score:', err);
      setErrorMsg(err.message || 'حدث خطأ أثناء اعتماد النتيجة');
    } finally {
      setIsUpdating(false);
    }
  };

  // 8. Dispute Score via PostgreSQL RPC
  const handleDisputeScore = async () => {
    if (!myTeamId) return;
    if (!disputeReason.trim()) {
      setErrorMsg('يرجى كتابة سبب الاعتراض والنزاع بالتفصيل لإرساله للجنة التحكيم');
      return;
    }

    setIsUpdating(true);
    setErrorMsg('');

    try {
      const { data, error } = await supabase.rpc('dispute_scrim_match', {
        p_lobby_id: lobby.id,
        p_disputing_team_id: myTeamId,
        p_reason: disputeReason.trim(),
        p_guest_proof_url: counterProofUrl || null,
      });

      if (error) throw error;

      if (data && data.success) {
        setSuccessMsg('تم رفع النزاع وإحالته إلى لجنة التحكيم الإدارية في IEH بنجاح.');
        setShowDisputeForm(false);
        const { data: updatedLobby } = await supabase
          .from('scrim_lobbies')
          .select(`
            *,
            host_team:teams!scrim_lobbies_host_team_id_fkey(*),
            guest_team:teams!scrim_lobbies_guest_team_id_fkey(*)
          `)
          .eq('id', lobby.id)
          .single();

        if (updatedLobby) onUpdateLobby(updatedLobby as ScrimLobby);
      }
    } catch (err: any) {
      console.error('Error disputing match score:', err);
      setErrorMsg(err.message || 'حدث خطأ أثناء رفع النزاع');
    } finally {
      setIsUpdating(false);
    }
  };

  // 9. Cancel / Reset Submission back to in_progress
  const handleResetSubmission = async () => {
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
          proof_url: null,
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
      console.error('Error resetting score submission:', err);
      setErrorMsg(err.message || 'حدث خطأ أثناء إعادة ضبط النتيجة');
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
        className="w-full max-w-3xl modal-animate rounded-3xl flex flex-col overflow-hidden text-right text-white border border-white/20 bg-black shadow-[0_30px_70px_rgba(0,0,0,0.95)] max-h-[90vh]"
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 bg-[#0a0a0a] border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white text-black flex items-center justify-center shadow-md">
              <Swords className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white">غرفة المباراة والتحكيم المباشر</h3>
                <Badge variant="outline" size="xs" className="font-mono">
                  {lobby.game} • {lobby.format}
                </Badge>
                {isDisputed && (
                  <Badge variant="solid" size="xs" className="animate-pulse">
                    نزاع قيد التحكيم
                  </Badge>
                )}
              </div>
              <p className="text-[11px] text-zinc-400">
                {isMatchCompleted 
                  ? 'المباراة منتهية وموثقة في السجل الرسمي' 
                  : isDisputed
                  ? 'النزاع معروض أمام لجنة التحكيم الإدارية في IEH'
                  : isMatchLive 
                  ? 'المباراة جارية الآن' 
                  : 'مرحلة التحضير وتأكيد جاهزية الفريقين'}
                {isMemberOnly && <span className="text-zinc-400 mr-2 font-bold">• وضع المشاهدة (للكباتن فقط)</span>}
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

        {/* Status Alerts */}
        {errorMsg && (
          <div className="p-3 bg-white/10 border-b border-white/20 text-white text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-white shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-white text-black font-black border-b border-white text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-black shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Scoreboard Arena Header */}
        <div className="p-4 sm:p-6 bg-black border-b border-white/10">
          <div className="grid grid-cols-11 items-center gap-4">
            
            {/* Host Team */}
            <div className="col-span-5 flex items-center justify-end gap-3 text-right">
              <div>
                <div className="text-sm sm:text-base font-black text-white">{hostTeam?.name}</div>
                <div className="text-[10px] font-mono text-zinc-400 font-bold">[{hostTeam?.tag}]</div>
                <div className="mt-1">
                  <Badge variant={lobby.host_ready ? 'solid' : 'outline'} size="xs">
                    {lobby.host_ready ? 'جاهز للعب' : 'بانتظار الجاهزية'}
                  </Badge>
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
              {(isMatchCompleted || isPendingVerification || isDisputed) && (typeof lobby.host_score === 'number' && typeof lobby.guest_score === 'number') ? (
                <div className="px-3 py-1 rounded-xl bg-black border border-white/20 font-mono text-sm font-black text-white shadow-inner">
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
                  <Badge variant={lobby.guest_ready ? 'solid' : 'outline'} size="xs">
                    {lobby.guest_ready ? 'جاهز للعب' : 'بانتظار الجاهزية'}
                  </Badge>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-white/10 px-6 gap-2 bg-[#0a0a0a] overflow-x-auto">
          <button
            onClick={() => setActiveTab('lobby')}
            className={`py-2.5 px-4 text-xs font-black border-b-2 transition shrink-0 ${
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
            className={`py-2.5 px-4 text-xs font-black border-b-2 transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'veto'
                ? 'border-white text-white bg-white/5'
                : !bothReady && !isMatchLive
                ? 'border-transparent text-zinc-600 opacity-60'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            {!bothReady && !isMatchLive && <Lock className="w-3 h-3 text-zinc-600" />}
            <span>حظر واختيار الخرائط (Map Veto)</span>
            {lobby.selected_map && <span className="w-2 h-2 rounded-full bg-white" />}
          </button>

          <button
            onClick={() => {
              if (!bothReady && !isMatchLive) {
                setErrorMsg('لا يمكن إدخال النتيجة قبل تأكيد جاهزية الفريقين وبدء المباراة!');
                return;
              }
              setActiveTab('score');
            }}
            className={`py-2.5 px-4 text-xs font-black border-b-2 transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'score'
                ? 'border-white text-white bg-white/5'
                : !bothReady && !isMatchLive
                ? 'border-transparent text-zinc-600 opacity-60'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            {!bothReady && !isMatchLive && <Lock className="w-3 h-3 text-zinc-600" />}
            <span>توثيق النتيجة والإثباتات</span>
            {isPendingVerification && <span className="w-2 h-2 rounded-full bg-white animate-ping" />}
          </button>

          {isDisputed && (
            <button
              onClick={() => setActiveTab('dispute')}
              className={`py-2.5 px-4 text-xs font-black border-b-2 transition flex items-center gap-1.5 shrink-0 ${
                activeTab === 'dispute'
                  ? 'border-white text-white bg-white/15'
                  : 'border-transparent text-zinc-400 hover:text-white'
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              <span>لجنة التحكيم والنزاع</span>
              <span className="w-2 h-2 rounded-full bg-white" />
            </button>
          )}
        </div>

        {/* Tab Contents */}
        <div className="p-5 sm:p-6 overflow-y-auto max-h-[60vh] space-y-5">
          
          {/* TAB 1: LOBBY & CREDENTIALS */}
          {activeTab === 'lobby' && (
            <div className="space-y-5">
              
              {/* Ready Check Action */}
              <div className="p-4 rounded-2xl bg-[#0a0a0a] border border-white/10 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">تأكيد الجاهزية والحضور (Ready Check)</div>
                  <div className="text-[11px] text-zinc-400">
                    {bothReady 
                      ? 'تم تأكيد جاهزية الفريقين بنجاح. المباراة جارية!' 
                      : 'يجب على كلا الكابتنين تأكيد الجاهزية لفتح مرحلة حظر الخرائط وبدء اللقاء'}
                  </div>
                </div>

                {!isMatchCompleted && (
                  <Button
                    type="button"
                    onClick={handleToggleReady}
                    isLoading={isUpdating}
                    icon={<CheckCircle2 className="w-4 h-4 stroke-[2.5]" />}
                    variant={(isHost && lobby.host_ready) || (isGuest && lobby.guest_ready) ? "secondary" : "primary"}
                    size="md"
                    className="font-black"
                  >
                    {(isHost && lobby.host_ready) || (isGuest && lobby.guest_ready) 
                      ? 'أنت جاهز (إلغاء)' 
                      : 'أنا جاهز للعب الآن'}
                  </Button>
                )}
              </div>

              {/* Room Code & Discord */}
              <div className="p-4 rounded-2xl bg-[#0a0a0a] border border-white/10 space-y-4">
                <div className="text-xs font-bold text-white flex items-center justify-between">
                  <span>بيانات الاتصال وروم اللعبة (Credentials)</span>
                  <span className="text-[10px] text-zinc-500 font-mono">خاصة بكباتن الفريقين</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                            {copiedCode ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        )}
                      </div>
                    )}
                  </div>

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
                          <a href={lobby.discord_channel} target="_blank" rel="noreferrer" className="text-white hover:underline flex items-center gap-1">
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
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleCancelMatch}
                      disabled={isUpdating}
                      icon={<Ban className="w-3.5 h-3.5" />}
                    >
                      إلغاء المباراة نهائياً
                    </Button>
                    
                    {isHost && (
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={handleSaveCredentials}
                        isLoading={isUpdating}
                        className="font-bold"
                      >
                        حفظ وتحديث بيانات اللوبي
                      </Button>
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
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 rounded-2xl bg-white/[0.03] border border-white/10">
                    <div>
                      <div className="text-xs font-black text-white flex items-center gap-2">
                        <span>نظام حظر واختيار الخرائط (Map Veto)</span>
                        {!lobby.selected_map && (
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                            isMyVetoTurn ? 'bg-accent/20 text-accent border border-accent/30 animate-pulse' : 'bg-zinc-800 text-zinc-400'
                          }`}>
                            {isMyVetoTurn ? '⏳ دورك للحظر الآن' : `⏳ بانتظار حظر [${currentTurn === 'host' ? hostTeam?.tag : guestTeam?.tag}]`}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-zinc-400">قم بحظر الخرائط بالتناوب حتى تتبقى الخريطة الرسمية للمواجهة</div>
                    </div>
                    {lobby.selected_map && (
                      <div className="px-3 py-1.5 rounded-xl bg-white/10 text-white border border-white/20 text-xs font-black flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>الخريطة المحددة: {lobby.selected_map}</span>
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
                          className={`p-3.5 rounded-2xl border text-center transition flex flex-col items-center justify-between gap-2.5 ${
                            isSelected
                              ? 'bg-white text-black border-white font-black shadow-md scale-105'
                              : isBanned
                              ? 'bg-white/5 border-white/10 text-zinc-500 line-through opacity-60'
                              : 'bg-[#0a0a0a] border-white/15 text-white hover:border-white/40'
                          }`}
                        >
                          <span className="text-xs font-black">{mapName}</span>
                          
                          {!isBanned && !lobby.selected_map && !isMatchCompleted && (
                            <button
                              type="button"
                              onClick={() => handleBanMap(mapName)}
                              disabled={isUpdating || !isMyVetoTurn}
                              className={`px-3 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1 ${
                                isMyVetoTurn
                                  ? 'bg-white/10 text-white hover:bg-white/20 border border-white/20 cursor-pointer'
                                  : 'bg-zinc-800 text-zinc-600 cursor-not-allowed opacity-50'
                              }`}
                            >
                              <Ban className="w-3 h-3" />
                              <span>حظر (Ban)</span>
                            </button>
                          )}

                          {isBanned && (
                            <span className="text-[10px] text-zinc-400 font-bold">محظورة</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 3: VERIFY & SUBMIT SCORE WITH PROOF */}
          {activeTab === 'score' && (
            <div className="space-y-4">
              {!bothReady && !isMatchLive && !isMatchCompleted ? (
                <div className="p-8 text-center rounded-2xl bg-black/50 border border-white/10 space-y-2">
                  <Lock className="w-8 h-8 text-zinc-600 mx-auto" />
                  <p className="text-xs font-bold text-zinc-400">توثيق النتيجة مقفل حالياً</p>
                  <p className="text-[11px] text-zinc-500">لا يمكن إدخال النتيجة قبل تأكيد جاهزية الفريقين وبدء المباراة فعلياً.</p>
                </div>
              ) : isMatchCompleted ? (
                <div className="p-6 text-center rounded-2xl bg-[#0a0a0a] border border-white/20 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center mx-auto">
                    <Trophy className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-black text-white">المباراة منتهية وموثقة رسمياً في سجل الفرق</h4>
                  <div className="text-3xl font-mono font-black text-white">
                    {lobby.host_score} : {lobby.guest_score}
                  </div>
                  <p className="text-xs text-zinc-400">تم تسجيل مكافأة eBits وتحديث سلسلة الانتصارات لكلا الفريقين.</p>
                  
                  {lobby.proof_url && (
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => setPreviewImageModal(lobby.proof_url || null)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-zinc-300 hover:text-white transition"
                      >
                        <ImageIcon className="w-3.5 h-3.5 text-accent" />
                        <span>معاينة إثبات لوحة النتائج (Scoreboard Proof)</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : isPendingVerification ? (
                <div className="p-6 rounded-2xl bg-[#0a0a0a] border border-white/20 space-y-4">
                  <div className="text-center space-y-1">
                    <div className="text-xs font-black text-white">
                      تم رفع نتيجة المباراة من قبل الكابتن: ({lobby.host_score} - {lobby.guest_score})
                    </div>
                    <p className="text-xs text-zinc-400">
                      {lobby.reported_by_team_id === myTeamId
                        ? 'بانتظار مراجعة وتأكيد كابتن الفريق المنافس للنتيجة...'
                        : 'يرجى مراجعة إثبات المباراة أدناه وتأكيد النتيجة أو رفع نزاع:'}
                    </p>
                  </div>

                  {/* Submitted Proof Card */}
                  {lobby.proof_url && (
                    <div className="p-3 rounded-2xl bg-black border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-16 h-12 rounded-xl bg-zinc-900 border border-white/10 overflow-hidden cursor-pointer shrink-0 relative group"
                          onClick={() => setPreviewImageModal(lobby.proof_url || null)}
                        >
                          <img src={lobby.proof_url} alt="Match Proof" className="w-full h-full object-cover group-hover:scale-110 transition" />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                            <Eye className="w-4 h-4 text-white" />
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-bold text-white flex items-center gap-1.5">
                            <FileCheck2 className="w-3.5 h-3.5 text-white" />
                            <span>سكرين شوت لوحة النتائج (Proof)</span>
                          </div>
                          {lobby.proof_notes && (
                            <p className="text-[11px] text-zinc-400 mt-0.5">ملاحظات: {lobby.proof_notes}</p>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setPreviewImageModal(lobby.proof_url || null)}
                        className="text-xs text-accent hover:underline flex items-center gap-1"
                      >
                        <span>تكبير الصورة</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  {/* Decision Actions */}
                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    {(isHost || isGuest) && (
                      lobby.reported_by_team_id !== myTeamId ? (
                        <>
                          <Button
                            type="button"
                            onClick={handleConfirmScore}
                            isLoading={isUpdating}
                            icon={<Check className="w-4 h-4 stroke-[3]" />}
                            variant="primary"
                            size="md"
                            className="font-extrabold"
                          >
                            تأكيد واعتماد النتيجة رسمياً
                          </Button>

                          <Button
                            type="button"
                            onClick={() => setShowDisputeForm(!showDisputeForm)}
                            disabled={isUpdating}
                            icon={<Scale className="w-4 h-4" />}
                            variant="secondary"
                            size="md"
                            className="font-extrabold"
                          >
                            اعتراض ورفع نزاع للإدارة
                          </Button>
                        </>
                      ) : (
                        <Button
                          type="button"
                          onClick={handleResetSubmission}
                          isLoading={isUpdating}
                          icon={<X className="w-4 h-4 stroke-[3]" />}
                          variant="ghost"
                          size="md"
                          className="font-extrabold"
                        >
                          إلغاء وإعادة تعديل النتيجة
                        </Button>
                      )
                    )}
                  </div>

                  {/* Inline Dispute Form */}
                  {showDisputeForm && (
                    <div className="p-4 rounded-2xl bg-white/10 border border-white/20 space-y-3 text-right animate-in fade-in">
                      <div className="text-xs font-black text-white flex items-center gap-1.5">
                        <Scale className="w-4 h-4" />
                        <span>فتح نزاع رسمي أمام إدارة IEH</span>
                      </div>
                      <p className="text-[11px] text-zinc-400">
                        سيتم إيقاف المباراة فوراً وإحالة ملفها للتحكيم الإداري. يرجى توضيح سبب الاعتراض وإرفاق صورة إثبات من جانب فريقك.
                      </p>

                      <textarea
                        value={disputeReason}
                        onChange={(e) => setDisputeReason(e.target.value)}
                        placeholder="اكتب سبب الاعتراض بالتفصيل (مثال: النتيجة الحقيقية 13-10 لصالحنا، أو استخدام لاعب غير مسجل)..."
                        rows={2}
                        className="w-full text-xs p-3 rounded-xl bg-black border border-white/20 text-white focus:outline-none focus:border-white"
                      />

                      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div>
                          <input
                            type="file"
                            ref={counterFileInputRef}
                            onChange={(e) => handleFileUpload(e, true)}
                            accept="image/*"
                            className="hidden"
                          />
                          <button
                            type="button"
                            onClick={() => counterFileInputRef.current?.click()}
                            disabled={isUploadingCounterProof}
                            className="px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs text-zinc-300 flex items-center gap-1.5"
                          >
                            {isUploadingCounterProof ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5 text-white" />}
                            <span>{counterProofUrl ? 'تغيير صورة الإثبات المضاد' : 'إرفاق صورة إثبات مضاد (اختياري)'}</span>
                          </button>
                        </div>

                        <Button
                          type="button"
                          onClick={handleDisputeScore}
                          isLoading={isUpdating}
                          disabled={!disputeReason.trim()}
                          variant="primary"
                          size="md"
                          className="font-black"
                        >
                          إرسال النزاع للإدارة فوراً
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-5 rounded-2xl bg-black border border-white/10 space-y-5">
                  <div className="text-center space-y-1">
                    <div className="text-xs font-black text-white">إدخال النتيجة النهائية ورفع سكرين شوت الإثبات</div>
                    <div className="text-[11px] text-zinc-400">
                      يُشترط رفع صورة واضحة للوحة النتائج (Scoreboard) لضمان النزاهة قبل طلب تأكيد الخصم
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

                  {/* Scoreboard Proof Uploader */}
                  <div className="p-4 rounded-2xl bg-[#0a0a0a] border border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <ImageIcon className="w-4 h-4 text-white" />
                        <span>إثبات المباراة الرسمي (Scoreboard Proof Screenshot) *</span>
                      </span>
                      {proofUrl && (
                        <span className="text-[10px] text-white font-bold">تم إرفاق الصورة</span>
                      )}
                    </div>

                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={(e) => handleFileUpload(e, false)}
                      accept="image/*"
                      className="hidden"
                    />

                    {proofUrl ? (
                      <div className="relative rounded-xl overflow-hidden border border-white/20 h-32 bg-black flex items-center justify-center group">
                        <img src={proofUrl} alt="Scoreboard Proof" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => setPreviewImageModal(proofUrl)}
                            className="px-3 py-1.5 rounded-lg bg-white/20 text-white text-xs font-bold hover:bg-white/30"
                          >
                            معاينة
                          </button>
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="px-3 py-1.5 rounded-lg bg-white text-black text-xs font-bold hover:bg-zinc-200"
                          >
                            تغيير الصورة
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="p-5 rounded-xl border-2 border-dashed border-white/15 hover:border-white/30 bg-black/40 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2"
                      >
                        {isUploadingProof ? (
                          <Loader2 className="w-6 h-6 animate-spin text-white" />
                        ) : (
                          <UploadCloud className="w-6 h-6 text-zinc-500" />
                        )}
                        <span className="text-xs font-bold text-zinc-300">
                          {isUploadingProof ? 'جاري رفع صورة الإثبات...' : 'اضغط لاختيار ورفع سكرين شوت نهاية المباراة'}
                        </span>
                        <span className="text-[10px] text-zinc-500">يدعم صيغ PNG, JPG, WebP</span>
                      </div>
                    )}

                    <div>
                      <input
                        type="text"
                        value={proofNotes}
                        onChange={(e) => setProofNotes(e.target.value)}
                        placeholder="رقم المباراة (Match ID / Replay Code) أو ملاحظات (اختياري)"
                        className="w-full text-xs p-2.5 rounded-xl input-3d text-white font-mono focus:outline-none"
                      />
                    </div>
                  </div>

                  {(isHost || isGuest) && (
                    <div className="flex justify-center pt-2">
                      <Button
                        type="button"
                        onClick={handleReportScore}
                        isLoading={isUpdating}
                        disabled={isUploadingProof}
                        icon={<Trophy className="w-4 h-4 text-black" />}
                        variant="primary"
                        size="md"
                        className="font-extrabold"
                      >
                        رفع النتيجة لطلب تأكيد الخصم
                      </Button>
                    </div>
                  )}
                </div>
              )}

            </div>
          )}

          {/* TAB 4: DISPUTE & ARBITRATION VIEW */}
          {activeTab === 'dispute' && isDisputed && (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-white/10 border border-white/20 space-y-3 text-right">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-white font-black text-sm">
                    <Scale className="w-5 h-5" />
                    <span>المباراة قيد التحكيم والفض النزاعي (Arbitration)</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-white text-black font-black border border-white text-[10px] font-mono font-bold">
                    حالة طارئة
                  </span>
                </div>

                <p className="text-xs text-zinc-300 leading-relaxed">
                  تم تعليق النتيجة بسبب اعتراض رسمي من كابتن الفريق. تقوم إدارة ولجنة التحكيم في IEH بمراجعة إثباتات الطرفين ومطابقة سجلات اللعبة لحسم النتيجة رسمياً.
                </p>

                {lobby.dispute_reason && (
                  <div className="p-3 rounded-xl bg-black/60 border border-white/10 text-xs space-y-1">
                    <span className="text-zinc-400 text-[11px] font-bold block">سبب الاعتراض المرفوع:</span>
                    <p className="text-white font-medium">{lobby.dispute_reason}</p>
                  </div>
                )}

                {/* Side-by-side Proofs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {lobby.proof_url && (
                    <div className="p-3 rounded-xl bg-black border border-white/10 space-y-2">
                      <span className="text-[11px] font-bold text-zinc-400 block">إثبات المستضيف ({hostTeam?.tag}):</span>
                      <div 
                        className="h-28 rounded-lg bg-zinc-900 overflow-hidden cursor-pointer relative group"
                        onClick={() => setPreviewImageModal(lobby.proof_url || null)}
                      >
                        <img src={lobby.proof_url} alt="Host Proof" className="w-full h-full object-cover group-hover:scale-105 transition" />
                      </div>
                    </div>
                  )}

                  {lobby.guest_proof_url && (
                    <div className="p-3 rounded-xl bg-black border border-white/10 space-y-2">
                      <span className="text-[11px] font-bold text-zinc-400 block">إثبات الخصم المضاد ({guestTeam?.tag}):</span>
                      <div 
                        className="h-28 rounded-lg bg-zinc-900 overflow-hidden cursor-pointer relative group"
                        onClick={() => setPreviewImageModal(lobby.guest_proof_url || null)}
                      >
                        <img src={lobby.guest_proof_url} alt="Guest Proof" className="w-full h-full object-cover group-hover:scale-105 transition" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Lightbox Image Preview Modal */}
      {previewImageModal && (
        <div 
          className="fixed inset-0 z-[100000] bg-black/95 flex items-center justify-center p-4"
          onClick={() => setPreviewImageModal(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl border border-white/20">
            <img src={previewImageModal} alt="Enlarged Proof" className="w-full h-full object-contain max-h-[85vh]" />
            <button
              onClick={() => setPreviewImageModal(null)}
              className="absolute top-3 right-3 p-2 rounded-full bg-black/70 hover:bg-black text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}
